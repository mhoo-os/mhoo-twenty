import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import {
  WORKSPACE_CODEX_LB_LUNA_MODEL_ID,
  WORKSPACE_CODEX_LB_TERRA_MODEL_ID,
} from 'src/engine/metadata-modules/ai/ai-models/constants/workspace-codex-lb.const';
import { SdkProviderFactoryService } from 'src/engine/metadata-modules/ai/ai-models/services/sdk-provider-factory.service';
import { WorkspaceCodexLbCredentialService } from 'src/engine/metadata-modules/ai/ai-models/services/workspace-codex-lb-credential.service';
import { WorkspaceCodexLbModelService } from 'src/engine/metadata-modules/ai/ai-models/services/workspace-codex-lb-model.service';

describe('WorkspaceCodexLbModelService', () => {
  const credentials = new Map<
    string,
    { apiKey: PlaintextString; revision: number }
  >([
    ['workspace-a', { apiKey: 'fake-key-a' as PlaintextString, revision: 1 }],
    ['workspace-b', { apiKey: 'fake-key-b' as PlaintextString, revision: 1 }],
  ]);
  const credentialService = {
    getForWorkspace: jest.fn(
      async (workspaceId: string) => credentials.get(workspaceId) ?? null,
    ),
  } as unknown as WorkspaceCodexLbCredentialService;
  const factory = {
    createUncachedProvider: jest.fn((config: { apiKey: string }) => ({
      createModel: (modelName: string) => ({
        keyUsed: config.apiKey,
        modelName,
      }),
    })),
  } as unknown as SdkProviderFactoryService;
  const service = new WorkspaceCodexLbModelService(credentialService, factory);

  beforeEach(() => {
    credentials.set('workspace-a', {
      apiKey: 'fake-key-a' as PlaintextString,
      revision: 1,
    });
    credentials.set('workspace-b', {
      apiKey: 'fake-key-b' as PlaintextString,
      revision: 1,
    });
    jest.clearAllMocks();
    service.clearWorkspace('workspace-a');
    service.clearWorkspace('workspace-b');
  });

  it('never shares a provider instance between two concurrent Workspaces', async () => {
    const [modelA, modelB] = await Promise.all([
      service.resolve('workspace-a', WORKSPACE_CODEX_LB_TERRA_MODEL_ID),
      service.resolve('workspace-b', WORKSPACE_CODEX_LB_LUNA_MODEL_ID),
    ]);

    expect(modelA.model).toMatchObject({
      keyUsed: 'fake-key-a',
      modelName: 'gpt-5.6-terra',
    });
    expect(modelB.model).toMatchObject({
      keyUsed: 'fake-key-b',
      modelName: 'gpt-5.6-luna',
    });
    expect(factory.createUncachedProvider).toHaveBeenCalledTimes(2);
  });

  it('rebuilds only the rotated Workspace and fails closed after removal', async () => {
    await service.resolve('workspace-a', WORKSPACE_CODEX_LB_TERRA_MODEL_ID);
    await service.resolve('workspace-b', WORKSPACE_CODEX_LB_TERRA_MODEL_ID);
    credentials.set('workspace-a', {
      apiKey: 'rotated-a' as PlaintextString,
      revision: 2,
    });

    const modelA = await service.resolve(
      'workspace-a',
      WORKSPACE_CODEX_LB_TERRA_MODEL_ID,
    );
    const modelB = await service.resolve(
      'workspace-b',
      WORKSPACE_CODEX_LB_TERRA_MODEL_ID,
    );

    expect(modelA.model).toMatchObject({ keyUsed: 'rotated-a' });
    expect(modelB.model).toMatchObject({ keyUsed: 'fake-key-b' });
    expect(factory.createUncachedProvider).toHaveBeenCalledTimes(3);

    credentials.delete('workspace-a');
    await expect(
      service.resolve('workspace-a', WORKSPACE_CODEX_LB_TERRA_MODEL_ID),
    ).rejects.toThrow('not configured');
    expect(
      (await service.resolve('workspace-b', WORKSPACE_CODEX_LB_TERRA_MODEL_ID))
        .model,
    ).toMatchObject({ keyUsed: 'fake-key-b' });
  });

  it('rejects every model outside Terra and Luna before reading a key', async () => {
    await expect(
      service.resolve('workspace-a', 'codex-lb/gpt-5.3-codex-spark'),
    ).rejects.toThrow('not allowed');
    expect(credentialService.getForWorkspace).not.toHaveBeenCalled();
  });
});

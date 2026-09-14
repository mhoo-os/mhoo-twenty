import { type Repository } from 'typeorm';

import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';
import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceCodexLbCredentialService } from 'src/engine/metadata-modules/ai/ai-models/services/workspace-codex-lb-credential.service';

describe('WorkspaceCodexLbCredentialService', () => {
  const rows = new Map<
    string,
    { ciphertext: EncryptedString; revision: number }
  >();
  let selectedWorkspaceId = '';
  let updateValue: Partial<WorkspaceEntity> = {};
  const queryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest
      .fn()
      .mockImplementation((_sql: string, params: { workspaceId: string }) => {
        selectedWorkspaceId = params.workspaceId;
        return queryBuilder;
      }),
    getOne: jest.fn().mockImplementation(async () => {
      const row = rows.get(selectedWorkspaceId);
      return row
        ? {
            id: selectedWorkspaceId,
            codexLbEncryptedApiKey: row.ciphertext,
            codexLbCredentialRevision: row.revision,
          }
        : null;
    }),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockImplementation((value: Partial<WorkspaceEntity>) => {
      updateValue = value;
      return queryBuilder;
    }),
    execute: jest.fn().mockImplementation(async () => {
      if (!['workspace-a', 'workspace-b'].includes(selectedWorkspaceId)) {
        return { affected: 0 };
      }
      const old = rows.get(selectedWorkspaceId);
      if (updateValue.codexLbEncryptedApiKey) {
        rows.set(selectedWorkspaceId, {
          ciphertext: updateValue.codexLbEncryptedApiKey,
          revision: (old?.revision ?? 0) + 1,
        });
      } else {
        rows.delete(selectedWorkspaceId);
      }
      return { affected: 1 };
    }),
  };
  const repository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  } as unknown as Repository<WorkspaceEntity>;
  const encryption = {
    encryptVersioned: jest.fn(
      (value: string, opts: { workspaceId: string }) =>
        `enc:v2:${opts.workspaceId}:${value}` as EncryptedString,
    ),
    decryptVersionedOrThrow: jest.fn(
      (value: string, opts: { workspaceId: string }) => {
        const prefix = `enc:v2:${opts.workspaceId}:`;
        if (!value.startsWith(prefix)) {
          throw new Error('Wrong Workspace');
        }
        return value.slice(prefix.length) as PlaintextString;
      },
    ),
  } as unknown as SecretEncryptionService;
  const service = new WorkspaceCodexLbCredentialService(repository, encryption);

  beforeEach(() => {
    rows.clear();
    jest.clearAllMocks();
  });

  it('encrypts and retrieves two distinct keys under their own Workspace IDs', async () => {
    await service.replaceForWorkspace(
      'workspace-a',
      'key-a' as PlaintextString,
    );
    await service.replaceForWorkspace(
      'workspace-b',
      'key-b' as PlaintextString,
    );

    expect(rows.get('workspace-a')?.ciphertext).not.toBe('key-a');
    expect(rows.get('workspace-b')?.ciphertext).not.toBe('key-b');
    expect(await service.getForWorkspace('workspace-a')).toEqual({
      apiKey: 'key-a',
      revision: 1,
    });
    expect(await service.getForWorkspace('workspace-b')).toEqual({
      apiKey: 'key-b',
      revision: 1,
    });
  });

  it('does not read the other Workspace after rotation or removal', async () => {
    await service.replaceForWorkspace(
      'workspace-a',
      'key-a' as PlaintextString,
    );
    await service.replaceForWorkspace(
      'workspace-b',
      'key-b' as PlaintextString,
    );
    await service.replaceForWorkspace(
      'workspace-a',
      'rotated-a' as PlaintextString,
    );

    expect(await service.getForWorkspace('workspace-a')).toEqual({
      apiKey: 'rotated-a',
      revision: 2,
    });
    expect(await service.getForWorkspace('workspace-b')).toEqual({
      apiKey: 'key-b',
      revision: 1,
    });

    await service.removeForWorkspace('workspace-a');
    expect(await service.isConfigured('workspace-a')).toBe(false);
    expect(await service.isConfigured('workspace-b')).toBe(true);
  });

  it('fails closed for a nonexistent Workspace and a mismatched envelope', async () => {
    await expect(
      service.replaceForWorkspace('missing', 'key' as PlaintextString),
    ).rejects.toThrow('Workspace not found');
    rows.set('workspace-a', {
      ciphertext: 'enc:v2:workspace-b:key-b' as EncryptedString,
      revision: 1,
    });
    await expect(service.getForWorkspace('workspace-a')).rejects.toThrow(
      'Wrong Workspace',
    );
  });
});

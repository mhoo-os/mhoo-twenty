import { Injectable } from '@nestjs/common';

import { AI_SDK_OPENAI_COMPATIBLE } from 'src/engine/metadata-modules/ai/ai-models/constants/ai-sdk-package.const';
import {
  WORKSPACE_CODEX_LB_BASE_URL,
  WORKSPACE_CODEX_LB_PROVIDER_NAME,
  isWorkspaceCodexLbModelId,
} from 'src/engine/metadata-modules/ai/ai-models/constants/workspace-codex-lb.const';
import {
  AiException,
  AiExceptionCode,
} from 'src/engine/metadata-modules/ai/ai.exception';
import {
  SdkProviderFactoryService,
  type AiSdkProviderInstance,
} from 'src/engine/metadata-modules/ai/ai-models/services/sdk-provider-factory.service';
import { WorkspaceCodexLbCredentialService } from 'src/engine/metadata-modules/ai/ai-models/services/workspace-codex-lb-credential.service';
import { type RegisteredAiModel } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';

type CachedWorkspaceProvider = {
  revision: number;
  provider: AiSdkProviderInstance;
};

@Injectable()
export class WorkspaceCodexLbModelService {
  private readonly providers = new Map<string, CachedWorkspaceProvider>();

  constructor(
    private readonly credentialService: WorkspaceCodexLbCredentialService,
    private readonly sdkProviderFactory: SdkProviderFactoryService,
  ) {}

  async resolve(
    workspaceId: string,
    modelId: string,
  ): Promise<RegisteredAiModel> {
    if (!isWorkspaceCodexLbModelId(modelId)) {
      throw new AiException(
        'The model is not allowed for the Workspace codex-lb provider.',
        AiExceptionCode.AGENT_EXECUTION_FAILED,
      );
    }

    const credential =
      await this.credentialService.getForWorkspace(workspaceId);

    if (!credential) {
      this.providers.delete(workspaceId);
      throw new AiException(
        'The Workspace codex-lb credential is not configured.',
        AiExceptionCode.API_KEY_NOT_CONFIGURED,
      );
    }

    let cached = this.providers.get(workspaceId);

    if (!cached || cached.revision !== credential.revision) {
      cached = {
        revision: credential.revision,
        provider: this.sdkProviderFactory.createUncachedProvider({
          npm: AI_SDK_OPENAI_COMPATIBLE,
          name: WORKSPACE_CODEX_LB_PROVIDER_NAME,
          baseUrl: WORKSPACE_CODEX_LB_BASE_URL,
          apiKey: credential.apiKey,
        }),
      };
      this.providers.set(workspaceId, cached);
    }

    return {
      modelId,
      sdkPackage: AI_SDK_OPENAI_COMPATIBLE,
      model: cached.provider.createModel(modelId.split('/')[1]),
      providerName: WORKSPACE_CODEX_LB_PROVIDER_NAME,
      modelsDevName: WORKSPACE_CODEX_LB_PROVIDER_NAME,
    };
  }

  clearWorkspace(workspaceId: string): void {
    this.providers.delete(workspaceId);
  }
}

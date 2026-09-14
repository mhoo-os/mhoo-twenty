import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SecretEncryptionModule } from 'src/engine/core-modules/secret-encryption/secret-encryption.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceCodexLbCredentialService } from 'src/engine/metadata-modules/ai/ai-models/services/workspace-codex-lb-credential.service';
import { WorkspaceCodexLbModelService } from 'src/engine/metadata-modules/ai/ai-models/services/workspace-codex-lb-model.service';

import { AiModelConfigService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-config.service';
import { AiModelPreferencesService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-preferences.service';
import { AiModelRegistryService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';
import { DefaultAiCatalogService } from 'src/engine/metadata-modules/ai/ai-models/services/default-ai-catalog.service';
import { ModelsDevCatalogService } from 'src/engine/metadata-modules/ai/ai-models/services/models-dev-catalog.service';
import { NativeToolBinderService } from 'src/engine/metadata-modules/ai/ai-models/services/native-tool-binder.service';
import { ProviderConfigService } from 'src/engine/metadata-modules/ai/ai-models/services/provider-config.service';
import { SdkProviderFactoryService } from 'src/engine/metadata-modules/ai/ai-models/services/sdk-provider-factory.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    SecretEncryptionModule,
  ],
  providers: [
    WorkspaceCodexLbCredentialService,
    WorkspaceCodexLbModelService,
    DefaultAiCatalogService,
    ProviderConfigService,
    SdkProviderFactoryService,
    ModelsDevCatalogService,
    AiModelPreferencesService,
    AiModelRegistryService,
    AiModelConfigService,
    NativeToolBinderService,
  ],
  exports: [
    WorkspaceCodexLbCredentialService,
    WorkspaceCodexLbModelService,
    DefaultAiCatalogService,
    AiModelRegistryService,
    AiModelPreferencesService,
    AiModelConfigService,
    SdkProviderFactoryService,
    ModelsDevCatalogService,
    NativeToolBinderService,
  ],
})
export class AiModelsModule {}

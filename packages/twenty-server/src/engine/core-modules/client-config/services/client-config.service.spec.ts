import { ClientConfigService } from 'src/engine/core-modules/client-config/services/client-config.service';
import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { MaintenanceModeService } from 'src/engine/core-modules/admin-panel/maintenance-mode.service';
import { AiModelRegistryService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';

describe('ClientConfigService', () => {
  it('exposes the Mhoo foundation mode to the frontend', async () => {
    const twentyConfigService = {
      get: jest.fn((key: string) => key === 'IS_MHOO_FOUNDATION_ENABLED'),
    } as unknown as TwentyConfigService;
    const domainServerConfigService = {
      getFrontUrl: jest.fn(() => new URL('https://app.mhoo.app')),
      getPublicBaseHostnameOrUndefined: jest.fn(() => undefined),
    } as unknown as DomainServerConfigService;
    const aiModelRegistryService = {
      getAdminFilteredModels: jest.fn(() => []),
      getRecommendedModelIds: jest.fn(() => new Set()),
      getResolvedProvidersForAdmin: jest.fn(() => ({})),
    } as unknown as AiModelRegistryService;
    const maintenanceModeService = {
      getMaintenanceMode: jest.fn(() => null),
    } as unknown as MaintenanceModeService;

    const service = new ClientConfigService(
      twentyConfigService,
      domainServerConfigService,
      aiModelRegistryService,
      maintenanceModeService,
    );

    await expect(service.getClientConfig()).resolves.toMatchObject({
      isMhooFoundationEnabled: true,
    });
  });
});

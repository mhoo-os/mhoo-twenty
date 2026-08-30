import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

describe('DomainServerConfigService', () => {
  it('keeps the configured host stable in Mhoo multi-workspace mode', () => {
    const values = {
      FRONTEND_URL: 'https://app.mhoo.app',
      IS_MULTIWORKSPACE_ENABLED: true,
      IS_MHOO_FOUNDATION_ENABLED: true,
      DEFAULT_SUBDOMAIN: 'app',
    };
    const twentyConfigService = {
      get: jest.fn((key: keyof typeof values) => values[key]),
    } as unknown as TwentyConfigService;
    const service = new DomainServerConfigService(twentyConfigService);

    expect(service.getBaseUrl().toString()).toBe('https://app.mhoo.app/');
  });
});

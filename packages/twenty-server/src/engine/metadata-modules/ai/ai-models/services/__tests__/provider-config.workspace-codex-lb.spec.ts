import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { DefaultAiCatalogService } from 'src/engine/metadata-modules/ai/ai-models/services/default-ai-catalog.service';
import { ProviderConfigService } from 'src/engine/metadata-modules/ai/ai-models/services/provider-config.service';
import { AI_SDK_OPENAI_COMPATIBLE } from 'src/engine/metadata-modules/ai/ai-models/constants/ai-sdk-package.const';

describe('ProviderConfigService Workspace codex-lb boundary', () => {
  it('does not expose an Organization codex-lb key as a fallback', () => {
    const organizationProviders = {
      'codex-lb': {
        npm: AI_SDK_OPENAI_COMPATIBLE,
        apiKey: 'wrong-global-key',
        baseUrl: 'https://codex-lb.mhoo.app/v1',
      },
    };
    const config = {
      get: jest.fn(() => organizationProviders),
    } as unknown as TwentyConfigService;
    const catalog = {
      getDefaultAiCatalog: jest.fn(() => ({})),
    } as unknown as DefaultAiCatalogService;

    expect(
      new ProviderConfigService(config, catalog).getResolvedProviders(),
    ).toEqual({});
    expect(organizationProviders['codex-lb'].apiKey).toBe('wrong-global-key');
  });
});

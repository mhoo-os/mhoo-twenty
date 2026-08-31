import { ConfigVariables } from 'src/engine/core-modules/twenty-config/config-variables';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { getMhooFoundationConfigurationErrors } from 'src/engine/core-modules/twenty-config/utils/validate-mhoo-foundation-config.util';

const mhooConfig = {
  IS_MHOO_FOUNDATION_ENABLED: true,
  IS_MULTIWORKSPACE_ENABLED: true,
  IS_IMAP_SMTP_CALDAV_ENABLED: false,
  CALENDAR_PROVIDER_GOOGLE_ENABLED: false,
  MESSAGING_PROVIDER_GMAIL_ENABLED: false,
  CALENDAR_PROVIDER_MICROSOFT_ENABLED: false,
  MESSAGING_PROVIDER_MICROSOFT_ENABLED: false,
  IS_CONNECTED_ACCOUNT_WEBHOOK_SUBSCRIPTION_ENABLED: false,
};

describe('getMhooFoundationConfigurationErrors', () => {
  it('keeps Mhoo foundation mode disabled by default', () => {
    expect(new ConfigVariables().IS_MHOO_FOUNDATION_ENABLED).toBe(false);
  });

  it('accepts stable-host multi-workspace mode', () => {
    expect(getMhooFoundationConfigurationErrors(mhooConfig)).toEqual([]);
  });

  it('fails closed for missing stable-host multi-workspace mode', () => {
    expect(
      getMhooFoundationConfigurationErrors({
        ...mhooConfig,
        IS_MULTIWORKSPACE_ENABLED: false,
      }),
    ).toContain('IS_MULTIWORKSPACE_ENABLED');
  });

  it('allows Twenty Connections selected by their normal provider flags', () => {
    const connectionEnabledConfig = {
      ...mhooConfig,
      IS_IMAP_SMTP_CALDAV_ENABLED: true,
      CALENDAR_PROVIDER_GOOGLE_ENABLED: true,
      MESSAGING_PROVIDER_GMAIL_ENABLED: true,
      CALENDAR_PROVIDER_MICROSOFT_ENABLED: true,
      MESSAGING_PROVIDER_MICROSOFT_ENABLED: true,
      IS_CONNECTED_ACCOUNT_WEBHOOK_SUBSCRIPTION_ENABLED: true,
    };

    expect(
      getMhooFoundationConfigurationErrors(connectionEnabledConfig),
    ).toEqual([]);
  });

  it('returns enabled Twenty Connection flags in foundation mode', () => {
    const configValues: Record<string, boolean> = {
      ...mhooConfig,
      CALENDAR_PROVIDER_GOOGLE_ENABLED: true,
      MESSAGING_PROVIDER_GMAIL_ENABLED: true,
      IS_CONNECTED_ACCOUNT_WEBHOOK_SUBSCRIPTION_ENABLED: true,
    };
    const environmentConfigDriver = {
      get: jest.fn((key: string) => {
        if (key === 'IS_CONFIG_VARIABLES_IN_DB_ENABLED') {
          return false;
        }

        return configValues[key];
      }),
    };
    const configService = new TwentyConfigService(
      environmentConfigDriver as never,
      undefined as never,
    );

    expect(configService.get('CALENDAR_PROVIDER_GOOGLE_ENABLED')).toBe(true);
    expect(configService.get('MESSAGING_PROVIDER_GMAIL_ENABLED')).toBe(true);
    expect(
      configService.get('IS_CONNECTED_ACCOUNT_WEBHOOK_SUBSCRIPTION_ENABLED'),
    ).toBe(true);
  });
});

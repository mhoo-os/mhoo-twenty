import { ConfigVariables } from 'src/engine/core-modules/twenty-config/config-variables';
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

  it('accepts the closed Mhoo provider boundary', () => {
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

  it('fails closed when a Twenty business-provider integration is enabled', () => {
    expect(
      getMhooFoundationConfigurationErrors({
        ...mhooConfig,
        IS_IMAP_SMTP_CALDAV_ENABLED: true,
      }),
    ).toContain('IS_IMAP_SMTP_CALDAV_ENABLED');
  });
});

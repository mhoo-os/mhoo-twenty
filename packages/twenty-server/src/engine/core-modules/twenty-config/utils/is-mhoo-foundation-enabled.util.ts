import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

// This is deliberately the only runtime predicate for the Mhoo foundation
// contract. Keep product-specific behavior at existing Twenty boundaries.
export const isMhooFoundationEnabled = (
  twentyConfigService: TwentyConfigService,
): boolean => twentyConfigService.get('IS_MHOO_FOUNDATION_ENABLED');

const MHOO_DISABLED_BUSINESS_PROVIDER_CONFIG_KEYS = new Set([
  'IS_IMAP_SMTP_CALDAV_ENABLED',
  'CALENDAR_PROVIDER_GOOGLE_ENABLED',
  'MESSAGING_PROVIDER_GMAIL_ENABLED',
  'CALENDAR_PROVIDER_MICROSOFT_ENABLED',
  'MESSAGING_PROVIDER_MICROSOFT_ENABLED',
  'IS_CONNECTED_ACCOUNT_WEBHOOK_SUBSCRIPTION_ENABLED',
]);

export const isMhooDisabledBusinessProviderConfigKey = (key: string): boolean =>
  MHOO_DISABLED_BUSINESS_PROVIDER_CONFIG_KEYS.has(key);

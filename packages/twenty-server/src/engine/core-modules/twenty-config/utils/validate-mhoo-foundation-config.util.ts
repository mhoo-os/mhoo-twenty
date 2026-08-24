export const getMhooFoundationConfigurationErrors = (config: {
  IS_MHOO_FOUNDATION_ENABLED: boolean;
  IS_MULTIWORKSPACE_ENABLED: boolean;
  IS_IMAP_SMTP_CALDAV_ENABLED: boolean;
  CALENDAR_PROVIDER_GOOGLE_ENABLED: boolean;
  MESSAGING_PROVIDER_GMAIL_ENABLED: boolean;
  CALENDAR_PROVIDER_MICROSOFT_ENABLED: boolean;
  MESSAGING_PROVIDER_MICROSOFT_ENABLED: boolean;
  IS_CONNECTED_ACCOUNT_WEBHOOK_SUBSCRIPTION_ENABLED: boolean;
}): string[] => {
  if (!config.IS_MHOO_FOUNDATION_ENABLED) {
    return [];
  }

  const prohibitedBusinessProviderFlags = [
    'IS_IMAP_SMTP_CALDAV_ENABLED',
    'CALENDAR_PROVIDER_GOOGLE_ENABLED',
    'MESSAGING_PROVIDER_GMAIL_ENABLED',
    'CALENDAR_PROVIDER_MICROSOFT_ENABLED',
    'MESSAGING_PROVIDER_MICROSOFT_ENABLED',
    'IS_CONNECTED_ACCOUNT_WEBHOOK_SUBSCRIPTION_ENABLED',
  ] as const;

  const errors: string[] = prohibitedBusinessProviderFlags.filter(
    (key) => config[key],
  );

  if (!config.IS_MULTIWORKSPACE_ENABLED) {
    errors.unshift('IS_MULTIWORKSPACE_ENABLED');
  }

  return errors;
};

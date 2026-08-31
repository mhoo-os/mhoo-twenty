export const getMhooFoundationConfigurationErrors = (config: {
  IS_MHOO_FOUNDATION_ENABLED: boolean;
  IS_MULTIWORKSPACE_ENABLED: boolean;
}): string[] => {
  if (!config.IS_MHOO_FOUNDATION_ENABLED) {
    return [];
  }

  if (!config.IS_MULTIWORKSPACE_ENABLED) {
    return ['IS_MULTIWORKSPACE_ENABLED'];
  }

  return [];
};

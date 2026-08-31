import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

// This is deliberately the only runtime predicate for the Mhoo foundation
// contract. Keep product-specific behavior at existing Twenty boundaries.
export const isMhooFoundationEnabled = (
  twentyConfigService: TwentyConfigService,
): boolean => twentyConfigService.get('IS_MHOO_FOUNDATION_ENABLED');

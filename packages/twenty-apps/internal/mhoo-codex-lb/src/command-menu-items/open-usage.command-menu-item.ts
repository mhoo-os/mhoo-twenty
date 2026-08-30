import {
  canAccessFullAdminPanel,
  defineCommandMenuItem,
} from 'twenty-sdk/define';

import {
  USAGE_COMMAND_UNIVERSAL_IDENTIFIER,
  USAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: USAGE_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Open Codex LB usage',
  shortLabel: 'Codex usage',
  isPinned: true,
  availabilityType: 'GLOBAL',
  frontComponentUniversalIdentifier:
    USAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: canAccessFullAdminPanel,
});

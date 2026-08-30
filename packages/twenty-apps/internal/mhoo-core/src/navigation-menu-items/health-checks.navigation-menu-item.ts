import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  HEALTH_CHECKS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier:
    HEALTH_CHECKS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Health Checks',
  icon: 'IconHeartbeat',
  color: 'green',
  position: 2,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
});

import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  SYSTEM_OVERVIEW_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  SYSTEM_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: SYSTEM_OVERVIEW_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'System Overview',
  icon: 'IconActivityHeartbeat',
  color: 'blue',
  position: 0,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: SYSTEM_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
});

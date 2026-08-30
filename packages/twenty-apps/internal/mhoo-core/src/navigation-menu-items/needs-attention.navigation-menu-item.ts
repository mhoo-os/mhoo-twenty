import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  NEEDS_ATTENTION_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  NEEDS_ATTENTION_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier:
    NEEDS_ATTENTION_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Needs Attention',
  icon: 'IconAlertTriangle',
  color: 'orange',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: NEEDS_ATTENTION_VIEW_UNIVERSAL_IDENTIFIER,
});

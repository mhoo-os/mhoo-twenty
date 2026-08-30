import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  EVALUATIONS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  EVALUATIONS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: EVALUATIONS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Evaluations',
  icon: 'IconCircleCheck',
  color: 'purple',
  position: 3,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: EVALUATIONS_VIEW_UNIVERSAL_IDENTIFIER,
});

import { defineView, getFieldUniversalIdentifier } from 'twenty-sdk/define';

import {
  APPLICATION_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_EXPECTED_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_LAST_OBSERVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_OBSERVED_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_OPERATIONAL_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
  SYSTEM_OVERVIEW_EXPECTED_VERSION_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_OVERVIEW_KIND_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_OVERVIEW_LAST_OBSERVED_AT_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_OVERVIEW_NAME_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_OVERVIEW_OBSERVED_VERSION_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_OVERVIEW_STATUS_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const SYSTEM_COMPONENT_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  getFieldUniversalIdentifier({
    applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
    objectUniversalIdentifier: SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
    name: 'name',
  });

export default defineView({
  universalIdentifier: SYSTEM_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'System Overview',
  objectUniversalIdentifier: SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
  icon: 'IconActivityHeartbeat',
  position: 0,
  fields: [
    {
      universalIdentifier: SYSTEM_OVERVIEW_NAME_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        SYSTEM_COMPONENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: SYSTEM_OVERVIEW_KIND_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        SYSTEM_COMPONENT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier:
        SYSTEM_OVERVIEW_STATUS_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        SYSTEM_COMPONENT_OPERATIONAL_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier:
        SYSTEM_OVERVIEW_EXPECTED_VERSION_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        SYSTEM_COMPONENT_EXPECTED_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier:
        SYSTEM_OVERVIEW_OBSERVED_VERSION_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        SYSTEM_COMPONENT_OBSERVED_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier:
        SYSTEM_OVERVIEW_LAST_OBSERVED_AT_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        SYSTEM_COMPONENT_LAST_OBSERVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 180,
    },
  ],
});

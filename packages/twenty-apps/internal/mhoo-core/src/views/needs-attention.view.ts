import {
  defineView,
  getFieldUniversalIdentifier,
  ViewFilterOperand,
} from 'twenty-sdk/define';

import {
  APPLICATION_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_OBSERVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  NEEDS_ATTENTION_COMPONENT_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  NEEDS_ATTENTION_NAME_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  NEEDS_ATTENTION_OBSERVED_AT_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  NEEDS_ATTENTION_STATUS_FILTER_UNIVERSAL_IDENTIFIER,
  NEEDS_ATTENTION_STATUS_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  NEEDS_ATTENTION_SUMMARY_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  NEEDS_ATTENTION_VIEW_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_ON_HEALTH_OBSERVATION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const HEALTH_OBSERVATION_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  getFieldUniversalIdentifier({
    applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
    objectUniversalIdentifier: HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
    name: 'name',
  });

export default defineView({
  universalIdentifier: NEEDS_ATTENTION_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Needs Attention',
  objectUniversalIdentifier: HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  icon: 'IconAlertTriangle',
  position: 0,
  fields: [
    {
      universalIdentifier: NEEDS_ATTENTION_NAME_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        HEALTH_OBSERVATION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier:
        NEEDS_ATTENTION_STATUS_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        HEALTH_OBSERVATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier:
        NEEDS_ATTENTION_COMPONENT_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        SYSTEM_COMPONENT_ON_HEALTH_OBSERVATION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier:
        NEEDS_ATTENTION_SUMMARY_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        HEALTH_OBSERVATION_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 340,
    },
    {
      universalIdentifier:
        NEEDS_ATTENTION_OBSERVED_AT_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        HEALTH_OBSERVATION_OBSERVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 180,
    },
  ],
  filters: [
    {
      universalIdentifier: NEEDS_ATTENTION_STATUS_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        HEALTH_OBSERVATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['DEGRADED', 'FAILED'],
    },
  ],
});

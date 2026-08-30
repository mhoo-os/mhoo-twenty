import { defineView, getFieldUniversalIdentifier } from 'twenty-sdk/define';

import {
  APPLICATION_UNIVERSAL_IDENTIFIER,
  EVALUATIONS_COMPONENT_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATIONS_COMPLETED_AT_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATIONS_NAME_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATIONS_RESULT_SUMMARY_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATIONS_STATUS_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATIONS_VIEW_UNIVERSAL_IDENTIFIER,
  EVALUATION_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_RESULT_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_ON_EVALUATION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const EVALUATION_NAME_FIELD_UNIVERSAL_IDENTIFIER = getFieldUniversalIdentifier({
  applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: EVALUATION_UNIVERSAL_IDENTIFIER,
  name: 'name',
});

export default defineView({
  universalIdentifier: EVALUATIONS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Evaluations',
  objectUniversalIdentifier: EVALUATION_UNIVERSAL_IDENTIFIER,
  icon: 'IconCircleCheck',
  position: 0,
  fields: [
    {
      universalIdentifier: EVALUATIONS_NAME_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: EVALUATION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: EVALUATIONS_STATUS_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        EVALUATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier:
        EVALUATIONS_COMPONENT_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        SYSTEM_COMPONENT_ON_EVALUATION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier:
        EVALUATIONS_RESULT_SUMMARY_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        EVALUATION_RESULT_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 340,
    },
    {
      universalIdentifier:
        EVALUATIONS_COMPLETED_AT_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        EVALUATION_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 180,
    },
  ],
});

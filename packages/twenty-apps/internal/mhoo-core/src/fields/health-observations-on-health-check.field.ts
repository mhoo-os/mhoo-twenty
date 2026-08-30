import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  HEALTH_CHECK_ON_HEALTH_OBSERVATION_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATIONS_ON_HEALTH_CHECK_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier:
    HEALTH_OBSERVATIONS_ON_HEALTH_CHECK_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'healthObservations',
  label: 'Health Observations',
  icon: 'IconReportAnalytics',
  relationTargetObjectMetadataUniversalIdentifier:
    HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    HEALTH_CHECK_ON_HEALTH_OBSERVATION_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});

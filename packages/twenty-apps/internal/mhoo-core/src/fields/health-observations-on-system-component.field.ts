import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  HEALTH_OBSERVATIONS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_ON_HEALTH_OBSERVATION_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier:
    HEALTH_OBSERVATIONS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'healthObservations',
  label: 'Health Observations',
  icon: 'IconReportAnalytics',
  relationTargetObjectMetadataUniversalIdentifier:
    HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SYSTEM_COMPONENT_ON_HEALTH_OBSERVATION_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});

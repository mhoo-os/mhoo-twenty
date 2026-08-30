import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  HEALTH_CHECK_ON_HEALTH_OBSERVATION_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATIONS_ON_HEALTH_CHECK_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier:
    HEALTH_CHECK_ON_HEALTH_OBSERVATION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'healthCheck',
  label: 'Health Check',
  icon: 'IconHeartbeat',
  relationTargetObjectMetadataUniversalIdentifier: HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    HEALTH_OBSERVATIONS_ON_HEALTH_CHECK_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'healthCheckId',
  },
});

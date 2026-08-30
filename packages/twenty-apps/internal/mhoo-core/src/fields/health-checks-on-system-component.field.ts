import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  HEALTH_CHECKS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_ON_HEALTH_CHECK_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier:
    HEALTH_CHECKS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'healthChecks',
  label: 'Health Checks',
  icon: 'IconHeartbeat',
  relationTargetObjectMetadataUniversalIdentifier: HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SYSTEM_COMPONENT_ON_HEALTH_CHECK_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});

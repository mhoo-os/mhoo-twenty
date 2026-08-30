import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  HEALTH_CHECKS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_ON_HEALTH_CHECK_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier:
    SYSTEM_COMPONENT_ON_HEALTH_CHECK_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'systemComponent',
  label: 'System Component',
  icon: 'IconComponents',
  relationTargetObjectMetadataUniversalIdentifier:
    SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    HEALTH_CHECKS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'systemComponentId',
  },
});

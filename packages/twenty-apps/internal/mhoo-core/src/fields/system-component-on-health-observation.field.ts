import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  HEALTH_OBSERVATIONS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_ON_HEALTH_OBSERVATION_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier:
    SYSTEM_COMPONENT_ON_HEALTH_OBSERVATION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'systemComponent',
  label: 'System Component',
  icon: 'IconComponents',
  relationTargetObjectMetadataUniversalIdentifier:
    SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    HEALTH_OBSERVATIONS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'systemComponentId',
  },
});

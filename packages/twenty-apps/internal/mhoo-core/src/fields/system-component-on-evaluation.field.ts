import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  EVALUATIONS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_ON_EVALUATION_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: SYSTEM_COMPONENT_ON_EVALUATION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: EVALUATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'systemComponent',
  label: 'System Component',
  icon: 'IconComponents',
  relationTargetObjectMetadataUniversalIdentifier:
    SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    EVALUATIONS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'systemComponentId',
  },
});

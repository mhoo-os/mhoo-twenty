import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  EVALUATIONS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_ON_EVALUATION_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier:
    EVALUATIONS_ON_SYSTEM_COMPONENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'evaluations',
  label: 'Evaluations',
  icon: 'IconCircleCheck',
  relationTargetObjectMetadataUniversalIdentifier: EVALUATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SYSTEM_COMPONENT_ON_EVALUATION_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});

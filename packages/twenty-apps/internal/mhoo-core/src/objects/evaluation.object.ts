import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  EVALUATION_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_EVIDENCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_RESULT_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_SPECIFICATION_HASH_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  EVALUATION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: EVALUATION_UNIVERSAL_IDENTIFIER,
  nameSingular: 'evaluation',
  namePlural: 'evaluations',
  labelSingular: 'Evaluation',
  labelPlural: 'Evaluations',
  description: 'A deterministic evaluation or proof result for a system component.',
  icon: 'IconCircleCheck',
  fields: [
    {
      universalIdentifier: EVALUATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'status',
      type: FieldType.SELECT,
      label: 'Status',
      icon: 'IconCircleCheck',
      isNullable: false,
      defaultValue: "'PENDING'",
      options: [
        { value: 'PENDING', label: 'Pending', position: 0, color: 'gray' },
        { value: 'PASSED', label: 'Passed', position: 1, color: 'green' },
        { value: 'FAILED', label: 'Failed', position: 2, color: 'red' },
        { value: 'BLOCKED', label: 'Blocked', position: 3, color: 'orange' },
      ],
    },
    {
      universalIdentifier: EVALUATION_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'startedAt',
      type: FieldType.DATE_TIME,
      label: 'Started At',
      icon: 'IconPlayerPlay',
    },
    {
      universalIdentifier: EVALUATION_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'completedAt',
      type: FieldType.DATE_TIME,
      label: 'Completed At',
      icon: 'IconPlayerStop',
    },
    {
      universalIdentifier:
        EVALUATION_SPECIFICATION_HASH_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'specificationHash',
      type: FieldType.TEXT,
      label: 'Specification Hash',
      icon: 'IconHash',
    },
    {
      universalIdentifier: EVALUATION_RESULT_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'resultSummary',
      type: FieldType.TEXT,
      label: 'Result Summary',
      icon: 'IconNotes',
    },
    {
      universalIdentifier:
        EVALUATION_EVIDENCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'evidenceReference',
      type: FieldType.TEXT,
      label: 'Evidence Reference',
      description: 'A provenance reference; it never grants authority.',
      icon: 'IconFileSearch',
    },
  ],
});

import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  HEALTH_OBSERVATION_EVIDENCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_LATENCY_MILLISECONDS_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_OBSERVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  nameSingular: 'healthObservation',
  namePlural: 'healthObservations',
  labelSingular: 'Health Observation',
  labelPlural: 'Health Observations',
  description: 'An append-oriented recorded observation for a health check.',
  icon: 'IconReportAnalytics',
  fields: [
    {
      universalIdentifier: HEALTH_OBSERVATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'status',
      type: FieldType.SELECT,
      label: 'Status',
      icon: 'IconActivityHeartbeat',
      isNullable: false,
      defaultValue: "'UNKNOWN'",
      options: [
        { value: 'HEALTHY', label: 'Healthy', position: 0, color: 'green' },
        {
          value: 'DEGRADED',
          label: 'Degraded',
          position: 1,
          color: 'orange',
        },
        { value: 'FAILED', label: 'Failed', position: 2, color: 'red' },
        { value: 'UNKNOWN', label: 'Unknown', position: 3, color: 'gray' },
      ],
    },
    {
      universalIdentifier:
        HEALTH_OBSERVATION_OBSERVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'observedAt',
      type: FieldType.DATE_TIME,
      label: 'Observed At',
      icon: 'IconClock',
      isNullable: false,
      defaultValue: 'now',
    },
    {
      universalIdentifier:
        HEALTH_OBSERVATION_LATENCY_MILLISECONDS_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'latencyMilliseconds',
      type: FieldType.NUMBER,
      label: 'Latency (ms)',
      icon: 'IconClockHour4',
    },
    {
      universalIdentifier:
        HEALTH_OBSERVATION_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'summary',
      type: FieldType.TEXT,
      label: 'Summary',
      icon: 'IconNotes',
    },
    {
      universalIdentifier:
        HEALTH_OBSERVATION_EVIDENCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'evidenceReference',
      type: FieldType.TEXT,
      label: 'Evidence Reference',
      description: 'A provenance reference; it never grants authority.',
      icon: 'IconFileSearch',
    },
  ],
});

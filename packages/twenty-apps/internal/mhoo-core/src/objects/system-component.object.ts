import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  SYSTEM_COMPONENT_ENVIRONMENT_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_EXPECTED_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_LAST_OBSERVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_OBSERVED_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_OPERATIONAL_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_SOURCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'systemComponent',
  namePlural: 'systemComponents',
  labelSingular: 'System Component',
  labelPlural: 'System Components',
  description: 'A Mhoo component observed by the internal control plane.',
  icon: 'IconComponents',
  fields: [
    {
      universalIdentifier: SYSTEM_COMPONENT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'kind',
      type: FieldType.SELECT,
      label: 'Kind',
      icon: 'IconCategory',
      isNullable: false,
      defaultValue: "'APPLICATION'",
      options: [
        { value: 'APPLICATION', label: 'Application', position: 0, color: 'blue' },
        { value: 'RUNTIME', label: 'Runtime', position: 1, color: 'purple' },
        { value: 'DATABASE', label: 'Database', position: 2, color: 'orange' },
        { value: 'QUEUE', label: 'Queue', position: 3, color: 'yellow' },
        { value: 'PROVIDER', label: 'Provider', position: 4, color: 'green' },
        {
          value: 'EXTERNAL_DEPENDENCY',
          label: 'External Dependency',
          position: 5,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier:
        SYSTEM_COMPONENT_ENVIRONMENT_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'environment',
      type: FieldType.SELECT,
      label: 'Environment',
      icon: 'IconTopologyStar3',
      isNullable: false,
      defaultValue: "'LOCAL'",
      options: [
        { value: 'LOCAL', label: 'Local', position: 0, color: 'blue' },
        {
          value: 'DEVELOPMENT',
          label: 'Development',
          position: 1,
          color: 'purple',
        },
        { value: 'STAGING', label: 'Staging', position: 2, color: 'orange' },
        { value: 'PRODUCTION', label: 'Production', position: 3, color: 'red' },
      ],
    },
    {
      universalIdentifier:
        SYSTEM_COMPONENT_OPERATIONAL_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'operationalStatus',
      type: FieldType.SELECT,
      label: 'Operational Status',
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
        SYSTEM_COMPONENT_EXPECTED_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'expectedVersion',
      type: FieldType.TEXT,
      label: 'Expected Version',
      icon: 'IconVersions',
    },
    {
      universalIdentifier:
        SYSTEM_COMPONENT_OBSERVED_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'observedVersion',
      type: FieldType.TEXT,
      label: 'Observed Version',
      icon: 'IconVersions',
    },
    {
      universalIdentifier:
        SYSTEM_COMPONENT_LAST_OBSERVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'lastObservedAt',
      type: FieldType.DATE_TIME,
      label: 'Last Observed At',
      icon: 'IconClock',
    },
    {
      universalIdentifier:
        SYSTEM_COMPONENT_SOURCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'sourceReference',
      type: FieldType.TEXT,
      label: 'Source Reference',
      description: 'A provenance or evidence reference; it never grants access.',
      icon: 'IconFileSearch',
    },
  ],
});

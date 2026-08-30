import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  HEALTH_CHECK_ENABLED_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_EXPECTED_INTERVAL_MINUTES_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_SEVERITY_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  nameSingular: 'healthCheck',
  namePlural: 'healthChecks',
  labelSingular: 'Health Check',
  labelPlural: 'Health Checks',
  description: 'A deterministic health check configured for a system component.',
  icon: 'IconHeartbeat',
  fields: [
    {
      universalIdentifier: HEALTH_CHECK_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'checkType',
      type: FieldType.SELECT,
      label: 'Check Type',
      icon: 'IconChecklist',
      isNullable: false,
      defaultValue: "'HEALTH'",
      options: [
        { value: 'HEALTH', label: 'Health', position: 0, color: 'green' },
        { value: 'RUNTIME', label: 'Runtime', position: 1, color: 'blue' },
        { value: 'SECURITY', label: 'Security', position: 2, color: 'red' },
        {
          value: 'INTEGRATION',
          label: 'Integration',
          position: 3,
          color: 'purple',
        },
        { value: 'RECOVERY', label: 'Recovery', position: 4, color: 'orange' },
      ],
    },
    {
      universalIdentifier: HEALTH_CHECK_ENABLED_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'isEnabled',
      type: FieldType.BOOLEAN,
      label: 'Enabled',
      icon: 'IconToggleRight',
      defaultValue: true,
    },
    {
      universalIdentifier:
        HEALTH_CHECK_EXPECTED_INTERVAL_MINUTES_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'expectedIntervalMinutes',
      type: FieldType.NUMBER,
      label: 'Expected Interval (Minutes)',
      icon: 'IconClock',
    },
    {
      universalIdentifier: HEALTH_CHECK_SEVERITY_FIELD_UNIVERSAL_IDENTIFIER,
      name: 'severity',
      type: FieldType.SELECT,
      label: 'Severity',
      icon: 'IconAlertTriangle',
      isNullable: false,
      defaultValue: "'MEDIUM'",
      options: [
        { value: 'LOW', label: 'Low', position: 0, color: 'gray' },
        { value: 'MEDIUM', label: 'Medium', position: 1, color: 'yellow' },
        { value: 'HIGH', label: 'High', position: 2, color: 'orange' },
        { value: 'CRITICAL', label: 'Critical', position: 3, color: 'red' },
      ],
    },
  ],
});

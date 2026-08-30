import { defineApplicationRole } from 'twenty-sdk/define';

import {
  DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  EVALUATION_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Mhoo Core application role',
  description:
    'Least-privilege default role for deterministic Mhoo Core features.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
    HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
    HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
    EVALUATION_UNIVERSAL_IDENTIFIER,
  ].map((objectUniversalIdentifier) => ({
    objectUniversalIdentifier,
    canReadObjectRecords: true,
    canUpdateObjectRecords: false,
    canSoftDeleteObjectRecords: false,
    canDestroyObjectRecords: false,
  })),
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});

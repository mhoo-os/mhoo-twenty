import { defineRole } from 'twenty-sdk/define';

import { SYSTEM_MACHINE_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { SYSTEM_MACHINE_OBJECT_PERMISSIONS } from 'src/roles/core-object-permissions';

export default defineRole({
  universalIdentifier: SYSTEM_MACHINE_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Mhoo System Machine',
  description:
    'Machine-only API-key role for deterministic health and evaluation updates.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: true,
  objectPermissions: SYSTEM_MACHINE_OBJECT_PERMISSIONS,
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});

import { defineRole } from 'twenty-sdk/define';

import { MHOO_OBSERVER_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { READ_CORE_OBJECT_PERMISSIONS } from 'src/roles/core-object-permissions';

export default defineRole({
  universalIdentifier: MHOO_OBSERVER_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Mhoo Observer',
  description: 'Read-only internal access to Mhoo Core operational records.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: true,
  canBeAssignedToApiKeys: false,
  objectPermissions: READ_CORE_OBJECT_PERMISSIONS,
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});

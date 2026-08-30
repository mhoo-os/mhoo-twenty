import { defineRole } from 'twenty-sdk/define';

import { MHOO_OPERATOR_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { WRITE_CORE_OBJECT_PERMISSIONS } from 'src/roles/core-object-permissions';

export default defineRole({
  universalIdentifier: MHOO_OPERATOR_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Mhoo Operator',
  description:
    'Internal operators can observe and maintain Mhoo Core records without delete or settings access.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: true,
  canBeAssignedToApiKeys: false,
  objectPermissions: WRITE_CORE_OBJECT_PERMISSIONS,
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});

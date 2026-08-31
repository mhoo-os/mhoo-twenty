import { defineApplicationRole } from 'twenty-sdk/define';

import { CLOVER_READER_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineApplicationRole({
  universalIdentifier: CLOVER_READER_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Mhoo Finance Clover reader',
  description:
    'May discover read-only Mhoo Finance tools. It grants no Twenty record or settings authority.',
  canAccessAllTools: false,
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToAgents: true,
  canBeAssignedToUsers: true,
  canBeAssignedToApiKeys: true,
  objectPermissions: [],
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});

import { type RolePermissionConfig } from 'src/engine/twenty-orm/types/role-permission-config';
import { getRoleIdsFromRolePermissionConfig } from 'src/engine/twenty-orm/utils/get-role-ids-from-role-permission-config.util';

export const canAccessLogicFunctionTool = ({
  allowedRoleUniversalIdentifiers,
  rolePermissionConfig,
  roleUniversalIdentifierById,
}: {
  allowedRoleUniversalIdentifiers: string[] | undefined;
  rolePermissionConfig: RolePermissionConfig;
  roleUniversalIdentifierById: Partial<Record<string, string>>;
}): boolean => {
  if (!allowedRoleUniversalIdentifiers) {
    return true;
  }

  if ('shouldBypassPermissionChecks' in rolePermissionConfig) {
    return true;
  }

  const allowed = new Set(allowedRoleUniversalIdentifiers);

  return getRoleIdsFromRolePermissionConfig(rolePermissionConfig).some(
    (roleId) => {
      const universalIdentifier = roleUniversalIdentifierById[roleId];

      return (
        universalIdentifier !== undefined && allowed.has(universalIdentifier)
      );
    },
  );
};

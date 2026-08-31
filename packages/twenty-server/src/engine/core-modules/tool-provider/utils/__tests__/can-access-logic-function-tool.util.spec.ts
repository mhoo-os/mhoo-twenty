import { canAccessLogicFunctionTool } from 'src/engine/core-modules/tool-provider/utils/can-access-logic-function-tool.util';

const ALLOWED_ROLE = 'a1111111-1111-4111-8111-111111111111';
const OTHER_ROLE = 'b2222222-2222-4222-8222-222222222222';

describe('canAccessLogicFunctionTool', () => {
  it('keeps existing tools available when no role allowlist is declared', () => {
    expect(
      canAccessLogicFunctionTool({
        allowedRoleUniversalIdentifiers: undefined,
        rolePermissionConfig: { unionOf: ['role-id'] },
        roleUniversalIdentifierById: {},
      }),
    ).toBe(true);
  });

  it('allows a caller with an allowed role in a union', () => {
    expect(
      canAccessLogicFunctionTool({
        allowedRoleUniversalIdentifiers: [ALLOWED_ROLE],
        rolePermissionConfig: { unionOf: ['other-id', 'allowed-id'] },
        roleUniversalIdentifierById: {
          'other-id': OTHER_ROLE,
          'allowed-id': ALLOWED_ROLE,
        },
      }),
    ).toBe(true);
  });

  it('denies a caller without an allowed role, including an empty allowlist', () => {
    expect(
      canAccessLogicFunctionTool({
        allowedRoleUniversalIdentifiers: [ALLOWED_ROLE],
        rolePermissionConfig: { unionOf: ['other-id'] },
        roleUniversalIdentifierById: { 'other-id': OTHER_ROLE },
      }),
    ).toBe(false);
    expect(
      canAccessLogicFunctionTool({
        allowedRoleUniversalIdentifiers: [],
        rolePermissionConfig: { unionOf: ['allowed-id'] },
        roleUniversalIdentifierById: { 'allowed-id': ALLOWED_ROLE },
      }),
    ).toBe(false);
  });

  it('permits trusted internal execution that explicitly bypasses role checks', () => {
    expect(
      canAccessLogicFunctionTool({
        allowedRoleUniversalIdentifiers: [],
        rolePermissionConfig: { shouldBypassPermissionChecks: true },
        roleUniversalIdentifierById: {},
      }),
    ).toBe(true);
  });
});

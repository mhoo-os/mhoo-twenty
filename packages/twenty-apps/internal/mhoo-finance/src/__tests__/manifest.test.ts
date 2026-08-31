import { describe, expect, it } from 'vitest';

import application from 'src/application.config';
import {
  CLOVER_FORBIDDEN_EFFECT_PERMISSIONS,
  CLOVER_REQUIRED_READ_PERMISSIONS,
} from 'src/clover/permissions';
import cloverConnectionProvider from 'src/connection-providers/clover.connection-provider';
import cloverConnectionStatus from 'src/logic-functions/clover-connection-status.logic-function';
import defaultFunctionRole from 'src/roles/default-function.role';

describe('@mhoo/finance manifest contracts', () => {
  it('pins a secret-custodied Clover OAuth provider without OAuth scopes', () => {
    expect(cloverConnectionProvider.success).toBe(true);
    expect(cloverConnectionProvider.config).toMatchObject({
      name: 'clover',
      type: 'oauth',
      oauth: {
        authorizationEndpoint: 'https://www.clover.com/oauth/v2/authorize',
        tokenEndpoint: 'https://api.clover.com/oauth/v2/token',
        scopes: [],
        clientIdVariable: 'CLOVER_CLIENT_ID',
        clientSecretVariable: 'CLOVER_CLIENT_SECRET',
        tokenRequestContentType: 'json',
        usePkce: false,
      },
    });
    expect(application.config?.serverVariables).toMatchObject({
      CLOVER_CLIENT_ID: { isSecret: false, isRequired: true },
      CLOVER_CLIENT_SECRET: { isSecret: true, isRequired: true },
    });
  });

  it('keeps the function role at zero Twenty data and settings authority', () => {
    expect(defaultFunctionRole.success).toBe(true);
    expect(defaultFunctionRole.config).toMatchObject({
      canAccessAllTools: false,
      canReadAllObjectRecords: false,
      canUpdateAllObjectRecords: false,
      canSoftDeleteAllObjectRecords: false,
      canDestroyAllObjectRecords: false,
      canUpdateAllSettings: false,
      objectPermissions: [],
      fieldPermissions: [],
      permissionFlagUniversalIdentifiers: [],
    });
  });

  it('exposes only a no-input native tool in this scaffold slice', () => {
    expect(cloverConnectionStatus.success).toBe(true);
    expect(cloverConnectionStatus.config).toMatchObject({
      name: 'clover-connection-status',
      toolTriggerSettings: {
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
    });
    expect(cloverConnectionStatus.config).not.toHaveProperty(
      'httpRouteTriggerSettings',
    );
  });

  it('accounts for every reviewed read category and forbids effects', () => {
    expect(CLOVER_REQUIRED_READ_PERMISSIONS).toEqual([
      'Read customers',
      'Read employees',
      'Read inventory',
      'Read merchant',
      'Read orders',
      'Read payments',
    ]);
    expect(CLOVER_FORBIDDEN_EFFECT_PERMISSIONS).toContain('Online payments');
    expect(
      CLOVER_FORBIDDEN_EFFECT_PERMISSIONS.every(
        (permission) =>
          permission.startsWith('Write') || permission === 'Online payments',
      ),
    ).toBe(true);
  });
});

import { defineLogicFunction } from 'twenty-sdk/define';
import { type AppConnection, listConnections } from 'twenty-sdk/logic-function';

import {
  CLOVER_CONNECTION_STATUS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  CLOVER_READER_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const CLOVER_MERCHANT_ID_PATTERN = /^[A-Z0-9]{13}$/;

type CloverConnectionStatus =
  | Readonly<{
      ok: true;
      status: 'connected';
      provider: 'clover';
      connectionId: string;
      merchantId: string;
      visibility: 'user' | 'workspace';
      ownerWorkspaceMemberId: string | null;
      bindingSource: 'connection-handle';
    }>
  | Readonly<{
      ok: false;
      status: 'unavailable';
      errorCode:
        | 'clover_connection_missing'
        | 'clover_connection_ambiguous'
        | 'clover_connection_auth_failed'
        | 'clover_connection_scope_unexpected'
        | 'clover_merchant_binding_unavailable'
        | 'clover_connection_unavailable';
    }>;

export const resolveCloverConnectionStatus = (
  connections: readonly AppConnection[],
): CloverConnectionStatus => {
  if (connections.length === 0) {
    return unavailable('clover_connection_missing');
  }

  if (connections.length !== 1) {
    return unavailable('clover_connection_ambiguous');
  }

  const connection = connections[0];

  if (connection.authFailedAt !== null) {
    return unavailable('clover_connection_auth_failed');
  }

  if (connection.scopes.length !== 0) {
    return unavailable('clover_connection_scope_unexpected');
  }

  if (!CLOVER_MERCHANT_ID_PATTERN.test(connection.handle)) {
    return unavailable('clover_merchant_binding_unavailable');
  }

  return {
    ok: true,
    status: 'connected',
    provider: 'clover',
    connectionId: connection.id,
    merchantId: connection.handle,
    visibility: connection.visibility,
    ownerWorkspaceMemberId: connection.workspaceMemberId,
    bindingSource: 'connection-handle',
  };
};

const unavailable = (
  errorCode: Extract<CloverConnectionStatus, { ok: false }>['errorCode'],
): CloverConnectionStatus => ({
  ok: false,
  status: 'unavailable',
  errorCode,
});

export const handleCloverConnectionStatus =
  async (): Promise<CloverConnectionStatus> => {
    try {
      const connections = await listConnections({ providerName: 'clover' });

      return resolveCloverConnectionStatus(connections);
    } catch {
      return unavailable('clover_connection_unavailable');
    }
  };

// The published v2.37.0 SDK types predate the role allowlist added by this
// source tree. This retains a narrow, checked declaration while allowing the
// App to typecheck against the exact published SDK package.
type LogicFunctionConfig = Parameters<typeof defineLogicFunction>[0];

type RoleScopedLogicFunctionConfig = LogicFunctionConfig & {
  toolTriggerSettings: NonNullable<
    LogicFunctionConfig['toolTriggerSettings']
  > & {
    allowedRoleUniversalIdentifiers: string[];
  };
};

const cloverConnectionStatusLogicFunction = {
  universalIdentifier:
    CLOVER_CONNECTION_STATUS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'clover-connection-status',
  description:
    'Reports the one visible Clover Connection and canonical merchant binding without returning credentials or calling Clover.',
  timeoutSeconds: 10,
  handler: handleCloverConnectionStatus,
  toolTriggerSettings: {
    allowedRoleUniversalIdentifiers: [CLOVER_READER_ROLE_UNIVERSAL_IDENTIFIER],
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
} satisfies RoleScopedLogicFunctionConfig;

export default defineLogicFunction(cloverConnectionStatusLogicFunction);

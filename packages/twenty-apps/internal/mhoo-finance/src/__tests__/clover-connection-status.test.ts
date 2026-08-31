import { describe, expect, it } from 'vitest';
import { type AppConnection } from 'twenty-sdk/logic-function';

import { resolveCloverConnectionStatus } from 'src/logic-functions/clover-connection-status.logic-function';

const buildConnection = (
  overrides: Partial<AppConnection> = {},
): AppConnection => ({
  id: 'connection-1',
  providerName: 'clover',
  name: 'Clover #1',
  handle: '88TJMM2T52WQ2',
  visibility: 'workspace',
  userWorkspaceId: 'user-workspace-1',
  workspaceMemberId: 'workspace-member-1',
  accessToken: 'fixture-access-token-that-must-not-escape',
  scopes: [],
  authFailedAt: null,
  ...overrides,
});

describe('Clover connection status', () => {
  it('returns one canonical binding without credentials', () => {
    const result = resolveCloverConnectionStatus([buildConnection()]);

    expect(result).toEqual({
      ok: true,
      status: 'connected',
      provider: 'clover',
      connectionId: 'connection-1',
      merchantId: '88TJMM2T52WQ2',
      visibility: 'workspace',
      ownerWorkspaceMemberId: 'workspace-member-1',
      bindingSource: 'connection-handle',
    });
    expect(JSON.stringify(result)).not.toContain('fixture-access-token');
  });

  it('fails closed when no visible connection exists', () => {
    expect(resolveCloverConnectionStatus([])).toMatchObject({
      ok: false,
      errorCode: 'clover_connection_missing',
    });
  });

  it('fails closed when more than one connection is visible', () => {
    expect(
      resolveCloverConnectionStatus([
        buildConnection(),
        buildConnection({ id: 'connection-2' }),
      ]),
    ).toMatchObject({
      ok: false,
      errorCode: 'clover_connection_ambiguous',
    });
  });

  it('rejects failed authentication and unexpected OAuth scopes', () => {
    expect(
      resolveCloverConnectionStatus([
        buildConnection({ authFailedAt: '2026-08-31T00:00:00.000Z' }),
      ]),
    ).toMatchObject({
      errorCode: 'clover_connection_auth_failed',
    });
    expect(
      resolveCloverConnectionStatus([
        buildConnection({ scopes: ['write'] }),
      ]),
    ).toMatchObject({
      errorCode: 'clover_connection_scope_unexpected',
    });
  });

  it('rejects an email-shaped or malformed merchant binding', () => {
    for (const handle of [
      'owner@example.com',
      'short',
      '88TJMM2T52WQ_',
      '88tjmm2t52wq2',
    ]) {
      expect(
        resolveCloverConnectionStatus([buildConnection({ handle })]),
      ).toMatchObject({
        ok: false,
        errorCode: 'clover_merchant_binding_unavailable',
      });
    }
  });
});

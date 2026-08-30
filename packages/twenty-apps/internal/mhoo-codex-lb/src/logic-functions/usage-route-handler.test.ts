import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const metadataQuery = vi.fn();

vi.mock('twenty-client-sdk/metadata', () => ({
  MetadataApiClient: class {
    query = metadataQuery;
  },
}));

import { usageRouteHandler } from 'src/logic-functions/usage-route-handler';

const responseBody = {
  generatedAt: '2026-08-30T12:00:00Z',
  window: '7d',
  windowStartedAt: '2026-08-23T12:00:00Z',
  totals: {
    requestCount: 3,
    inputTokens: 100,
    outputTokens: 20,
    cachedInputTokens: 30,
    errorCount: 1,
    totalCostUsd: 0.42,
  },
  workspaces: [
    {
      workspaceId: 'workspace-mhoo',
      workspaceName: 'MHOO',
      isActive: true,
      lastUsedAt: '2026-08-30T11:00:00Z',
      requestCount: 3,
      inputTokens: 100,
      outputTokens: 20,
      cachedInputTokens: 30,
      errorCount: 1,
      totalCostUsd: 0.42,
      models: [
        {
          model: 'gpt-5.6-sol',
          requestCount: 3,
          inputTokens: 100,
          outputTokens: 20,
          cachedInputTokens: 30,
          errorCount: 1,
          totalCostUsd: 0.42,
        },
      ],
    },
  ],
};

describe('usageRouteHandler', () => {
  beforeEach(() => {
    metadataQuery.mockReset();
    process.env.CODEX_LB_USAGE_BRIDGE_BASE_URL = 'http://codex-lb:2455';
    process.env.CODEX_LB_USAGE_BRIDGE_TOKEN = 'bridge-secret';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.CODEX_LB_USAGE_BRIDGE_BASE_URL;
    delete process.env.CODEX_LB_USAGE_BRIDGE_TOKEN;
  });

  it('denies callers without full server-admin access before contacting Codex-LB', async () => {
    metadataQuery.mockResolvedValue({
      currentUser: { canAccessFullAdminPanel: false },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await usageRouteHandler('7d');

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the bounded aggregate for a full server admin', async () => {
    metadataQuery.mockResolvedValue({
      currentUser: { canAccessFullAdminPanel: true },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new globalThis.Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await usageRouteHandler('7d');

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body as string)).toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: 'http://codex-lb:2455/api/integrations/twenty/v1/workspace-usage?window=7d',
      }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer bridge-secret' },
      }),
    );
  });

  it('rejects an unexpected gateway response instead of passing it through', async () => {
    metadataQuery.mockResolvedValue({
      currentUser: { canAccessFullAdminPanel: true },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new globalThis.Response(JSON.stringify({ secret: 'must-not-pass' }), {
          status: 200,
        }),
      ),
    );

    const response = await usageRouteHandler('30d');

    expect(response.status).toBe(502);
    expect(JSON.parse(response.body as string)).toEqual({
      error: 'Codex LB returned an invalid response',
    });
  });
});

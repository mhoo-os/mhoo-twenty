import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { Response } from 'twenty-sdk/logic-function';

import { parseGlobalUsage } from 'src/logic-functions/usage-response-validator';
import type { UsageWindow } from 'src/types/usage';

const WINDOWS = new Set<UsageWindow>(['1d', '7d', '30d']);

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const usageRouteHandler = async (rawWindow: string | undefined) => {
  const window: UsageWindow = WINDOWS.has(rawWindow as UsageWindow)
    ? (rawWindow as UsageWindow)
    : '7d';

  try {
    const identity = await new MetadataApiClient().query({
      currentUser: { canAccessFullAdminPanel: true },
    });
    if (identity.currentUser?.canAccessFullAdminPanel !== true) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
  } catch {
    return jsonResponse({ error: 'Authentication could not be verified' }, 401);
  }

  const rawBaseUrl = process.env.CODEX_LB_USAGE_BRIDGE_BASE_URL?.trim();
  const token = process.env.CODEX_LB_USAGE_BRIDGE_TOKEN?.trim();
  if (!rawBaseUrl || !token) {
    return jsonResponse({ error: 'Codex LB usage is not configured' }, 503);
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(rawBaseUrl);
    if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new Error();
  } catch {
    return jsonResponse({ error: 'Codex LB usage is not configured' }, 503);
  }

  const endpoint = new URL(
    '/api/integrations/twenty/v1/workspace-usage',
    baseUrl,
  );
  endpoint.searchParams.set('window', window);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return jsonResponse({ error: 'Codex LB usage is unavailable' }, 502);
    }
    const usage = parseGlobalUsage(await response.json());
    if (usage === null) {
      return jsonResponse({ error: 'Codex LB returned an invalid response' }, 502);
    }
    return jsonResponse(usage, 200);
  } catch {
    return jsonResponse({ error: 'Codex LB usage is unavailable' }, 502);
  }
};

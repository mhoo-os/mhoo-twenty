import type {
  GlobalUsage,
  ModelUsage,
  UsageTotals,
  UsageWindow,
  WorkspaceUsage,
} from 'src/types/usage';

const WINDOWS = new Set<UsageWindow>(['1d', '7d', '30d']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const parseTotals = (value: unknown): UsageTotals | null => {
  if (!isRecord(value)) return null;
  const fields = [
    'requestCount',
    'inputTokens',
    'outputTokens',
    'cachedInputTokens',
    'errorCount',
    'totalCostUsd',
  ] as const;
  if (!fields.every((field) => isNonNegativeNumber(value[field]))) {
    return null;
  }
  return {
    requestCount: value.requestCount as number,
    inputTokens: value.inputTokens as number,
    outputTokens: value.outputTokens as number,
    cachedInputTokens: value.cachedInputTokens as number,
    errorCount: value.errorCount as number,
    totalCostUsd: value.totalCostUsd as number,
  };
};

const parseModel = (value: unknown): ModelUsage | null => {
  if (!isRecord(value) || typeof value.model !== 'string') return null;
  const totals = parseTotals(value);
  return totals === null ? null : { model: value.model, ...totals };
};

const parseWorkspace = (value: unknown): WorkspaceUsage | null => {
  if (
    !isRecord(value) ||
    typeof value.workspaceId !== 'string' ||
    typeof value.workspaceName !== 'string' ||
    typeof value.isActive !== 'boolean' ||
    !(value.lastUsedAt === null || typeof value.lastUsedAt === 'string') ||
    !Array.isArray(value.models) ||
    value.models.length > 100
  ) {
    return null;
  }
  const totals = parseTotals(value);
  const models = value.models.map(parseModel);
  if (totals === null || models.some((model) => model === null)) return null;
  return {
    workspaceId: value.workspaceId,
    workspaceName: value.workspaceName,
    isActive: value.isActive,
    lastUsedAt: value.lastUsedAt,
    ...totals,
    models: models as ModelUsage[],
  };
};

export const parseGlobalUsage = (value: unknown): GlobalUsage | null => {
  if (
    !isRecord(value) ||
    typeof value.generatedAt !== 'string' ||
    typeof value.windowStartedAt !== 'string' ||
    typeof value.window !== 'string' ||
    !WINDOWS.has(value.window as UsageWindow) ||
    !Array.isArray(value.workspaces) ||
    value.workspaces.length > 500
  ) {
    return null;
  }
  const totals = parseTotals(value.totals);
  const workspaces = value.workspaces.map(parseWorkspace);
  if (totals === null || workspaces.some((workspace) => workspace === null)) {
    return null;
  }
  return {
    generatedAt: value.generatedAt,
    window: value.window as UsageWindow,
    windowStartedAt: value.windowStartedAt,
    totals,
    workspaces: workspaces as WorkspaceUsage[],
  };
};

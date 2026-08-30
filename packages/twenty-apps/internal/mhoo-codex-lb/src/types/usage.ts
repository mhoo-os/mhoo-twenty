export type UsageWindow = '1d' | '7d' | '30d';

export type UsageTotals = {
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  errorCount: number;
  totalCostUsd: number;
};

export type ModelUsage = UsageTotals & { model: string };

export type WorkspaceUsage = UsageTotals & {
  workspaceId: string;
  workspaceName: string;
  isActive: boolean;
  lastUsedAt: string | null;
  models: ModelUsage[];
};

export type GlobalUsage = {
  generatedAt: string;
  window: UsageWindow;
  windowStartedAt: string;
  totals: UsageTotals;
  workspaces: WorkspaceUsage[];
};

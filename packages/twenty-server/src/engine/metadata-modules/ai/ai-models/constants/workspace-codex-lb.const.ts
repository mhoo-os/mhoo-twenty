export const WORKSPACE_CODEX_LB_PROVIDER_NAME = 'codex-lb';
export const WORKSPACE_CODEX_LB_BASE_URL = 'https://codex-lb.mhoo.app/v1';
export const WORKSPACE_CODEX_LB_TERRA_MODEL_ID = 'codex-lb/gpt-5.6-terra';
export const WORKSPACE_CODEX_LB_LUNA_MODEL_ID = 'codex-lb/gpt-5.6-luna';
export const WORKSPACE_CODEX_LB_MODEL_IDS = [
  WORKSPACE_CODEX_LB_TERRA_MODEL_ID,
  WORKSPACE_CODEX_LB_LUNA_MODEL_ID,
] as const;

export const isWorkspaceCodexLbModelId = (modelId: string): boolean =>
  modelId === WORKSPACE_CODEX_LB_TERRA_MODEL_ID ||
  modelId === WORKSPACE_CODEX_LB_LUNA_MODEL_ID;

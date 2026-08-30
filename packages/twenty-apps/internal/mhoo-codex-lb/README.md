# Codex LB Usage

Private Mhoo Twenty App that shows aggregate Codex-LB usage across explicitly
bound Twenty Workspaces.

The command is visible only when `canAccessFullAdminPanel` is true. The
authenticated server-side route repeats that check before it calls Codex-LB
with a dedicated read-only service token. The browser never receives that
token or contacts Codex-LB directly.

Required server variables:

- `CODEX_LB_USAGE_BRIDGE_BASE_URL`
- `CODEX_LB_USAGE_BRIDGE_TOKEN`

The Codex-LB bridge is disabled while its matching server-side token is absent.
Bind one dedicated proxy key to each Workspace through the API-key
`twentyWorkspaceId` and `twentyWorkspaceName` fields.

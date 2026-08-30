# Mhoo Core App guidance

Follow [AGENTS.md](AGENTS.md). In addition:

- This package is an internal App in the Mhoo-Twenty monorepo, not a standalone
  npm-published integration.
- Pin both Twenty SDK packages to `2.37.0`; do not replace them with `latest`.
- Keep App metadata declaration files small and default-exported so the Twenty
  SDK can discover them through its manifest build.
- The built-in Workspace MCP provides role-aware generated CRUD tools for these
  objects. Do not add a custom MCP or logic function merely to duplicate CRUD.
- Validate with `yarn twenty dev:typecheck`, `yarn lint`, `yarn typecheck`,
  `yarn test:unit`, `yarn twenty dev:build`, then an explicit-remote `plan`.

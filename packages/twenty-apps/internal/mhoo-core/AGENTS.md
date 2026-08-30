# Mhoo Core App guidance

- This is a native Twenty `2.37.0` App. Read the Mhoo Twenty development skill
  and the governed v2.37 App documentation before changing metadata.
- Preserve the accepted boundary: Twenty owns identity, authentication,
  Workspace lifecycle, human authorization, and MCP authentication. Mhoo Core
  owns only deterministic operational records inside Twenty.
- Keep the v0.1 slice to `SystemComponent`, `HealthCheck`,
  `HealthObservation`, and `Evaluation`; model relationships with native
  relation fields and keep universal identifiers stable.
- Prefer native views, roles, generated API clients, and built-in Workspace
  MCP. Do not add a custom database, API, worker, MCP server, agent, or
  provider credential store without an accepted requirement.
- Use the isolated loopback remote in [SETUP.md](SETUP.md). Run `plan` before
  `apply`; never use `--force` or a non-disposable Workspace without explicit
  authorization.

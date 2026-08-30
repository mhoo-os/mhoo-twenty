# Mhoo Core

`@mhoo/core` is the internal Twenty App that begins Mhoo's deterministic
control plane. It records operational facts; it is not an AI runtime, a second
identity system, an external connector platform, or a parallel database/API.

## v0.1: observe and evaluate

The first vertical slice uses only native Twenty metadata and record primitives:

- `SystemComponent` — an Mhoo system, runtime, database, provider, or external dependency.
- `HealthCheck` — a configured check for a component.
- `HealthObservation` — append-oriented outcome data linked to a component and optional check.
- `Evaluation` — a deterministic proof or evaluation linked to a component.

The app ships three operator views: **System Overview**, **Needs Attention**
(degraded or failed observations), and **Evaluations**, plus the native Health
Checks index.

## Authority and access

Twenty remains the authority for Workspace lifecycle, people, authentication,
memberships, roles, API keys, and MCP authentication. This app adds only
domain metadata and these narrow roles:

- **Mhoo Operator** — reads and maintains the four Core objects; no delete or settings access.
- **Mhoo Observer** — reads those objects only.
- **Mhoo System Machine** — API-key-only, with writes limited to deterministic health/evaluation records and component state.

The app's default runtime role is read-only. No logic function, custom MCP
server, agent, credential store, job runner, or external connection is part of
this first slice.

## Native MCP path

Codex uses the Workspace's built-in `/mcp` endpoint with its authenticated
Twenty role. It discovers the current catalog before acting, then uses the
generated database tools exposed by the role, for example:

1. `list_object_metadata_names`
2. `learn_tools` for `find_many_health_observations` or `create_one_health_observation`
3. `execute_tool` with the discovered schema

An Observer receives read tools only. An Operator or a System-Machine API key
can receive the matching create/update tools. The server enforces the role;
MCP arguments never grant authority.

## Development

The safe, dedicated local loop is documented in [SETUP.md](SETUP.md). It uses
the governed Twenty `2.37.0` SDK and an isolated disposable loopback server.

## Deferred deliberately

Runtime instances, source connections, sync runs, incidents, operator actions,
OAuth/Connections, ingestion jobs, retrieval, agents, custom dashboards, and
custom tools are later slices. They need an actual bounded requirement rather
than a placeholder implementation.

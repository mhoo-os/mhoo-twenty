# Proposed Workspace AI provider boundary

Status: ADR-0019 accepted in `mhoo-os/mhoo`; source implementation **incomplete and not deployable** (2026-09-14). Mission: `codex-lb-usage-retirement-redeploy`.

## Observed gap

Twenty 2.37's Admin Panel → AI → Custom Providers is marked **Organization** on both live Workspace hosts. `AdminPanelResolver.addAiProvider()` writes `AI_PROVIDERS` via `TwentyConfigService`; `ProviderConfigService.getResolvedProviders()` reads that one instance configuration; `AiModelRegistryService` caches model/provider instances globally. It cannot hold two distinct keys with Workspace-only use. `WorkspaceEntity` stores `fastModel`, `smartModel`, and `enabledAiModelIds`, but no provider credential. `ApplicationRegistrationVariableEntity` is explicitly instance-scoped and is not a safe substitute. The existing `SecretEncryptionService.encryptVersioned` supports a `workspaceId` option.

Do not bind either live key through `AI_PROVIDERS`, even under distinct provider names: global catalog and model registry could expose and route the other Workspace's credential. A UI-only filter is not a security boundary.

## Accepted decision

ADR-0019 accepts a Twenty-owned Workspace credential boundary. The current source slice uses a hidden Workspace ciphertext column and per-Workspace provider cache; it is not complete until the upgrade command, authorized write/readback UI, Workspace model listing, every native execution path, and isolation tests pass. Do not deploy this intermediate branch.

## Smallest safe implementation candidate

1. Add a core metadata entity keyed by `(workspaceId, providerName)` with an `enc:v2` ciphertext column, a Workspace foreign key with cascade cleanup, and an explicit provider configuration limited to `https://codex-lb.mhoo.app/v1` and the two allowed model IDs for this mission. Encrypt/decrypt with `SecretEncryptionService` and `workspaceId`; never return plaintext from GraphQL, logs, DTOs, metrics, or UI readback. Update through a Workspace-authenticated mutation with the existing Workspace settings permission, server-side current Workspace identity, and a write-only key input. Do not accept a caller-supplied Workspace ID as authority.
2. Keep instance catalog providers separate. Refactor AI model resolution to require the resolved Workspace ID for Workspace calls and build/cache a Workspace-specific provider instance keyed by Workspace ID plus credential/config revision. Never reuse a global provider object containing a Workspace key. Missing or invalid Workspace configuration fails closed; no fallback to another Workspace or an instance-wide key for the same scoped provider.
3. Thread the authenticated Workspace ID through every execution path: Chat, Agent/async job, Workflow, title generation, setup chat, text generation, model validation/listing, client config, and usage/billing metadata. Derive it from the persisted run/workspace context on background work, not an untrusted request field. Return only the current Workspace's allowed models in its settings and pickers. Validate `smartModel`, `fastModel`, and enabled IDs against that same scoped registry; start with Terra where a default is required and permit Luna, no other codex-lb models.
4. Put credential entry in Workspace → AI, not Admin Panel → AI. Show endpoint, selected model IDs, and a boolean `configured`/masked status, but no secret prefix. Rotate by replacing only the current Workspace row and invalidating only its cached provider. Keep the global Custom Providers UI labeled Organization and refuse its use for these Workspace keys.

## Required proof before live keys or deploy

- Unit and integration tests with two Workspace IDs and distinct fake keys: each current-Workspace settings read returns only its own configuration; cross-Workspace update/read attempts are denied; encryption is Workspace-bound; DB stores no plaintext; rotation and Workspace deletion clean only the intended row.
- Concurrent routed mock requests from Chat, Agent/job, and Workflow assert Workspace A sends only key A and Workspace B sends only key B. A missing key, forged Workspace ID, stale cache entry, and model enabled only in the other Workspace all fail closed. Verify title/setup and model-list paths do not select a globally cached provider.
- Migration/upgrade guard, exact-source build/typecheck, focused tests, immutable image/source provenance, hosted two-Workspace UI readback, then one small authenticated routed request per Workspace. Source tests and saved settings alone do not prove production acceptance.

No live key was retrieved or entered; no provider, model, or runtime setting was changed as part of this source work.

# MHOO CI CONTRACT v1

## Scope and authority

`mhoo-os/mhoo-twenty` is the Mhoo source foundation built on Twenty v2.30.1.
This contract governs source validation, development checks, candidate custody,
and future deployment readiness. It does not transfer production authority,
import legacy data, or recreate the TwentyHQ operating environment.

The frozen source identity remains:

- upstream commit: `064bdd795a0bd78c65f024350cefed2c8f38a661`
- upstream tree: `7ebc5efa7f5f1bfdf9d238a88e3455decaa4f313`
- Mhoo exact-source commit: `5271f821d2adf6aa31c74b93d8166becc426fe0a`
- version: `v2.30.1`

The current signed candidate remains
`ghcr.io/mhoo-os/mhoo-twenty@sha256:c0f7f17aadec0ba66e6fbd94e4733ec33116ba64c5c4c23b1a666e48867cd2f5`.
This CI cleanup must not rebuild, retag as authoritative, or replace that
candidate.

## Fast PR CI

Ordinary pull requests receive deterministic, path-aware feedback from the
existing upstream-derived checks:

- lockfile/dependency installation through the repository Yarn action;
- formatting, lint, typecheck, build, and package tests;
- server, frontend, UI, SDK, shared, email, website, Zapier, create-app, and
  example-app checks where changed-file gates select them;
- source-boundary/provenance validation for the proposed branch;
- Codex plugin and other cheap static checks.

The `changed-files.yaml` reusable workflow may skip unrelated expensive jobs.
The path lists are safety decisions, not a replacement for validation:
database, migration, upgrade-command, generated-contract, and runtime changes
must select more validation. A documentation-only change does not need the
complete server integration matrix when no executable or runtime input is
changed.

PR concurrency uses a stable workflow/ref identity and cancellation for obsolete
PR work wherever the inherited workflow already supports it. Main/release,
merge-queue, signing, publication, and rehearsal jobs do not cancel in-flight
work when doing so could destroy evidence or leave a release operation
ambiguous.

## Deep CI

Expensive checks remain available and are not weakened:

- server integration and secure-deployment tests;
- database initialization, migrations, seeds, and runtime validation;
- cross-version upgrade from the pinned oldest supported image;
- upgrade-command mutation guards;
- Docker Compose and app-dev smoke tests;
- Twenty App discovery, install, local-server, and compatibility checks;
- labeled/main Playwright E2E;
- GraphQL, REST, metadata, and OpenAPI breaking-change checks;
- frontend screenshot artifact generation.

The cross-version workflow now requires an old image reference containing an
immutable digest. The default is the v1.22 multi-architecture manifest digest
recorded in the workflow; a manual override without `@sha256:` fails before
the old container starts.

The migration/upgrade controls are evidence gates. A failed protected-history
check is not converted to a pass by changing the baseline or deleting a test.

## Release and candidate CI

The Mhoo candidate path remains:

~~~text
exact source
  -> deterministic BuildKit build
  -> published image
  -> immutable digest
  -> exact-digest disposable runtime validation
  -> provenance/attestation
  -> Cosign/OIDC signature
  -> candidate custody/rehearsal staging
~~~

The source and candidate workflows are:

- `twenty-v2.30.1-provenance.yml`;
- `publish-twenty-v2.30.1-candidate.yml`;
- `sign-twenty-v2.30.1-candidate-4.yml`;
- `stage-twenty-v2.30.1-candidate-4-rehearsal.yml`.

A green health endpoint is not product readiness, and a signed image is not
production authority. Deployment, DNS, Cloudflare, Tailscale, production
databases, legacy data, credentials, and cutover remain outside this contract.

## Source and provenance rules

`scripts/provenance/verify-source.sh` continues to:

1. verify the upstream commit and tree;
2. verify the Mhoo exact-source tree;
3. verify the v2.30.0 baseline ancestry;
4. optionally verify the upstream remote tag;
5. hash-check the source package, lockfile, runtime pins, Dockerfile, and
   entrypoint;
6. reject differences from upstream outside an explicit overlay allowlist.

This PR adds only the CI-contract documentation, the listed Mhoo CI workflow
gates/pins, and the listed composite-action input protections to that
allowlist. The allowlist is deliberately path-specific; it is not a blanket
permission to alter application source or bypass provenance.

The verifier protects the Twenty source/runtime boundary; it deliberately does
not attest the reviewed CI-overlay contents that its allowlist excludes. Those
paths require normal repository governance (review, protected `main`, and
required checks). Missing overlay protections must be reported as a governance
gap, not represented as source-verifier coverage.

Historical rehearsal, recovery, publication, signing, and provenance records
remain historical evidence. They are not rewritten to reflect the fresh-build
strategy.

## Migration and upgrade rules

- Twenty remains frozen at v2.30.1 for this task.
- The upgrade mutation guard remains required.
- Cross-version upgrade uses a digest-addressed old image and a fresh per-run
  secret; it does not use production credentials or data.
- No legacy production database, PostgreSQL data, encryption key, Clover
  credential, integration, user, workspace, DNS record, Cloudflare setting,
  Tailscale setting, or deployed runtime is changed by this contract.
- A future deployment must separately prove candidate provenance, isolated
  rehearsal, rollback, approval, authenticated behavior, provider-effect
  boundaries, and another recovery checkpoint.

## Immutable dependency and image rules

Deterministic CI image inputs use `tag@sha256:digest` or a digest-only
reference. The current verified inputs are:

| Input | Reference |
|---|---|
| Twenty app-dev compatibility image | `twentycrm/twenty-app-dev:v2.30.1@sha256:fdcbd7d90c12a66a83efcdd204d6ea20eaf6fcf0a21ddfa5f2b9fe5e12846fce` |
| Postgres 18 service | `postgres:18@sha256:cd78ca58eb75f929698e117a589488ccb2bd45107247fe02400b50ff6c418324` |
| Postgres 16 upgrade/Claude service | `postgres:16@sha256:56f243d2355bad7d2016b1e78b80da8ac9e7967b766be2bfbff84fe85ffa30bc` |
| Redis 7 service | `redis:7@sha256:9815d9e94c50caed3d5b79ce0e4dfd916582560ec83c92d0fe3b8772579e6b86` |
| Redis 7 Alpine upgrade service | `redis:7-alpine@sha256:1db42ccef14898aa29bae778452d567534b59c107129cbc1163fb552de184d3c` |
| ClickHouse 25.8.8 service | `clickhouse/clickhouse-server:25.8.8@sha256:894fff7d48555eeb43a6b6467a514a03d74c6865cd905119a6a44e27c3e7e456` |
| OpenAPI Diff tool | `openapitools/openapi-diff@sha256:82291446e5554742d9c0725d7b315d18e93958c5526f9a663e8885227bdd6cb6` |
| Oldest supported Twenty image | `twentycrm/twenty:v1.22@sha256:63f5e89a1409816dba7fec7753747bf3d0fcfbef822f95048f029334e70f9116` |

The OpenAPI Diff digest was invoked locally with `--help` after resolution to
confirm the CLI remains available. Full API compatibility remains a GitHub CI
check. A future digest update must record the resolved manifest, platform,
compatibility result, and the reason for the change.

GitHub Actions are pinned to commit SHAs in the active workflows. The runner
label `ubuntu-latest` is a GitHub-managed execution environment rather than a
container input; changing runner classes requires a separate capacity and
compatibility review.

The reusable Docker action rejects the moving `latest` tag and moving `main`
source checkout. The existing `dockerhub-latest` source name in
`spawn-twenty-server` is retained only as an upstream compatibility name; its
Mhoo default is the immutable v2.30.1 app-dev reference.

The semver tag and digest are both required syntactically, but the reusable
Docker action does not yet independently prove that the supplied tag resolves
to the supplied digest in the registry. Tag-to-digest correspondence is an
explicit follow-up before treating that pair as a stronger release-identity
claim.

## Concurrency and trigger rules

- Obsolete PR runs should be cancelled where the workflow has no release or
  recovery evidence to preserve.
- Main, merge-queue, candidate publication, signing, and rehearsal work should
  not be cancelled in ways that leave ambiguous custody or incomplete evidence.
- Path filters may reduce cost only when the affected source boundary is
  explicit.
- TwentyHQ dispatch, Crowdin, private preview, private review, organization
  policy, Trust Center, and engineering-webhook automation has no automatic
  Mhoo trigger.
- TwentyHQ CLA messaging, contributor-ranking congratulations, and automated
  Claude documentation-drift review have no automatic Mhoo trigger.
- Retained upstream-only workflows use a manual or reusable interface plus an
  explicit `github.repository == 'twentyhq/twenty'` gate. This protects Mhoo
  even if a future sync accidentally restores a trigger before the workflow is
  reviewed.

## Explicitly outside Mhoo CI

The following are not required checks and must not be added as hidden
dependencies:

- TwentyHQ `ci-privileged`, `ci-public`, or `twenty-infra` dispatch;
- TwentyHQ GitHub App client IDs/private keys;
- TwentyHQ Crowdin projects or Crowdin tokens;
- TwentyHQ Argos/comment/review/preview infrastructure;
- TwentyHQ CLA and contributor-ranking automation;
- automated Claude documentation-drift review: Mhoo currently has no
  `CLAUDE_CODE_OAUTH_TOKEN`. The local `claude.yml` job remains an explicitly
  invoked, separately authorized capability until Mhoo deliberately configures
  its own credential and policy;
- TwentyHQ contributor-blocking policy and engineering webhook;
- production deployment/cutover, DNS, Cloudflare, Tailscale, or database
  mutation;
- legacy production data or credential import;
- application feature work unrelated to CI-contract cleanup.

Mhoo-owned visual testing currently ends at screenshot artifact generation. A
future Mhoo visual pipeline must be designed, authenticated, and reviewed
separately before it becomes a required check.

## Upstream synchronization expectations

When consuming a future Twenty update, classify each changed workflow again:

~~~text
upstream workflow
  |-- generic engineering protection -> inherit/adapt with evidence
  |-- TwentyHQ-only operation       -> keep visibly gated in Mhoo
  `-- Mhoo capability               -> add or change in a separate Mhoo overlay
~~~

Do not silently copy new TwentyHQ secrets, private repository names, release
authority, or moving image dependencies. Re-run the audit and update
`CI_AUDIT.md`, this contract, and the provenance overlay allowlist together.

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
PR work wherever the inherited workflow already supports it. `CI Front` also
uses the `mhoo-standard-runner-v1` generation in that identity, preserving its
per-ref grouping and main-SHA suffix while preventing remediated runs from
sharing the permanently stuck inherited larger-runner group. Main/release,
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
- `publish-twenty-v2.30.1-candidate-6.yml` (Candidate 6-only, input-free
  manual successor custody control);
- `sign-twenty-v2.30.1-candidate-4.yml`;
- `stage-twenty-v2.30.1-candidate-4-rehearsal.yml`.

## Candidate 6 custody control (remediated source/CI contract)

Candidate 6 has two deliberately distinct identities. Its immutable Git source
tag is the existing annotated `mhoo/candidate/v2.30.1-6` tag; it has object
`cafe7198449e337520ca7283654678a166aa8e3c`, peels to
`08d55ab7ed4bbc4e72fee825822c3ce0656c82ef`, and has source tree
`8d7b43fe941bc648a35bb486642d0d532013e5ae`. It is not an OCI image tag. A
later authorized publication identifies its OCI content only as
`ghcr.io/mhoo-os/mhoo-twenty@sha256:...`; the custody workflow must never
create or move a Candidate 6 OCI tag.

The independently reviewed predecessor had six custody defects: nonzero
registry inspection was treated as absence; a check-before-push mutable tag
could race an external publisher; Buildx metadata was treated as registry
authority; the receipt preceded evidence upload; grep trusted malformed YAML;
and Cosign was selected from `PATH`. GitHub Actions concurrency cannot solve
the external registry race. GHCR has no reviewed registry-enforced
create-if-absent / immutable-tag primitive in this contract, so the selected
primitive is digest-only OCI publication, not fixed-tag publication.

The manual, input-free workflow on reviewed `main` first verifies the annotated
Git source tag, its tagger metadata, peeled commit, source tree, exact upstream
lineage, and workflow blob. It builds a local OCI layout once, uploads blobs
and the root manifest/index to the authenticated OCI Registry API under its
canonical digest, then reads that digest back. A registry state is PRESENT only
for a valid authenticated response proving the object, ABSENT only for a valid
authenticated manifest-not-found response, and INDETERMINATE for every other
result. In particular, 401/403, 408/timeouts, DNS/TLS/transport failures, 429,
5xx, malformed responses, and generic tool errors fail the job; none means
absence.

The authoritative read-back requires exactly one `Docker-Content-Digest`
header, a supported manifest/index media type, and equality of Buildx's claimed
digest, the canonical digest reference, the header digest, and the SHA-256 of
the exact returned manifest/index bytes. Only then is the digest signed. Cosign
v2.6.1 is downloaded to a controlled absolute path, checked against reviewed
SHA-256 `064954c5d8c7e3b28188eee5b1727b31c411550bc5fefd41aa672d3c761d103a`,
rehashes immediately before signing and verification, and records its version,
path, checksum, source, runner OS, and architecture.

Raw evidence is created and structurally checked after signature verification,
uploaded with `if-no-files-found: error`, and its returned artifact ID, URL, and
digest are bound into the final receipt. The final receipt is created and
structurally validated only after that upload, and its upload is the final
custody operation. It records workflow ref/SHA/blob/run identity and action
SHAs; annotated-source-tag/tagger/annotation metadata; source and upstream
identity; builder/Docker information; every digest authority; media type;
digest-only reference; Cosign custody and verification; transparency evidence;
and validation results. Local receipt creation is not workflow success: the
terminal GitHub Actions conclusion remains authoritative.

`validate-candidate-6-publication-workflow.sh` requires actionlint and a
duplicate-key YAML parser, then structurally checks triggers, permissions,
jobs, actions, step ordering, digest-only commands, receipt fields, and
fail-closed registry handling. Its deterministic adversarial self-test rejects
duplicate keys, unauthorized triggers, comment-only commands, nonzero-as-absent
logic, permissive error paths, mutable tag pushes, unsafe receipt order,
unverified PATH Cosign, missing read-back or receipt fields, and unpinned
actions. No Candidate 6 publication occurred during this remediation. Phase 4
remains BLOCKED and R3 remains OPEN pending independent custody re-review and a
separately authorized publication run. Candidate 5 is not modified.

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
6. byte-verify the bounded Mhoo context block, when present at the exact start
   of upstream-owned `README.md`; and
7. reject differences from upstream outside an explicit full-path overlay
   allowlist.

Fully Mhoo-owned overlay paths, such as Mhoo provenance controls and the listed
CI workflow adaptations, use the deliberately path-specific allowlist. It is
not a blanket permission to alter application source or bypass provenance.

`README.md` is a different class: it remains upstream-owned and is not a full
path overlay. The verifier accepts the exact upstream blob or exactly one block
delimited by `<!-- mhoo-os-context:start -->` and
`<!-- mhoo-os-context:end -->` at byte zero, followed by exactly two LF bytes.
After removing only that prefix, the remaining bytes must exactly equal the
pinned upstream README. Duplicate, nested, missing, renamed, or relocated
markers and every extra, deleted, reordered, or modified upstream byte fail
closed. This bounded text overlay preserves upstream custody; it does not
exempt `README.md` from source verification.

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
container input. The public Mhoo fork's standard-runner capacity review records
4 CPU, 16 GB RAM, and 14 GB storage. `front-build` retains its existing 10 GB
Node heap. No frontend test, build, artifact, screenshot, or aggregate-status
gate is removed by this runner adaptation; actual CI execution is the
compatibility proof. If an actual standard-runner `front-build` or
`front-sb-build` failure is solely disk exhaustion or the existing 30-minute
timeout, one CI-only remediation may clean unused preinstalled runner
toolchains before dependency installation (with disk usage before/after), or
raise only the affected job timeout to at most 60 minutes. Functional failures
remain failures.

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

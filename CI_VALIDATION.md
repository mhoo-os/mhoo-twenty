# Mhoo CI contract v1 validation report

Status is recorded for the review branch `codex/mhoo-ci-contract-v1`.

## Changed workflows and actions

Changed for the Mhoo overlay:

- gated TwentyHQ-only dispatch, sync, preview, localization, review, comment,
  and engineering-webhook workflows;
- pinned active Postgres, Redis, ClickHouse, OpenAPI Diff, app-dev, and
  cross-version image inputs;
- required immutable old-version input for cross-version upgrade;
- required immutable semver-plus-digest input in the reusable Docker image
  action;
- updated `scripts/provenance/verify-source.sh` with a path-specific Mhoo
  overlay allowlist.

The complete file list is the branch diff. No application source, Twenty
version, historical rehearsal/provenance record, production configuration, or
database was changed.

## Workflows intentionally untouched

The core generic checks and release custody workflows remain untouched:

- `changed-files.yaml`;
- `ci-app-docs-drift.yaml`;
- `ci-codex-plugin.yaml`;
- `ci-create-app.yaml`;
- `ci-docs.yaml`;
- `ci-emails.yaml`;
- `ci-front.yaml`;
- `ci-front-component-renderer.yaml`;
- `ci-merge-queue.yaml`;
- `ci-release-create.yaml`;
- `ci-shared.yaml`;
- `ci-test-docker-compose.yaml`;
- `ci-twenty-apps.yaml`;
- `ci-ui.yaml`;
- `ci-utils.yaml`;
- `ci-website.yaml`;
- `discover-apps.yaml`;
- candidate publication, signing, staging, and provenance workflows.

They were reviewed, not silently omitted.

## Expected gating behavior

In `mhoo-os/mhoo-twenty`, the following no longer run automatically or require
TwentyHQ secrets:

- app prod-parity dispatch;
- TwentyHQ main/tag CD;
- AI catalog and DPA/Trust Center sync;
- blocked-contributor policy;
- external PR auto-draft;
- post-CI comments and PR review dispatch;
- preview and website-preview dispatch;
- Crowdin app/docs/website workflows;
- downstream visual regression dispatch;
- TwentyHQ cross-repository Claude response dispatch;
- the `engineering.twenty.com` main-failure webhook.

The local Claude job, where explicitly invoked and separately authorized,
remains distinct from the gated cross-repository job. CI UI/Front screenshot
artifacts remain produced locally.

## Checks run on this branch

Recorded checks:

- `git diff --check`: PASS.
- Docker manifest resolution for the v1.22 old image, v2.30.1 app-dev image,
  Postgres 18, Redis 7, and ClickHouse 25.8.8: PASS.
- OpenAPI Diff digest invocation with `--help`: PASS on the resolved amd64
  image manifest; full compatibility remains a CI check.
- Workflow/action YAML validation: PASS for changed workflow syntax and
  expressions with the repository's known baseline findings excluded.
  Unfiltered actionlint still reports pre-existing missing descriptions on
  local composite actions, the pre-existing `ci-zapier` needs-schema warning,
  and the pre-existing custom rehearsal runner label.
- Composite-action YAML parsing, provenance shell syntax, whitespace checks,
  and the no-moving-image scan: PASS.
- Source/provenance verification: PASS on the clean committed checkout,
  including the upstream remote tag and exact overlay allowlist.
- Relevant package/runtime tests: not yet run locally; GitHub Actions is the
  authoritative environment for the full matrix.

## Checks not run and why

- No production deployment, DNS, Cloudflare, Tailscale, database, credential,
  or legacy-data operation was run.
- No candidate was rebuilt or re-signed.
- Full server/frontend/integration/E2E matrices were not duplicated locally
  before the PR; recent authoritative runs already demonstrated the inherited
  checks, and this branch changes CI inputs/gating rather than application
  behavior.
- Crowdin, TwentyHQ private dispatch, preview, review, and engineering webhook
  checks were intentionally not invoked because Mhoo does not own their
  credentials or external systems.

An initial local manifest loop caught a 65-character ClickHouse digest typo
before commit; the corrected amd64 manifest and the full immutable-image loop
then passed.

## Failures and unresolved items

Historical failures that this contract intentionally removes from Mhoo's
automatic path include missing TwentyHQ dispatcher credentials, unavailable
Crowdin builds, and GitHub's inability to create/approve the inherited
automated catalog PR. They are not application failures and are preserved in
the audit rationale.

Any fresh failure from the branch's GitHub checks will be appended here with
the exact workflow/job and conclusion; it must not be hidden as a skipped
check.

## Expected Actions effect

Mhoo PRs should stop allocating runners to scheduled or event-driven
TwentyHQ-only dispatch/sync work. The valuable build, lint, typecheck, unit,
integration, migration, upgrade, app, screenshot, source-trust, candidate,
and signing paths remain available. Skipped/manual upstream-only workflow
files may remain visible in the Actions UI, but they should not fail due to
missing TwentyHQ secrets.

## Final PR validation

The branch-associated checks completed with no fresh failures:

- `CI SDK`, run `32648388139`: SDK lint, typecheck, unit, integration, and E2E
  jobs plus the status gate: PASS.
- `GraphQL and OpenAPI Breaking Changes Detection`, run `32648388150`:
  GraphQL and REST compatibility comparison: PASS.
- `Twenty v2.30.1 provenance`, run `32648388016`: canonical source trust,
  deterministic candidate build, and disposable exact-image runtime validation:
  PASS.

The final PR check snapshot contained 88 entries: 47 passed, 39 were skipped
by path or trigger conditions, 0 were pending, and 2 failed. The two failures
are inherited `pull_request_target` runs from the unmerged base branch, not
fresh branch failures:

- Auto-Draft External PRs, run `32648388042`, job `dispatch`: failed while
  minting the TwentyHQ `ci-privileged` dispatch token because
  `TWENTY_WORKFLOW_DISPATCHER_CLIENT_ID` is absent.
- PR Review Dispatch, run `32648388019`, job `dispatch`: failed at the same
  TwentyHQ token-mint step for the same reason.

The PR comment records why these base-branch results cannot evaluate the
changed `pull_request_target` definitions. No TwentyHQ or Mhoo credentials were
added. The changed branch definitions gate these workflows to the canonical
TwentyHQ repository and manual upstream-only use, so their post-merge Mhoo
behavior does not require those secrets.

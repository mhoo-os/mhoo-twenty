# Mhoo CI contract v1: inherited CI audit

Audit baseline: `main` at `52a305d1a4866b3a036278eef16d20394d423796`.

This repository is the canonical Mhoo fork of Twenty v2.30.1. The upstream
source identity remains recorded in `.twenty-source`; this audit covers the
operational CI overlay required for `mhoo-os/mhoo-twenty`.

Classification is per workflow/job. `GATE` means the upstream workflow file is
retained for synchronization, but its automatic Mhoo execution is disabled or
the job is explicitly limited to `twentyhq/twenty`. `REMOVE` would mean that a
file has no synchronization or future reference value; no files were physically
removed in this cleanup PR.

## Workflow and job decisions

| Workflow / jobs | Current purpose | Classification | Mhoo decision | Reason |
|---|---|---|---|---|
| `app-prod-parity-e2e-dispatch.yaml` / `dispatch` | Dispatches labeled or main app parity E2E to `twentyhq/ci-privileged`. | GATE | Keep file, manual upstream-only trigger, owner gate. | Requires a TwentyHQ GitHub App and private repository; Mhoo must not recreate those credentials. |
| `cd-deploy-main.yaml` / `website-changed-files`, `deploy-main` | Determines website changes and dispatches `twenty-infra` deployment. | GATE | Keep file, manual upstream-only trigger, owner gate. | Mhoo deployment belongs to the separate Mhoo-owned deployment architecture. |
| `cd-deploy-tag.yaml` / `dispatch-tag` | Dispatches tagged releases to TwentyHQ staging infrastructure. | GATE | Keep file, manual upstream-only trigger, owner gate. | No TwentyHQ infrastructure or deployment side effect is part of Mhoo CI. |
| `changed-files.yaml` / `changed-files` | Reusable path-change detector used by CI matrices. | KEEP | Continue using it for path-based gating. | Generic correctness optimization; it does not depend on TwentyHQ services. |
| `ci-ai-catalog-sync.yaml` / `sync-catalog` | Fetches an external model catalog, opens an automated PR, and asks TwentyHQ infra to automerge it. | GATE | Disable schedule; retain manual upstream-only trigger and owner gate. | The catalog source and automerge policy are not currently Mhoo-owned. |
| `ci-app-docs-drift.yaml` / `changed-files-check` | Identifies app-platform changes that may need documentation review. | KEEP | Preserve. | Generic, credential-free path guard. |
| `ci-app-docs-drift.yaml` / `docs-drift-check` | Uses Claude to inspect app-platform documentation drift and comment on a PR. | GATE | Run automatically only for `twentyhq/twenty`. | Mhoo has no `CLAUDE_CODE_OAUTH_TOKEN`; adding an owned token and policy is a separate decision. |
| `ci-blocked-contributors.yaml` / `check-blocked-contributors` | Enforces TwentyHQ contributor-blocking policy across PR conversations. | GATE | Disable automatic triggers; retain upstream-only manual trigger and owner gate. | Organization policy is not an Mhoo product or source-control contract. |
| `ci-breaking-changes.yaml` / `changed-files-check` | Limits API compatibility work to relevant source changes. | KEEP | Preserve. | Generic path guard. |
| `ci-breaking-changes.yaml` / `api-breaking-changes` | Builds both API revisions, runs GraphQL/REST/OpenAPI compatibility checks, and emits artifacts. | ADAPT | Preserve; pin Postgres, Redis, ClickHouse, and OpenAPI Diff inputs. | High-value compatibility protection; mutable service/tool references made results non-repeatable. |
| `ci-codex-plugin.yaml` / `changed-files-check`, `codex-plugin-validate` | Validates the repository Codex plugin. | KEEP | Preserve. | Mhoo-owned developer tooling and static contract. |
| `ci-create-app-e2e-minimal.yaml` / `changed-files-check`, `create-app-e2e-minimal`, `ci-create-app-e2e-minimal-status-check` | Scaffolds the smallest app, installs it, and exercises it against a server. | KEEP | Preserve; pin service inputs. | Protects the public app installation contract. |
| `ci-create-app.yaml` / `changed-files-check`, `create-app-test`, `ci-create-app-status-check` | Runs create-app unit/static tests. | KEEP | Preserve. | Generic SDK/scaffolding safety. |
| `ci-cross-version-upgrade.yaml` / `no-op`, `cross-version-upgrade` | Seeds an older Twenty image and proves upgrade into the current source database. | ADAPT | Preserve; default and manual old-version inputs require an immutable digest. | Migration safety is load-bearing; a moving old image would invalidate the evidence. |
| `ci-docs.yaml` / `changed-files-check`, `docs-lint` | Lints and validates documentation changes. | KEEP | Preserve. | Generic documentation protection. |
| `ci-dpa-subprocessors-sync.yaml` / `sync-subprocessors` | Syncs Twenty Trust Center data, opens a PR, and invokes TwentyHQ automerge. | GATE | Disable schedule; retain manual upstream-only trigger and owner gate. | TwentyHQ trust-center ownership and customer-notification policy are not Mhoo-owned. |
| `ci-e2e-main.yaml` / `e2e-test`, `ci-e2e-main-status-check` | Runs labeled/main Playwright E2E against built server and frontend. | ADAPT | Preserve; pin service images. | Valuable runtime/UI protection. |
| `ci-e2e-main.yaml` / `notify-main-ci-failure` | Posts failures to `engineering.twenty.com`. | GATE | Keep job for upstream sync, owner-gate the external webhook. | Prevents an unrelated external side effect from Mhoo. |
| `ci-emails.yaml` / `changed-files-check`, `emails-test`, `ci-emails-status-check` | Tests email package changes. | KEEP | Preserve. | Generic package protection. |
| `ci-example-app-hello-world.yaml` / `changed-files-check`, `example-app-hello-world`, `ci-example-app-hello-world-status-check` | Installs and tests the hello-world example app. | KEEP | Preserve; pin service images. | Protects the example app contract. |
| `ci-example-app-postcard.yaml` / `changed-files-check`, `example-app-postcard`, `ci-example-app-postcard-status-check` | Installs and tests the postcard example app. | KEEP | Preserve; pin service images. | Protects the example app contract. |
| `ci-front-component-renderer.yaml` / `changed-files-check`, `renderer-task`, `renderer-sb-build`, `renderer-sb-test`, `ci-front-component-renderer-status-check` | Builds and tests the frontend component renderer and Storybook. | KEEP | Preserve. | Generic frontend/component safety. |
| `ci-front.yaml` / `changed-files-check`, `front-sb-build`, `front-sb-test`, `front-sb-screenshots`, `front-task`, `front-build`, `ci-front-status-check` | Runs frontend lint/typecheck/tests/build and produces screenshot artifacts. | ADAPT | Preserve every Front and Storybook validation job on GitHub's standard public Ubuntu runner. | The inherited larger-runner label requires an unavailable paid plan for the public Mhoo fork; actual CI execution is the compatibility proof. Visual artifacts remain useful without the downstream TwentyHQ Argos dispatcher. |
| `ci-merge-queue.yaml` / `upgrade-mutation-guard` | Prevents protected upgrade-command history from being mutated without explicit approval. | KEEP | Preserve unchanged. | High-value migration immutability control; never weaken for green CI. |
| `ci-release-create.yaml` / `create_pr` | Creates a version-bump release PR on manual request. | ADAPT | Retain as manual release preparation; Mhoo release identity still needs explicit ownership review. | It does not dispatch TwentyHQ infrastructure, but its inherited release metadata is not yet a complete Mhoo release contract. |
| `ci-sdk.yaml` / `changed-files-check`, `sdk-test`, `sdk-e2e-test`, `ci-sdk-status-check` | Tests SDK packages and SDK E2E behavior against local services. | KEEP | Preserve; pin service images. | Protects the public SDK/app boundary. |
| `ci-server.yaml` / `changed-files-check`, `upgrade-changed-files-check` | Selects server/build versus upgrade-sensitive paths. | KEEP | Preserve. | Correctly makes database/upgrade changes more expensive, not less. |
| `ci-server.yaml` / `server-build`, `server-lint-typecheck`, `server-validation`, `server-test`, `server-integration-test` | Builds, lints, typechecks, migrates, seeds, and runs unit/integration/secure-deployment tests. | KEEP | Preserve; pin service images. | Core engineering protection demonstrated by successful recent runs. |
| `ci-server.yaml` / `server-previous-version-upgrade-mutation-guard` | Checks protected previous-version upgrade command history. | KEEP | Preserve unchanged. | Migration safety boundary. |
| `ci-server.yaml` / `cross-version-upgrade` | Calls the cross-version upgrade reusable workflow. | ADAPT | Preserve with immutable old-version input. | Upgrade evidence must identify its old image exactly. |
| `ci-server.yaml` / `discover-public-apps`, `server-apps-install-smoke` | Discovers public apps and installs them into a server smoke runtime. | KEEP | Preserve; the Docker Hub path now defaults to the v2.30.1 app-dev digest. | Protects app compatibility without a TwentyHQ service. |
| `ci-server.yaml` / `ci-server-status-check` | Aggregates server job outcomes. | KEEP | Preserve. | Required-style status aggregation for the server matrix. |
| `ci-shared.yaml` / `changed-files-check`, `shared-test`, `ci-shared-status-check` | Tests shared package code. | KEEP | Preserve. | Generic package protection. |
| `ci-test-docker-compose.yaml` / `changed-files-check`, `test-compose`, `test-app-dev`, `ci-test-docker-status-check` | Builds and starts local Docker Compose/server app-dev variants. | KEEP | Preserve. | Mhoo needs local build/runtime confidence; it does not use the TwentyHQ deployment stack. |
| `ci-twenty-apps.yaml` / `discover`, `ci`, `integration`, `ci-twenty-apps-status-check` | Discovers changed apps and tests them against local and Docker Hub server variants. | ADAPT | Preserve; Docker Hub app-dev default is pinned to v2.30.1 digest. | Valuable app compatibility check, previously exposed by a moving `latest` image. |
| `ci-ui.yaml` / `changed-files-check`, `ui-task`, `ui-sb-build`, `ui-sb-test`, `ci-ui-status-check` | Runs UI lint/typecheck/test/Storybook checks. | KEEP | Preserve. | Generic UI protection. |
| `ci-utils.yaml` / `danger-js` | Warns about package-lock and `.env.example` changes, posts the TwentyHQ CLA note, and finds TODO/FIXME markers. | ADAPT | Retain local warnings and TODO/FIXME checks; show the CLA note only in `twentyhq/twenty`. | The CLA is TwentyHQ policy, not a Mhoo contribution requirement. |
| `ci-utils.yaml` / `congratulate` | On a merged PR, queries TwentyHQ contributor services and posts rankings. | GATE | Run only in `twentyhq/twenty`. | It queries `twenty.com` and `twentyhq/twenty` contributor history, neither of which is Mhoo-owned automation. |
| `ci-website.yaml` / `changed-files-check`, `website-task`, `ci-website-status-check` | Tests the website package. | KEEP | Preserve. | Generic website package protection. |
| `ci-zapier.yaml` / `changed-files-check`, `server-setup`, `zapier-test`, `ci-zapier-status-check` | Runs Zapier integration tests against a local server. | KEEP | Preserve; pin service images. | Protects the integration package. |
| `claude.yml` / `claude` | Runs explicitly authorized local Claude work from trusted PR/issue interactions. | ADAPT | Preserve as a separately authorized Mhoo capability; pin local service images. | Not TwentyHQ infrastructure, but requires its own Mhoo secret/policy review. |
| `claude.yml` / `claude-cross-repo` | Posts responses to TwentyHQ `ci-privileged` after a repository dispatch. | GATE | Owner-gate the job. | Prevents a Mhoo run from requiring or attempting TwentyHQ credentials. |
| `discover-apps.yaml` / `discover` | Reusable app matrix discovery and app-folder safety checks. | KEEP | Preserve. | Generic reusable CI helper. |
| `docs-i18n-pull.yaml` / `pull_docs_translations` | Pulls Crowdin docs translations, commits a branch, and invokes TwentyHQ automerge. | GATE | Remove schedule/PR triggers; retain manual/call file for upstream synchronization and owner-gate. | Crowdin project and credentials are TwentyHQ-owned. |
| `docs-i18n-push.yaml` / `push_docs` | Uploads docs to the TwentyHQ Crowdin project. | GATE | Disable push trigger; retain manual/call file and owner-gate. | No Mhoo Crowdin configuration exists. |
| `external-contributor-pr-auto-draft.yaml` / `dispatch` | Sends external PRs to TwentyHQ private draft-conversion automation. | GATE | Disable automatic trigger; retain upstream-only manual file and owner-gate. | Do not mint or copy TwentyHQ App credentials. |
| `i18n-pull.yaml` / `pull_translations` | Pulls app translations from TwentyHQ Crowdin and dispatches automerge. | GATE | Disable schedule; retain manual/call file and owner-gate. | Localization authority is not Mhoo-owned. |
| `i18n-push.yaml` / `extract_translations` | Extracts/uploads app translations and dispatches automerge. | GATE | Disable push trigger; retain manual/call file and owner-gate. | Same Crowdin/infrastructure boundary. |
| `post-ci-comments.yaml` / `dispatch-breaking-changes` | Finds PRs after compatibility CI and dispatches comments to `ci-privileged`. | GATE | Disable workflow-run trigger; retain manual upstream-only file and owner-gate. | Comment delivery is TwentyHQ private automation. |
| `pr-review-dispatch.yaml` / `dispatch` | Sends PR review requests to TwentyHQ private review automation. | GATE | Disable automatic trigger; retain manual upstream-only file and owner-gate. | No Mhoo-owned review service is present. |
| `preview-env-dispatch.yaml` / `trigger-preview` | Dispatches PR previews to TwentyHQ `ci-public`. | GATE | Disable automatic trigger; retain manual upstream-only file and owner-gate. | Mhoo preview infrastructure is a separate future task. |
| `publish-twenty-v2.30.1-candidate.yml` / `publish` | Builds and publishes the v2.30.1 candidate artifact. | KEEP | Preserve. | Mhoo release custody is digest-addressed and already passed. |
| `sign-twenty-v2.30.1-candidate-4.yml` / `sign-existing` | Signs the already published candidate digest with Cosign/OIDC. | KEEP | Preserve unchanged. | Do not rebuild or change the signed candidate identity. |
| `stage-twenty-v2.30.1-candidate-4-rehearsal.yml` / `stage-candidate` | Stages the exact candidate for isolated rehearsal authorization. | KEEP | Preserve unchanged. | Historical rehearsal/custody evidence remains valid and separate from fresh deployment. |
| `twenty-v2.30.1-provenance.yml` / `source-trust`, `candidate-runtime` | Verifies exact source/tree and builds/validates a disposable candidate. | KEEP | Preserve; explicitly allow only the documented Mhoo CI overlay paths. | Source trust and runtime evidence are distinct load-bearing gates. |
| `visual-regression-dispatch.yaml` / `resolve-context`, `dispatch-pixel-diff` | Resolves screenshot artifacts and dispatches Argos/comment processing to `ci-privileged`. | GATE | Disable workflow-run trigger; retain upstream-only manual file and owner-gate both jobs. | CI UI/Front screenshot artifacts remain; downstream visual processing is not Mhoo-owned. |
| `website-i18n-pull.yaml` / `pull_website_translations` | Pulls website translations from TwentyHQ Crowdin and dispatches automerge. | GATE | Disable schedule; retain manual/call file and owner-gate. | No Mhoo localization authority or secret. |
| `website-i18n-push.yaml` / `extract_website_translations` | Extracts/uploads website translations and dispatches automerge. | GATE | Disable push trigger; retain manual/call file and owner-gate. | Same Crowdin/infrastructure boundary. |
| `website-preview-dispatch.yaml` / `trigger-build`, `trigger-cleanup` | Dispatches website preview build/cleanup to TwentyHQ private infrastructure. | GATE | Disable automatic trigger; retain manual upstream-only file and owner-gate. | Prevents unowned preview side effects. |

## Composite action decisions

| Action | Classification | Decision |
|---|---|---|
| `deploy-twenty-app/action.yml` | KEEP | Generic app deployment/install helper; no TwentyHQ dispatch. |
| `install-twenty-app/action.yml` | KEEP | Generic app installation helper. |
| `nx-affected/action.yaml` | KEEP | Generic affected-task runner. |
| `restore-cache/action.yaml` | KEEP | Generic cache restore. |
| `save-cache/action.yaml` | KEEP | Generic cache save. |
| `spawn-twenty-app-dev-test/action.yml` | ADAPT | Default is the v2.30.1 app-dev image index digest; reject a reference without `@sha256`. |
| `spawn-twenty-docker-image/action.yaml` | ADAPT | Reject `latest` and moving `main`; require semver plus immutable digest and derive the matching source tag. Tag-to-digest correspondence remains a documented follow-up. |
| `spawn-twenty-server/action.yml` | ADAPT | Keep the existing `dockerhub-latest` compatibility name, but make its default image and local Postgres/Redis immutable. |
| `test-twenty-app/action.yml` | KEEP | Generic installed-app test helper. |
| `upgrade-mutation-guard/action.yaml` | KEEP | High-value migration/upgrade immutability helper. |
| `yarn-install/action.yaml` | KEEP | Lockfile-controlled dependency installation. |

## Audit conclusion

The useful inherited contract is the build/test/upgrade/source-trust/release
layer. The unowned layer is the TwentyHQ organization and infrastructure
dispatch layer. This PR gates the latter without deleting the upstream files.
The source verifier enforces the Twenty source/runtime boundary by excluding
only the documented CI overlay paths from its upstream-difference check; it
does not attest the contents of that overlay. Overlay integrity instead relies
on normal repository governance: review, protected `main`, and required checks.

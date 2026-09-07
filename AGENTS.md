# AGENTS.md

## Repository role

`mhoo-twenty` is the maintained Mhoo fork of Twenty and, under accepted
ADR-0008, Mhoo's sole application and data framework. It owns the Twenty user
experience, Workspace behavior, `@mhoo/core`, later Mhoo Apps, and supported
framework extensions. It does not own provider facts, model reasoning,
architecture governance, or infrastructure deployment and cutover authority.

## Locked repository and accepted ownership

- General Twenty and `@mhoo/core` ownership remains assigned here by accepted
  ADR-0008. Accepted ADR-0009 assigns `@mhoo/finance` to `mhoo-twenty-next`;
  do not start or duplicate Finance implementation here.
- Accepted [ADR-0013](https://github.com/mhoo-os/mhoo/blob/abdc2be8a2adb6d979905db8bcf6a3ae6c41225c/ADR/0013-frozen-legacy-readme-context.md)
  preserves the locked legacy `main` and freezes `README.md` at
  `cbf80755521cee7b0e3fbea0c9d17eaf7582b1a7`, whole-file SHA-256
  `cd5872c2b124f7f1ace19f84223eb84247235a8f7752291fb0261606c12c3fc0`.
  Do not rewrite its generated notice or upstream body, unlock the branch,
  merge, delete source, or infer repository retirement from this exception.
- The accepted [MHO-256 receipt](https://github.com/mhoo-os/mhoo/blob/abdc2be8a2adb6d979905db8bcf6a3ae6c41225c/docs/architecture/finance/MHO-256-acceptance.md)
  records ADR-0009 acceptance and PR #46's supersession by the frozen exception.
  Stale local proposals and the historical README do not supersede those ADRs.
- Registration as a project or assignment of a repository head grants no new
  implementation or runtime authority. An authorized documentation proposal
  may be prepared in isolation; landing it remains subject to the branch lock
  and a separate owner decision. Do not bypass the lock.

## Start, reuse, and handoff

- Before probes or tests, read the assigned issue's existing run ledger and
  coordinator checkpoint. Reuse their exact-source receipts. The setup
  handoff uses `/Users/mhoooo/Documents/Codex/MHOO-DESK-SETUP.md` and
  `/Users/mhoooo/Documents/Codex/2026-09-06/mhoo-coordinator/checkpoint.json`;
  if unavailable, request their current location rather than making a new
  ledger. These are handoff pointers, not timeless operational authority.
- Verify origin, remote default branch and source SHA, local HEAD, dirty state,
  and existing worktrees. Missing local instructions do not prove absence on
  remote `main`. Preserve retained workers and their checkouts; use one isolated
  proposal lane. Finalize custody only after explicit receiving-head acceptance,
  notification to retained workers, their acknowledgment, and coordinator
  notification. Source publication alone does not establish adoption.
- Historical inputs include [PR #40](https://github.com/mhoo-os/mhoo-twenty/pull/40)
  (MHO-123 Gate 0) and [PR #45](https://github.com/mhoo-os/mhoo-twenty/pull/45)
  (Finance fixture slice). Compare their exact heads with the assigned target
  before reuse. An open PR is not a dispatch or proof of unported work.
- Invalidate only the evidence affected by changed source, configuration,
  environment, scope, or authority. Record the changed input and missing proof
  in the existing ledger; do not rerun accepted journeys because time passed.
- Finish an authorized increment with repository/base/head, changed files,
  validation evidence and limits, existing ledger/PR references, and remaining
  gates. Continue the next safe authorized step, including resolving missing
  evidence without a source change; do not repeat unchanged completed checks.
  Escalate ownership conflicts, absent ledgers, lock/freeze conflicts, or new
  external effects to the coordinator; otherwise wait without inventing work.
- Cleanup candidates require an exact path/ref, owner, retained evidence and
  dependency disposition. A prunable worktree or old branch alone authorizes
  no deletion.

## Sources of truth

- `.twenty-source` and `scripts/provenance/verify-source.sh` define and verify
  the immutable upstream/source identity and expected validation inputs.
- Before changing a Twenty App, SDK application surface, or Mhoo alternative to
  a Twenty primitive, read the coordination repository's
  [`mhoo-twenty-development` skill](https://github.com/mhoo-os/mhoo/blob/0e94e6b00a3033215e4df3ab197e5559652c2436/.agents/skills/mhoo-twenty-development/SKILL.md).
  The skill owns framework workflow; this file and accepted ADRs retain
  repository and architecture authority.
- Current source, migrations, tests, and Mhoo CI workflows establish implemented
  fork behavior. `CI_AUDIT.md` and `MHOO_CI_CONTRACT.md` classify inherited CI
  only where the checked-in workflows corroborate them.
- The root README is inherited upstream product documentation. Use it for
  context, never as Mhoo fork policy.
- Cross-repository authority comes from accepted ADRs in `../mhoo/ADR/`;
  deployment and operational state comes from `../infrastructure` evidence,
  not this repository.

## Upstream and fork boundaries

- Before editing, classify the behavior: untouched upstream Twenty, necessary
  Mhoo fork delta, Twenty App/extension, Core, or infrastructure. Choose the
  least-invasive layer and avoid unnecessary fork divergence.
- Do not casually change source pins, upstream tree identity, expected migration
  counts, image digests, lockfile identity, or signed/provenance values. A
  source or artifact identity change needs matching provenance and review.
- Keep Twenty as the sole human identity, authentication, membership, role,
  authorization, and Workspace-lifecycle authority. Do not introduce a
  parallel Core, connector, or App identity or data framework.
- Prefer a Twenty App or extension over a fork change when it can satisfy the
  requirement without altering upstream behavior. `@mhoo/core` and later Mhoo
  Apps live here. Use Twenty Connections and App-local logic by default;
  `connectors` remains conditional for an accepted shared or
  integration-heavy provider seam.

## CI and external effects

- Preserve valuable Mhoo engineering, migration, runtime, app, SDK,
  source-trust, provenance, and deterministic-CI protections.
- Do not enable, recreate credentials for, or depend on TwentyHQ-owned
  infrastructure, private automation, dispatch, previews, webhooks, Crowdin,
  or privileged services merely to make inherited workflows green.
- Publishing, signing, deployment, provider access, production migrations,
  credential changes, and cutover require explicit authorization. A candidate
  artifact or passing CI is not deployment or operational authority.

## Validation and architecture changes

- For documentation-only proposals, check `git diff --check` and verify the
  frozen README hash and byte equality against its pinned commit. This does
  not establish runtime or application-test acceptance.
- Existing commands, when the assigned change requires them: from repository
  root, `yarn nx run twenty-front:build`, `yarn nx run twenty-front:test`,
  `yarn nx run twenty-front:typecheck`, and corresponding `twenty-server`
  targets. Their definitions are in each package's `project.json`; dependencies
  may build other packages. Inspect scope before running them. The root pins
  Yarn 4.13.0 in `package.json`; do not install or change dependencies for a
  documentation-only check.
- Source custody commands are `scripts/provenance/verify-source.sh` and
  `scripts/provenance/test-verify-source.sh`, as used by
  `.github/workflows/twenty-v2.37.0-source.yml`. Run only applicable checks;
  never substitute another checkout's success for the proposed exact head.

- Do not manually edit a generated Mhoo context block. Run the central checker
  for context changes. The upstream README body outside the bounded notice
  remains upstream-owned, and local status prose must follow source/provenance
  evidence.
- Use the changed package's existing Nx/Yarn task and its focused tests. For
  source/provenance work, run `scripts/provenance/verify-source.sh` and the
  applicable checked-in provenance validation.
- Treat migration and upgrade guards as load-bearing; do not weaken them to
  obtain green CI. Verify an exact source head when a deliberately divergent
  baseline is under test.
- Changes to Mhoo-wide authority, tenancy, connectors, or deployment ownership
  require a new accepted ADR in `../mhoo/ADR/`; keep repository-local UI and App
  decisions here unless they alter those boundaries.

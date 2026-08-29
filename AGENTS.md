# AGENTS.md

## Repository role

`mhoo-twenty` is the maintained Mhoo fork of Twenty. It owns the Twenty user
experience, Workspace-facing behavior, Twenty Apps, and supported framework
extensions. It does not own Mhoo Core's separate data plane,
connector-provider authority, or infrastructure deployment and cutover
authority.

## Sources of truth

- Read the upstream engineering rules in [`CLAUDE.md`](CLAUDE.md) before
  changing inherited Twenty source.
- Before changing a Twenty App, SDK application surface, or Mhoo alternative to
  a Twenty primitive, read the coordination repository's
  [`mhoo-twenty-development` skill](../mhoo/.agents/skills/mhoo-twenty-development/SKILL.md).
  The skill owns framework workflow; this file and accepted ADRs retain
  repository and architecture authority.
- `.twenty-source` and `scripts/provenance/verify-source.sh` define and verify
  the immutable upstream/source identity and controlled Mhoo overlay.
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
  parallel Core, connector, or app identity system.
- Prefer a Twenty App or extension over a fork change when it can satisfy the
  requirement without altering upstream behavior. Route tenant-isolated
  cross-system data-plane work to Core and provider-heavy integration to
  connectors under the accepted architecture.

## CI and external effects

- Preserve valuable Mhoo engineering, migration, runtime, App, SDK,
  source-trust, provenance, and deterministic-CI protections.
- Do not enable, recreate credentials for, or depend on TwentyHQ-owned
  infrastructure, private automation, dispatch, previews, webhooks, Crowdin,
  or privileged services merely to make inherited workflows green.
- Publishing, signing, deployment, provider access, production migrations,
  credential changes, and cutover require explicit authorization. A candidate
  artifact or passing CI is not deployment or operational authority.

## Validation and architecture changes

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
  require an accepted ADR in `../mhoo/ADR/`; keep repository-local UI and App
  decisions here unless they alter those boundaries.

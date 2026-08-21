# Twenty baseline

## Decision

Mhoo Twenty is pinned to the official `twenty/v2.30.0` release.

- Upstream repository: `https://github.com/twentyhq/twenty.git`
- Upstream tag: `twenty/v2.30.0`
- Upstream commit: `531361c9a73b5eda6223fc8deae7d5b3fe144fec`
- Matching App SDK: `twenty-sdk@2.30.0` / `sdk/v2.30.0`
- Runtime toolchain: Node.js `^24.5.0`, Yarn `4.13.0`
- Self-hosted image: `twentycrm/twenty:v2.30.0` for `linux/amd64` and `linux/arm64`

This is a clean vanilla baseline. It does not contain data, credentials,
Mhoo business objects, Mhoo database migrations, or production configuration.

## Why this version

As verified on 2026-08-21, `twenty/v2.30.0` is the latest official GitHub
release that is neither a draft nor a prerelease. It is also the newest
candidate with all of the release surfaces aligned: an immutable Twenty tag, a
matching stable SDK tag and npm package, and a published multi-architecture
Docker image.

`v2.30.1` is not an upstream Twenty tag or release. `twenty/v2.32.0` exists as a
source tag and Docker image, but it is not an official GitHub release and
`twenty-sdk@2.32.0` is not published. Moving from 2.30 to 2.32 also crosses 208
upstream commits and adds the 2.31 and 2.32 instance/workspace upgrade command
sets. That is a useful future upgrade candidate, not a sound first production
baseline.

## Upgrade strategy

1. Track `upstream` as `https://github.com/twentyhq/twenty.git` and fetch tags
   without rewriting fork history.
2. Evaluate only official, non-prerelease Twenty releases with matching SDK and
   Docker artifacts.
3. Create an isolated upgrade branch from this baseline branch.
4. Review release notes, App SDK changes, database migrations, instance upgrade
   commands, workspace upgrade commands, environment variables, and Docker
   Compose changes before updating the pin.
5. Prove a clean install and a disposable copy upgrade separately. Never test
   an upgrade against production data first.
6. Require server, worker, migrations, login, workspace creation, and any
   installed Mhoo Apps to pass before adopting the new baseline.

Version upgrades are deliberate pull requests. The branch must not float with
`upstream/main` or a mutable Docker `latest` tag.

## Customization boundary

Keep this repository close to vanilla Twenty so upstream upgrades remain
reviewable.

- Prefer Twenty configuration and supported extension points over core edits.
- Build Mhoo-specific UI and behavior as separately versioned Mhoo Apps when
  that work is approved.
- Keep external provider integrations in `mhoo-os/connectors`.
- Keep AI infrastructure in `mhoo-os/codex-lb`.
- Keep the future business state layer in `mhoo-os/core`.
- Keep architecture and product documentation in `mhoo-os/mhoo`.
- Do not add Mhoo business state, provider credentials, deployment secrets, or
  production data to this repository.

If a Twenty core change becomes unavoidable, isolate it in a small commit,
document the upstream issue and removal condition, and test it independently
from Mhoo App changes.

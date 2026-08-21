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
reviewable. This repository is Mhoo's UI and workspace layer, not the business
state or provider-integration layer.

- Prefer Twenty configuration, Apps, and supported extension points over core
  edits.
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

## Clean reproduction record

The baseline was reproduced on 2026-08-21 from a fresh clone and new disposable
PostgreSQL and Redis volumes. No existing local Twenty database or Redis state
was used.

Versions used:

- macOS 26.3.1 on arm64
- Node.js 24.16.0 and Yarn 4.13.0
- Docker Engine 29.6.2 and Docker Compose 5.3.1
- PostgreSQL 16.14 from `postgres:16`
- Redis 7.4.11 from `redis:7`

The equivalent commands were:

```bash
yarn install --immutable

# Start new PostgreSQL 16 and Redis 7 containers with new volumes, then export:
export PG_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/default
export REDIS_URL=redis://127.0.0.1:56379
export NODE_ENV=development
export APP_SECRET=baseline-smoke-secret
export FRONTEND_URL=http://127.0.0.1:3301
export SERVER_URL=http://127.0.0.1:3300
export NODE_PORT=3300
export NX_DAEMON=false

for project in twenty-ui twenty-shared twenty-client-sdk twenty-emails twenty-sdk twenty-server; do
  npx nx run "$project:build" --excludeTaskDependencies --skip-nx-cache
done

npx nx run twenty-ui:build:individual --excludeTaskDependencies --skip-nx-cache
npx nx run twenty-shared:build:individual --excludeTaskDependencies --skip-nx-cache
npx nx run twenty-sdk:build:sdk --excludeTaskDependencies --skip-nx-cache
npx nx run twenty-front-component-renderer:sandbox:prebuild --excludeTaskDependencies --skip-nx-cache
npx nx run twenty-front-component-renderer:build --excludeTaskDependencies --skip-nx-cache
npx nx run twenty-front:build --excludeTaskDependencies --skip-nx-cache

cd packages/twenty-server
node dist/database/scripts/setup-db.js
node dist/command/command.js run-instance-commands --force --include-slow
node dist/command/command.js workspace:seed:dev
node dist/main.js
node dist/queue-worker/queue-worker.js
```

Results:

- Immutable dependency installation completed without changing the lockfile.
- The server and workspace UI production builds completed.
- Database setup created 71 core tables; all 140 recorded upgrade migrations
  had `completed` status.
- Development seeding created two workspaces and the seeded login succeeded.
- The compiled server returned HTTP 200 with `status: ok` from `/healthz`.
- The compiled worker started and processed queued seed jobs.

### Upstream startup caveat

On the unmodified `twenty/v2.30.0` source, `npx nx database:init
twenty-server` can remain alive in `twenty-shared:generateBarrels` after its
tracked files have been written. The same behavior occurs in the formatter-
backed remote DOM generator. Both use `@prettier/sync` 0.5.5; retained worker
activity prevents the Nx task from returning. The pre-smoke foundation commits
changed only documentation and `.twenty-baseline` relative to the upstream tag,
so this is upstream behavior rather than a Mhoo product change.

This affects CI: a direct `database:init` job can stall before database setup.
The baseline smoke workflow therefore validates the checked-in generated
artifacts, compiles the dependency targets directly with
`--excludeTaskDependencies`, and invokes the already-built database setup,
migration, and seed entry points separately. This is a CI wrapper only; it does
not modify Twenty internals. The tradeoff is that this smoke workflow proves
the checked-in release artifacts build, but does not prove that regenerating
those artifacts terminates. Upstream generator changes must continue to be
reviewed separately.

The v2.30.0 server also reads `NODE_PORT`; the `.env.example` comment still
shows `PORT`. Use `NODE_PORT` when selecting a non-default runtime port.

# Local development loop

This App targets the governed Twenty `v2.37.0` framework. Keep its local
Workspace isolated from the legacy v2.30.1 App-dev volumes and from every
remote Mhoo Workspace.

## Prerequisites

- Node `24.16.0` and Corepack/Yarn `4.13.0`
- Docker Desktop running
- the cached `twentycrm/twenty-app-dev:v2.37.0` image

## Install the App dependencies

The first install creates the Yarn 4 lockfile from the pinned SDK packages:

```bash
corepack yarn install
corepack yarn install --immutable
```

## Start the disposable v2.37 server

First verify the dedicated name, volumes, and port are unused:

```bash
lsof -nP -iTCP:2022 -sTCP:LISTEN
docker ps -a --filter name='^/mhoo-twenty-core-app-dev$'
docker volume ls --format '{{.Name}}' | rg '^mhoo-twenty-core-app-dev-(data|storage)$'
```

Then start only this loopback-bound container:

```bash
docker run -d --pull=never \
  --name mhoo-twenty-core-app-dev \
  -p 127.0.0.1:2022:2022 \
  -e NODE_PORT=2022 \
  -e SERVER_URL=http://localhost:2022 \
  -v mhoo-twenty-core-app-dev-data:/data/postgres \
  -v mhoo-twenty-core-app-dev-storage:/app/packages/twenty-server/.local-storage \
  twentycrm/twenty-app-dev@sha256:53381e68f6fa50808f624f4c0125ce2143c6d21321ba25886e1115c73367c6e6
curl -fsS http://127.0.0.1:2022/healthz
```

Do not use `yarn twenty docker:start` here: its stock container and volume
names can reuse the legacy local App-dev state.

## Register the dedicated remote

The Twenty CLI stores its remote list globally. Add the local remote through
OAuth, immediately restore the previous default, and always pass the explicit
remote name below. Do not paste API keys into source or shell history.

```bash
corepack yarn twenty remote:add --as mhoo-core-local --url http://localhost:2022
corepack yarn twenty remote:use production
```

## Verify, plan, and sync

```bash
corepack yarn lint
corepack yarn typecheck
corepack yarn test:unit
corepack yarn twenty dev:typecheck
corepack yarn twenty dev:build

# Read-only metadata preview.
corepack yarn twenty --remote mhoo-core-local plan

# Only after reviewing the plan, apply to this disposable Workspace.
corepack yarn twenty --remote mhoo-core-local apply

# Watch and resync future local metadata changes.
corepack yarn twenty --remote mhoo-core-local dev --verbose
```

Never pass `--force`, deploy, publish, install, or point these commands at a
non-disposable Workspace without separate authorization.

## Integration checks

Integration tests require an explicit, disposable loopback URL and test API
key; they refuse any non-loopback URL:

```bash
TWENTY_API_URL=http://localhost:2022 TWENTY_API_KEY='<local-test-key>' \
  corepack yarn test
```

#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(git rev-parse --show-toplevel)"
SOURCE_MANIFEST="$REPOSITORY_ROOT/.twenty-source"
IMAGE_NAME="${IMAGE_NAME:-mhoo-os/mhoo-twenty:mhoo-twenty-v2.30.1-candidate.1}"
SOURCE_REVISION="${SOURCE_REVISION:-$(git rev-parse HEAD)}"
BUILD_ID="${BUILD_ID:-mhoo-twenty-v2.30.1-candidate.1}"
CANDIDATE_DIGEST="${CANDIDATE_DIGEST:-}"
ARTIFACT_DIRECTORY="${ARTIFACT_DIRECTORY:-$(git rev-parse --git-path candidate-artifacts)}"
REPORT_PATH="${REPORT_PATH:-$ARTIFACT_DIRECTORY/${BUILD_ID}.validation.json}"

fail() {
  echo "candidate validation failed: $*" >&2
  exit 1
}

manifest_value() {
  local key="$1"
  local value

  value="$(sed -n "s/^${key}=//p" "$SOURCE_MANIFEST")"
  [[ -n "$value" ]] || fail "missing ${key} in .twenty-source"
  printf '%s' "$value"
}

assert_equal() {
  local actual="$1"
  local expected="$2"
  local description="$3"

  [[ "$actual" == "$expected" ]] ||
    fail "${description}: expected ${expected}, got ${actual}"
}

wait_for_healthy_container() {
  local container_name="$1"

  for _ in $(seq 1 90); do
    if [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container_name" 2>/dev/null)" == "healthy" ]]; then
      return
    fi
    if [[ "$(docker inspect --format '{{.State.Running}}' "$container_name" 2>/dev/null)" != "true" ]]; then
      docker logs "$container_name" >&2 || true
      fail "${container_name} stopped before becoming healthy"
    fi
    sleep 2
  done

  docker logs "$container_name" >&2 || true
  fail "${container_name} did not become healthy"
}

wait_for_server() {
  for _ in $(seq 1 180); do
    if curl --fail --silent "${SERVER_URL}/healthz" >/dev/null; then
      return
    fi
    if [[ "$(docker inspect --format '{{.State.Running}}' "$SERVER_CONTAINER" 2>/dev/null)" != "true" ]]; then
      docker logs "$SERVER_CONTAINER" >&2 || true
      fail "candidate server stopped during startup"
    fi
    sleep 2
  done

  docker logs "$SERVER_CONTAINER" >&2 || true
  fail "candidate server did not become healthy"
}

RUN_SUFFIX="$(date -u +%Y%m%d%H%M%S)-$$"
NETWORK_NAME="mhoo-twenty-candidate-${RUN_SUFFIX}"
POSTGRES_CONTAINER="mhoo-twenty-postgres-${RUN_SUFFIX}"
REDIS_CONTAINER="mhoo-twenty-redis-${RUN_SUFFIX}"
SERVER_CONTAINER="mhoo-twenty-server-${RUN_SUFFIX}"
WORKER_CONTAINER="mhoo-twenty-worker-${RUN_SUFFIX}"
LOG_DIRECTORY="$(mktemp -d -t mhoo-twenty-candidate.XXXXXX)"
VALIDATION_PASSED=0

cleanup() {
  local exit_code=$?

  if [[ "$VALIDATION_PASSED" != "1" ]]; then
    docker logs "$SERVER_CONTAINER" >"$LOG_DIRECTORY/server.log" 2>&1 || true
    docker logs "$WORKER_CONTAINER" >"$LOG_DIRECTORY/worker.log" 2>&1 || true
    tail -n 200 "$LOG_DIRECTORY/server.log" >&2 || true
    tail -n 200 "$LOG_DIRECTORY/worker.log" >&2 || true
  fi

  docker rm -f "$WORKER_CONTAINER" "$SERVER_CONTAINER" "$REDIS_CONTAINER" "$POSTGRES_CONTAINER" \
    >/dev/null 2>&1 || true
  docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
  rm -rf "$LOG_DIRECTORY"
  exit "$exit_code"
}
trap cleanup EXIT

cd "$REPOSITORY_ROOT"
docker image inspect "$IMAGE_NAME" >/dev/null 2>&1 || fail "image ${IMAGE_NAME} is not loaded"

assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{.Os}}/{{.Architecture}}')" \
  "$(manifest_value TWENTY_BUILD_PLATFORM)" "candidate platform"
assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{index .Config.Labels "org.opencontainers.image.source"}}')" \
  "https://github.com/mhoo-os/mhoo-twenty" "OCI source label"
assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" \
  "$SOURCE_REVISION" "OCI revision label"
assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{index .Config.Labels "org.opencontainers.image.version"}}')" \
  "$(manifest_value TWENTY_VERSION)" "OCI version label"
assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{index .Config.Labels "io.mhoo.build.id"}}')" \
  "$BUILD_ID" "OCI build label"
assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{index .Config.Labels "io.mhoo.twenty.upstream.revision"}}')" \
  "$(manifest_value TWENTY_UPSTREAM_COMMIT)" "upstream revision label"
assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{index .Config.Labels "io.mhoo.twenty.upstream.tree"}}')" \
  "$(manifest_value TWENTY_UPSTREAM_TREE)" "upstream tree label"

docker network create "$NETWORK_NAME" >/dev/null

docker run --detach \
  --name "$POSTGRES_CONTAINER" \
  --network "$NETWORK_NAME" \
  --network-alias postgres \
  --env POSTGRES_DB=default \
  --env POSTGRES_PASSWORD=postgres \
  --health-cmd 'pg_isready -U postgres -d default' \
  --health-interval 2s \
  --health-timeout 5s \
  --health-retries 45 \
  "$(manifest_value VALIDATION_POSTGRES_IMAGE)" >/dev/null

docker run --detach \
  --name "$REDIS_CONTAINER" \
  --network "$NETWORK_NAME" \
  --network-alias redis \
  --health-cmd 'redis-cli ping' \
  --health-interval 2s \
  --health-timeout 5s \
  --health-retries 45 \
  "$(manifest_value VALIDATION_REDIS_IMAGE)" >/dev/null

wait_for_healthy_container "$POSTGRES_CONTAINER"
wait_for_healthy_container "$REDIS_CONTAINER"

COMMON_ENVIRONMENT=(
  --env APP_SECRET=candidate-validation-only-secret-never-production
  --env FRONTEND_URL=http://127.0.0.1:3000
  --env IS_CONFIG_VARIABLES_IN_DB_ENABLED=false
  --env IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=false
  --env NODE_ENV=production
  --env PG_DATABASE_URL=postgres://postgres:postgres@postgres:5432/default
  --env REDIS_URL=redis://redis:6379
  --env SERVER_URL=http://127.0.0.1:3000
  --env SIGN_IN_PREFILLED=true
  --env STORAGE_TYPE=local
)

docker run --detach \
  --platform "$(manifest_value TWENTY_BUILD_PLATFORM)" \
  --name "$SERVER_CONTAINER" \
  --network "$NETWORK_NAME" \
  --publish 127.0.0.1::3000 \
  "${COMMON_ENVIRONMENT[@]}" \
  --env DISABLE_CRON_JOBS_REGISTRATION=true \
  "$IMAGE_NAME" >/dev/null

SERVER_PORT="$(docker port "$SERVER_CONTAINER" 3000/tcp | head -n 1 | awk -F: '{print $NF}')"
[[ "$SERVER_PORT" =~ ^[0-9]+$ ]] || fail "could not resolve candidate server port"
SERVER_URL="http://127.0.0.1:${SERVER_PORT}"

wait_for_server

HEALTH_STATUS="$(curl --fail --silent "${SERVER_URL}/healthz" | jq -r '.status')"
assert_equal "$HEALTH_STATUS" "ok" "health endpoint"

CLIENT_CONFIG="$(curl --fail --silent "${SERVER_URL}/client-config")"
assert_equal "$(jq -r '.appVersion' <<<"$CLIENT_CONFIG")" \
  "$(manifest_value TWENTY_VERSION)" "client-config app version"
assert_equal "$(jq -r '.isConfigVariablesInDbEnabled' <<<"$CLIENT_CONFIG")" \
  "false" "client-config environment authority"

curl --fail --silent "${SERVER_URL}/" | grep -q '<div id="root"></div>' ||
  fail "frontend root did not return the frozen Twenty shell"

CORE_TABLE_COUNT="$(
  docker exec "$POSTGRES_CONTAINER" psql -U postgres -d default -Atc \
    "SELECT count(*) FROM pg_tables WHERE schemaname='core';"
)"
TYPEORM_MIGRATION_COUNT="$(
  docker exec "$POSTGRES_CONTAINER" psql -U postgres -d default -Atc \
    'SELECT count(*) FROM core._typeorm_migrations;'
)"
COMPLETED_UPGRADE_COUNT="$(
  docker exec "$POSTGRES_CONTAINER" psql -U postgres -d default -Atc \
    'SELECT count(*) FROM core."upgradeMigration";'
)"

assert_equal "$CORE_TABLE_COUNT" "$(manifest_value EXPECTED_CORE_TABLE_COUNT)" \
  "core table count"
assert_equal "$TYPEORM_MIGRATION_COUNT" "$(manifest_value EXPECTED_TYPEORM_MIGRATION_COUNT)" \
  "TypeORM migration count"
assert_equal "$COMPLETED_UPGRADE_COUNT" "$(manifest_value EXPECTED_COMPLETED_UPGRADE_COUNT)" \
  "completed upgrade count"

docker run --rm \
  --platform "$(manifest_value TWENTY_BUILD_PLATFORM)" \
  --network "$NETWORK_NAME" \
  "${COMMON_ENVIRONMENT[@]}" \
  --env NODE_ENV=development \
  --entrypoint node \
  "$IMAGE_NAME" \
  dist/command/command workspace:seed:dev >/dev/null

docker run --detach \
  --platform "$(manifest_value TWENTY_BUILD_PLATFORM)" \
  --name "$WORKER_CONTAINER" \
  --network "$NETWORK_NAME" \
  "${COMMON_ENVIRONMENT[@]}" \
  --env DISABLE_CRON_JOBS_REGISTRATION=true \
  --env DISABLE_DB_MIGRATIONS=true \
  "$IMAGE_NAME" \
  node dist/queue-worker/queue-worker >/dev/null

for _ in $(seq 1 90); do
  if docker logs "$WORKER_CONTAINER" 2>&1 | grep -Eq 'Processing job .* on queue'; then
    break
  fi
  if [[ "$(docker inspect --format '{{.State.Running}}' "$WORKER_CONTAINER")" != "true" ]]; then
    docker logs "$WORKER_CONTAINER" >&2 || true
    fail "candidate worker stopped during startup"
  fi
  sleep 2
done

docker logs "$WORKER_CONTAINER" 2>&1 | grep -Eq 'Processing job .* on queue' ||
  fail "candidate worker did not process the seeded queue"
[[ "$(docker inspect --format '{{.State.Running}}' "$WORKER_CONTAINER")" == "true" ]] ||
  fail "candidate worker is not running"

# shellcheck disable=SC2016
LOGIN_QUERY='mutation CandidateLogin($email: String!, $password: String!) { signIn(email: $email, password: $password) { availableWorkspaces { availableWorkspacesForSignIn { loginToken } } tokens { accessOrWorkspaceAgnosticToken { token } refreshToken { token } } } }'
LOGIN_PAYLOAD="$(jq -nc \
  --arg query "$LOGIN_QUERY" \
  --arg email 'tim@apple.dev' \
  --arg password 'tim@apple.dev' \
  '{query: $query, variables: {email: $email, password: $password}}')"
LOGIN_RESPONSE="$(curl --fail --silent \
  --header 'Content-Type: application/json' \
  --data "$LOGIN_PAYLOAD" \
  "${SERVER_URL}/metadata")"

jq -e '
  .errors == null and
  (.data.signIn.availableWorkspaces.availableWorkspacesForSignIn | length) > 0 and
  (.data.signIn.availableWorkspaces.availableWorkspacesForSignIn[0].loginToken | length) > 20 and
  (.data.signIn.tokens.accessOrWorkspaceAgnosticToken.token | length) > 20 and
  (.data.signIn.tokens.refreshToken.token | length) > 20
' <<<"$LOGIN_RESPONSE" >/dev/null || fail "seeded authenticated login failed"

mkdir -p "$(dirname "$REPORT_PATH")"
jq -n \
  --arg buildId "$BUILD_ID" \
  --arg candidateDigest "$CANDIDATE_DIGEST" \
  --arg image "$IMAGE_NAME" \
  --arg sourceRevision "$SOURCE_REVISION" \
  --arg upstreamCommit "$(manifest_value TWENTY_UPSTREAM_COMMIT)" \
  --arg upstreamTree "$(manifest_value TWENTY_UPSTREAM_TREE)" \
  --arg checkedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson coreTableCount "$CORE_TABLE_COUNT" \
  --argjson typeormMigrationCount "$TYPEORM_MIGRATION_COUNT" \
  --argjson completedUpgradeCount "$COMPLETED_UPGRADE_COUNT" \
  '{
    result: "passed",
    checkedAt: $checkedAt,
    buildId: $buildId,
    candidateDigest: $candidateDigest,
    image: $image,
    sourceRevision: $sourceRevision,
    upstreamCommit: $upstreamCommit,
    upstreamTree: $upstreamTree,
    checks: {
      platform: "linux/amd64",
      ociLabels: "passed",
      databaseInitialization: "passed",
      migrations: "passed",
      serverStartup: "passed",
      workerStartup: "passed",
      health: "passed",
      clientConfig: "passed",
      frontendShell: "passed",
      seededAuthenticatedLogin: "passed"
    },
    counts: {
      coreTables: $coreTableCount,
      typeormMigrations: $typeormMigrationCount,
      completedUpgrades: $completedUpgradeCount
    }
  }' >"$REPORT_PATH"

VALIDATION_PASSED=1
echo "candidate validation passed"
echo "report_path=$REPORT_PATH"
echo "core_tables=$CORE_TABLE_COUNT"
echo "typeorm_migrations=$TYPEORM_MIGRATION_COUNT"
echo "completed_upgrades=$COMPLETED_UPGRADE_COUNT"

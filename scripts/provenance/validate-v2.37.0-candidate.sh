#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(git rev-parse --show-toplevel)"
SOURCE_MANIFEST="$REPOSITORY_ROOT/.twenty-source"
IMAGE_NAME="${IMAGE_NAME:-}"
SOURCE_REVISION="${SOURCE_REVISION:-}"
BUILD_ID="${BUILD_ID:-}"
CANDIDATE_DIGEST="${CANDIDATE_DIGEST:-}"
REPORT_PATH="${REPORT_PATH:-$(git rev-parse --git-path candidate-artifacts)/v2.37.0-validation.json}"

fail() {
  echo "v2.37.0 candidate validation failed: $*" >&2
  exit 1
}

manifest_value() {
  local value
  value="$(sed -n "s/^${1}=//p" "$SOURCE_MANIFEST")"
  [[ -n "$value" ]] || fail "missing ${1} in .twenty-source"
  printf '%s' "$value"
}

assert_equal() {
  [[ "$1" == "$2" ]] || fail "$3: expected $2, got $1"
}

wait_for_healthy_container() {
  local container_name="$1"
  for _ in $(seq 1 90); do
    [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container_name" 2>/dev/null)" == healthy ]] && return
    [[ "$(docker inspect --format '{{.State.Running}}' "$container_name" 2>/dev/null)" == true ]] ||
      fail "${container_name} stopped before becoming healthy"
    sleep 2
  done
  fail "${container_name} did not become healthy"
}

[[ "$IMAGE_NAME" =~ ^ghcr\.io/mhoo-os/mhoo-twenty@sha256:[0-9a-f]{64}$ ]] ||
  fail "IMAGE_NAME must be the authoritative GHCR digest reference"
[[ "$CANDIDATE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] ||
  fail "CANDIDATE_DIGEST is invalid"
[[ "$IMAGE_NAME" == "ghcr.io/mhoo-os/mhoo-twenty@${CANDIDATE_DIGEST}" ]] ||
  fail "image reference and candidate digest disagree"
[[ "$SOURCE_REVISION" =~ ^[0-9a-f]{40}$ ]] || fail "SOURCE_REVISION is invalid"
[[ "$BUILD_ID" =~ ^mhoo-twenty-v2\.37\.0-candidate\.[1-9][0-9]*$ ]] ||
  fail "BUILD_ID is invalid"

RUN_SUFFIX="$(date -u +%Y%m%d%H%M%S)-$$"
NETWORK_NAME="mhoo-twenty-v237-${RUN_SUFFIX}"
POSTGRES_CONTAINER="mhoo-twenty-v237-postgres-${RUN_SUFFIX}"
REDIS_CONTAINER="mhoo-twenty-v237-redis-${RUN_SUFFIX}"
SERVER_CONTAINER="mhoo-twenty-v237-server-${RUN_SUFFIX}"
WORKER_CONTAINER="mhoo-twenty-v237-worker-${RUN_SUFFIX}"
LOG_DIRECTORY="$(mktemp -d -t mhoo-twenty-v237.XXXXXX)"
VALIDATION_PASSED=0

cleanup() {
  local exit_code=$?
  if [[ "$VALIDATION_PASSED" != 1 ]]; then
    docker logs "$SERVER_CONTAINER" >"$LOG_DIRECTORY/server.log" 2>&1 || true
    docker logs "$WORKER_CONTAINER" >"$LOG_DIRECTORY/worker.log" 2>&1 || true
    tail -n 200 "$LOG_DIRECTORY/server.log" >&2 || true
    tail -n 200 "$LOG_DIRECTORY/worker.log" >&2 || true
  fi
  docker rm -f "$WORKER_CONTAINER" "$SERVER_CONTAINER" "$REDIS_CONTAINER" "$POSTGRES_CONTAINER" >/dev/null 2>&1 || true
  docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
  rm -rf "$LOG_DIRECTORY"
  exit "$exit_code"
}
trap cleanup EXIT

cd "$REPOSITORY_ROOT"
docker image inspect "$IMAGE_NAME" >/dev/null 2>&1 || fail "authoritative image is not loaded"
assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{.Os}}/{{.Architecture}}')" \
  "$(manifest_value TWENTY_BUILD_PLATFORM)" "candidate platform"
assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" \
  "$SOURCE_REVISION" "OCI revision label"
assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{index .Config.Labels "org.opencontainers.image.version"}}')" \
  "$(manifest_value TWENTY_VERSION)" "OCI version label"
assert_equal "$(docker image inspect "$IMAGE_NAME" --format '{{index .Config.Labels "io.mhoo.build.id"}}')" \
  "$BUILD_ID" "OCI build label"

docker network create "$NETWORK_NAME" >/dev/null
docker run --detach --name "$POSTGRES_CONTAINER" --network "$NETWORK_NAME" --network-alias postgres \
  --env POSTGRES_DB=default --env POSTGRES_PASSWORD=postgres \
  --health-cmd 'pg_isready -U postgres -d default' --health-interval 2s --health-timeout 5s --health-retries 45 \
  "$(manifest_value VALIDATION_POSTGRES_IMAGE)" >/dev/null
docker run --detach --name "$REDIS_CONTAINER" --network "$NETWORK_NAME" --network-alias redis \
  --health-cmd 'redis-cli ping' --health-interval 2s --health-timeout 5s --health-retries 45 \
  "$(manifest_value VALIDATION_REDIS_IMAGE)" >/dev/null
wait_for_healthy_container "$POSTGRES_CONTAINER"
wait_for_healthy_container "$REDIS_CONTAINER"

COMMON_ENVIRONMENT=(
  --env APP_SECRET=candidate-validation-only-secret-never-production
  --env FRONTEND_URL=http://127.0.0.1:3000
  --env IS_CONFIG_VARIABLES_IN_DB_ENABLED=false
  --env IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=true
  --env NODE_ENV=production
  --env PG_DATABASE_URL=postgres://postgres:postgres@postgres:5432/default
  --env REDIS_URL=redis://redis:6379
  --env SERVER_URL=http://127.0.0.1:3000
  --env STORAGE_TYPE=local
)

docker run --detach --platform "$(manifest_value TWENTY_BUILD_PLATFORM)" --name "$SERVER_CONTAINER" \
  --network "$NETWORK_NAME" --publish 127.0.0.1::3000 "${COMMON_ENVIRONMENT[@]}" \
  --env DISABLE_CRON_JOBS_REGISTRATION=true "$IMAGE_NAME" >/dev/null
SERVER_PORT="$(docker port "$SERVER_CONTAINER" 3000/tcp | head -n 1 | awk -F: '{print $NF}')"
[[ "$SERVER_PORT" =~ ^[0-9]+$ ]] || fail "could not resolve candidate server port"
SERVER_URL="http://127.0.0.1:${SERVER_PORT}"

for _ in $(seq 1 180); do
  curl --fail --silent "${SERVER_URL}/healthz" >/dev/null && break
  [[ "$(docker inspect --format '{{.State.Running}}' "$SERVER_CONTAINER" 2>/dev/null)" == true ]] ||
    fail "candidate server stopped during startup"
  sleep 2
done
assert_equal "$(curl --fail --silent "${SERVER_URL}/healthz" | jq -r '.status')" ok "health endpoint"
CLIENT_CONFIG="$(curl --fail --silent "${SERVER_URL}/client-config")"
assert_equal "$(jq -r '.appVersion' <<<"$CLIENT_CONFIG")" "$(manifest_value TWENTY_VERSION)" "client-config app version"
assert_equal "$(jq -r '.isConfigVariablesInDbEnabled' <<<"$CLIENT_CONFIG")" false "environment config authority"
curl --fail --silent "${SERVER_URL}/" | grep -q '<div id="root"></div>' || fail "frontend shell is missing"

docker run --detach --platform "$(manifest_value TWENTY_BUILD_PLATFORM)" --name "$WORKER_CONTAINER" \
  --network "$NETWORK_NAME" "${COMMON_ENVIRONMENT[@]}" --env DISABLE_CRON_JOBS_REGISTRATION=true \
  --env DISABLE_DB_MIGRATIONS=true "$IMAGE_NAME" node dist/queue-worker/queue-worker >/dev/null
sleep 5
[[ "$(docker inspect --format '{{.State.Running}}' "$WORKER_CONTAINER")" == true ]] ||
  fail "candidate worker is not running"

CORE_TABLE_COUNT="$(docker exec "$POSTGRES_CONTAINER" psql -U postgres -d default -Atc "SELECT count(*) FROM pg_tables WHERE schemaname='core';")"
TYPEORM_MIGRATION_COUNT="$(docker exec "$POSTGRES_CONTAINER" psql -U postgres -d default -Atc 'SELECT count(*) FROM core._typeorm_migrations;')"
[[ "$CORE_TABLE_COUNT" =~ ^[1-9][0-9]*$ ]] || fail "core schema was not initialized"
[[ "$TYPEORM_MIGRATION_COUNT" =~ ^[1-9][0-9]*$ ]] || fail "TypeORM migrations were not recorded"

mkdir -p "$(dirname "$REPORT_PATH")"
jq -n --arg buildId "$BUILD_ID" --arg candidateDigest "$CANDIDATE_DIGEST" --arg image "$IMAGE_NAME" \
  --arg sourceRevision "$SOURCE_REVISION" --arg checkedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson coreTableCount "$CORE_TABLE_COUNT" --argjson typeormMigrationCount "$TYPEORM_MIGRATION_COUNT" \
  '{schema:"mhoo.twenty-v2.37.candidate-validation/v1",result:"passed",checkedAt:$checkedAt,buildId:$buildId,candidateDigest:$candidateDigest,image:$image,sourceRevision:$sourceRevision,checks:{platform:"passed",ociLabels:"passed",databaseInitialization:"passed",serverStartup:"passed",workerStartup:"passed",health:"passed",clientConfig:"passed",frontendShell:"passed",applicationFilePersistence:"not evaluated; separate gate"},counts:{coreTables:$coreTableCount,typeormMigrations:$typeormMigrationCount}}' >"$REPORT_PATH"

VALIDATION_PASSED=1
echo "v2.37.0 candidate validation passed"
echo "report_path=$REPORT_PATH"

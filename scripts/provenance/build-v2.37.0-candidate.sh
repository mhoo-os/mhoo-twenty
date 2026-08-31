#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(git rev-parse --show-toplevel)"
SOURCE_MANIFEST="$REPOSITORY_ROOT/.twenty-source"

fail() {
  echo "v2.37.0 candidate build failed: $*" >&2
  exit 1
}

manifest_value() {
  local key="$1"
  local value

  value="$(sed -n "s/^${key}=//p" "$SOURCE_MANIFEST")"
  [[ -n "$value" ]] || fail "missing ${key} in .twenty-source"
  printf '%s' "$value"
}

cd "$REPOSITORY_ROOT"

SOURCE_REPOSITORY="${SOURCE_REPOSITORY:-https://github.com/mhoo-os/mhoo-twenty}"
SOURCE_REVISION="${SOURCE_REVISION:-$(git rev-parse HEAD)}"
BUILD_ID="${BUILD_ID:-mhoo-twenty-v2.37.0-candidate.local}"
BUILD_CREATED="${BUILD_CREATED:-$(git show -s --format=%cI "$SOURCE_REVISION")}"
OUTPUT_MODE="${OUTPUT_MODE:-oci}"
ARTIFACT_DIRECTORY="${ARTIFACT_DIRECTORY:-$(git rev-parse --git-path candidate-artifacts)}"
OUTPUT_PATH="${OUTPUT_PATH:-$ARTIFACT_DIRECTORY/${BUILD_ID}.oci.tar}"
METADATA_PATH="${METADATA_PATH:-$ARTIFACT_DIRECTORY/${BUILD_ID}.metadata.json}"
IMAGE_NAME="${IMAGE_NAME:-mhoo-os/mhoo-twenty:${BUILD_ID}}"

[[ "$SOURCE_REPOSITORY" == "https://github.com/mhoo-os/mhoo-twenty" ]] ||
  fail "source repository is not the governed Mhoo repository"
[[ "$SOURCE_REVISION" =~ ^[0-9a-f]{40}$ ]] ||
  fail "SOURCE_REVISION must be a full commit SHA"
git cat-file -e "${SOURCE_REVISION}^{commit}" ||
  fail "source revision is not available locally"
[[ "$(manifest_value TWENTY_VERSION)" == "v2.37.0" ]] ||
  fail "source manifest is not Twenty v2.37.0"

"$REPOSITORY_ROOT/scripts/provenance/verify-source.sh"

mkdir -p "$(dirname "$OUTPUT_PATH")" "$(dirname "$METADATA_PATH")"

BUILD_ARGUMENTS=(
  --platform "$(manifest_value TWENTY_BUILD_PLATFORM)"
  --target "$(manifest_value TWENTY_BUILD_TARGET)"
  --file "$(manifest_value TWENTY_DOCKERFILE)"
  --build-arg "APP_VERSION=$(manifest_value TWENTY_VERSION)"
  --label "org.opencontainers.image.source=${SOURCE_REPOSITORY}"
  --label "org.opencontainers.image.revision=${SOURCE_REVISION}"
  --label "org.opencontainers.image.version=$(manifest_value TWENTY_VERSION)"
  --label "org.opencontainers.image.created=${BUILD_CREATED}"
  --label "org.opencontainers.image.ref.name=${BUILD_ID}"
  --label "org.opencontainers.image.title=mhoo-twenty"
  --label "io.mhoo.build.id=${BUILD_ID}"
  --label "io.mhoo.twenty.upstream.repository=$(manifest_value TWENTY_UPSTREAM_REPOSITORY)"
  --label "io.mhoo.twenty.upstream.revision=$(manifest_value TWENTY_UPSTREAM_COMMIT)"
  --label "io.mhoo.twenty.upstream.tree=$(manifest_value TWENTY_UPSTREAM_TREE)"
  --label "io.mhoo.twenty.exact-source.revision=$(manifest_value MHOO_TWENTY_EXACT_SOURCE_COMMIT)"
  --label "io.mhoo.twenty.dockerfile.sha256=$(manifest_value TWENTY_DOCKERFILE_SHA256)"
  --label "io.mhoo.twenty.lockfile.sha256=$(manifest_value TWENTY_LOCKFILE_SHA256)"
  --metadata-file "$METADATA_PATH"
)

case "$OUTPUT_MODE" in
  oci)
    BUILD_ARGUMENTS+=(
      --provenance=mode=max
      --sbom=true
      --output "type=oci,dest=${OUTPUT_PATH},name=${IMAGE_NAME}"
    )
    ;;
  docker)
    BUILD_ARGUMENTS+=(
      --provenance=false
      --sbom=false
      --load
      --tag "$IMAGE_NAME"
    )
    ;;
  *)
    fail "OUTPUT_MODE must be oci or docker"
    ;;
esac

docker buildx build "${BUILD_ARGUMENTS[@]}" \
  "${SOURCE_REPOSITORY}.git#${SOURCE_REVISION}"

IMAGE_DIGEST="$(jq -r '."containerimage.digest" // empty' "$METADATA_PATH")"
[[ "$IMAGE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] ||
  fail "BuildKit did not report an image digest"

echo "v2.37.0 candidate build passed"
echo "source_revision=$SOURCE_REVISION"
echo "build_id=$BUILD_ID"
echo "image_digest=$IMAGE_DIGEST"

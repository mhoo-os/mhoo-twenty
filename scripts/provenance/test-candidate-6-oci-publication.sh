#!/usr/bin/env bash

# Source-faithful proof for publish-oci-layout.sh. It uses a disposable local
# Docker Distribution registry and an OCI layout with a nested index.
set -euo pipefail

fail() {
  echo "Candidate 6 OCI publication proof failed: $*" >&2
  exit 1
}

command -v curl >/dev/null 2>&1 || fail 'curl is required'
command -v jq >/dev/null 2>&1 || fail 'jq is required'

repository_root="$(git rev-parse --show-toplevel)"
publisher="$repository_root/scripts/provenance/publish-oci-layout.sh"
[[ -x "$publisher" ]] || fail 'publish-oci-layout.sh must be executable'

proof_root="$(mktemp -d)"
registry_name="mhoo-candidate-6-oci-proof-$$"
registry_id=''
registry_mode=''
cleanup() {
  if [[ "$registry_mode" == docker && -n "$registry_id" ]]; then
    docker rm --force "$registry_id" >/dev/null 2>&1 || true
  elif [[ "$registry_mode" == native && -n "$registry_id" ]]; then
    kill "$registry_id" >/dev/null 2>&1 || true
    wait "$registry_id" 2>/dev/null || true
  fi
  rm -rf "$proof_root"
}
trap cleanup EXIT

if [[ -n "${OCI_TEST_REGISTRY_BINARY:-}" ]]; then
  [[ -x "$OCI_TEST_REGISTRY_BINARY" ]] || fail 'OCI_TEST_REGISTRY_BINARY is not executable'
  command -v python3 >/dev/null 2>&1 || fail 'python3 is required to allocate a native registry port'
  registry_mode=native
  registry_port="${OCI_TEST_REGISTRY_PORT:-$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')}"
  registry_data="$proof_root/native-registry-data"
  registry_config="$proof_root/native-registry.yml"
  printf 'version: 0.1\nlog:\n  level: debug\nstorage:\n  filesystem:\n    rootdirectory: %s\nhttp:\n  addr: 127.0.0.1:%s\n  host: http://127.0.0.1:%s\n' "$registry_data" "$registry_port" "$registry_port" >"$registry_config"
  "$OCI_TEST_REGISTRY_BINARY" serve "$registry_config" >"$proof_root/registry.log" 2>&1 &
  registry_id=$!
else
  command -v docker >/dev/null 2>&1 || fail 'docker is required unless OCI_TEST_REGISTRY_BINARY is supplied'
  registry_mode=docker
  registry_id="$(docker run --detach --rm --name "$registry_name" --publish 127.0.0.1::5000 registry:2)"
  registry_port="$(docker port "$registry_id" 5000/tcp | awk -F: 'NR == 1 { print $NF }')"
  [[ "$registry_port" =~ ^[0-9]+$ ]] || fail 'disposable registry port was not assigned'
fi
registry_api="http://127.0.0.1:${registry_port}/v2/mhoo/candidate-6-proof"

for attempt in {1..30}; do
  if curl --silent --fail "http://127.0.0.1:${registry_port}/v2/" >/dev/null; then
    break
  fi
  [[ "$attempt" != 30 ]] || fail 'disposable registry did not become ready'
  sleep 1
done

layout="$proof_root/layout"
mkdir -p "$layout/blobs/sha256"
printf '{"imageLayoutVersion":"1.0.0"}\n' >"$layout/oci-layout"
put_blob() {
  local source="$1" digest
  digest="sha256:$(sha256sum "$source" | awk '{print $1}')"
  cp "$source" "$layout/blobs/sha256/${digest#sha256:}"
  printf '%s\n' "$digest"
}

printf '{}' >"$proof_root/config.json"
printf 'candidate-6-disposable-layer\n' >"$proof_root/layer.tar"
config_digest="$(put_blob "$proof_root/config.json")"
layer_digest="$(put_blob "$proof_root/layer.tar")"
jq -nc --arg config "$config_digest" --arg layer "$layer_digest" '{schemaVersion:2,mediaType:"application/vnd.oci.image.manifest.v1+json",config:{mediaType:"application/vnd.oci.image.config.v1+json",digest:$config,size:2},layers:[{mediaType:"application/vnd.oci.image.layer.v1.tar",digest:$layer,size:27}]}' >"$proof_root/image-manifest.json"
image_digest="$(put_blob "$proof_root/image-manifest.json")"
jq -nc --arg image "$image_digest" '{schemaVersion:2,mediaType:"application/vnd.oci.image.index.v1+json",manifests:[{mediaType:"application/vnd.oci.image.manifest.v1+json",digest:$image,size:0,platform:{os:"linux",architecture:"amd64"}}]}' >"$proof_root/nested-index.json"
nested_digest="$(put_blob "$proof_root/nested-index.json")"
jq -nc --arg nested "$nested_digest" '{schemaVersion:2,mediaType:"application/vnd.oci.image.index.v1+json",manifests:[{mediaType:"application/vnd.oci.image.index.v1+json",digest:$nested,size:0}]}' >"$proof_root/root-index.json"
root_digest="$(put_blob "$proof_root/root-index.json")"
jq -nc --arg root "$root_digest" '{schemaVersion:2,manifests:[{mediaType:"application/vnd.oci.image.index.v1+json",digest:$root,size:0}]}' >"$layout/index.json"

run_publisher() {
  local repository="$1" evidence="$2"
  REGISTRY_API="http://127.0.0.1:${registry_port}/v2/${repository}" \
    OCI_LAYOUT="$layout" \
    BUILD_CLAIMED_DIGEST="$root_digest" \
    IMAGE_REPOSITORY="127.0.0.1:${registry_port}/${repository}" \
    GITHUB_ACTOR='candidate-6-disposable-proof' \
    GITHUB_TOKEN='bound-disposable-token' \
    OCI_PUBLICATION_EVIDENCE_DIRECTORY="$evidence" \
    OCI_PUBLICATION_TEST_MODE=1 \
    "$publisher"
}

run_publisher 'mhoo/candidate-6-proof' "$proof_root/evidence"
manifest_digests=()
while IFS= read -r digest; do
  manifest_digests+=("$digest")
done < <(jq -r '.graph.manifestDigests[]' "$proof_root/evidence/registry-readback.json")
[[ "${manifest_digests[*]}" == *"$root_digest"* && "${manifest_digests[*]}" == *"$nested_digest"* && "${manifest_digests[*]}" == *"$image_digest"* ]] || fail 'proof receipt does not enumerate the complete manifest graph'
for digest in "${manifest_digests[@]}"; do
  body="$proof_root/${digest#sha256:}.json"
  status="$(curl --silent --show-error --output "$body" --write-out '%{http_code}' --header 'Accept: application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json' "${registry_api}/manifests/${digest}")"
  [[ "$status" == 200 ]] || fail "manifest ${digest} GET did not return 200"
  [[ "sha256:$(sha256sum "$body" | awk '{print $1}')" == "$digest" ]] || fail "manifest ${digest} body does not match its descriptor digest"
done

if [[ "$registry_mode" == docker ]]; then
  docker logs "$registry_id" >"$proof_root/registry.log" 2>&1
fi
grep -F '/v2/mhoo/candidate-6-proof/blobs/uploads/' "$proof_root/registry.log" >/dev/null || fail 'bound token path did not reach the first registry request'

negative_log="$proof_root/missing-child-manifest.log"
if OCI_PUBLICATION_TEST_OMIT_MANIFEST_DIGEST="$image_digest" run_publisher 'mhoo/candidate-6-proof-negative' "$proof_root/negative-evidence" >"$negative_log" 2>&1; then
  fail 'missing child-manifest publication unexpectedly passed'
fi
if ! grep -F "test-only omission of manifest ${image_digest}" "$negative_log" >/dev/null || ! grep -F 'registry manifest publication is indeterminate (HTTP 400)' "$negative_log" >/dev/null; then
  fail "missing child-manifest failure was not detected by the registry: $(tr '\n' ' ' <"$negative_log")"
fi

printf 'Candidate 6 disposable OCI publication proof passed: root=%s nested=%s image=%s\n' "$root_digest" "$nested_digest" "$image_digest"

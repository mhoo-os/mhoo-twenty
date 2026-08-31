#!/usr/bin/env bash

# Publish a closed OCI descriptor graph from a local OCI image layout. This is
# intentionally digest-only: no registry tag is accepted or created here.
set -euo pipefail

fail() {
  echo "digest-only OCI publication failed: $*" >&2
  exit 1
}

require_environment() {
  local name
  for name in "$@"; do
    [[ -n "${!name:-}" ]] || fail "required environment variable ${name} is not bound"
  done
}

is_sha256_digest() {
  [[ "$1" =~ ^sha256:[0-9a-f]{64}$ ]]
}

is_manifest_media_type() {
  case "$1" in
    application/vnd.oci.image.index.v1+json|application/vnd.oci.image.manifest.v1+json|application/vnd.docker.distribution.manifest.list.v2+json|application/vnd.docker.distribution.manifest.v2+json|application/vnd.oci.artifact.manifest.v1+json)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

require_environment REGISTRY_API OCI_LAYOUT BUILD_CLAIMED_DIGEST IMAGE_REPOSITORY GITHUB_ACTOR GITHUB_TOKEN

GHCR_TOKEN_ENDPOINT='https://ghcr.io/token'
GHCR_TOKEN_SERVICE='ghcr.io'
GHCR_TOKEN_SCOPE='repository:mhoo-os/mhoo-twenty:pull,push'

if [[ "${OCI_PUBLICATION_TEST_MODE:-}" == 1 ]]; then
  [[ "$REGISTRY_API" =~ ^http://127\.0\.0\.1:[0-9]+/v2/[a-z0-9][a-z0-9._/-]*$ ]] || fail "test registry API is not loopback scoped"
  REGISTRY_ORIGIN="${REGISTRY_API%%/v2/*}"
  REGISTRY_PATH="${REGISTRY_API#*/v2/}"
  TOKEN_ENDPOINT="${REGISTRY_TOKEN_ENDPOINT:-}"
  TOKEN_SERVICE="${REGISTRY_TOKEN_SERVICE:-}"
  TOKEN_SCOPE="${REGISTRY_TOKEN_SCOPE:-}"
  [[ "$TOKEN_ENDPOINT" == "${REGISTRY_ORIGIN}/token" && "$TOKEN_ENDPOINT" =~ ^http://127\.0\.0\.1:[0-9]+/token$ ]] || fail "test token endpoint is not loopback scoped and exact"
  [[ "$TOKEN_SERVICE" == "${REGISTRY_ORIGIN#http://}" ]] || fail "test token service is not exact"
  [[ "$TOKEN_SCOPE" == "repository:${REGISTRY_PATH}:pull,push" ]] || fail "test token scope is not exact"
else
  [[ "$REGISTRY_API" == 'https://ghcr.io/v2/mhoo-os/mhoo-twenty' ]] || fail "registry API is not the fixed Mhoo Twenty destination"
  [[ "$IMAGE_REPOSITORY" == 'ghcr.io/mhoo-os/mhoo-twenty' ]] || fail "image repository is not the fixed Mhoo Twenty destination"
  [[ -z "${OCI_PUBLICATION_TEST_OMIT_MANIFEST_DIGEST:-}" ]] || fail "test-only omission hook is forbidden outside disposable proof"
  [[ -z "${REGISTRY_TOKEN_ENDPOINT:-}${REGISTRY_TOKEN_SERVICE:-}${REGISTRY_TOKEN_SCOPE:-}" ]] || fail "test-only token overrides are forbidden outside disposable proof"
  TOKEN_ENDPOINT="$GHCR_TOKEN_ENDPOINT"
  TOKEN_SERVICE="$GHCR_TOKEN_SERVICE"
  TOKEN_SCOPE="$GHCR_TOKEN_SCOPE"
fi

[[ -f "$OCI_LAYOUT/index.json" && -d "$OCI_LAYOUT/blobs/sha256" ]] || fail "OCI layout is incomplete"
is_sha256_digest "$BUILD_CLAIMED_DIGEST" || fail "Buildx claimed digest is invalid"

root_count="$(jq -er '.manifests | length' "$OCI_LAYOUT/index.json")"
[[ "$root_count" == 1 ]] || fail "OCI layout must have exactly one root manifest"
ROOT_DIGEST="$(jq -er '.manifests[0].digest' "$OCI_LAYOUT/index.json")"
ROOT_MEDIA_TYPE="$(jq -er '.manifests[0].mediaType' "$OCI_LAYOUT/index.json")"
if ! is_sha256_digest "$ROOT_DIGEST" || ! is_manifest_media_type "$ROOT_MEDIA_TYPE"; then
  fail "OCI root descriptor is invalid"
fi
ROOT_BODY="$OCI_LAYOUT/blobs/sha256/${ROOT_DIGEST#sha256:}"
[[ -f "$ROOT_BODY" ]] || fail "OCI root manifest body is missing"
[[ "sha256:$(sha256sum "$ROOT_BODY" | awk '{print $1}')" == "$ROOT_DIGEST" && "$ROOT_DIGEST" == "$BUILD_CLAIMED_DIGEST" ]] || fail "Buildx claimed digest does not match OCI manifest bytes"

EVIDENCE_DIRECTORY="${OCI_PUBLICATION_EVIDENCE_DIRECTORY:-${RUNNER_TEMP:-/tmp}/oci-publication-raw-evidence}"
mkdir -p "$EVIDENCE_DIRECTORY"
REGISTRY_ORIGIN="${REGISTRY_API%%/v2/*}"
ACCEPT_MANIFESTS='application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json, application/vnd.oci.artifact.manifest.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json'

status_from() {
  awk 'toupper($1) ~ /^HTTP\// { code=$2 } END { print code }' "$1"
}

obtain_scoped_bearer_token() {
  local headers response status token_count token
  headers="$(mktemp)"
  response="$(mktemp)"
  if ! curl --silent --show-error --dump-header "$headers" --output "$response" --get --user "${GITHUB_ACTOR}:${GITHUB_TOKEN}" \
    --data-urlencode "service=${TOKEN_SERVICE}" --data-urlencode "scope=${TOKEN_SCOPE}" "$TOKEN_ENDPOINT"; then
    rm -f "$headers" "$response"
    fail 'token service request failed'
  fi
  status="$(status_from "$headers")"
  if [[ ! "$status" =~ ^2[0-9][0-9]$ ]]; then
    rm -f "$headers" "$response"
    fail "token service response is indeterminate (HTTP ${status:-none})"
  fi
  if ! token_count="$(jq -er 'if type == "object" then [(.token?, .access_token?) | select(type == "string" and length > 0)] | length else -1 end' "$response")" || [[ "$token_count" != 1 ]]; then
    rm -f "$headers" "$response"
    fail 'token service response is malformed, missing, or ambiguous'
  fi
  if ! token="$(jq -er 'if type == "object" then [(.token?, .access_token?) | select(type == "string" and length > 0)] | .[0] else error("not an object") end' "$response")"; then
    rm -f "$headers" "$response"
    fail 'token service response does not contain a usable token'
  fi
  rm -f "$headers" "$response"
  SCOPED_BEARER_TOKEN="$token"
}

authenticated_curl() {
  local headers='' argument status attempt=0
  local -a request=("$@")
  for ((argument = 0; argument < ${#request[@]}; argument++)); do
    if [[ "${request[$argument]}" == '--dump-header' || "${request[$argument]}" == '-D' ]]; then
      ((argument + 1 < ${#request[@]})) || fail 'registry request did not bind a header file'
      headers="${request[$((argument + 1))]}"
      break
    fi
  done
  [[ -n "$headers" ]] || fail 'registry request did not bind a header file'
  while :; do
    if ! curl --silent --show-error --header "Authorization: Bearer ${SCOPED_BEARER_TOKEN}" "${request[@]}"; then
      fail 'registry request failed'
    fi
    status="$(status_from "$headers")"
    if [[ "$status" == 401 && "$attempt" == 0 ]]; then
      attempt=1
      obtain_scoped_bearer_token
      continue
    fi
    return 0
  done
}

header_value() {
  local name="$1" headers="$2"
  awk -v name="$name" 'tolower($0) ~ "^" tolower(name) ":" { sub(/^[^:]*:[[:space:]]*/, ""); sub(/\r$/, ""); value=$0 } END { print value }' "$headers"
}

location_from() {
  header_value location "$1"
}

publication_state="$(mktemp -d)"
cleanup_publication_state() {
  rm -rf "$publication_state"
}
trap cleanup_publication_state EXIT
visited_manifests="$publication_state/visited-manifests"
manifest_media_types="$publication_state/manifest-media-types"
blob_digests="$publication_state/blob-digests"
manifests_postorder="$publication_state/manifests-postorder"
verify_visited_manifests="$publication_state/verify-visited-manifests"
touch "$visited_manifests" "$manifest_media_types" "$blob_digests" "$manifests_postorder" "$verify_visited_manifests"

contains_line() {
  local file="$1" value="$2"
  grep -Fqx "$value" "$file"
}

append_unique() {
  local file="$1" value="$2"
  contains_line "$file" "$value" || printf '%s\n' "$value" >>"$file"
}

manifest_media_type() {
  local digest="$1"
  awk -F '\t' -v digest="$digest" '$1 == digest { value=$2 } END { print value }' "$manifest_media_types"
}

descriptor_body() {
  local digest="$1"
  is_sha256_digest "$digest" || fail "descriptor digest is invalid: ${digest}"
  local body="$OCI_LAYOUT/blobs/sha256/${digest#sha256:}"
  [[ -f "$body" ]] || fail "descriptor body is missing: ${digest}"
  [[ "sha256:$(sha256sum "$body" | awk '{print $1}')" == "$digest" ]] || fail "descriptor body digest does not match: ${digest}"
  printf '%s\n' "$body"
}

collect_blob() {
  local digest="$1"
  descriptor_body "$digest" >/dev/null
  append_unique "$blob_digests" "$digest"
}

collect_manifest() {
  local digest="$1" media_type="$2" body child_digest child_type
  is_manifest_media_type "$media_type" || fail "unsupported manifest media type: ${media_type}"
  contains_line "$visited_manifests" "$digest" && return 0
  printf '%s\n' "$digest" >>"$visited_manifests"
  body="$(descriptor_body "$digest")"
  printf '%s\t%s\n' "$digest" "$media_type" >>"$manifest_media_types"

  while IFS=$'\t' read -r child_digest child_type; do
    [[ -n "$child_digest" && -n "$child_type" ]] || fail "manifest ${digest} has an incomplete child descriptor"
    collect_manifest "$child_digest" "$child_type"
  done < <(jq -er 'if .manifests then .manifests[] | [.digest, .mediaType] | @tsv else empty end' "$body")

  while IFS=$'\t' read -r child_digest child_type; do
    [[ -n "$child_digest" && -n "$child_type" ]] || fail "manifest ${digest} has an incomplete subject descriptor"
    if is_manifest_media_type "$child_type"; then
      collect_manifest "$child_digest" "$child_type"
    else
      collect_blob "$child_digest"
    fi
  done < <(jq -er 'if .subject then [.subject.digest, .subject.mediaType] | @tsv else empty end' "$body")

  while IFS=$'\t' read -r child_digest child_type; do
    [[ -n "$child_digest" && -n "$child_type" ]] || fail "manifest ${digest} has an incomplete content descriptor"
    collect_blob "$child_digest"
  done < <(jq -er '([.config?] + (.layers? // []) + (.blobs? // []))[]? | select(. != null) | [.digest, .mediaType] | @tsv' "$body")

  printf '%s\n' "$digest" >>"$manifests_postorder"
}

collect_manifest "$ROOT_DIGEST" "$ROOT_MEDIA_TYPE"

# Exchange the GitHub credential once before any registry request. Registry
# operations below are Bearer-only; a single 401 may refresh this same grant.
SCOPED_BEARER_TOKEN=''
obtain_scoped_bearer_token

upload_blob() {
  local digest="$1" file="$2" headers response location status query_separator encoded_digest
  headers="$(mktemp)"
  response="$(mktemp)"
  authenticated_curl --dump-header "$headers" --output "$response" --request POST "$REGISTRY_API/blobs/uploads/"
  status="$(status_from "$headers")"
  [[ "$status" == 202 ]] || fail "registry blob start is indeterminate (HTTP ${status:-none})"
  location="$(location_from "$headers")"
  case "$location" in
    "$REGISTRY_ORIGIN"/*)
      ;;
    /v2/*)
      location="${REGISTRY_ORIGIN}${location}"
      ;;
    *)
      fail "registry blob start returned invalid location"
      ;;
  esac
  query_separator='?'
  [[ "$location" == *\?* ]] && query_separator='&'
  encoded_digest="${digest/:/%3A}"
  authenticated_curl --dump-header "$headers" --output "$response" --request PUT --header 'Content-Type: application/octet-stream' --data-binary "@$file" "${location}${query_separator}digest=${encoded_digest}"
  status="$(status_from "$headers")"
  [[ "$status" == 201 ]] || fail "registry blob completion is indeterminate (HTTP ${status:-none})"
}

publish_manifest() {
  local digest="$1" body headers response status
  if [[ "${OCI_PUBLICATION_TEST_MODE:-}" == 1 && "${OCI_PUBLICATION_TEST_OMIT_MANIFEST_DIGEST:-}" == "$digest" ]]; then
    printf 'test-only omission of manifest %s\n' "$digest" >&2
    return 0
  fi
  body="$(descriptor_body "$digest")"
  headers="$(mktemp)"
  response="$(mktemp)"
  authenticated_curl --dump-header "$headers" --output "$response" --request PUT --header "Content-Type: $(manifest_media_type "$digest")" --data-binary "@$body" "$REGISTRY_API/manifests/$digest"
  status="$(status_from "$headers")"
  [[ "$status" == 201 || "$status" == 202 ]] || fail "registry manifest publication is indeterminate (HTTP ${status:-none})"
}

verify_manifest_graph() {
  local digest="$1" expected_media_type="$2" body headers status header_count registry_digest body_digest child_digest child_type
  contains_line "$verify_visited_manifests" "$digest" && return 0
  printf '%s\n' "$digest" >>"$verify_visited_manifests"
  headers="$(mktemp)"
  body="$(mktemp)"
  authenticated_curl --dump-header "$headers" --output "$body" --header "Accept: ${ACCEPT_MANIFESTS}" "$REGISTRY_API/manifests/$digest"
  status="$(status_from "$headers")"
  [[ "$status" == 200 ]] || fail "referenced manifest ${digest} read-back is indeterminate (HTTP ${status:-none})"
  header_count="$(awk 'tolower($0) ~ /^docker-content-digest:/ { count++ } END { print count+0 }' "$headers")"
  registry_digest="$(header_value docker-content-digest "$headers")"
  body_digest="sha256:$(sha256sum "$body" | awk '{print $1}')"
  [[ "$header_count" == 1 && "$registry_digest" == "$digest" && "$body_digest" == "$digest" ]] || fail "registry digest authorities disagree for ${digest}"
  [[ "$(header_value content-type "$headers")" == "$expected_media_type" ]] || fail "registry media type disagrees for ${digest}"
  while IFS=$'\t' read -r child_digest child_type; do
    [[ -n "$child_digest" && -n "$child_type" ]] || fail "retrieved manifest ${digest} has an incomplete child descriptor"
    verify_manifest_graph "$child_digest" "$child_type"
  done < <(jq -er 'if .manifests then .manifests[] | [.digest, .mediaType] | @tsv else empty end' "$body")
}

while IFS= read -r digest; do
  upload_blob "$digest" "$(descriptor_body "$digest")"
done < <(sort "$blob_digests")

while IFS= read -r digest; do
  publish_manifest "$digest"
done <"$manifests_postorder"

verify_manifest_graph "$ROOT_DIGEST" "$ROOT_MEDIA_TYPE"

manifest_digests_json="$(jq -R . <"$manifests_postorder" | jq -s .)"
jq -n --arg buildxDigest "$BUILD_CLAIMED_DIGEST" --arg canonicalDigest "$ROOT_DIGEST" --arg registryDigest "$ROOT_DIGEST" --arg bodyDigest "$ROOT_DIGEST" --arg mediaType "$ROOT_MEDIA_TYPE" --argjson manifestDigests "$manifest_digests_json" '{buildxClaimedDigest:$buildxDigest,canonicalDigest:$canonicalDigest,registryDigestHeader:$registryDigest,rawBodySha256:$bodyDigest,manifestMediaType:$mediaType,readbackHttpStatus:200,graph:{manifestDigests:$manifestDigests}}' >"$EVIDENCE_DIRECTORY/registry-readback.json"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "digest=${ROOT_DIGEST}"
    echo "image_ref=${IMAGE_REPOSITORY}@${ROOT_DIGEST}"
  } >>"$GITHUB_OUTPUT"
fi

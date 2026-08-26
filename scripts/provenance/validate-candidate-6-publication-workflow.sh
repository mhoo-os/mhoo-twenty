#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(git rev-parse --show-toplevel)"
WORKFLOW="$REPOSITORY_ROOT/.github/workflows/publish-twenty-v2.30.1-candidate-6.yml"

fail() {
  echo "Candidate 6 workflow validation failed: $*" >&2
  exit 1
}

require_literal() {
  grep -Fqx -- "$1" "$WORKFLOW" >/dev/null || fail "missing required literal: $1"
}

require_fragment() {
  grep -F -- "$1" "$WORKFLOW" >/dev/null || fail "missing required fragment: $1"
}

[[ -f "$WORKFLOW" ]] || fail "workflow is missing"
require_literal '  workflow_dispatch:'
if grep -Eq '^  (push|pull_request|workflow_call):|^      inputs:' "$WORKFLOW"; then
  fail "workflow must expose only an input-free workflow_dispatch trigger"
fi

for required_literal in \
  "  CANDIDATE_NUMBER: '6'" \
  '  CANDIDATE_TAG: mhoo/candidate/v2.30.1-6' \
  '  EXPECTED_REPOSITORY: mhoo-os/mhoo-twenty' \
  '  EXPECTED_SOURCE_REVISION: 08d55ab7ed4bbc4e72fee825822c3ce0656c82ef' \
  '  EXPECTED_SOURCE_TREE: 8d7b43fe941bc648a35bb486642d0d532013e5ae' \
  '  EXPECTED_UPSTREAM_TAG: twenty/v2.30.1' \
  '  EXPECTED_UPSTREAM_COMMIT: 064bdd795a0bd78c65f024350cefed2c8f38a661' \
  '  EXPECTED_UPSTREAM_TREE: 7ebc5efa7f5f1bfdf9d238a88e3455decaa4f313' \
  '  EXPECTED_WORKFLOW_REF: refs/heads/main' \
  '  IMAGE_REPOSITORY: ghcr.io/mhoo-os/mhoo-twenty' \
  '  IMAGE_TAG: ghcr.io/mhoo-os/mhoo-twenty:v2.30.1-6'; do
  require_literal "$required_literal"
done

# These are source-text literals deliberately checked against the workflow.
# shellcheck disable=SC2016
for required_fragment in \
  'git ls-remote --tags "$SOURCE_REMOTE" "$expected_ref" "${expected_ref}^{}"' \
  'git cat-file -t "$expected_ref"' \
  'git checkout --detach "$EXPECTED_SOURCE_REVISION"' \
  'git status --porcelain' \
  'scripts/provenance/verify-source.sh' \
  'docker manifest inspect "$IMAGE_TAG"' \
  'docker buildx imagetools inspect "$IMAGE_TAG"' \
  'docker pull --platform linux/amd64 "$IMAGE_REF"' \
  'docker buildx imagetools inspect --raw "$IMAGE_REF"' \
  'mhoo-twenty-v2.30.1-candidate-6-custody' \
  'candidate5:"not modified"'; do
  require_fragment "$required_fragment"
done

if grep -Fq 'candidate/v2.30.1-5' "$WORKFLOW" || grep -Fq 'v2.30.1-5' "$WORKFLOW"; then
  fail "Candidate 6 workflow must not target Candidate 5"
fi

echo 'Candidate 6 workflow static contract passed'

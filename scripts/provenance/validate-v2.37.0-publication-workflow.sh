#!/usr/bin/env bash

set -euo pipefail

WORKFLOW=".github/workflows/publish-twenty-v2.37.0-candidate.yml"
VALIDATOR="scripts/provenance/validate-v2.37.0-candidate.sh"

fail() {
  echo "v2.37.0 publication workflow validation failed: $*" >&2
  exit 1
}

require_literal() {
  grep -Fq -- "$1" "$WORKFLOW" || fail "missing required contract: $1"
}

forbid_literal() {
  ! grep -Fq -- "$1" "$WORKFLOW" || fail "forbidden mutable publication contract: $1"
}

require_validator_literal() {
  grep -Fq -- "$1" "$VALIDATOR" || fail "missing validator contract: $1"
}

forbid_validator_literal() {
  ! grep -Fq -- "$1" "$VALIDATOR" || fail "forbidden validator contract: $1"
}

[[ -f "$WORKFLOW" ]] || fail "workflow is missing"
[[ -f "$VALIDATOR" ]] || fail "candidate validator is missing"
command -v actionlint >/dev/null || fail "actionlint is required"
actionlint "$WORKFLOW"

require_literal 'workflow_dispatch:'
# The following values are intentionally literal workflow expressions and
# shell fragments, not strings for this validator to expand.
# shellcheck disable=SC2016
require_literal 'CANDIDATE_SOURCE_TAG: mhoo/candidate/v2.37.0-${{ inputs.candidate_number }}'
# shellcheck disable=SC2016
require_literal '[[ "$source_revision" == "$GITHUB_SHA" ]]'
# shellcheck disable=SC2016
require_literal 'git cat-file -t "$expected_ref")" == tag'
require_literal 'scripts/provenance/verify-source.sh'
require_literal 'scripts/provenance/build-v2.37.0-candidate.sh'
require_literal 'scripts/provenance/publish-oci-layout.sh'
require_literal 'scripts/provenance/validate-v2.37.0-candidate.sh'
require_literal 'cosign-linux-amd64'
# shellcheck disable=SC2016
require_literal 'sign --yes "$IMAGE_REF"'
# shellcheck disable=SC2016
require_literal 'verify --certificate-identity "$CERTIFICATE_IDENTITY"'
require_literal 'applicationFilePersistence:"not evaluated; separate gate"'
require_literal 'primitive:"digest-only"'
require_literal 'retention-days: 90'

require_validator_literal "--format '{{index .Config.Labels \"org.opencontainers.image.revision\"}}'"
require_validator_literal "--format '{{index .Config.Labels \"org.opencontainers.image.version\"}}'"
require_validator_literal "--format '{{index .Config.Labels \"io.mhoo.build.id\"}}'"
forbid_validator_literal '\"org.opencontainers.image.revision\"'
forbid_validator_literal '\"org.opencontainers.image.version\"'
forbid_validator_literal '\"io.mhoo.build.id\"'

forbid_literal 'docker push'
forbid_literal 'docker tag'
forbid_literal 'build-push-action'
forbid_literal ':latest'
forbid_literal 'candidate-6'
forbid_literal 'v2.30.1'

echo "v2.37.0 publication workflow contract passed"

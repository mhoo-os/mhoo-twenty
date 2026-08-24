#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(git rev-parse --show-toplevel)"
SOURCE_MANIFEST="$REPOSITORY_ROOT/.twenty-source"

fail() {
  echo "source verification failed: $*" >&2
  exit 1
}

manifest_value() {
  local key="$1"
  local value

  value="$(sed -n "s/^${key}=//p" "$SOURCE_MANIFEST")"
  [[ -n "$value" ]] || fail "missing ${key} in .twenty-source"
  printf '%s' "$value"
}

sha256_file() {
  shasum -a 256 "$1" | awk '{print $1}'
}

sha256_git_file() {
  local revision="$1"
  local path="$2"

  git show "${revision}:${path}" | shasum -a 256 | awk '{print $1}'
}

assert_equal() {
  local actual="$1"
  local expected="$2"
  local description="$3"

  [[ "$actual" == "$expected" ]] ||
    fail "${description}: expected ${expected}, got ${actual}"
}

cd "$REPOSITORY_ROOT"
[[ -f "$SOURCE_MANIFEST" ]] || fail ".twenty-source is missing"

UPSTREAM_REPOSITORY="$(manifest_value TWENTY_UPSTREAM_REPOSITORY)"
UPSTREAM_REF="$(manifest_value TWENTY_UPSTREAM_REF)"
UPSTREAM_COMMIT="$(manifest_value TWENTY_UPSTREAM_COMMIT)"
UPSTREAM_TREE="$(manifest_value TWENTY_UPSTREAM_TREE)"
EXACT_SOURCE_COMMIT="$(manifest_value MHOO_TWENTY_EXACT_SOURCE_COMMIT)"
BASELINE_COMMIT="$(manifest_value TWENTY_BASELINE_COMMIT)"

assert_equal "$(git rev-parse "${UPSTREAM_COMMIT}^{commit}")" "$UPSTREAM_COMMIT" \
  "upstream commit"
assert_equal "$(git rev-parse "${UPSTREAM_COMMIT}^{tree}")" "$UPSTREAM_TREE" \
  "upstream tree"
assert_equal "$(git rev-parse "${EXACT_SOURCE_COMMIT}^{tree}")" "$UPSTREAM_TREE" \
  "Mhoo exact-source tree"

git merge-base --is-ancestor "$BASELINE_COMMIT" "$UPSTREAM_COMMIT" ||
  fail "v2.30.0 baseline is not an ancestor of v2.30.1"

if [[ "${VERIFY_UPSTREAM_REMOTE:-1}" == "1" ]]; then
  REMOTE_COMMIT="$(git ls-remote "$UPSTREAM_REPOSITORY" "$UPSTREAM_REF" | awk 'NR == 1 {print $1}')"
  assert_equal "$REMOTE_COMMIT" "$UPSTREAM_COMMIT" "upstream remote ref"
fi

assert_source_file_hash() {
  local path="$1"
  local manifest_key="$2"
  local expected_hash

  expected_hash="$(manifest_value "$manifest_key")"
  assert_equal "$(sha256_git_file "$UPSTREAM_COMMIT" "$path")" "$expected_hash" \
    "upstream ${path} hash"
  assert_equal "$(sha256_file "$path")" "$expected_hash" \
    "working tree ${path} hash"
}

assert_source_file_hash package.json TWENTY_PACKAGE_JSON_SHA256
assert_source_file_hash yarn.lock TWENTY_LOCKFILE_SHA256
assert_source_file_hash .yarnrc.yml TWENTY_YARNRC_SHA256
assert_source_file_hash .nvmrc TWENTY_NVMRC_SHA256
assert_source_file_hash .dockerignore TWENTY_DOCKERIGNORE_SHA256
assert_source_file_hash packages/twenty-docker/twenty/Dockerfile TWENTY_DOCKERFILE_SHA256
assert_source_file_hash packages/twenty-docker/twenty/entrypoint.sh TWENTY_ENTRYPOINT_SHA256

assert_equal "$(cat .nvmrc)" "$(manifest_value TWENTY_SOURCE_NODE_VERSION)" \
  "source Node version"
assert_equal "$(node -p "require('./package.json').packageManager")" \
  "yarn@$(manifest_value TWENTY_YARN_VERSION)" "Yarn package manager pin"

# Mhoo CI contract overlay. These paths are intentionally reviewed separately
# from the exact upstream source tree and are not application-source edits.
# Phase 3 Mhoo foundation fork deltas are explicitly enumerated below so this
# check still fails closed for every other upstream source path.
UNEXPECTED_PATHS="$(
  git diff --name-only "$UPSTREAM_COMMIT" HEAD -- . \
    ':(exclude).twenty-source' \
    ':(exclude)AGENTS.md' \
    ':(exclude)CI_AUDIT.md' \
    ':(exclude)CI_GOVERNANCE_VALIDATION.md' \
    ':(exclude)MHOO_CI_CONTRACT.md' \
    ':(exclude)CI_VALIDATION.md' \
    ':(exclude).github/actions/spawn-twenty-app-dev-test/action.yml' \
    ':(exclude).github/actions/spawn-twenty-docker-image/action.yaml' \
    ':(exclude).github/actions/spawn-twenty-server/action.yml' \
    ':(exclude).github/workflows/app-prod-parity-e2e-dispatch.yaml' \
    ':(exclude).github/workflows/cd-deploy-main.yaml' \
    ':(exclude).github/workflows/cd-deploy-tag.yaml' \
    ':(exclude).github/workflows/ci-ai-catalog-sync.yaml' \
    ':(exclude).github/workflows/ci-app-docs-drift.yaml' \
    ':(exclude).github/workflows/ci-blocked-contributors.yaml' \
    ':(exclude).github/workflows/ci-breaking-changes.yaml' \
    ':(exclude).github/workflows/ci-create-app-e2e-minimal.yaml' \
    ':(exclude).github/workflows/ci-cross-version-upgrade.yaml' \
    ':(exclude).github/workflows/ci-dpa-subprocessors-sync.yaml' \
    ':(exclude).github/workflows/ci-e2e-main.yaml' \
    ':(exclude).github/workflows/ci-example-app-hello-world.yaml' \
    ':(exclude).github/workflows/ci-example-app-postcard.yaml' \
    ':(exclude).github/workflows/ci-sdk.yaml' \
    ':(exclude).github/workflows/ci-server.yaml' \
    ':(exclude).github/workflows/ci-zapier.yaml' \
    ':(exclude).github/workflows/ci-utils.yaml' \
    ':(exclude).github/workflows/claude.yml' \
    ':(exclude).github/workflows/docs-i18n-pull.yaml' \
    ':(exclude).github/workflows/docs-i18n-push.yaml' \
    ':(exclude).github/workflows/external-contributor-pr-auto-draft.yaml' \
    ':(exclude).github/workflows/i18n-pull.yaml' \
    ':(exclude).github/workflows/i18n-push.yaml' \
    ':(exclude).github/workflows/post-ci-comments.yaml' \
    ':(exclude).github/workflows/pr-review-dispatch.yaml' \
    ':(exclude).github/workflows/preview-env-dispatch.yaml' \
    ':(exclude).github/workflows/visual-regression-dispatch.yaml' \
    ':(exclude).github/workflows/website-i18n-pull.yaml' \
    ':(exclude).github/workflows/website-i18n-push.yaml' \
    ':(exclude).github/workflows/website-preview-dispatch.yaml' \
    ':(exclude).github/workflows/publish-twenty-v2.30.1-candidate.yml' \
    ':(exclude).github/workflows/sign-twenty-v2.30.1-candidate-4.yml' \
    ':(exclude).github/workflows/stage-twenty-v2.30.1-candidate-4-rehearsal.yml' \
    ':(exclude).github/workflows/twenty-v2.30.1-provenance.yml' \
    ':(exclude)docs/provenance/**' \
    ':(exclude)packages/twenty-emails/src/components/BaseHead.tsx' \
    ':(exclude)packages/twenty-emails/src/components/Footer.tsx' \
    ':(exclude)packages/twenty-emails/src/components/Logo.tsx' \
    ':(exclude)packages/twenty-emails/src/components/get-customer-brand.ts' \
    ':(exclude)packages/twenty-front/src/modules/auth/components/Logo.tsx' \
    ':(exclude)packages/twenty-front/src/generated-metadata/graphql.ts' \
    ':(exclude)packages/twenty-front/src/modules/app/components/RootAppProviders.tsx' \
    ':(exclude)packages/twenty-front/src/modules/app/components/WorkspaceAppProviders.tsx' \
    ':(exclude)packages/twenty-front/src/modules/auth/sign-in-up/components/FooterNote.tsx' \
    ':(exclude)packages/twenty-front/src/modules/branding/utils/getCustomerBrand.ts' \
    ':(exclude)packages/twenty-front/src/modules/branding/utils/__tests__/getCustomerBrand.test.ts' \
    ':(exclude)packages/twenty-front/src/modules/client-config/hooks/useClientConfig.ts' \
    ':(exclude)packages/twenty-front/src/modules/client-config/states/isMhooFoundationEnabledState.ts' \
    ':(exclude)packages/twenty-front/src/modules/client-config/types/ClientConfig.ts' \
    ':(exclude)packages/twenty-front/src/modules/client-config/utils/__tests__/clientConfigUtils.test.ts' \
    ':(exclude)packages/twenty-front/src/modules/domain-manager/hooks/useGetPublicWorkspaceDataByDomain.ts' \
    ':(exclude)packages/twenty-front/src/modules/domain-manager/hooks/useIsCurrentLocationOnDefaultDomain.ts' \
    ':(exclude)packages/twenty-front/src/modules/onboarding/components/OnboardingHeader.tsx' \
    ':(exclude)packages/twenty-front/src/modules/onboarding/components/OnboardingPulsingLogo.tsx' \
    ':(exclude)packages/twenty-front/src/modules/workspace/components/WorkspaceProviderEffect.tsx' \
    ':(exclude)packages/twenty-front/src/modules/ui/utilities/page-favicon/components/PageFavicon.tsx' \
    ':(exclude)packages/twenty-front/src/pages/auth/SignInUp.tsx' \
    ':(exclude)packages/twenty-front/src/testing/mock-data/config.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/auth/auth.resolver.spec.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/auth/auth.resolver.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/auth/controllers/oauth-propagator.controller.spec.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/auth/controllers/oauth-propagator.controller.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/auth/guards/google-apis-oauth-exchange-code-for-token.guard.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/auth/guards/google-apis-oauth-request-code.guard.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/auth/guards/microsoft-apis-oauth-exchange-code-for-token.guard.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/auth/guards/microsoft-apis-oauth-request-code.guard.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/client-config/client-config.controller.spec.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/client-config/client-config.entity.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/client-config/services/client-config.service.spec.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/client-config/services/client-config.service.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/domain/custom-domain-manager/services/custom-domain-manager.service.spec.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/domain/custom-domain-manager/services/custom-domain-manager.service.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/domain/domain-server-config/services/__test__/domain-server-config.service.spec.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/domain/workspace-domains/services/__test__/workspace-domains.service.spec.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/twenty-config/twenty-config.service.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/twenty-config/utils/is-mhoo-foundation-enabled.util.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/twenty-config/utils/validate-mhoo-foundation-config.util.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/twenty-config/utils/__tests__/validate-mhoo-foundation-config.util.spec.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/two-factor-authentication/two-factor-authentication.module.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/two-factor-authentication/two-factor-authentication.resolver.spec.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/two-factor-authentication/two-factor-authentication.resolver.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/workspace/crons/jobs/check-custom-domain-valid-records.cron.job.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/workspace/services/__tests__/workspace.service.spec.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/workspace/services/workspace.service.ts' \
    ':(exclude)packages/twenty-server/src/engine/core-modules/workspace/workspace.resolver.ts' \
    ':(exclude)packages/twenty-server/src/modules/connected-account/channel-sync/services/channel-sync.service.ts' \
    ':(exclude)packages/twenty-client-sdk/src/metadata/generated/schema.graphql' \
    ':(exclude)packages/twenty-client-sdk/src/metadata/generated/schema.ts' \
    ':(exclude)packages/twenty-client-sdk/src/metadata/generated/types.ts' \
    ':(exclude)packages/twenty-utils/dangerfile.ts' \
    ':(exclude)scripts/provenance/**'
)"

[[ -z "$UNEXPECTED_PATHS" ]] || {
  printf '%s\n' "$UNEXPECTED_PATHS" >&2
  fail "Twenty source differs from upstream outside the provenance overlay"
}

git diff --quiet || fail "working tree has unstaged changes"
git diff --cached --quiet || fail "working tree has staged changes"

echo "source verification passed"
echo "upstream_ref=$UPSTREAM_REF"
echo "upstream_commit=$UPSTREAM_COMMIT"
echo "upstream_tree=$UPSTREAM_TREE"
echo "mhoo_exact_source_commit=$EXACT_SOURCE_COMMIT"

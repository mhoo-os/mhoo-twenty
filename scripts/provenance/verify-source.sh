#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(git rev-parse --show-toplevel)"
SOURCE_MANIFEST="$REPOSITORY_ROOT/.twenty-source"
VERIFY_REVISION="${VERIFY_REVISION:-HEAD}"

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
  local file_path="$2"

  git show "${revision}:${file_path}" | shasum -a 256 | awk '{print $1}'
}

assert_equal() {
  local actual="$1"
  local expected="$2"
  local description="$3"

  [[ "$actual" == "$expected" ]] ||
    fail "${description}: expected ${expected}, got ${actual}"
}

assert_source_file_hash() {
  local file_path="$1"
  local manifest_key="$2"
  local expected_hash

  expected_hash="$(manifest_value "$manifest_key")"
  assert_equal "$(sha256_git_file "$UPSTREAM_COMMIT" "$file_path")" \
    "$expected_hash" "upstream ${file_path} hash"
  assert_equal "$(sha256_file "$file_path")" "$expected_hash" \
    "working tree ${file_path} hash"
}

is_allowed_overlay_path() {
  local changed_path="$1"

  case "$changed_path" in
    .twenty-source|AGENTS.md|CI_AUDIT.md|CI_GOVERNANCE_VALIDATION.md|CI_VALIDATION.md|MHOO_CI_CONTRACT.md|README.md)
      return 0
      ;;
    .agents/trajectory-review.json|.agents/trajectory-review-rubric.md)
      return 0
      ;;
    .github/actions/spawn-twenty-app-dev-test/action.yml|.github/actions/spawn-twenty-docker-image/action.yaml|.github/actions/spawn-twenty-server/action.yml)
      return 0
      ;;
    .github/workflows/app-prod-parity-e2e-dispatch.yaml|.github/workflows/cd-deploy-main.yaml|.github/workflows/cd-deploy-tag.yaml|.github/workflows/ci-ai-catalog-sync.yaml|.github/workflows/ci-app-docs-drift.yaml|.github/workflows/ci-blocked-contributors.yaml|.github/workflows/ci-breaking-changes.yaml|.github/workflows/ci-create-app-e2e-minimal.yaml|.github/workflows/ci-cross-version-upgrade.yaml|.github/workflows/ci-dpa-subprocessors-sync.yaml|.github/workflows/ci-e2e-main.yaml|.github/workflows/ci-example-app-hello-world.yaml|.github/workflows/ci-example-app-postcard.yaml|.github/workflows/ci-front.yaml|.github/workflows/ci-sdk.yaml|.github/workflows/ci-server.yaml|.github/workflows/ci-utils.yaml|.github/workflows/ci-zapier.yaml|.github/workflows/claude.yml|.github/workflows/docs-i18n-pull.yaml|.github/workflows/docs-i18n-push.yaml|.github/workflows/external-contributor-pr-auto-draft.yaml|.github/workflows/i18n-pull.yaml|.github/workflows/i18n-push.yaml|.github/workflows/post-ci-comments.yaml|.github/workflows/pr-review-dispatch.yaml|.github/workflows/preview-env-dispatch.yaml|.github/workflows/publish-twenty-v2.37.0-candidate.yml|.github/workflows/twenty-v2.37.0-source.yml|.github/workflows/visual-regression-dispatch.yaml|.github/workflows/website-i18n-pull.yaml|.github/workflows/website-i18n-push.yaml|.github/workflows/website-preview-dispatch.yaml)
      return 0
      ;;
    docs/provenance/ADR_0008_CONNECTIONS_ALIGNMENT.md|docs/provenance/PHASE_2_FOUNDATION_INVENTORY.md|docs/provenance/PHASE_3_FOUNDATION_IMPLEMENTATION.md|docs/provenance/twenty-v2.30.1-candidate.md|docs/provenance/twenty-v2.30.1-published-candidate.md|docs/provenance/twenty-v2.37.0-delta-disposition.tsv|docs/provenance/twenty-v2.37.0-upgrade.md)
      return 0
      ;;
    scripts/ci/classify_front_change.py|scripts/ci/test_classify_front_change.py|scripts/ci/verified_front_backports.json|scripts/provenance/build-v2.37.0-candidate.sh|scripts/provenance/publish-oci-layout.sh|scripts/provenance/test-candidate-6-oci-auth-harness.py|scripts/provenance/test-candidate-6-oci-publication.sh|scripts/provenance/test-verify-source.sh|scripts/provenance/test_verify_bounded_readme_overlay.py|scripts/provenance/validate-v2.37.0-candidate.sh|scripts/provenance/validate-v2.37.0-publication-workflow.sh|scripts/provenance/verify-source.sh|scripts/provenance/verify_bounded_readme_overlay.py)
      return 0
      ;;
    packages/twenty-client-sdk/src/metadata/generated/schema.graphql|packages/twenty-client-sdk/src/metadata/generated/schema.ts|packages/twenty-client-sdk/src/metadata/generated/types.ts)
      return 0
      ;;
    packages/twenty-emails/src/components/BaseHead.tsx|packages/twenty-emails/src/components/Footer.tsx|packages/twenty-emails/src/components/Logo.tsx|packages/twenty-emails/src/components/get-customer-brand.ts)
      return 0
      ;;
    packages/twenty-front/src/generated-metadata/graphql.ts|packages/twenty-front/src/hooks/__tests__/usePageChangeEffectNavigateLocationFoundation.test.tsx)
      return 0
      ;;
    packages/twenty-front/src/modules/app/components/RootAppProviders.tsx|packages/twenty-front/src/modules/app/components/WorkspaceAppProviders.tsx)
      return 0
      ;;
    packages/twenty-front/src/modules/auth/components/Logo.tsx|packages/twenty-front/src/modules/auth/components/__tests__/VerifyEmail.test.tsx|packages/twenty-front/src/modules/auth/sign-in-up/components/FooterNote.tsx|packages/twenty-front/src/modules/auth/sign-in-up/hooks/useSignInUp.ts|packages/twenty-front/src/modules/auth/sign-in-up/hooks/__tests__/useSignInUp.test.tsx)
      return 0
      ;;
    packages/twenty-front/src/modules/branding/utils/getCustomerBrand.ts|packages/twenty-front/src/modules/branding/utils/__tests__/getCustomerBrand.test.ts)
      return 0
      ;;
    packages/twenty-front/src/modules/client-config/hooks/useClientConfig.ts|packages/twenty-front/src/modules/client-config/states/isMhooFoundationEnabledState.ts|packages/twenty-front/src/modules/client-config/types/ClientConfig.ts|packages/twenty-front/src/modules/client-config/utils/__tests__/clientConfigUtils.test.ts)
      return 0
      ;;
    packages/twenty-front/src/modules/domain-manager/hooks/useGetPublicWorkspaceDataByDomain.ts|packages/twenty-front/src/modules/domain-manager/hooks/useIsCurrentLocationOnDefaultDomain.ts)
      return 0
      ;;
    packages/twenty-front/src/modules/onboarding/components/OnboardingHeader.tsx|packages/twenty-front/src/modules/onboarding/components/OnboardingPulsingLogo.tsx|packages/twenty-front/src/modules/ui/utilities/page-favicon/components/PageFavicon.tsx|packages/twenty-front/src/modules/workspace/components/WorkspaceProviderEffect.tsx|packages/twenty-front/src/pages/auth/SignInUp.tsx|packages/twenty-front/src/testing/mock-data/config.ts)
      return 0
      ;;
    packages/twenty-apps/internal/mhoo-finance/*)
      return 0
      ;;
    packages/twenty-server/src/engine/core-modules/application/application-manifest/converters/__tests__/from-connection-provider-manifest-to-universal-flat-connection-provider.util.spec.ts|packages/twenty-server/src/engine/core-modules/application/application-manifest/converters/from-connection-provider-manifest-to-universal-flat-connection-provider.util.ts|packages/twenty-server/src/engine/core-modules/application/connection-provider/connection-provider-oauth-flow.service.ts|packages/twenty-server/src/engine/core-modules/application/connection-provider/connection-provider-oauth.controller.ts|packages/twenty-server/src/engine/core-modules/application/connection-provider/refresh/services/app-oauth-refresh-tokens.service.ts|packages/twenty-server/src/engine/core-modules/application/connection-provider/utils/__tests__/exchange-code-for-token.util.spec.ts|packages/twenty-server/src/engine/core-modules/application/connection-provider/utils/__tests__/extract-oauth-callback-handle.util.spec.ts|packages/twenty-server/src/engine/core-modules/application/connection-provider/utils/exchange-refresh-token-for-token.util.ts|packages/twenty-server/src/engine/core-modules/application/connection-provider/utils/extract-oauth-callback-handle.util.ts)
      return 0
      ;;
    packages/twenty-server/src/engine/core-modules/auth/auth.resolver.spec.ts|packages/twenty-server/src/engine/core-modules/auth/auth.resolver.ts|packages/twenty-server/src/engine/core-modules/auth/controllers/oauth-propagator.controller.spec.ts|packages/twenty-server/src/engine/core-modules/auth/controllers/oauth-propagator.controller.ts|packages/twenty-server/src/engine/core-modules/auth/guards/google-apis-oauth-exchange-code-for-token.guard.ts|packages/twenty-server/src/engine/core-modules/auth/guards/google-apis-oauth-request-code.guard.ts|packages/twenty-server/src/engine/core-modules/auth/guards/microsoft-apis-oauth-exchange-code-for-token.guard.ts|packages/twenty-server/src/engine/core-modules/auth/guards/microsoft-apis-oauth-request-code.guard.ts)
      return 0
      ;;
    packages/twenty-server/src/engine/core-modules/client-config/client-config.controller.spec.ts|packages/twenty-server/src/engine/core-modules/client-config/client-config.entity.ts|packages/twenty-server/src/engine/core-modules/client-config/services/client-config.service.spec.ts|packages/twenty-server/src/engine/core-modules/client-config/services/client-config.service.ts)
      return 0
      ;;
    packages/twenty-server/src/engine/core-modules/domain/custom-domain-manager/services/custom-domain-manager.service.spec.ts|packages/twenty-server/src/engine/core-modules/domain/custom-domain-manager/services/custom-domain-manager.service.ts|packages/twenty-server/src/engine/core-modules/domain/domain-server-config/services/__test__/domain-server-config.service.spec.ts|packages/twenty-server/src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service.ts|packages/twenty-server/src/engine/core-modules/domain/workspace-domains/services/__test__/workspace-domains.service.spec.ts|packages/twenty-server/src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service.ts)
      return 0
      ;;
    packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts|packages/twenty-server/src/engine/core-modules/twenty-config/twenty-config.service.ts|packages/twenty-server/src/engine/core-modules/twenty-config/utils/is-mhoo-foundation-enabled.util.ts|packages/twenty-server/src/engine/core-modules/twenty-config/utils/validate-mhoo-foundation-config.util.ts|packages/twenty-server/src/engine/core-modules/twenty-config/utils/__tests__/validate-mhoo-foundation-config.util.spec.ts)
      return 0
      ;;
    packages/twenty-server/src/engine/core-modules/two-factor-authentication/two-factor-authentication.module.ts|packages/twenty-server/src/engine/core-modules/two-factor-authentication/two-factor-authentication.resolver.spec.ts|packages/twenty-server/src/engine/core-modules/two-factor-authentication/two-factor-authentication.resolver.ts|packages/twenty-server/src/engine/core-modules/workspace/crons/jobs/check-custom-domain-valid-records.cron.job.ts|packages/twenty-server/src/engine/core-modules/workspace/services/__tests__/workspace.service.spec.ts|packages/twenty-server/src/engine/core-modules/workspace/services/workspace.service.ts|packages/twenty-server/src/engine/core-modules/workspace/workspace.resolver.ts)
      return 0
      ;;
    packages/twenty-server/src/modules/connected-account/channel-sync/services/channel-sync.service.ts|packages/twenty-utils/dangerfile.ts)
      return 0
      ;;
    packages/twenty-server/src/engine/core-modules/tool-provider/providers/logic-function-tool.provider.ts|packages/twenty-server/src/engine/core-modules/tool-provider/utils/__tests__/can-access-logic-function-tool.util.spec.ts|packages/twenty-server/src/engine/core-modules/tool-provider/utils/can-access-logic-function-tool.util.ts|packages/twenty-server/src/engine/workspace-manager/workspace-migration/workspace-migration-builder/validators/services/flat-connection-provider-validator.service.ts|packages/twenty-shared/src/application/oauthConnectionProviderConfigType.ts|packages/twenty-shared/src/application/storedOAuthConnectionProviderConfigType.ts|packages/twenty-shared/src/application/toolTriggerSettingsType.ts)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

cd "$REPOSITORY_ROOT"
[[ -f "$SOURCE_MANIFEST" ]] || fail ".twenty-source is missing"

UPSTREAM_REPOSITORY="$(manifest_value TWENTY_UPSTREAM_REPOSITORY)"
UPSTREAM_REF="$(manifest_value TWENTY_UPSTREAM_REF)"
UPSTREAM_COMMIT="$(manifest_value TWENTY_UPSTREAM_COMMIT)"
UPSTREAM_TREE="$(manifest_value TWENTY_UPSTREAM_TREE)"
SDK_UPSTREAM_REF="$(manifest_value TWENTY_SDK_UPSTREAM_REF)"
SDK_UPSTREAM_COMMIT="$(manifest_value TWENTY_SDK_UPSTREAM_COMMIT)"
EXACT_SOURCE_COMMIT="$(manifest_value MHOO_TWENTY_EXACT_SOURCE_COMMIT)"

assert_equal "$(git cat-file -t "$UPSTREAM_COMMIT")" "commit" \
  "upstream object type"
assert_equal "$(git rev-parse "${UPSTREAM_COMMIT}^{tree}")" "$UPSTREAM_TREE" \
  "upstream tree"
assert_equal "$(git rev-parse "${EXACT_SOURCE_COMMIT}^{tree}")" "$UPSTREAM_TREE" \
  "Mhoo exact-source tree"
assert_equal "$(git cat-file -t "$EXACT_SOURCE_COMMIT")" "commit" \
  "Mhoo exact-source object type"

if [[ "${VERIFY_UPSTREAM_REMOTE:-1}" == "1" ]]; then
  remote_commit="$(git ls-remote "$UPSTREAM_REPOSITORY" "$UPSTREAM_REF" | awk 'NR == 1 {print $1}')"
  sdk_remote_commit="$(git ls-remote "$UPSTREAM_REPOSITORY" "$SDK_UPSTREAM_REF" | awk 'NR == 1 {print $1}')"
  assert_equal "$remote_commit" "$UPSTREAM_COMMIT" "upstream remote ref"
  assert_equal "$sdk_remote_commit" "$SDK_UPSTREAM_COMMIT" "SDK upstream remote ref"
fi

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
assert_equal "$(node -p "require('./packages/twenty-sdk/package.json').version")" \
  "$(manifest_value TWENTY_SDK_VERSION)" "Twenty SDK version"
assert_equal "$(node -p "require('./packages/create-twenty-app/package.json').version")" \
  "$(manifest_value TWENTY_SDK_VERSION)" "create-twenty-app version"

assert_equal "$(manifest_value TWENTY_APP_DEV_IMAGE)" \
  "twentycrm/twenty-app-dev:$(manifest_value TWENTY_VERSION)" \
  "governed app-dev image repository and tag"
expected_app_dev_version="$(manifest_value TWENTY_VERSION)@$(manifest_value TWENTY_APP_DEV_IMAGE_INDEX_DIGEST)"
for app_dev_action in \
  .github/actions/spawn-twenty-app-dev-test/action.yml \
  .github/actions/spawn-twenty-server/action.yml; do
  actual_app_dev_version="$(
    sed -n "s/^[[:space:]]*default: '\(v[0-9][^']*@sha256:[0-9a-f]\{64\}\)'$/\1/p" \
      "$app_dev_action" | head -n 1
  )"
  assert_equal "$actual_app_dev_version" "$expected_app_dev_version" \
    "governed app-dev image pin in ${app_dev_action}"
done

python3 "$REPOSITORY_ROOT/scripts/provenance/verify_bounded_readme_overlay.py" \
  --upstream-revision "$UPSTREAM_COMMIT"

unexpected_paths="$({
  while IFS= read -r changed_path; do
    if [[ -n "$changed_path" && "$changed_path" != "README.md" ]] &&
      ! is_allowed_overlay_path "$changed_path"; then
      printf '%s\n' "$changed_path"
    fi
  done < <(git diff --name-only "$UPSTREAM_COMMIT" "$VERIFY_REVISION" -- .)
} | LC_ALL=C sort -u)"

if [[ -n "$unexpected_paths" ]]; then
  printf '%s\n' "$unexpected_paths" >&2
  fail "Twenty source differs from upstream outside the provenance overlay"
fi

if [[ "${VERIFY_WORKTREE_CLEAN:-1}" == "1" ]]; then
  git diff --quiet || fail "working tree has unstaged changes"
  git diff --cached --quiet || fail "working tree has staged changes"
fi

echo "source verification passed"
echo "upstream_ref=$UPSTREAM_REF"
echo "upstream_commit=$UPSTREAM_COMMIT"
echo "upstream_tree=$UPSTREAM_TREE"
echo "sdk_upstream_ref=$SDK_UPSTREAM_REF"
echo "sdk_upstream_commit=$SDK_UPSTREAM_COMMIT"
echo "mhoo_exact_source_commit=$EXACT_SOURCE_COMMIT"

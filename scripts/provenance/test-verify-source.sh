#!/usr/bin/env bash

set -euo pipefail

PROVENANCE_TEST_REPOSITORY_ROOT="$(git rev-parse --show-toplevel)"

fail_test() {
  echo "verify-source regression test failed: $*" >&2
  exit 1
}

expect_verifier_failure() {
  local description="$1"
  local required_output="$2"
  local additional_required_output="${3:-}"
  local verifier_output
  local verifier_exit=0

  verifier_output="$(VERIFY_UPSTREAM_REMOTE=0 scripts/provenance/verify-source.sh 2>&1)" || verifier_exit=$?
  [[ "$verifier_exit" -ne 0 ]] || fail_test "$description unexpectedly passed"
  [[ "$verifier_output" == *"$required_output"* ]] || {
    printf '%s\n' "$verifier_output" >&2
    fail_test "$description did not fail for the expected reason"
  }
  if [[ -n "$additional_required_output" && "$verifier_output" != *"$additional_required_output"* ]]; then
    printf '%s\n' "$verifier_output" >&2
    fail_test "$description did not name the protected path"
  fi
}

cd "$PROVENANCE_TEST_REPOSITORY_ROOT"
python3 scripts/provenance/test_verify_bounded_readme_overlay.py

PROVENANCE_TEST_TEMP_ROOT="$(mktemp -d /tmp/mhoo-readme-provenance-test.XXXXXX)"
case "$PROVENANCE_TEST_TEMP_ROOT" in
  /tmp/mhoo-readme-provenance-test.*) ;;
  *) fail_test "unsafe temporary root: $PROVENANCE_TEST_TEMP_ROOT" ;;
esac
PROVENANCE_TEST_WORKTREE="$PROVENANCE_TEST_TEMP_ROOT/worktree"

cleanup_provenance_test() {
  git -C "$PROVENANCE_TEST_REPOSITORY_ROOT" worktree remove --force "$PROVENANCE_TEST_WORKTREE" >/dev/null 2>&1 || true
  if [[ -d "$PROVENANCE_TEST_TEMP_ROOT" ]]; then
    rm -rf -- "$PROVENANCE_TEST_TEMP_ROOT"
  fi
}
trap cleanup_provenance_test EXIT

git worktree add --detach "$PROVENANCE_TEST_WORKTREE" HEAD >/dev/null
cd "$PROVENANCE_TEST_WORKTREE"

VERIFY_UPSTREAM_REMOTE=0 scripts/provenance/verify-source.sh >/dev/null

printf 'unauthorized README suffix' >> README.md
expect_verifier_failure \
  "unauthorized README byte mutation" \
  "does not reproduce pinned upstream README bytes"
git restore --source=HEAD -- README.md
VERIFY_UPSTREAM_REMOTE=0 scripts/provenance/verify-source.sh >/dev/null

printf '\nunauthorized protected-path mutation\n' >> LICENSE
git add LICENSE
git -c user.name='Mhoo provenance test' \
  -c user.email='provenance-test@mhoo.invalid' \
  commit -m 'test: unauthorized protected path mutation' >/dev/null
expect_verifier_failure \
  "unrelated provenance-protected path mutation" \
  "Twenty source differs from upstream outside the provenance overlay" \
  "LICENSE"
echo "verify-source regression tests passed"

#!/usr/bin/env python3

"""Classify frontend CI risk and verify narrow official Twenty backports."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any


OFFICIAL_UPSTREAM_REPOSITORY = "https://github.com/twentyhq/twenty.git"
REGISTRY_PATH = "scripts/ci/verified_front_backports.json"
FRONT_PATH_PREFIXES = (
    "packages/twenty-front/",
    "packages/twenty-front-component-renderer/",
    "packages/twenty-ui/",
    "packages/twenty-shared/",
    "packages/twenty-sdk/",
)
FRONT_EXACT_PATHS = {
    ".nvmrc",
    ".yarnrc.yml",
    "nx.json",
    "package.json",
    "yarn.lock",
}
FRONT_CI_CONTROL_PATHS = {
    ".github/actions/nx-affected/action.yaml",
    ".github/actions/restore-cache/action.yaml",
    ".github/actions/save-cache/action.yaml",
    ".github/actions/yarn-install/action.yaml",
    ".github/workflows/changed-files.yaml",
    ".github/workflows/ci-front.yaml",
    "CI_AUDIT.md",
    "MHOO_CI_CONTRACT.md",
    REGISTRY_PATH,
    "scripts/ci/classify_front_change.py",
    "scripts/ci/test_classify_front_change.py",
}
BACKPORT_CONTROL_PATHS = {
    "scripts/provenance/test-verify-source.sh",
    "scripts/provenance/verify-source.sh",
}
HEX_COMMIT_RE = re.compile(r"^[0-9a-f]{40}$")
BACKPORT_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


class ClassificationError(RuntimeError):
    pass


@dataclass(frozen=True)
class Change:
    status: str
    path: str
    previous_path: str | None = None


@dataclass(frozen=True)
class Classification:
    run_front: bool
    deep_required: bool
    verified_backport: bool
    reason: str
    backport_id: str = ""


def run_git(
    repository_root: Path,
    *args: str,
    check: bool = True,
    text: bool = True,
    timeout_seconds: int | None = None,
) -> subprocess.CompletedProcess[str] | subprocess.CompletedProcess[bytes]:
    environment = os.environ.copy()
    environment["GIT_TERMINAL_PROMPT"] = "0"
    return subprocess.run(
        ["git", *args],
        cwd=repository_root,
        check=check,
        capture_output=True,
        text=text,
        env=environment,
        timeout=timeout_seconds,
    )


def git_text(repository_root: Path, *args: str) -> str:
    result = run_git(repository_root, *args)
    assert isinstance(result.stdout, str)
    return result.stdout.strip()


def read_git_json(repository_root: Path, revision: str, path: str) -> dict[str, Any]:
    try:
        raw = git_text(repository_root, "show", f"{revision}:{path}")
    except subprocess.CalledProcessError as error:
        raise ClassificationError(f"missing {path} at {revision}") from error

    try:
        value = json.loads(raw)
    except json.JSONDecodeError as error:
        raise ClassificationError(f"invalid JSON in {path}: {error.msg}") from error
    if not isinstance(value, dict):
        raise ClassificationError(f"{path} must contain a JSON object")
    return value


def validate_safe_path(path: str, description: str) -> None:
    pure_path = PurePosixPath(path)
    if (
        not path
        or path.startswith("/")
        or "\\" in path
        or any(ord(character) < 32 or ord(character) == 127 for character in path)
        or any(part in {"", ".", ".."} for part in pure_path.parts)
        or pure_path.as_posix() != path
    ):
        raise ClassificationError(f"unsafe {description}: {path!r}")


def validate_registry(registry: dict[str, Any], registry_path: str) -> dict[str, dict[str, Any]]:
    if set(registry) != {"format", "backports"}:
        raise ClassificationError(f"{registry_path} has unexpected top-level keys")
    if registry["format"] != 1:
        raise ClassificationError(f"{registry_path} format must be 1")
    if not isinstance(registry["backports"], list):
        raise ClassificationError(f"{registry_path} backports must be a list")

    parsed: dict[str, dict[str, Any]] = {}
    expected_keys = {
        "contentManifestSha256",
        "id",
        "paths",
        "receipt",
        "upstreamCommit",
        "upstreamRepository",
    }
    for index, entry in enumerate(registry["backports"]):
        if not isinstance(entry, dict) or set(entry) != expected_keys:
            raise ClassificationError(
                f"{registry_path} backport #{index + 1} has an invalid schema"
            )
        backport_id = entry["id"]
        if not isinstance(backport_id, str) or not BACKPORT_ID_RE.fullmatch(backport_id):
            raise ClassificationError(f"invalid backport id: {backport_id!r}")
        if backport_id in parsed:
            raise ClassificationError(f"duplicate backport id: {backport_id}")
        if entry["upstreamRepository"] != OFFICIAL_UPSTREAM_REPOSITORY:
            raise ClassificationError(
                f"backport {backport_id} must use {OFFICIAL_UPSTREAM_REPOSITORY}"
            )
        if not isinstance(entry["upstreamCommit"], str) or not HEX_COMMIT_RE.fullmatch(
            entry["upstreamCommit"]
        ):
            raise ClassificationError(f"backport {backport_id} has an invalid commit")
        if not isinstance(entry["contentManifestSha256"], str) or not SHA256_RE.fullmatch(
            entry["contentManifestSha256"]
        ):
            raise ClassificationError(
                f"backport {backport_id} has an invalid content manifest hash"
            )
        receipt = entry["receipt"]
        if not isinstance(receipt, str):
            raise ClassificationError(f"backport {backport_id} receipt must be a path")
        validate_safe_path(receipt, f"receipt path for {backport_id}")
        if not receipt.startswith("docs/provenance/") or not receipt.endswith(".md"):
            raise ClassificationError(
                f"backport {backport_id} receipt must be a provenance Markdown file"
            )

        paths = entry["paths"]
        if not isinstance(paths, list) or not paths:
            raise ClassificationError(f"backport {backport_id} paths must be non-empty")
        if not all(isinstance(path, str) for path in paths):
            raise ClassificationError(f"backport {backport_id} paths must be strings")
        for path in paths:
            validate_safe_path(path, f"source path for {backport_id}")
            if not path.startswith("packages/twenty-front/"):
                raise ClassificationError(
                    f"backport {backport_id} is not frontend-only: {path}"
                )
        if paths != sorted(set(paths)):
            raise ClassificationError(
                f"backport {backport_id} paths must be sorted and unique"
            )
        parsed[backport_id] = entry

    if list(parsed) != sorted(parsed):
        raise ClassificationError(
            f"{registry_path} backports must be sorted by id"
        )

    return parsed


def parse_changes(repository_root: Path, base: str, head: str) -> list[Change]:
    result = run_git(
        repository_root,
        "diff",
        "--name-status",
        "--find-renames",
        "-z",
        base,
        head,
        "--",
        text=False,
    )
    assert isinstance(result.stdout, bytes)
    tokens = result.stdout.decode("utf-8").split("\0")
    if tokens and tokens[-1] == "":
        tokens.pop()

    changes: list[Change] = []
    index = 0
    while index < len(tokens):
        status = tokens[index]
        index += 1
        if status.startswith(("R", "C")):
            if index + 1 >= len(tokens):
                raise ClassificationError("truncated rename or copy record")
            previous_path = tokens[index]
            path = tokens[index + 1]
            index += 2
            changes.append(Change(status=status, path=path, previous_path=previous_path))
        else:
            if index >= len(tokens):
                raise ClassificationError("truncated changed-path record")
            changes.append(Change(status=status, path=tokens[index]))
            index += 1
    return changes


def is_front_relevant(path: str) -> bool:
    if path in FRONT_EXACT_PATHS or path in FRONT_CI_CONTROL_PATHS:
        return True
    if path == "packages/twenty-sdk/package.json":
        return False
    return path.startswith(FRONT_PATH_PREFIXES)


def ensure_commit_available(
    repository_root: Path,
    upstream_repository: str,
    commit: str,
    fetch_missing: bool,
) -> None:
    if fetch_missing:
        try:
            fetch_result = run_git(
                repository_root,
                "fetch",
                "--no-tags",
                "--depth=1",
                upstream_repository,
                commit,
                check=False,
                timeout_seconds=60,
            )
        except subprocess.TimeoutExpired as error:
            raise ClassificationError(
                f"official upstream commit fetch timed out: {commit}"
            ) from error
        if fetch_result.returncode != 0:
            raise ClassificationError(
                f"official upstream commit could not be fetched: {commit}"
            )
    object_type = run_git(
        repository_root, "cat-file", "-t", commit, check=False
    )
    if object_type.returncode != 0 or object_type.stdout.strip() != "commit":
        raise ClassificationError(f"upstream commit is unavailable: {commit}")


def verify_backport_content(
    repository_root: Path,
    head: str,
    entry: dict[str, Any],
    fetch_missing: bool,
) -> None:
    upstream_repository = entry["upstreamRepository"]
    upstream_commit = entry["upstreamCommit"]
    ensure_commit_available(
        repository_root, upstream_repository, upstream_commit, fetch_missing
    )

    manifest_lines: list[str] = []
    for path in entry["paths"]:
        try:
            head_blob = git_text(repository_root, "rev-parse", f"{head}:{path}")
            upstream_blob = git_text(
                repository_root, "rev-parse", f"{upstream_commit}:{path}"
            )
        except subprocess.CalledProcessError as error:
            raise ClassificationError(
                f"backport path is missing from head or upstream: {path}"
            ) from error
        if head_blob != upstream_blob:
            raise ClassificationError(
                f"backport path does not match official upstream blob: {path}"
            )
        manifest_lines.append(f"{path}\t{upstream_blob}\n")

    actual_hash = hashlib.sha256("".join(manifest_lines).encode()).hexdigest()
    if actual_hash != entry["contentManifestSha256"]:
        raise ClassificationError(
            "official upstream path-and-blob manifest hash mismatch"
        )


def classify(
    repository_root: Path,
    base: str,
    head: str,
    fetch_missing: bool,
) -> Classification:
    changes = parse_changes(repository_root, base, head)
    changed_paths = {change.path for change in changes}
    if not any(is_front_relevant(path) for path in changed_paths):
        return Classification(False, False, False, "no frontend boundary changed")

    full_reason = "ordinary frontend or CI-control change requires deep validation"
    try:
        base_registry = validate_registry(
            read_git_json(repository_root, base, REGISTRY_PATH), REGISTRY_PATH
        )
        head_registry = validate_registry(
            read_git_json(repository_root, head, REGISTRY_PATH), REGISTRY_PATH
        )
    except ClassificationError as error:
        return Classification(True, True, False, f"{full_reason}: {error}")

    removed_ids = set(base_registry) - set(head_registry)
    modified_ids = {
        backport_id
        for backport_id in set(base_registry) & set(head_registry)
        if base_registry[backport_id] != head_registry[backport_id]
    }
    added_ids = set(head_registry) - set(base_registry)
    if removed_ids or modified_ids or len(added_ids) != 1:
        return Classification(True, True, False, full_reason)

    backport_id = next(iter(added_ids))
    entry = head_registry[backport_id]
    source_paths = set(entry["paths"])
    changed_front_source_paths = {
        path for path in changed_paths if path.startswith("packages/")
    }
    allowed_paths = source_paths | {
        REGISTRY_PATH,
        entry["receipt"],
        *BACKPORT_CONTROL_PATHS,
    }
    required_changed_paths = source_paths | {REGISTRY_PATH, entry["receipt"]}
    if (
        changed_front_source_paths != source_paths
        or not required_changed_paths.issubset(changed_paths)
        or changed_paths - allowed_paths
    ):
        return Classification(
            True,
            True,
            False,
            f"{full_reason}: diff exceeds registered backport scope",
        )
    if any(change.status.startswith(("D", "R", "C")) for change in changes):
        return Classification(
            True,
            True,
            False,
            f"{full_reason}: deletion, rename, or copy detected",
        )

    try:
        verify_backport_content(repository_root, head, entry, fetch_missing)
    except ClassificationError as error:
        return Classification(True, True, False, f"{full_reason}: {error}")

    return Classification(
        True,
        False,
        True,
        "exact official upstream frontend backport verified",
        backport_id,
    )


def write_github_output(output_path: Path, classification: Classification) -> None:
    reason = classification.reason.replace("\n", " ").replace("\r", " ")
    with output_path.open("a", encoding="utf-8") as output:
        output.write(f"run_front={str(classification.run_front).lower()}\n")
        output.write(f"deep_required={str(classification.deep_required).lower()}\n")
        output.write(
            f"verified_backport={str(classification.verified_backport).lower()}\n"
        )
        output.write(f"backport_id={classification.backport_id}\n")
        output.write(f"reason={reason}\n")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository-root", type=Path, default=Path.cwd())
    parser.add_argument("--base")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--fetch-missing", action="store_true")
    parser.add_argument("--force-deep", action="store_true")
    parser.add_argument("--github-output", type=Path)
    args = parser.parse_args()

    repository_root = args.repository_root.resolve()
    try:
        if args.force_deep:
            classification = Classification(
                True,
                True,
                False,
                "main, merge queue, or explicit deep validation",
            )
        else:
            if not args.base:
                raise ClassificationError("--base is required without --force-deep")
            classification = classify(
                repository_root,
                args.base,
                args.head,
                args.fetch_missing,
            )
    except (ClassificationError, subprocess.CalledProcessError) as error:
        print(f"frontend CI classification failed: {error}", file=sys.stderr)
        return 1

    if args.github_output:
        write_github_output(args.github_output, classification)
    print(json.dumps(classification.__dict__, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

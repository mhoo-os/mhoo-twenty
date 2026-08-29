#!/usr/bin/env python3
"""Verify the one bounded Mhoo block permitted in upstream README.md.

README.md remains upstream-owned. An overlay, when present, must be one exact
top-of-file block followed by exactly two LF bytes. Removing only that prefix
must reproduce the pinned upstream blob byte for byte.
"""

from __future__ import annotations

import argparse
import hashlib
import subprocess
import sys
from pathlib import Path

README_PATH = "README.md"
START_MARKER = b"<!-- mhoo-os-context:start -->"
END_MARKER = b"<!-- mhoo-os-context:end -->"
UPSTREAM_SEPARATOR = b"\n\n"


class BoundedReadmeOverlayError(ValueError):
    """The README is neither exact upstream nor the one bounded overlay."""


def sha256_hex(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def verify_bounded_readme_overlay(
    upstream_readme: bytes,
    candidate_readme: bytes,
) -> tuple[str, bytes]:
    """Return (mode, reconstructed_upstream) or fail closed.

    ``mode`` is ``absent`` when README.md is the exact upstream blob and
    ``present`` when the one authorized prefix was removed successfully.
    """

    if START_MARKER in upstream_readme or END_MARKER in upstream_readme:
        raise BoundedReadmeOverlayError(
            "pinned upstream README contains a reserved Mhoo context marker",
        )

    if candidate_readme == upstream_readme:
        return "absent", candidate_readme

    start_count = candidate_readme.count(START_MARKER)
    end_count = candidate_readme.count(END_MARKER)
    if start_count != 1 or end_count != 1:
        raise BoundedReadmeOverlayError(
            "README must contain exactly one start marker and one end marker "
            f"when the bounded overlay is present; found {start_count} and {end_count}",
        )

    if not candidate_readme.startswith(START_MARKER):
        raise BoundedReadmeOverlayError(
            "bounded README overlay must begin at byte zero",
        )

    content_start = len(START_MARKER)
    if candidate_readme[content_start : content_start + 1] != b"\n":
        raise BoundedReadmeOverlayError(
            "start marker must be followed by exactly an LF-delimited block",
        )

    end_start = candidate_readme.find(END_MARKER, content_start)
    if end_start <= content_start or candidate_readme[end_start - 1 : end_start] != b"\n":
        raise BoundedReadmeOverlayError(
            "end marker must close the LF-delimited top-of-file block",
        )

    overlay_end = end_start + len(END_MARKER)
    if candidate_readme[overlay_end : overlay_end + len(UPSTREAM_SEPARATOR)] != UPSTREAM_SEPARATOR:
        raise BoundedReadmeOverlayError(
            "end marker must be followed by exactly two LF bytes before upstream content",
        )

    reconstructed_upstream = candidate_readme[overlay_end + len(UPSTREAM_SEPARATOR) :]
    if reconstructed_upstream != upstream_readme:
        raise BoundedReadmeOverlayError(
            "removing the bounded block does not reproduce pinned upstream README bytes",
        )

    return "present", reconstructed_upstream


def git_blob(repository_root: Path, revision: str, path: str) -> bytes:
    result = subprocess.run(
        ["git", "show", f"{revision}:{path}"],
        cwd=repository_root,
        check=False,
        capture_output=True,
    )
    if result.returncode != 0:
        detail = result.stderr.decode("utf-8", errors="replace").strip()
        raise BoundedReadmeOverlayError(
            f"cannot read pinned upstream {path} at {revision}: {detail}",
        )
    return result.stdout


def repository_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True,
        capture_output=True,
        text=True,
    )
    return Path(result.stdout.strip())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--upstream-revision", required=True)
    args = parser.parse_args()

    try:
        root = repository_root()
        upstream = git_blob(root, args.upstream_revision, README_PATH)
        candidate = (root / README_PATH).read_bytes()
        mode, reconstructed = verify_bounded_readme_overlay(upstream, candidate)
    except (BoundedReadmeOverlayError, OSError, subprocess.CalledProcessError) as error:
        print(f"bounded README overlay verification failed: {error}", file=sys.stderr)
        return 1

    print("bounded README overlay verification passed")
    print(f"readme_overlay_mode={mode}")
    print(f"upstream_readme_sha256={sha256_hex(upstream)}")
    print(f"stripped_readme_sha256={sha256_hex(reconstructed)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

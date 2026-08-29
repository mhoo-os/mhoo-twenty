#!/usr/bin/env python3
"""Hostile regression tests for the bounded upstream README overlay."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

sys.dont_write_bytecode = True

from verify_bounded_readme_overlay import (  # noqa: E402
    BoundedReadmeOverlayError,
    END_MARKER,
    START_MARKER,
    UPSTREAM_SEPARATOR,
    git_blob,
    sha256_hex,
    verify_bounded_readme_overlay,
)


class BoundedReadmeOverlayTests(unittest.TestCase):
    UPSTREAM = b"# Upstream README\n\nAlpha\nBeta\nGamma\n"
    BLOCK = START_MARKER + b"\nMhoo context\n" + END_MARKER + UPSTREAM_SEPARATOR

    def assert_rejected(self, candidate: bytes, upstream: bytes | None = None) -> None:
        with self.assertRaises(BoundedReadmeOverlayError):
            verify_bounded_readme_overlay(upstream or self.UPSTREAM, candidate)

    def test_exact_upstream_without_overlay_passes(self) -> None:
        mode, stripped = verify_bounded_readme_overlay(self.UPSTREAM, self.UPSTREAM)
        self.assertEqual("absent", mode)
        self.assertEqual(self.UPSTREAM, stripped)

    def test_exact_upstream_with_one_authorized_block_passes(self) -> None:
        mode, stripped = verify_bounded_readme_overlay(
            self.UPSTREAM,
            self.BLOCK + self.UPSTREAM,
        )
        self.assertEqual("present", mode)
        self.assertEqual(self.UPSTREAM, stripped)

    def test_current_pr_readme_reconstructs_pinned_upstream(self) -> None:
        root = Path(__file__).resolve().parents[2]
        manifest = (root / ".twenty-source").read_text(encoding="utf-8")
        upstream_revision = next(
            line.split("=", 1)[1]
            for line in manifest.splitlines()
            if line.startswith("TWENTY_UPSTREAM_COMMIT=")
        )
        upstream = git_blob(root, upstream_revision, "README.md")
        mode, stripped = verify_bounded_readme_overlay(
            upstream,
            (root / "README.md").read_bytes(),
        )
        self.assertEqual("present", mode)
        self.assertEqual(upstream, stripped)
        self.assertEqual(
            "c071d6f378e7aad1508eb4c0b0cd1b54d37db9de1dbc3b870522ae7cf83ceb53",
            sha256_hex(upstream),
        )
        self.assertEqual(sha256_hex(upstream), sha256_hex(stripped))

    def test_readme_changed_outside_block_fails(self) -> None:
        changed = self.UPSTREAM.replace(b"Beta", b"Beto", 1)
        self.assert_rejected(self.BLOCK + changed)

    def test_one_upstream_byte_changed_before_block_fails(self) -> None:
        self.assert_rejected(b"!" + self.BLOCK + self.UPSTREAM[1:])

    def test_one_upstream_byte_changed_after_block_fails(self) -> None:
        changed = bytes([self.UPSTREAM[0] ^ 1]) + self.UPSTREAM[1:]
        self.assert_rejected(self.BLOCK + changed)

    def test_upstream_content_deleted_fails(self) -> None:
        self.assert_rejected(self.BLOCK + self.UPSTREAM.replace(b"Beta\n", b"", 1))

    def test_upstream_content_reordered_fails(self) -> None:
        self.assert_rejected(
            self.BLOCK + b"# Upstream README\n\nBeta\nAlpha\nGamma\n",
        )

    def test_duplicate_mhoo_block_fails(self) -> None:
        self.assert_rejected(self.BLOCK + self.BLOCK + self.UPSTREAM)

    def test_missing_start_marker_fails(self) -> None:
        self.assert_rejected(
            b"Mhoo context\n" + END_MARKER + UPSTREAM_SEPARATOR + self.UPSTREAM,
        )

    def test_missing_end_marker_fails(self) -> None:
        self.assert_rejected(
            START_MARKER + b"\nMhoo context\n" + UPSTREAM_SEPARATOR + self.UPSTREAM,
        )

    def test_nested_markers_fail(self) -> None:
        self.assert_rejected(
            START_MARKER
            + b"\n"
            + START_MARKER
            + b"\nnested\n"
            + END_MARKER
            + b"\n"
            + END_MARKER
            + UPSTREAM_SEPARATOR
            + self.UPSTREAM,
        )

    def test_renamed_markers_fail(self) -> None:
        cases = (
            self.BLOCK.replace(START_MARKER, b"<!-- mhoo-os-context:begin -->", 1),
            self.BLOCK.replace(END_MARKER, b"<!-- mhoo-os-context:finish -->", 1),
        )
        for renamed in cases:
            with self.subTest(renamed=renamed):
                self.assert_rejected(renamed + self.UPSTREAM)

    def test_block_in_unauthorized_location_fails(self) -> None:
        split = self.UPSTREAM.index(b"Alpha")
        self.assert_rejected(
            self.UPSTREAM[:split] + self.BLOCK + self.UPSTREAM[split:],
        )

    def test_arbitrary_extra_prefix_fails(self) -> None:
        self.assert_rejected(b"arbitrary prefix\n" + self.BLOCK + self.UPSTREAM)

    def test_arbitrary_extra_suffix_fails(self) -> None:
        self.assert_rejected(self.BLOCK + self.UPSTREAM + b"arbitrary suffix\n")

    def test_readme_wholly_replaced_fails(self) -> None:
        self.assert_rejected(self.BLOCK + b"replacement README\n")

    def test_reserved_marker_collision_in_upstream_fails(self) -> None:
        self.assert_rejected(
            self.BLOCK + self.UPSTREAM,
            START_MARKER + b"\n" + self.UPSTREAM,
        )


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


CLASSIFIER = Path(__file__).with_name("classify_front_change.py")
REGISTRY_PATH = Path("scripts/ci/verified_front_backports.json")
FRONT_PATH = Path("packages/twenty-front/src/example.ts")
RECEIPT_PATH = Path("docs/provenance/example-backport.md")


def run(
    command: list[str],
    cwd: Path,
    *,
    environment: dict[str, str] | None = None,
) -> str:
    return subprocess.run(
        command,
        cwd=cwd,
        check=True,
        capture_output=True,
        text=True,
        env=environment,
    ).stdout.strip()


def git(repository: Path, *args: str) -> str:
    return run(["git", *args], repository)


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def commit(repository: Path, message: str) -> str:
    git(repository, "add", ".")
    git(repository, "commit", "-m", message)
    return git(repository, "rev-parse", "HEAD")


class FrontChangeClassifierTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_directory.name)
        self.upstream = self.root / "upstream"
        self.repository = self.root / "repository"
        for repository in (self.upstream, self.repository):
            repository.mkdir()
            git(repository, "init", "-q")
            git(repository, "config", "user.name", "CI test")
            git(repository, "config", "user.email", "ci-test@mhoo.invalid")

        write(self.upstream / FRONT_PATH, "export const value = 'upstream';\n")
        self.upstream_commit = commit(self.upstream, "upstream fix")
        self.upstream_blob = git(
            self.upstream, "rev-parse", f"{self.upstream_commit}:{FRONT_PATH}"
        )
        git(
            self.repository,
            "fetch",
            "--no-tags",
            str(self.upstream),
            self.upstream_commit,
        )

        write(self.repository / FRONT_PATH, "export const value = 'baseline';\n")
        write(
            self.repository / REGISTRY_PATH,
            json.dumps({"format": 1, "backports": []}, indent=2) + "\n",
        )
        write(self.repository / "README.md", "fixture\n")
        self.base = commit(self.repository, "baseline")

        real_git = shutil.which("git")
        assert real_git is not None
        self.fetch_log = self.root / "official-fetch.log"
        fake_bin = self.root / "fake-bin"
        fake_bin.mkdir()
        fake_git = fake_bin / "git"
        write(
            fake_git,
            "#!/bin/sh\n"
            "if [ \"$1\" = fetch ]; then\n"
            "  for argument in \"$@\"; do\n"
            "    if [ \"$argument\" = "
            "\"https://github.com/twentyhq/twenty.git\" ]; then\n"
            f"      echo fetched >> {self.fetch_log}\n"
            "      exit 0\n"
            "    fi\n"
            "  done\n"
            "fi\n"
            f"exec {real_git} \"$@\"\n",
        )
        fake_git.chmod(0o755)
        self.classifier_environment = os.environ.copy()
        self.classifier_environment["PATH"] = (
            f"{fake_bin}:{self.classifier_environment['PATH']}"
        )

    def tearDown(self) -> None:
        self.temp_directory.cleanup()

    def registry_entry(self, manifest_hash: str | None = None) -> dict[str, object]:
        content_manifest = f"{FRONT_PATH.as_posix()}\t{self.upstream_blob}\n"
        return {
            "contentManifestSha256": manifest_hash
            or hashlib.sha256(content_manifest.encode()).hexdigest(),
            "id": "example-backport",
            "paths": [FRONT_PATH.as_posix()],
            "receipt": RECEIPT_PATH.as_posix(),
            "upstreamCommit": self.upstream_commit,
            "upstreamRepository": "https://github.com/twentyhq/twenty.git",
        }

    def classify(
        self,
        head: str,
        *,
        force_deep: bool = False,
    ) -> dict[str, object]:
        command = [
            "python3",
            str(CLASSIFIER),
            "--repository-root",
            str(self.repository),
            "--head",
            head,
        ]
        if force_deep:
            command.append("--force-deep")
        else:
            command.extend(["--base", self.base])
        command.append("--fetch-missing")
        output = run(
            command,
            self.repository,
            environment=self.classifier_environment,
        )
        return json.loads(output)

    def add_registered_backport(self, *, manifest_hash: str | None = None) -> str:
        write(self.repository / FRONT_PATH, "export const value = 'upstream';\n")
        write(self.repository / RECEIPT_PATH, "# Example backport\n")
        write(
            self.repository / REGISTRY_PATH,
            json.dumps(
                {
                    "format": 1,
                    "backports": [self.registry_entry(manifest_hash)],
                },
                indent=2,
            )
            + "\n",
        )
        return commit(self.repository, "registered backport")

    def test_documentation_only_change_skips_frontend(self) -> None:
        write(self.repository / "README.md", "updated fixture\n")
        head = commit(self.repository, "docs")
        result = self.classify(head)
        self.assertFalse(result["run_front"])
        self.assertFalse(result["deep_required"])

    def test_ordinary_frontend_change_requires_deep_ci(self) -> None:
        write(self.repository / FRONT_PATH, "export const value = 'ordinary';\n")
        head = commit(self.repository, "ordinary frontend")
        result = self.classify(head)
        self.assertTrue(result["run_front"])
        self.assertTrue(result["deep_required"])
        self.assertFalse(result["verified_backport"])

    def test_ci_control_change_requires_deep_ci(self) -> None:
        write(
            self.repository / ".github/workflows/ci-front.yaml",
            "name: changed\n",
        )
        head = commit(self.repository, "CI control")
        result = self.classify(head)
        self.assertTrue(result["run_front"])
        self.assertTrue(result["deep_required"])

    def test_exact_registered_backport_uses_fast_gate(self) -> None:
        head = self.add_registered_backport()
        result = self.classify(head)
        self.assertTrue(result["run_front"])
        self.assertFalse(result["deep_required"])
        self.assertTrue(result["verified_backport"])
        self.assertEqual(result["backport_id"], "example-backport")
        self.assertEqual(self.fetch_log.read_text(encoding="utf-8"), "fetched\n")

    def test_extra_frontend_path_forces_deep_ci(self) -> None:
        self.add_registered_backport()
        write(
            self.repository / "packages/twenty-front/src/extra.ts",
            "export const extra = true;\n",
        )
        head = commit(self.repository, "extra source")
        result = self.classify(head)
        self.assertTrue(result["deep_required"])
        self.assertFalse(result["verified_backport"])

    def test_blob_mismatch_forces_deep_ci(self) -> None:
        self.add_registered_backport()
        write(self.repository / FRONT_PATH, "export const value = 'tampered';\n")
        head = commit(self.repository, "tamper")
        result = self.classify(head)
        self.assertTrue(result["deep_required"])
        self.assertIn("does not match official upstream blob", result["reason"])

    def test_unchanged_receipt_forces_deep_ci(self) -> None:
        write(self.repository / RECEIPT_PATH, "# Existing receipt\n")
        self.base = commit(self.repository, "existing receipt")
        write(self.repository / FRONT_PATH, "export const value = 'upstream';\n")
        write(
            self.repository / REGISTRY_PATH,
            json.dumps(
                {"format": 1, "backports": [self.registry_entry()]}, indent=2
            )
            + "\n",
        )
        head = commit(self.repository, "backport without receipt change")
        result = self.classify(head)
        self.assertTrue(result["deep_required"])
        self.assertIn("exceeds registered backport scope", result["reason"])

    def test_manifest_hash_mismatch_forces_deep_ci(self) -> None:
        head = self.add_registered_backport(manifest_hash="0" * 64)
        result = self.classify(head)
        self.assertTrue(result["deep_required"])
        self.assertIn("manifest hash mismatch", result["reason"])

    def test_nonofficial_upstream_repository_forces_deep_ci(self) -> None:
        self.add_registered_backport()
        registry = json.loads((self.repository / REGISTRY_PATH).read_text())
        registry["backports"][0]["upstreamRepository"] = (
            "https://example.invalid/twenty.git"
        )
        write(
            self.repository / REGISTRY_PATH,
            json.dumps(registry, indent=2) + "\n",
        )
        head = commit(self.repository, "untrusted upstream")
        result = self.classify(head)
        self.assertTrue(result["deep_required"])
        self.assertIn("must use https://github.com/twentyhq/twenty.git", result["reason"])

    def test_force_deep_for_main_and_merge_queue(self) -> None:
        result = self.classify(self.base, force_deep=True)
        self.assertTrue(result["run_front"])
        self.assertTrue(result["deep_required"])
        self.assertFalse(result["verified_backport"])


if __name__ == "__main__":
    unittest.main()

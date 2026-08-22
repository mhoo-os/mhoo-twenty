# Twenty v2.30.1 source and candidate provenance

## Scope

This gate canonicalizes the frozen Twenty `v2.30.1` migration target and builds a disposable candidate. It does not customize Twenty, deploy an image, connect to a production database, run production migrations, change secrets, rotate credentials, begin a rehearsal, or upgrade beyond `v2.30.1`.

The release separation remains:

- `v2.30.0`: baseline evidence
- `v2.30.1`: migration target
- `v2.30.2+`: future upgrade, outside this gate

## Source trust

| Identity | Value |
| --- | --- |
| Upstream repository | `https://github.com/twentyhq/twenty.git` |
| Upstream ref | `refs/tags/twenty/v2.30.1` |
| Upstream commit | `064bdd795a0bd78c65f024350cefed2c8f38a661` |
| Upstream tree | `7ebc5efa7f5f1bfdf9d238a88e3455decaa4f313` |
| Mhoo exact-source commit | `5271f821d2adf6aa31c74b93d8166becc426fe0a` |
| Mhoo exact-source tree | `7ebc5efa7f5f1bfdf9d238a88e3455decaa4f313` |
| Baseline commit | `531361c9a73b5eda6223fc8deae7d5b3fe144fec` |

The upstream tag is a lightweight tag and the target commit is unsigned. The source-trust claim is therefore limited to the upstream GitHub repository ref plus the recorded Git commit and tree hashes. The Mhoo exact-source commit has a different commit hash because it preserves the existing fork history, but it has the exact upstream tree.

There is no upstream GitHub Release object or `sdk/v2.30.1` tag. The official `twentycrm/twenty:v2.30.1` OCI index does exist at `sha256:36049a73f0d2e25c059007ccb452cf183b02fd57cb107afee7d959879639fa97`; its Linux AMD64 manifest is `sha256:b4d2db8412f03820f74eae7c0c751d24a41ae2a2d22dc10c77b59727952d9c2f`. These facts are recorded as release-alignment evidence, not used as a substitute for building from source.

## Controlled overlay

The candidate source revision may differ from the upstream tree only at:

- `.twenty-source`
- `.github/workflows/twenty-v2.30.1-provenance.yml`
- `docs/provenance/`
- `scripts/provenance/`

The verification gate fails on any other difference, including a Twenty core modification.

Build inputs pinned by `.twenty-source` include the Dockerfile, Docker ignore file, Yarn lockfile, root package metadata, Yarn configuration, source and image Node versions, base image digest, target, platform, entrypoint, and disposable validation service image digests. The upstream Dockerfile resolves bounded Alpine packages from the repositories embedded in its pinned base image; those package repositories are not snapshot URLs, so the build is provenance-reproducible but is not claimed to be bit-for-bit reproducible indefinitely.

## Candidate

Candidate result: pending.

The completed report records the candidate source revision, build ID, OCI image/manifest digest, BuildKit metadata, provenance/SBOM presence, OCI labels, disposable database migration counts, server and worker startup, `/healthz`, `/client-config`, frontend shell, and seeded authenticated login.

## Local commands

```bash
scripts/provenance/verify-source.sh

SOURCE_REVISION="$(git rev-parse HEAD)" \
BUILD_ID=mhoo-twenty-v2.30.1-candidate.1 \
scripts/provenance/build-candidate.sh

SOURCE_REVISION="$(git rev-parse HEAD)" \
BUILD_ID=mhoo-twenty-v2.30.1-candidate.1 \
IMAGE_NAME=mhoo-os/mhoo-twenty:mhoo-twenty-v2.30.1-candidate.1 \
scripts/provenance/validate-candidate.sh
```

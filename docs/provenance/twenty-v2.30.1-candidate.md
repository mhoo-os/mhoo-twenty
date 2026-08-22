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
- `.github/workflows/publish-twenty-v2.30.1-candidate.yml`
- `.github/workflows/sign-twenty-v2.30.1-candidate-4.yml`
- `.github/workflows/stage-twenty-v2.30.1-candidate-4-rehearsal.yml`
- `.github/workflows/twenty-v2.30.1-provenance.yml`
- `docs/provenance/`
- `scripts/provenance/`

The verification gate fails on any other difference, including a Twenty core modification.

Build inputs pinned by `.twenty-source` include the Dockerfile, Docker ignore file, Yarn lockfile, root package metadata, Yarn configuration, source and image Node versions, base image digest, target, platform, entrypoint, and disposable validation service image digests. The upstream Dockerfile resolves bounded Alpine packages from the repositories embedded in its pinned base image; those package repositories are not snapshot URLs, so the build is provenance-reproducible but is not claimed to be bit-for-bit reproducible indefinitely.

## Candidate

Candidate result: **PASS**.

| Identity | Value |
| --- | --- |
| Candidate tag | `mhoo/candidate/v2.30.1-1` |
| Candidate tag object | `6f00cf5e832c5546cd6f1e8cb3ab584ced7fdac9` |
| Candidate source/control revision | `4c87f8447a828c02f3ed3ed995c6f6c550001435` |
| Build ID | `mhoo-twenty-v2.30.1-candidate.1` |
| Image name used for validation | `mhoo-os/mhoo-twenty:mhoo-twenty-v2.30.1-candidate.1` |
| Platform | `linux/amd64` |
| OCI image manifest digest | `sha256:e5f8d17e18cc8d4f366330e2c708976fcb4e7b42918ff4acf9a0abba7e94e9c3` |
| OCI image config digest | `sha256:93dd3b613c5373597785ba477dbcbadafea043553c253f7941d4ae70f218c7cf` |
| Authoritative workflow | [run 32591069988](https://github.com/mhoo-os/mhoo-twenty/actions/runs/32591069988) |
| Build and validation job | [job 97075050018](https://github.com/mhoo-os/mhoo-twenty/actions/runs/32591069988/job/97075050018) |

BuildKit built directly from `https://github.com/mhoo-os/mhoo-twenty.git#4c87f8447a828c02f3ed3ed995c6f6c550001435` and recorded the manifest digest in its metadata. The digest commits to the image config and therefore to the verified OCI labels:

| OCI label | Verified value |
| --- | --- |
| `org.opencontainers.image.source` | `https://github.com/mhoo-os/mhoo-twenty` |
| `org.opencontainers.image.revision` | `4c87f8447a828c02f3ed3ed995c6f6c550001435` |
| `org.opencontainers.image.version` | `v2.30.1` |
| `org.opencontainers.image.ref.name` | `mhoo-twenty-v2.30.1-candidate.1` |
| `io.mhoo.build.id` | `mhoo-twenty-v2.30.1-candidate.1` |
| `io.mhoo.twenty.upstream.revision` | `064bdd795a0bd78c65f024350cefed2c8f38a661` |
| `io.mhoo.twenty.upstream.tree` | `7ebc5efa7f5f1bfdf9d238a88e3455decaa4f313` |
| `io.mhoo.twenty.exact-source.revision` | `5271f821d2adf6aa31c74b93d8166becc426fe0a` |

The CI validation build used BuildKit's Docker-load output so the exact image could be started on the disposable runner. That output mode does not preserve separate provenance or SBOM attestations, and none are claimed here. The cryptographic custody chain for this non-published candidate is the recorded upstream commit/tree, exact-source tree equality, pinned build-input hashes, immutable Mhoo candidate tag, BuildKit manifest/config digests, digest-bound OCI labels, and the successful workflow receipt. The image was not pushed to a registry, signed, deployed, or made operationally authoritative.

## Disposable validation

The authoritative job printed `candidate validation passed` after all of the following checks succeeded:

| Check | Result |
| --- | --- |
| Exact source trust and controlled-overlay boundary | Passed |
| OCI source, revision, version, build, upstream commit, and upstream tree labels | Passed |
| Core tables after disposable initialization | `71` |
| TypeORM migrations | `182` |
| Completed upgrade migrations on a fresh database | `138` |
| Server startup and `/healthz` | Passed |
| `/client-config` version and environment authority | Passed |
| Frozen frontend shell | Passed |
| Worker startup and seeded queue processing | Passed |
| Seeded authenticated login and token issuance | Passed |

PostgreSQL, Redis, server, and worker ran only in the GitHub-hosted disposable job and were destroyed by its cleanup trap. No production deployment, production database access or migration, secret change, credential rotation, rehearsal, or version upgrade occurred.

Two earlier builds produced manifests but ended in validation-harness false negatives and are explicitly not candidates: `sha256:7eeabc9c38dffdb78b5caa0cf043e62c3492ca930d037f5a6ec5e93bd7c8e428` and `sha256:fd000b0cc028030c1c51bf7a0aebf660c187fca54a85b29fcb5c617e74203b16`. Only the digest recorded in the candidate table above is approved for the next gate.

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

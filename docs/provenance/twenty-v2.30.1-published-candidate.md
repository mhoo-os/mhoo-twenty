# Twenty v2.30.1 published candidate custody

## Status

Candidate `mhoo/candidate/v2.30.1-4` is the promotion gate for a durable,
digest-addressed migration-rehearsal image. Until the tag-triggered workflow
and sign-only continuation finish and this record is updated with its verified
signature identity, signed artifact custody remains **PENDING**.

The disposable candidate-1 digest is evidence from its CI run only. It is not
available in a registry and must not be rebuilt or represented as the same
artifact.

Candidate `mhoo/candidate/v2.30.1-2` is retired. Its authoritative workflow
[run 32593506611](https://github.com/mhoo-os/mhoo-twenty/actions/runs/32593506611)
passed exact-source and controlled-overlay verification, then failed before
BuildKit started because the qualified registry tag was not passed to the
build script. It produced no image, registry package, digest, signature, or
custody claim. Its annotated tag remains unchanged as the failure receipt and
must not be moved or reused.

Candidate `mhoo/candidate/v2.30.1-3` is also retired. Its authoritative
workflow [run 32593818803](https://github.com/mhoo-os/mhoo-twenty/actions/runs/32593818803)
passed tag identity, canonical-main, exact-source, controlled-overlay, GHCR
authentication, and no-replacement checks. Its one build then hit the upstream
Twenty frontend dependency race between `twenty-sdk:build` and
`twenty-sdk:build:sdk`, failing with `ENOTEMPTY` before image export. The
parallel PR validation of the same source passed in
[run 32593704603](https://github.com/mhoo-os/mhoo-twenty/actions/runs/32593704603),
confirming nondeterministic build behavior. Candidate 3 produced no registry
package, digest, validation, signature, or custody claim. Its annotated tag
remains unchanged and must not be moved or reused.

Candidate 4 publication [run 32594715632](https://github.com/mhoo-os/mhoo-twenty/actions/runs/32594715632)
built once, pushed the image, pulled it by its exact registry digest, and passed
the disposable runtime validation. It then failed while the Cosign installer
requested a detached signature that is not published for Cosign `v3.1.3`.
No image rebuild is permitted or needed. The digest-fixed sign-only continuation
uses the installer's verified Cosign `v2.6.1` path, revalidates the existing
digest, and signs only that object.

## Promotion boundary

The publication workflow is triggered only by the annotated Git tag
`mhoo/candidate/v2.30.1-4`. The tag must point to the current canonical `main`
revision. The workflow then:

1. verifies the exact upstream tree and controlled provenance overlay;
2. builds once from the tagged full source revision;
3. pushes `ghcr.io/mhoo-os/mhoo-twenty:v2.30.1-4` without an SBOM or
   provenance attestation;
4. records the registry manifest digest;
5. pulls and validates that exact digest in a disposable server, worker,
   PostgreSQL, and Redis environment;
6. stops without a signature because its Cosign installer failed.

The digest-fixed sign-only continuation verifies the immutable candidate tag
and registry-tag digest, pulls and revalidates the exact published digest,
signs it with GitHub Actions OIDC, verifies the signature against the exact
workflow identity, and preserves the completed custody receipt. It contains no
build step.

The workflow refuses to run from a branch or lightweight tag and refuses to
replace an existing registry tag. A rerun therefore cannot silently rebuild or
move the named promotion candidate.

## Frozen rehearsal input

Published and validated; signature pending:

```text
ghcr.io/mhoo-os/mhoo-twenty@sha256:c0f7f17aadec0ba66e6fbd94e4733ec33116ba64c5c4c23b1a666e48867cd2f5
```

Only the digest-bound reference may become a rehearsal input. The mutable
registry tag is an operator convenience and is not evidence of artifact
identity.

## Required evidence

| Evidence | State |
| --- | --- |
| Exact upstream source tree | Verified by the promotion workflow |
| Controlled provenance overlay | Verified by the promotion workflow |
| OCI labels | Verified against the published digest |
| Disposable candidate validation | Passed in run `32594715632` |
| GHCR digest | `sha256:c0f7f17aadec0ba66e6fbd94e4733ec33116ba64c5c4c23b1a666e48867cd2f5` |
| Exact-digest disposable validation | Passed in run `32594715632` |
| Keyless signature | Pending |
| Exact-identity signature verification | Pending |
| Digest frozen for rehearsal | Pending |

## Non-scope

This gate does not deploy the candidate, access or restore production data,
run a migration rehearsal, change infrastructure, rotate credentials, publish
an SBOM or SLSA/in-toto attestation, enforce a vulnerability policy, or approve
production cutover.

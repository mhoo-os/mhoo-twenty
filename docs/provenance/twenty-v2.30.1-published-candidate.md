# Twenty v2.30.1 published candidate custody

## Status

Candidate `mhoo/candidate/v2.30.1-4` is the promotion gate for a durable,
digest-addressed migration-rehearsal image. Until the tag-triggered workflow
finishes and this record is updated with its exact registry digest and verified
signature identity, durable candidate artifact and signed artifact custody
remain **PENDING**.

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
6. signs the validated digest with GitHub Actions OIDC;
7. verifies the keyless signature against the exact workflow identity; and
8. preserves a custody receipt containing the build metadata, validation
   report, signature verification, and digest-only image reference.

The workflow refuses to run from a branch or lightweight tag and refuses to
replace an existing registry tag. A rerun therefore cannot silently rebuild or
move the named promotion candidate.

## Frozen rehearsal input

Pending publication. The authoritative form will be:

```text
ghcr.io/mhoo-os/mhoo-twenty@sha256:<registry-manifest-digest>
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
| Disposable candidate validation | Required before signing |
| GHCR digest | Pending |
| Keyless signature | Pending |
| Exact-identity signature verification | Pending |
| Digest frozen for rehearsal | Pending |

## Non-scope

This gate does not deploy the candidate, access or restore production data,
run a migration rehearsal, change infrastructure, rotate credentials, publish
an SBOM or SLSA/in-toto attestation, enforce a vulnerability policy, or approve
production cutover.

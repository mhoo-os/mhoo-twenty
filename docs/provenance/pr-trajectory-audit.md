# PR trajectory-audit custody

## Source and transformation

The user supplied the audit bundle from the local Mhoo coordination workspace at
`/Users/mhoooo/projects/mhoo-os/mhoo/.agents/skills/pr-trajectory-audit` on
2026-08-31. It was not committed in that workspace at the time of import, so
this receipt binds the exact supplied files by SHA-256 rather than claiming an
upstream Git revision.

The copied bundle is Mhoo-owned process tooling, not Twenty application source.
Its repository-specific `references/failure-patterns.md` was regenerated from
this repository's own AI layer and PR history. The live workflow keeps the
supplied behavior but pins every third-party action to the commit identities
already used by Mhoo CI.

## Supplied file hashes

| Path | SHA-256 |
| --- | --- |
| `SKILL.md` | `1ee82dcfe7698259c1139fd7e541ebe1719fe9bbb50cffe978787d86e6d5ed72` |
| `agents/openai.yaml` | `81f92fe76131159bd86e433b0c7b55aceb5c2874ae13e933e1ac3ab66f6f8dcc` |
| `assets/report-template.md` | `a7faa77ffc9cbab58ed06f14f69d6f523cee15b50c76a5ba3d815eca185da571` |
| `assets/trajectory-review.yml` | `13abb10ed3f2a8c2d2152e4c04c51c0fa9b4e3650d44122aac7020f8194d06cf` |
| `references/failure-patterns.md` | `150de2044eca949287a2f31238ff38e760371b8562e2d0ced58898b7ef93eb5b` |
| `references/judging-rubric.md` | `96d1090f8b1cb8ac856dec25e8b0d51f601f247307e927997ea37eb6871bdd49` |
| `references/mining-methodology.md` | `afb3947941dd91f0afa0316c39255558e6ac9a2fcc68cae644459afaa82b85e6` |
| `scripts/mine_prs.py` | `29649557e148db3df76ad9ed243a860314929a7cb15d401cd14a3ea0fcc7c0b1` |

## Authority boundary

This receipt allows only the enumerated audit-tooling overlay paths. It does not
authorize a source pin change, artifact publication, deployment, runtime
configuration mutation, credential action, cutover, or publication of any
unapproved legal surface.

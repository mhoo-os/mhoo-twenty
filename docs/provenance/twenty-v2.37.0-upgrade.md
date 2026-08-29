# Twenty v2.37.0 governed-source upgrade

- Status: source implementation candidate; not published, deployed, or promoted
- Upgrade date: 2026-08-29
- Previous governed source: `twenty/v2.30.1`
- Target governed source: `twenty/v2.37.0`

## Source custody

| Identity | Value |
| --- | --- |
| Upstream repository | `https://github.com/twentyhq/twenty.git` |
| Twenty ref | `refs/tags/twenty/v2.37.0` |
| SDK ref | `refs/tags/sdk/v2.37.0` |
| Upstream commit | `6da524b8903ec16a3eeea4b2e4a5fb63dbfc1c58` |
| Upstream tree | `3ce4ef3eac3604ee52b6b8ee0f1a4766d7f533ca` |
| Mhoo exact-source commit | `6d0e9d0a14cf0ae68db3c7ae92b56798f1628050` |
| GitHub release | `twenty/v2.37.0`, published 2026-08-28 |
| Official image index | `twentycrm/twenty@sha256:63cafcc69ca18a7f402adbb519a0c7322ec5838866056f2c94d6ee38a06206a0` |
| Official Linux AMD64 manifest | `sha256:247b98a5f1903dba8043faec44850b6a93a5d475c8e6cc3e4117d29a2c471af7` |
| App-dev image index | `twentycrm/twenty-app-dev@sha256:53381e68f6fa50808f624f4c0125ce2143c6d21321ba25886e1115c73367c6e6` |
| App-dev Linux AMD64 manifest | `sha256:12e5e0d724e0cd40e4753e676b2fa21c407e54cdae332d67c3dc97c5b100a2c6` |

Both release refs are lightweight tags at the same unsigned Git commit. The
source-trust statement is therefore limited to the two current refs in the
official GitHub repository, the recorded commit/tree, and the bounded Mhoo
exact-source commit. The official image identities are release-alignment
evidence; they do not replace a Mhoo source build or authorize publication.
The app-dev identity is used only by disposable CI compatibility checks and is
not a Mhoo runtime candidate.

The Mhoo exact-source commit has the current Mhoo `main` as its parent but the
exact upstream v2.37.0 tree. This preserves Mhoo history without claiming that
the two repositories share the same commit identity.

## Release relationship

GitHub's compare API reports v2.37.0 as 637 commits ahead and two commits behind
the v2.30.1 tag, with `twenty/v2.30.0` commit
`531361c9a73b5eda6223fc8deae7d5b3fe144fec` as the merge base. This upgrade is
therefore an exact-tree import plus an explicit Mhoo overlay reconciliation,
not a linear fast-forward or a replay of every old commit.

## Complete old-delta disposition

[`twenty-v2.37.0-delta-disposition.tsv`](twenty-v2.37.0-delta-disposition.tsv)
classifies all 122 paths that differed between the previous governed upstream
commit and Mhoo `main` before this upgrade.

| Disposition | Count | Result |
| --- | ---: | --- |
| `KEEP` | 12 | Mhoo governance, historical evidence, and the generic fail-closed OCI publisher remain Mhoo-owned. |
| `DROP — UPSTREAM NOW PROVIDES IT` | 0 | No existing Mhoo fork patch was proved byte-for-byte or semantically redundant in v2.37. |
| `MOVE INTO TWENTY APP` | 0 | The old governed delta contained no Mhoo product App implementation to move. New product work must use Apps first. |
| `REIMPLEMENT AGAINST v2.37` | 102 | Stable-host authority, global brand seams, generated metadata, source custody, and CI safety are adapted to the current source shape. |
| `REMOVE` | 8 | Active Candidate 4/6 and v2.30.1 publication/build validation entrypoints are retired; immutable tags, workflow receipts, and historical documents are unchanged. |
| `UNDECIDED` | 0 | No old delta is left unclassified. |

The removed workflows and candidate entrypoints must not be reused to build,
retag, or retry a frozen v2.30.1 candidate. A future v2.37 publication requires
its own authorized candidate design and new immutable identity.

## Fork delta retained

v2.37.0 still does not provide Mhoo's accepted stable-host mode. The relevant
upstream files remain either byte-identical to v2.30.1 or lack an equivalent
contract. The upgrade therefore retains and revalidates the bounded seams that:

- expose an explicit `IS_MHOO_FOUNDATION_ENABLED` client/server mode;
- keep `app.mhoo.app` stable instead of deriving a Workspace from `Host`,
  origin, subdomain, or custom domain;
- require authenticated Twenty token and membership context for Workspace
  selection;
- reject Workspace hostname mutation and skip Mhoo-managed DNS lifecycle;
- preserve invitation, verification, 2FA, OAuth-propagator, and provider-auth
  authority checks;
- keep the narrow global Mhoo customer-brand fallback; and
- retain Mhoo-owned CI boundaries around TwentyHQ credentials, dispatch,
  Crowdin, previews, privileged automation, and deployment.

Generated client metadata is regenerated from v2.37 after adding the retained
client-config field. It is not copied from the v2.30.1 generated output.

## Native v2.37 adoption

The governed tree now includes Twenty SDK/App v2.37.0 primitives for Apps,
objects, fields, relations, indexes, roles, permissions, views, layouts,
front components, logic functions, jobs, connection providers, skills/tools,
files, generated APIs, and the Workspace-authenticated MCP transport. This
upgrade introduces no parallel Mhoo auth, CRUD/API framework, OAuth platform,
MCP server, queue, file service, or generic admin framework.

Using Twenty Connections as Mhoo's default simple OAuth authority, changing the
canonical MCP transport, or moving Core state ownership into a Twenty App are
cross-system changes proposed by ADR-0007. They are not silently implemented by
this source upgrade while ADR-0001 through ADR-0006 remain accepted.

## Validation boundary

The source-custody workflow verifies both upstream release refs, exact commit
and tree identities, pinned build inputs, the bounded README overlay, the
exhaustive controlled path overlay, and hostile mutation regressions. Focused
frontend/server tests cover the stable-host and authority seams against v2.37.
Full candidate build, publication, deployment, migration, recovery, and
production/cutover remain separate gates.

## Baseline-import CI reconciliation

The exact-tree import necessarily differs from v2.30.1 across public APIs and
historical upstream upgrade-command directories. Those differences remain
visible to the normal breaking-change report and migration guard; they are not
made invisible or treated as ordinary patch behavior.

- `ci:allow-v2.37-baseline-api-breaks` is accepted only when the base is
  v2.30.1 and the checked source identities match the exact v2.37.0 import.
- `ci:allow-previous-version-upgrade-mutation` is the inherited explicit
  review mechanism for the upstream historical upgrade-command import.
- app compatibility jobs use the digest-pinned v2.37.0 app-dev image. The
  previous v2.30.1 candidate image is no longer an active v2.37 CI runtime.
- whitespace validation compares the controlled overlay to the verified
  exact-source commit, so untouched upstream generated whitespace is not
  misclassified as a Mhoo patch defect.

These exceptions authorize review of this source candidate only. They do not
authorize merge, publication, deployment, migration, or cutover.

## Explicit non-actions

- No existing candidate tag, digest, signature, or receipt is changed.
- No image is built, published, signed, or promoted by this source change.
- No provider credential, OAuth grant, customer data, database, DNS, runtime,
  deployment, traffic, or production system is touched.
- Candidate/Gate/Phase work is not rerun.

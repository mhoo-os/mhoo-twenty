# @mhoo/finance

`@mhoo/finance` is the native Twenty 2.37 App boundary for read-only finance
provider facts. The current source slice includes the Clover Connection
Provider boundary plus a synthetic fixture-first ingestion-to-insight path:
immutable source artifacts, import receipts, revision-aware normalized facts,
coverage periods, deterministic reconciliation exceptions, native views, and
a native standalone dashboard preview.

ARCHITECTURE IMPACT: CROSS-SYSTEM

## Current truth

- Source owner: `mhoo-os/mhoo-twenty`
- Exact base: `da3a0b6c06f8db0862a19cc9f0b990bbff703fbe`
- Package: `@mhoo/finance`
- Twenty engine: exact `2.37.0`
- SDK and client SDK: exact `2.37.0`
- Provider calls: absent
- Custom App `/mcp`: absent
- Deployment, installation, credentials, customer data, and cutover: not
  authorized and not performed

## Fixture-first vertical slice

Generate or reset the deterministic synthetic dataset from this package:

```text
yarn fixtures:generate
```

The generated `fixtures/mhoo-finance-fixture-pack.json` contains no provider,
customer, credential, or personal-account data. It covers January–March bank,
card, Toast, and Clover periods, a Toast/Clover overlap, duplicate file and
row suppression, pending-to-posted and corrected revisions, refunds, voids,
discounts, internal transfers, a missing period, a legitimate zero-activity
period, a stale source, a resolved control total, and open reconciliation
exceptions.

The `finance-audit-dashboard` front component is an inspectable local preview
with populated, loading, empty, partial, stale, failed, and denied states. It
uses the same deterministic fixture pipeline as the generated pack and ends a
source trace at an exact synthetic artifact row. The native rollup tab uses
Twenty page-layout graphs over the App-owned objects; no dashboard-only
service or AI-generated arithmetic is introduced.

Focused proof:

```text
yarn test:unit
yarn lint
yarn typecheck
```

The common fixture-generation plus focused-test loop remains local and
provider-free. A live Workspace fixture load, screenshot receipt, and runtime
permission proof remain separate Twenty installation/runtime gates.

The native tool is discovered as `app_clover_connection_status` through
Twenty's built-in tool registry. It takes no caller-supplied Workspace,
merchant, or Connection selector and never returns an access token.

## Clover permission boundary

The Clover application registration must request only:

- Read customers
- Read employees
- Read inventory
- Read merchant
- Read orders
- Read payments

Write customers, employees, inventory, merchant, orders, and payments are
forbidden. Online payments is also forbidden. These permissions are configured
at Clover rather than represented as OAuth scope strings, so the Connection
Provider intentionally declares an empty OAuth `scopes` list.

## Proof status

Source validation can run without credentials:

```text
yarn install --immutable
yarn lint
yarn typecheck
yarn test:unit
yarn twenty dev:typecheck
yarn twenty dev:build
```

Runtime Connection, merchant, and role-filtered tool proof is blocked by exact
Twenty 2.37 compatibility gaps documented in `COMPATIBILITY.md`. Do not install
or connect this App to Clover until those blockers have separately reviewed
resolutions.

# @mhoo/finance

`@mhoo/finance` is the native Twenty 2.37 App boundary for read-only finance
provider facts. This first source slice scaffolds the App, declares the Clover
Connection Provider, freezes the reviewed read/effect permission boundary, and
exposes one native Connection status tool.

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

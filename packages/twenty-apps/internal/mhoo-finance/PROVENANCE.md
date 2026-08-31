# Mhoo Finance provenance

ARCHITECTURE IMPACT: CROSS-SYSTEM

## Destination custody

- Destination: `mhoo-os/mhoo-twenty`
- Destination path: `packages/twenty-apps/internal/mhoo-finance`
- Package: `@mhoo/finance`
- Destination base commit: `da3a0b6c06f8db0862a19cc9f0b990bbff703fbe`
- Twenty version: `v2.37.0`
- `twenty-sdk`: `2.37.0`
- `twenty-client-sdk`: `2.37.0`
- Extraction date: `2026-08-31`

## Legacy source

- Repository: `https://github.com/mhooooo/mhoo.git`
- Commit: `0515e92c6c76d43d52cdae003813c4759154ef20`
- Commit tree: `fe3cccd0c7459351f2401e9701973dbd7872245d`
- Reviewed paths:
  - `twenty-apps/mhoo-hass`
  - `deploy/hass-mcp-edge`

Selected legacy concepts and source files:

| Legacy file | Selected concept | Material transformation |
| --- | --- | --- |
| `twenty-apps/mhoo-hass/src/application-config.ts` | App-registration Clover client ID/secret declaration | New App identity and neutral Finance wording; no values imported |
| `twenty-apps/mhoo-hass/src/connection-providers/clover.ts` | Clover production OAuth endpoints and JSON token request | New provider identifier; exact Twenty 2.37 declaration; legacy runtime assumptions not accepted |
| `twenty-apps/mhoo-hass/src/clover/permissions.ts` | Six read permission categories and explicit effect exclusions | Preserved as reviewed constants and manifest tests |
| `twenty-apps/mhoo-hass/src/clover/tools.ts` | Credential-free `clover_who_am_i` intent | Replaced by one native `toolTriggerSettings` status function; no handwritten MCP protocol |
| `twenty-apps/mhoo-hass/src/default-role.ts` | Zero Twenty-record authority | New stable role identifier and exact v2.37 application-role declaration |
| `twenty-apps/mhoo-hass/src/logic-functions/clover-mcp-route.ts` | Evidence of the old Connection resolution assumption | The route was not copied; its email-handle-as-merchant assumption is now rejected fail closed |

## Explicit exclusions

No source, artifact, state, or data was imported from:

- `deploy/hass-mcp-edge`;
- the legacy handwritten JSON-RPC/MCP route or protocol implementation;
- the legacy KV audit ledger, bounded Clover client, or GET tool registry;
- old universal identifiers;
- Clover access or refresh tokens;
- Cloudflare secrets, OAuth grants, routes, Workers, or KV;
- Hass-specific merchant, hostname, email, consent, or Workspace assumptions;
- generated output, logs, customer records, or production state.

## License and dependencies

The legacy `mhoo-hass` package was marked `UNLICENSED`. This extraction does not
copy legacy implementation text; it records bounded concepts and rewrites them
against the exact Twenty 2.37 SDK. The destination is also private and marked
`UNLICENSED`. It adds no runtime dependency. Development dependencies come from
the exact Twenty 2.37 App scaffold, with both Twenty SDK packages pinned to
`2.37.0`.

## Verification

The immutable repository, commit, tree, and selected file identities were
verified through GitHub before extraction. Local lint, typecheck, unit, SDK
manifest build, source-integrity, and diff checks are recorded with the pull
request. Runtime Connection, merchant, install, MCP, and provider proof remain
blocked as documented in `COMPATIBILITY.md`.

The reviewed destination pull-request URL will be added in a follow-up without
rewriting this extraction commit.

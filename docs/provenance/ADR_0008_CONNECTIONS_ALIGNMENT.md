# ADR-0008 Twenty Connections alignment

- Status: source correction; deployment remains separately gated.
- Governing decision: `mhoo-os/mhoo` ADR-0008.
- Architecture impact: `LOCAL` implementation of an accepted cross-system
  boundary.

ADR-0008 amended the earlier connector-host target: Twenty Connection
Providers are now the default owner for simple App-local OAuth credentials,
refresh, revoke, and connection lifecycle. The Mhoo stable-host foundation
must therefore not disable provider flags, OAuth guards, or connected-account
webhook scheduling solely because `IS_MHOO_FOUNDATION_ENABLED=true`.

This correction preserves the foundation behavior that remains authoritative:

- Twenty authenticates the user and resolves Workspace membership.
- Stable-host mode requires multi-Workspace support and does not infer
  Workspace authority from a hostname.
- Workspace custom-domain lifecycle remains unavailable in foundation mode.
- Each Google, Microsoft, IMAP/SMTP/CalDAV, or webhook path remains governed by
  its existing Twenty feature flag, permissions, token validation, and
  Workspace-scoped connection mapping.
- One provider grant still has one credential and refresh owner. This change
  does not select Nango, import credentials, call a provider, or authorize
  deployment.

# Mhoo-Twenty Foundation Phase 3: implementation record

- Status: implementation complete; review required before deployment or cutover.
- Starting `origin/main`: `8c5d88da49f01a182e9aeeb165f0a3615740a050`.
- Branch: `codex/mhoo-twenty-foundation-phase-3`.
- Source identity preserved: Twenty `v2.30.1`, upstream commit
  `064bdd795a0bd78c65f024350cefed2c8f38a661`, upstream tree
  `7ebc5efa7f5f1bfdf9d238a88e3455decaa4f313`, Mhoo source commit
  `5271f821d2adf6aa31c74b93d8166becc426fe0a`.
- Governing inputs: root `AGENTS.md`, ADR-0005, and
  `PHASE_2_FOUNDATION_INVENTORY.md`.

## Purpose and boundaries

This is a deliberately narrow Twenty fork delta. Twenty remains the sole
authority for people, credentials, sessions, invitations, Workspace lifecycle,
membership, and active Workspace. No Core tenant schema, Core identity,
connector behavior, deployment configuration, DNS/provider action, migration,
or Twenty version change is included.

## Files changed

- Server foundation/configuration: `config-variables.ts`, `twenty-config.service.ts`,
  the two Mhoo config utilities, client-config entity/service, stable domain
  services, auth resolver/OAuth propagator/provider guards, Workspace
  service/resolver/cron, and connected-account webhook scheduling.
- Front presentation/routing: client-config state/hook/type, stable-host domain
  hooks/effect, auth/onboarding components, app providers/favicon, and the
  customer-brand helper.
- Email presentation: shared `BaseHead`, `Footer`, `Logo`, and the email brand
  helper.
- Tests: focused config, auth, domain, client-config, and brand test files.
- Provenance: this record and an explicit Phase 3 path allowlist in
  `scripts/provenance/verify-source.sh`.

| Phase 2 requirement | Phase 3 implementation | Change class |
| --- | --- | --- |
| Stable-host multi-Workspace | `IS_MHOO_FOUNDATION_ENABLED` makes the configured `FRONTEND_URL` the URL for every Workspace; verified Twenty login-token Workspace IDs select the existing Workspace record and existing membership validation remains mandatory. | Narrow fork delta |
| No Workspace DNS/custom domain lifecycle | Custom-domain mutation, validation, resolver refresh, deletion, and custom-domain cron activity reject or no-op before a DNS provider call in Mhoo mode. | Narrow fork delta |
| Customer brand seam | Client and email brand helpers drive authentication/onboarding logos, auth title/footer links, and email title/logo/footer while technical Twenty identifiers remain unchanged. | Narrow fork delta |
| Provider-authority boundary | Startup validation and outbound provider OAuth guards close Twenty-owned IMAP/SMTP/CalDAV, Gmail/Calendar, Microsoft messaging/calendar, and connected-account webhook paths in Mhoo mode. Human Google/Microsoft/SAML/OIDC authentication is not gated. | Configuration plus narrow guard |

## Configuration

`IS_MHOO_FOUNDATION_ENABLED` is a new env-only Boolean and defaults to `false`.
When true it requires `IS_MULTIWORKSPACE_ENABLED=true` and rejects startup when
any of the following Twenty business-provider switches are enabled:

- `IS_IMAP_SMTP_CALDAV_ENABLED`
- `CALENDAR_PROVIDER_GOOGLE_ENABLED`
- `MESSAGING_PROVIDER_GMAIL_ENABLED`
- `CALENDAR_PROVIDER_MICROSOFT_ENABLED`
- `MESSAGING_PROVIDER_MICROSOFT_ENABLED`
- `IS_CONNECTED_ACCOUNT_WEBHOOK_SUBSCRIPTION_ENABLED`

`TwentyConfigService` also returns `false` for those keys while the env-only
Mhoo mode is true. That runtime guard prevents a later database-backed config
override from reopening a Twenty business-provider path.

The flag is returned in client configuration only to suppress hostname-driven
front-end effects and select the customer brand. It is disabled by default, so
upstream domain behavior is retained unchanged outside Mhoo mode.

## Security and routing behavior

In Mhoo mode `WorkspaceDomainsService` intentionally returns no Workspace for
an origin: `Host`, origin, Workspace slug, custom domain, or display name never
becomes tenant authority. Workspace URLs used by invitation, reset,
verification, and post-auth redirect generation are instead the configured
stable front origin.

`AuthResolver.getAuthTokensFromLoginToken` first verifies the signed Twenty
login token. Mhoo mode fetches only that token's Workspace ID, then preserves
the existing `validateUserAccess` membership check before issuing tokens. An
untrusted origin cannot select another Workspace. Existing JWT access-token
Workspace context remains the active Workspace for normal authenticated
requests.

The OAuth propagator permits only the configured stable front origin in Mhoo
mode. It does not change SAML/OIDC issuer or callback builders, which already
derive from `SERVER_URL`; its change applies only to post-auth/error redirect
validation.

## Brand coverage and technical identity

The client helper covers the authentication logo, onboarding logo, browser
title/favicon fallback, global auth title, and legal/footer links. The email
helper covers logo, email document title and customer footer links. The helpers
default to Twenty and use Mhoo only in Mhoo mode. Package names, SDK/API
identifiers, migrations, upstream assets, licensing, source provenance, and
technical references remain Twenty.

No Mhoo visual asset is added in this foundation change; the helpers intentionally
provide the approved asset replacement seam without copying or renaming
upstream technical assets.

## Tests and validation

Focused coverage was added for Mhoo configuration validity and default-off
behavior, stable Workspace URL generation, token-derived Workspace selection
without hostname resolution, OAuth callback allow/deny behavior,
custom-domain DNS-call prevention, client-config exposure, and customer-brand
defaults/override. Existing source tests remain the pattern used.

`scripts/provenance/verify-source.sh` enumerates each Phase 3 fork-delta path
explicitly. It remains fail-closed for every other upstream source path and
continues to verify all pinned source/lockfile/build inputs unchanged.

Completed before commit:

- `yarn install --immutable` completed with peer-dependency warnings only and
  no tracked lockfile change.
- Focused server Jest coverage passed: 8 suites / 43 tests, including config,
  stable domain, Workspace-domain, auth resolver, OAuth propagator,
  custom-domain manager, and client-config tests.
- Focused front Jest coverage passed: 2 suites / 5 tests.
- `npx vite build` passed for the affected front package. Local dependency
  build outputs were generated only to enable focused tests and remain ignored.
- Changed server and front files passed type-aware `oxlint`; all changed
  TypeScript/TSX files passed `oxfmt --check`.
- `git diff --check` passed before commit.

The server typecheck was attempted with
`yarn nx run twenty-server:typecheck --skip-nx-cache --excludeTaskDependencies`.
It remains red on clean-source issues outside this delta (for example,
`twenty-sdk/front-component-renderer/build` resolution, existing exception
typing, and metadata generic constraints). A filtered repeat found no errors
in Phase 3 source paths after the Mhoo configuration utility type correction.

`scripts/provenance/verify-source.sh` is run after committing a clean tree,
because it intentionally rejects a modified worktree.

This branch did not execute deployment, Cloudflare, DNS, tunnel, provider,
credential, production-data, Core-schema, connector, or version operations.

## Known limitations and non-goals

This source seam does not configure `SERVER_URL`, `FRONTEND_URL`, SMTP, OAuth
clients, cookie sessions, or Mhoo legal pages; those are later reviewed runtime
or infrastructure work. It does not add a Core tenant mapping, a new Workspace
selector, a Mhoo App, a connector, or a Core/API/MCP surface. Phase 3 must be
reviewed and merged before any of those subsequent scoped changes begin.

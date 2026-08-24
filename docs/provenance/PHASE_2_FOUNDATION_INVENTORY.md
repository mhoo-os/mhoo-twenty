# Mhoo-Twenty Foundation Phase 2: source inventory and design

- Status: inventory/design only. No runtime, configuration, source-pin, migration, provider, or infrastructure mutation.
- Inspected source: Twenty v2.30.1, upstream commit 064bdd795a0bd78c65f024350cefed2c8f38a661, tree 7ebc5efa7f5f1bfdf9d238a88e3455decaa4f313.
- Recorded Mhoo exact-source commit: 5271f821d2adf6aa31c74b93d8166becc426fe0a.
- Governing contract: ADR-0005, accepted 2026-08-24.

## Executive conclusion

**Verdict: YES WITH SMALL FORK DELTAS.**

Twenty can remain the sole human identity, credential, session, invitation,
membership, Workspace-lifecycle, and active-Workspace authority. SERVER_URL,
FRONTEND_URL, absolute-link generation, social/OIDC callback registration, and
cookie-session mode support https://app.mhoo.app. The secure session cookie is
host-only by construction and need not be exposed to api, connect, mcp, or
internal.mhoo.app.

The material incompatibility is upstream multi-Workspace routing. With
IS_MULTIWORKSPACE_ENABLED=true, Twenty v2.30.1 identifies a Workspace from
the browser origin and constructs {subdomain}.{FRONTEND_URL hostname} or a
Workspace custom domain. With it false, the resolver deliberately selects one
default Workspace. Configuration alone therefore cannot retain multiple ordinary
Workspaces on app.mhoo.app. A bounded Mhoo fork mode must make selection
explicit and server-validated, never host-derived, and emit one canonical app
origin. It must retain upstream domain capability rather than delete it.

No checked-in source indicates a need for Core users, Core passwords, Core
browser sessions, Core Workspace membership, wildcard tenants, or
Workspace-driven Cloudflare/DNS/Tunnel operations.

Primary classification count across the 32 boundary findings below: **A 6, B 4,
C 15, D 1, E 2, F 4**. Each row has one primary class.

## Boundary matrix

| Requirement | Actual Twenty source path | Current mechanism | Class | Mhoo approach | Risk |
| --- | --- | --- | --- | --- | --- |
| Canonical UI/API base URL | packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts; utils/generate-front-config.ts | SERVER_URL, optional FRONTEND_URL, then baked REACT_APP_SERVER_BASE_URL | A | Set both human-app values to https://app.mhoo.app; do not use auto-base mode | Low |
| Generated base links | domain/domain-server-config/services/domain-server-config.service.ts | getBaseUrl prepends DEFAULT_SUBDOMAIN in multi-workspace mode | C | Stable-host mode must not prepend a Workspace subdomain | High |
| Password login | auth/auth.resolver.ts; auth/services/auth.service.ts | Validates Twenty credential; returns available Workspaces/token pair | F | Preserve semantics | Low |
| Sign-up/Workspace creation | auth/auth.resolver.ts; auth/services/sign-in-up.service.ts | Creates Twenty User, Workspace, membership and onboarding; creates a subdomain | C | Keep authority; remove hostname-oriented Mhoo UX | High |
| Workspace selection/switching | user-workspace; twenty-front MultiWorkspaceDropdown; domain-manager useRedirectToWorkspaceDomain | Returns workspaceUrls, then browser redirects to them | C | Use explicit authenticated active-Workspace selection at one host | High |
| Membership enforcement | auth/auth.resolver.ts; auth/middlewares/workspace-auth-context.middleware.ts; user-workspace | Login token and guards validate membership | F | Preserve; ID is a selector, never a grant | High |
| Active Workspace | auth/token; auth/middlewares/workspace-auth-context.middleware.ts | Server workspace-scoped auth context | C | Stable-host mode uses existing authenticated context, not Host/URL/Core selector | High |
| Cookie sessions | user-session/services/user-session-cookie.service.ts | Optional cookie sessions; HTTPS cookie is __Host-twenty-session | A | Enable only in a focused later PR | Medium |
| Credentialed CORS/CSRF | user-session/utils/resolve-allowed-credentialed-origins.util.ts; middlewares/cookie-session-csrf.middleware.ts | Allows server/front/explicit origins; unsafe cookie requests require allowed Origin | A | Keep only app host by default | Medium |
| Google/Microsoft sign-in callbacks | auth/strategies/google.auth.strategy.ts; microsoft.auth.strategy.ts | Explicit AUTH callback URL configuration | A | Later register app-host callbacks | Medium |
| OIDC/SAML callbacks | auth/controllers/sso-auth.controller.ts; sso/services/sso.service.ts | Builds callback and redirect URLs from Workspace domain | C | Stable-host URL builder applies | Medium |
| OAuth propagator | auth/controllers/oauth-propagator.controller.ts | Validates decoded redirect against resolved Twenty domain | C | Permit fixed canonical origin/trusted state, not Workspace hosts | Medium |
| Provider account OAuth | auth/controllers/google-apis-auth.controller.ts; microsoft-apis-auth.controller.ts | Account integration callbacks are config values | E | Future connector ingress at connect.mhoo.app; leave upstream account integrations alone | Medium |
| Invitations | workspace-invitation; auth/services/sign-in-up.service.ts; twenty-emails send-invite-link | Twenty invite token/membership and Workspace URL | C | Preserve token/membership; stable-host links | High |
| Password reset | auth/services/reset-password.service.ts | Hashed/revocable Twenty AppToken; buildWorkspaceURL mail link | C | Preserve token semantics; stable-host link | High |
| Email verification | email-verification/services/email-verification.service.ts | Twenty verification token and Workspace/base link | C | Preserve semantics; stable-host link | Medium |
| Sender identity | twenty-config/config-variables.ts; reset/verification services | EMAIL_FROM_NAME and EMAIL_FROM_ADDRESS | A | Runtime config later, infrastructure-owned | Low |
| Transactional email brand | twenty-emails components Logo/Footer/BaseHead/WhatIsTwenty; emails | Compiled Twenty image/footer/copy | C | Small Mhoo brand/template layer | Medium |
| Login/auth logo | twenty-front/modules/auth/components/Logo.tsx | Served launcher icon, optional Workspace overlay | C | Global Mhoo asset/config seam | Low |
| Onboarding/loading logo | onboarding OnboardingHeader and OnboardingPulsingLogo | Hard-coded Twenty SVG | C | Same global asset seam | Low |
| Browser title/favicon | page-title, page-favicon, DefaultWorkspaceLogo/Name | Helmet title; Workspace-aware favicon/default Twenty assets | C | Mhoo global fallback; retain Workspace data | Low |
| Auth footer/legal/support links | FooterNote; settings/support utilities | Hard-coded Twenty links | C | Explicit Mhoo customer-link seam | Medium |
| Workspace display identity | workspace/workspace.entity.ts; settings Workspace name/logo components | Workspace name/logo are persisted data | A | Workspace-scoped display only, never route/authority | Low |
| Upstream custom domains | domain/custom-domain-manager; workspace/services/workspace.service.ts | Entitled custom-domain flow uses DnsManagerService | F | Leave upstream capability intact, do not enable for Mhoo Workspaces | High |
| Mhoo domain safety policy | same paths plus Cloudflare config variables | Existing source can register/update/delete hostnames when enabled | C | Opt-in Mhoo policy rejects/omits those mutations; retain upstream mode | High |
| Static edge hosts | No Twenty application source | External deployment/routing | D | Infrastructure owns static hostname matrix | High |
| Public function domains | domain/workspace-domains; PUBLIC_DOMAIN_URL | Builds subdomain public-function URLs | F | Do not use for normal Mhoo tenancy | Medium |
| Mhoo Home/Systems/Evidence/Operations | twenty-sdk/src/sdk/define/index.ts; create-twenty-app template | Apps provide navigation, layouts, components, objects, views, roles, functions | B | First-party Mhoo App | Low |
| Connector UI | SDK connection providers/logic functions; public Linear App | App presentation/configuration primitives | B | App UI only; provider ownership stays in connectors | Medium |
| Internal Control Plane views | SDK settings component, roles, permission flags | App can mount permissioned settings/front components | B | First-party App; private edge remains infrastructure | Medium |
| Core-backed UI/actions | SDK front components and logic functions | Extension can render/invoke bounded logic | B | UI B; Core auth/data E | High |
| Core API/MCP authority | No Twenty source owns it | Reserved by ADR-0005/0003 | E | Core validates trusted context; no human browser authority | High |

## Branding map

These are **user-visible brand** surfaces. Technical/upstream identity—package and
SDK names, migrations, source provenance, API types, licences/copyright—remains
Twenty. This is not a blind replacement exercise.

| Surface | Actual source/configuration | Scope | Config/App API? | Recommended mechanism |
| --- | --- | --- | --- | --- |
| Product/auth logo | twenty-front auth Logo; served images/icons | Global + optional Workspace overlay | No global setting/App hook | C global brand asset seam |
| Onboarding/splash | OnboardingHeader, OnboardingPulsingLogo | Global | No | C same asset seam |
| Browser title/favicon | page-title/page-favicon/default Workspace constants | Global fallback + Workspace data | Workspace logo only | C fallback; A Workspace logo |
| Workspace selector | MultiWorkspaceDropdown | Signed-in user/Workspace | Workspace name/logo data | A, plus C stable-host switching |
| Login/invite/reset/verification copy | twenty-front auth; twenty-emails emails | Global | No | C template/translation layer without semantic changes |
| Email logo/footer/company links | twenty-emails components Logo/Footer/BaseHead/WhatIsTwenty | Global | No | C template layer |
| Email sender/display name | EMAIL_FROM_NAME, EMAIL_FROM_ADDRESS | Runtime global | Yes | A, set later by infrastructure |
| Help/legal/support | FooterNote; settings navigation/support utility | Global | No | C Mhoo customer-link seam |
| Marketplace/App brand | application.config and app public assets | Per App | App manifest | B first-party Mhoo App |
| Settings/error/loading screens | twenty-front modules and pages | Global | No general API | C only after screen-specific decision |

## Authentication flow map

Browser auth screen
  -> GraphQL AuthResolver.signIn OR /auth/google OR /auth/microsoft
  -> AuthService validates Twenty credential/provider identity
  -> UserWorkspaceService finds available Twenty Workspaces
  -> workspace-agnostic token pair; optional UserSessionService cookie
  -> selected Workspace login token
  -> AuthResolver.getAuthTokensFromLoginToken validates membership
  -> workspace-scoped Twenty auth context and redirect

Invite email -> invite hash + personal token -> signUpInWorkspace
  -> invitation checks -> Twenty UserWorkspace creation/join -> optional verification
  -> login token -> membership validation

Forgot password -> emailPasswordResetLink -> ResetPasswordService
  -> hashed/revocable Twenty AppToken -> email link -> validate/reset -> normal sign-in

New Workspace -> signUpInNewWorkspace -> Twenty Workspace + UserWorkspace
  -> onboarding state -> activation

Workspace switch -> availableWorkspaces -> current browser redirect to workspaceUrls
  -> login token -> server membership validation -> active Twenty context

Relevant server roots are auth/auth.resolver.ts, auth/services/auth.service.ts,
auth/services/sign-in-up.service.ts, auth/token, user-workspace, and user-session.
React presentation lives in twenty-front/modules/auth. Invalid/expired
invitation/reset tokens remain rejected by existing Twenty services. Phase 3
must never mint an Mhoo user, session, password store, or membership.

## Canonical-origin map

| Source/configuration | Current behavior | app.mhoo.app assessment |
| --- | --- | --- |
| SERVER_URL, FRONTEND_URL, DEFAULT_SUBDOMAIN, PUBLIC_DOMAIN_URL | Server/front base, multi-workspace fallback, optional function domain | A for app URL; do not set public function domain for normal tenancy |
| utils/generate-front-config.ts | Bakes server URL unless auto mode | A: exact canonical URL; avoid multi-host auto mode |
| DomainServerConfigService | Front/base URL with multi-workspace default subdomain | C: stable-host exception required |
| WorkspaceDomainsService | Builds and resolves subdomain/custom Workspace URLs | C: principal blocker |
| Reset/verification/invitation services | Build absolute mail links through domain service | C only because builder changes; tokens remain F |
| Google/Microsoft callback config | Explicit config callback values | A |
| SSO service/OAuth propagator | Builds/revalidates Workspace-domain redirects | C |
| Connected-account webhook drivers | Compose public URLs from server URL | E/D later: connector ingress belongs at connect.mhoo.app |
| Credentialed-origin resolver | Derives allowlist from server/front/explicit origins | A: one app origin requires no extra origin |

No Mhoo-Twenty source assumes mhoo.app. It does contain localhost,
app.twenty.com, Twenty marketing/docs URLs, subdomain construction, and optional
custom/public domains. Only runtime URL config or customer-brand code should
change customer-facing values.

## Cookie/session assessment

**Host-only app.mhoo.app sessions are practical; there is no source blocker.**

- On HTTPS, UserSessionCookieService issues __Host-twenty-session and an
  impersonator variant, with HttpOnly, Secure, Path=/, configurable SameSite,
  expiry, and deliberately no Domain attribute.
- AUTH_COOKIE_SESSIONS_ENABLED defaults false. Session absolute lifetime defaults
  to 180d; idle timeout defaults to 30d. Sign-in/renewal issue sessions and
  sign-out/revocation clears them.
- Unsafe cookie-authenticated requests fail closed unless Origin is in the
  derived/explicit allowlist. Default SameSite=lax is appropriate for one
  human app host; none is only for a reviewed split-origin design.

The browser app and session-issuing Twenty server must be at app.mhoo.app. Do
not allowlist sibling service origins merely for convenience; Core and connectors
use their own machine/service trust.

## Workspace-routing assessment

WorkspaceDomainsService proves the blocker:

- Multi-workspace parses request origin, looks up by subdomain or customDomain,
  builds a subdomain/custom URL, and the UI redirects there.
- Single-workspace returns one default Workspace and cannot serve ordinary
  multi-Workspace Mhoo use.
- SubdomainManagerService generates/reserves a subdomain at creation.
- The optional custom-domain manager calls DnsManagerService to
  register/update/delete hostnames.

Thus normal Mhoo Workspaces cannot share one stable hostname by configuration
alone. The exact affected source is the domain service, Workspace URL builder,
auth/workspace creation input, domain hooks, selector redirect, and tests named
above. The upstream subdomain field can remain a technical identifier during a
bounded transition but must never be emitted as Mhoo host, authority input,
customer route, or Cloudflare/DNS lifecycle action.

## Twenty App / extension assessment

A first-party Mhoo App is the preferred product-capability home:

| Surface | Extension shape | Boundary |
| --- | --- | --- |
| Mhoo Home | Navigation item + page layout + front components | B |
| Systems/Evidence/Operations | Objects/views/widgets and Core-backed front components | B; Core owns canonical data |
| Connectors | Settings/front component and connection-provider UI | B; connectors own OAuth/webhooks/providers |
| Internal Control Plane | Settings component, roles/permission flags, front components | B; infrastructure owns private edge/Access |
| Core actions | Logic functions/front components after a trusted contract | B UI, E authorization/data |

The SDK exports application, object, field, view, navigation, page-layout,
front/settings component, logic-function, role, permission-flag, and connection
provider definitions. The rich fixture and public Linear App exercise those
primitives. They do not hook the global auth shell, email templates, browser
bootstrap branding, or identity/session semantics.

## Minimal fork-delta proposal

These are proposals, not authorization to implement:

1. **Mhoo stable-host multi-Workspace mode (C).** Opt-in mode separates
   authenticated Workspace selection from request Host, updates the domain URL
   builder and selector redirect, and uses only server-validated Twenty
   membership/context. Configuration cannot solve this because current true mode
   requires a Workspace host and false mode selects one default Workspace.
2. **Mhoo Workspace-domain policy adapter (C).** In stable-host mode reject/omit
   normal subdomain/custom-domain lifecycle mutations and never invoke
   DnsManagerService. Leaving Cloudflare credentials absent is necessary but
   not sufficient proof. Retain upstream domain support outside the Mhoo mode.
3. **Global customer-brand seam (C).** Explicit brand asset/config layer for
   login/onboarding fallback assets, title/favicon defaults, auth legal/support
   links, and transactional-email header/footer/product copy. No current config
   or App API reaches these global components.
4. **Canonical-link source tests (C).** Focused tests prove invite, reset,
   verification, social SSO, OIDC/SAML, and switching use only app.mhoo.app in
   Mhoo mode. Existing tests prove upstream domain behavior, not ADR-0005.

## Legacy OVH conflict — inventory only

| Infrastructure path | Existing behavior | Later reconciliation |
| --- | --- | --- |
| deploy/twenty-ovh-prod/env/production.env.example | TWENTY_SERVER_URL=https://mhoo.app | D: reviewed candidate config adopts app host |
| deploy/twenty-ovh-prod/compose.yaml | Passes only server URL; forces multi-workspace and DEFAULT_SUBDOMAIN=app | D + C: compose must match stable-host source mode |
| deploy/twenty-ovh-prod/bin/lib.sh | Fails unless apex URL; rendered-compose assertions require it | D: revise only after source proof |
| deploy/twenty-ovh-prod/bin/up.sh | Receipt records apex public origin | D |
| deploy/twenty-ovh-prod/cloudflared/config.yml | Routes apex, app, mhoooo, thaiwine, hq, twenty-origin to Twenty | D: replace named Workspace routes with static hostname contract; no wildcard |
| deploy/twenty-ovh-prod/README.md | Apex canonical, app redirect alias, named Workspace hosts | D: later runbook update |
| deploy/twenty-ovh-prod/test/source-contract.test.mjs | Locks apex, alias, named host allowlist, subdomain model | D: only with source/edge proof |

This conflict is intentionally unresolved. It requires separately reviewed
candidate provenance, isolated rehearsal, rollback, explicit approval, and
infrastructure-owned DNS/Tunnel/Cloudflare work. A Workspace operation must
never reconcile it.

## Phase 3 recommendation (not implemented)

1. Source-contract tests for ADR-0005 positive/negative cases, including
   no-host authority and no DNS calls.
2. Bounded stable-host routing/policy fork delta with multi-Workspace,
   invitation/reset/verification/switch and membership-isolation tests.
3. Local/disposable canonical URL plus host-only cookie-session candidate; no
   provider registration or infrastructure change.
4. Customer-brand seam and rendered screen/email tests.
5. First-party Mhoo App for Mhoo Home and bounded views/actions.
6. Separate infrastructure reconciliation after source proof and approval.

## Phase 2 validation record

- Inspected checked-in v2.30.1 server, front end, emails, SDK, App fixtures, and
  only the needed legacy OVH deployment source.
- No AGENTS.md applies at Mhoo-Twenty root. Nested App instructions were not
  applicable because no App source changed; root mhoo and infrastructure
  instructions governed read-only inspection.
- No source, .twenty-source, lockfile, migration, runtime behavior,
  infrastructure file, provider, DNS, Cloudflare, Tunnel, credential,
  publication, or cutover was changed.
- Final required checks: scripts/provenance/verify-source.sh,
  git diff --check, source-identity comparison, and final diff review.

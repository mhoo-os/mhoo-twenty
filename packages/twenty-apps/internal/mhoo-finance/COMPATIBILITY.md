# Clover compatibility boundary

ARCHITECTURE IMPACT: CROSS-SYSTEM

This source slice is intentionally not runtime acceptance. It defines the
native Twenty App and its bounded platform compatibility extension, but remains
fail closed until that extension has passed source and disposable-Workspace
proof.

## Exact reviewed facts

- Clover returns the 13-alphanumeric `merchant_id` on the OAuth callback.
- The Clover token response contains an expiring access/refresh token pair.
- Clover refreshes the pair at the separate `/oauth/v2/refresh` endpoint with
  `client_id` and `refresh_token`.
- Clover read permissions are configured on the Clover application
  registration. They are not OAuth scope strings.
- The v2.37 baseline accepts only `code`, `state`, and OAuth error fields at
  the App callback, derives a Connection handle from an ID token or the Twenty
  user's email, refreshes App Connections at the token endpoint with the
  standard grant body, and assumes a one-hour App access-token lifetime.
- The v2.37 baseline discovers every non-deleted logic function with
  `toolTriggerSettings` in a Workspace without filtering those descriptors by
  the authenticated caller's role.

## Consequence

This branch introduces a bounded, provider-declared callback-handle parameter,
refresh endpoint/body controls, and role allowlist for logic-function tool
discovery. `@mhoo/finance` uses those declarations for Clover's `merchant_id`,
JSON refresh endpoint, and an assignable zero-authority reader role.

The published `twenty-sdk@2.37.0` declaration types predate those bounded
platform additions. The App therefore keeps its compatibility declarations in
locally checked intersection types and passes the resulting values to the
unchanged SDK helpers; this does not make the published 2.37.0 runtime support
the behavior. The source-tree platform validators and disposable-Workspace
proof remain required.

No Clover grant is canonical or operable until the change is reviewed, merged,
and proved. In particular, the generic App refresh manager still needs a proven
provider-expiry rule rather than its baseline one-hour assumption. The status
tool therefore rejects the email-shaped fallback handle and all noncanonical
merchant identifiers.

The native tool declaration remains source-only until role allow/deny behavior
and Workspace/member-visible Connection behavior are proved in a disposable
Workspace. A Workspace-authenticated endpoint alone is not sufficient
authorization proof.

This blocker must not be bypassed with a caller-supplied merchant ID,
application variable, custom `/mcp` route, copied Cloudflare authority, static
token, or second credential owner.

## Non-actions

No Clover application was created or changed. No credentials, customer data,
provider calls, Twenty installation, Cloudflare mutation, deployment, DNS,
traffic, cutover, or legacy retirement occurred.

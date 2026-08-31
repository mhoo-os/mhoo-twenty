# Clover compatibility boundary

ARCHITECTURE IMPACT: CROSS-SYSTEM

This source slice is intentionally not runtime acceptance. It defines the
native Twenty App and fails closed where exact Twenty 2.37 Connections cannot
yet preserve Clover's merchant binding or token lifecycle, and where the
built-in tool registry cannot yet prove role-filtered exposure.

## Exact reviewed facts

- Clover returns the 13-alphanumeric `merchant_id` on the OAuth callback.
- The Clover token response contains an expiring access/refresh token pair.
- Clover refreshes the pair at the separate `/oauth/v2/refresh` endpoint with
  `client_id` and `refresh_token`.
- Clover read permissions are configured on the Clover application
  registration. They are not OAuth scope strings.
- Twenty 2.37 accepts only `code`, `state`, and OAuth error fields at the App
  callback, derives a Connection handle from an ID token or the Twenty user's
  email, refreshes App Connections at the token endpoint with the standard
  grant body, and assumes a one-hour App access-token lifetime.
- Twenty 2.37 discovers every non-deleted logic function with
  `toolTriggerSettings` in a Workspace without filtering those descriptors by
  the authenticated caller's role.

## Consequence

The Connection Provider declaration is valid metadata, but no Clover grant is
canonical or operable until a separately reviewed Twenty compatibility change
preserves the callback `merchant_id`, supports Clover's refresh contract, and
uses a proven token-expiry rule. The status tool therefore rejects the
email-shaped fallback handle and all noncanonical merchant identifiers.

The native tool declaration also remains source-only until a separately
reviewed compatibility change makes discovery and execution role-aware and
proves allow/deny behavior for Workspace and member-visible Connections. A
Workspace-authenticated endpoint alone is not sufficient authorization proof.

This blocker must not be bypassed with a caller-supplied merchant ID,
application variable, custom `/mcp` route, copied Cloudflare authority, static
token, or second credential owner.

## Non-actions

No Clover application was created or changed. No credentials, customer data,
provider calls, Twenty installation, Cloudflare mutation, deployment, DNS,
traffic, cutover, or legacy retirement occurred.

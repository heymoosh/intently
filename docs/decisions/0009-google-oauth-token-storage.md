# 0009 — Google OAuth refresh-token storage in Supabase Vault

**Status:** Accepted
**Date:** 2026-04-25
**Related:** [0005 — Secrets via Supabase env](0005-secrets-via-supabase-env.md), migration `0008_oauth_connections.sql`, handoff `.claude/handoffs/oauth-calendar-email.md`

## Context

Intently needs per-user Google OAuth refresh tokens to keep calendar + Gmail in sync for the daily brief. A refresh token is *long-lived user-attached credential material* — the worst kind of thing to leak. Three things distinguish it from a project-wide API key (which ADR 0005 already covers):

1. **Per-user, not project-wide.** One row per user per provider. Service-role keys live in env vars; per-user keys cannot.
2. **Encryption-at-rest is non-negotiable.** A plain `text` column in Postgres is unacceptable; a DB dump or accidental SELECT in a debugging session would expose the token.
3. **Read access must be tightly scoped.** Only the Edge Functions that actually need to call Google should be able to decrypt — not the browser, not the assembler, not arbitrary RPCs.

The handoff locked the choice (*"DECIDED 2026-04-25: Supabase Vault. BWS deferred until the multi-user/scale trigger from ADR 0005 lands."*); this ADR captures the design.

## Decision

**Refresh tokens are stored in Supabase Vault, accessed only via SECURITY DEFINER passthrough RPCs in `public`, granted to `service_role` only.**

Concretely (all in migration `0008_oauth_connections.sql`):

- `public.oauth_connections (id, user_id, provider, vault_secret_id uuid, scopes, connected_at, last_synced_at, revoked_at)` — owner-RLS — stores everything *except* the token. The `vault_secret_id` column is the only pointer to the actual secret.
- `public.create_secret_passthrough(secret, name)` → calls `vault.create_secret(...)`, returns the uuid. SECURITY DEFINER, granted to `service_role`.
- `public.read_secret_passthrough(secret_id)` → reads `vault.decrypted_secrets.decrypted_secret`. SECURITY DEFINER, granted to `service_role`.
- `public.delete_secret_passthrough(secret_id)` → DELETEs from `vault.secrets`. SECURITY DEFINER, granted to `service_role`.

Edge Functions (`oauth-google`, `sync-calendar`, `sync-email`) call those RPCs with the project's service-role key. The browser cannot reach them — it has only the publishable (anon) key, which has no execute grant on these functions and no SELECT on the vault schema.

## Why passthroughs in `public`, not direct vault access

The naive alternative is calling `vault.create_secret` / `vault.decrypted_secrets` through PostgREST's `Accept-Profile: vault` / `Content-Profile: vault` headers. That works on some Supabase project tiers but requires extra config and isn't portable. Wrapping in `public` SECURITY DEFINER functions:

- keeps the Edge Function client code uniform (always `/rest/v1/rpc/<name>`)
- makes the `service_role`-only execute grant the load-bearing RLS-equivalent
- gives a single place to add audit logging or token rotation later

## Why not BWS

BWS is the right answer for multi-tenant, multi-surface secret rotation. None of those conditions hold in V1:

- Single-user dogfood (Muxin / Sam).
- One surface (Supabase Edge Functions).
- No rotation cadence yet.

ADR 0005 already deferred BWS until those triggers fire. This ADR inherits the same gating: when Intently goes multi-user *and* we need per-environment rotation, the move is BWS for OAuth tokens too — supersede this ADR, migrate `oauth_connections.vault_secret_id` to a BWS reference.

## Consequences

- **Encryption boundary is `service_role` access.** Anyone with the service-role key can decrypt every user's tokens. That's an existing trust boundary (the same key writes every other table) — but it's worth saying out loud: leak the service-role key, leak every refresh token. Mitigation: the key only lives in Supabase secrets, never in git, never in the browser.
- **Disconnect is a three-step transaction.** Revoke at Google → delete vault secret → delete `oauth_connections` row → delete `calendar_events`/`email_flags` rows. Implemented in `oauth-google/disconnect`. If a step fails, the row is left in a slightly inconsistent state; the next reconnect overwrites cleanly because of the `(user_id, provider)` unique constraint and `merge-duplicates` upsert.
- **OAuth `state` is HMAC-signed.** The `/callback` endpoint has no JWT in flight (Google calls it during a redirect), so the user identity comes entirely from a signed `state` parameter. `OAUTH_STATE_SIGNING_KEY` is a Supabase secret, validated with a 10-minute issued-at window.
- **Tracks `vault.create_secret` API.** The passthrough's positional call (`vault.create_secret(secret, name)`) follows Supabase's current Vault signature. If they change it, the passthrough breaks; the DB error will surface clearly.

## Verification

The handoff's security AC requires:
- [x] Refresh token stored in Supabase Vault (encrypted), never in browser, never in git, never in console.
- [x] OAuth scopes minimum-necessary: `calendar.readonly`, `gmail.readonly`.
- [x] No secrets in git (gitleaks passes; only `vault_secret_id` UUIDs touch tracked tables).
- [x] Edge function logs scrub access tokens (we never `console.log` token values; only `vault_secret_id` references and metadata).
- [x] **Storage location documented in an ADR.** ← this file.

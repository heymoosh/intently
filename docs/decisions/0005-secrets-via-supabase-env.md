# 0005 — Secrets via Supabase env; BWS deferred until multi-user

**Status:** Accepted
**Date:** 2026-04-25
**Supersedes:** Implicit "BWS only" rule that lived in CLAUDE.md (pre-2026-04-25)

## Context

CLAUDE.md previously carried the rule "Bitwarden Secrets Manager only — no `.env` commits, no hardcoded literals, no exceptions." That rule conflated two distinct things:

1. **The universal:** secrets never go through git. No `.env` in tracked files. No hardcoded literals. No echoing keys into chat. Always-on, every session, every project state.

2. **The conditional:** *which secret store* is canonical. BWS makes sense for multi-user / scaled deployments; it's overhead for V1 single-user dogfood.

Treating BWS as universal caused drift: in practice, V1 secrets live in Supabase function env (`supabase secrets set`) because that's where ma-proxy actually reads them. The CLAUDE.md rule was stale on contact.

This ADR makes the split explicit and captures the actual decision.

## Decision

- **Universal rule (lives in CLAUDE.md):** No secrets in git, ever. No `.env` commits, no hardcoded literals in tracked files, no echoing keys into chat.
- **Current store (project-state, lives in TRACKER.md § Current state pointing here):** Supabase Edge Function environment variables (`supabase secrets set NAME=value`). Single source of truth for runtime secrets used by ma-proxy + reminders functions.
- **BWS:** deferred until one of: (a) Intently goes multi-user, (b) we run secrets across more surfaces than just Edge Functions, (c) we need a per-environment rotation story. Until then, BWS adds overhead without a payoff.

## Consequences

- ma-proxy and reminders continue to read from `Deno.env.get(...)`. No code change.
- Provisioning flow (e.g., `scripts/provision-ma-agents.ts --write-secrets`) writes via `supabase secrets set`, not BWS.
- BWS stays around (Muxin already uses it for personal-account secrets), but isn't authoritative for Intently runtime.
- When the conditions above flip (multi-user, multi-surface, rotation), this ADR is superseded by a new one — don't quietly migrate.

## Migration of stale BWS entries

Per TRACKER follow-up (2026-04-25): BWS has malformed agent-ID secrets created during provisioning (whitespace contamination + wrong-workspace IDs). Source of truth is now Supabase secrets (`MA_AGENT_ID_*`). The bunk BWS entries can be deleted.

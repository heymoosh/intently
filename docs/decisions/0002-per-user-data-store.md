# 0002 — Per-user data store

**Status:** Accepted
**Date:** 2026-04-22
**Decider:** muxin

## Context

Intently's V1 keeps all user data in its own store, not in external note apps (Obsidian, Notion, etc.). The data-store choice is independent of the mobile framework and Managed Agents specifics — Supabase works with any client surface and any backend language — so this decision does not wait on Session 2.

The store must:

1. Hold per-user Markdown files (goals, weekly plan, daily log, journal, per-project trackers and strategies).
2. Hold structured metadata (project list, task state, schedule preferences, config).
3. Enforce per-user isolation — user `muxin` can only read user `muxin`'s rows.
4. Be callable from a Python or TS backend that invokes Managed Agents.
5. Support future client surfaces (iOS, Android, web) without vendor-specific client code.
6. Stay exportable — Markdown is the canonical format; a user can always dump their data as .md files.

## Decision (proposed — confirm Thursday)

**Supabase** as the V1 store:
- Postgres for structured metadata (rows keyed by stable IDs per `agent-memory.md`).
- Storage buckets for Markdown blobs per user, or Postgres TEXT columns if we prefer row-shaped.
- Supabase Auth for user identity and row-level security.

One SDK across backend + all client surfaces. Underneath is Postgres — nothing proprietary, fully exportable.

## Alternatives considered

- **Firebase** — similar feature set, Google-flavored. Rejected in favor of Supabase's Postgres backing (easier migration to self-hosted if needed).
- **S3/R2 + a separate auth service** — dumber, cheaper, but more integration work upfront in a 4-day build.
- **Self-hosted Postgres from day one** — more ops work than a hackathon can absorb; revisit post-launch if costs or latency force it.

## Consequences

**Easier:**
- Single SDK for backend + any client.
- Per-user isolation via row-level security is first-class.
- Postgres is exportable and migratable.

**Harder:**
- One more vendor relationship. Supabase free tier should cover the hackathon; paid tier if the app grows.
- Row-level security rules are easy to misconfigure; needs review during Privacy Steward pass.

**Open until Thursday:**
- Markdown as TEXT columns vs. Supabase Storage blobs. Leaning TEXT columns for V1 (easier transactional updates alongside row metadata).
- Whether to use Supabase's realtime channels for agent-run status (nice-to-have; not V1 blocker).

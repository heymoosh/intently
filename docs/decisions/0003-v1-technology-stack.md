# 0003 — V1 technology stack

**Status:** Accepted
**Date:** 2026-04-22
**Decider:** muxin

## Context

Intently V1 is a mobile app with a backend that invokes Claude Managed Agents. Four-day hackathon build, solo. Must run on iOS and Android; web is a V2-but-nice-to-have. Must be secure, not cost-prohibitive, and scale if the hackathon demo earns a real user base.

## Decision

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Expo (React Native) + TypeScript** | One codebase → iOS + Android today, web PWA later. TypeScript shares types with backend. Broadest ecosystem for voice, Markdown, chat UI. Over-the-air updates let us push fixes post-recording if the demo video breaks. |
| Backend | **Supabase Edge Functions (Deno + TypeScript)** | Co-located with data — no cross-vendor latency. Same language as the frontend. Free tier covers hackathon load. |
| Data store | **Supabase Postgres + Storage + Auth** | Decided in ADR 0002. Per-user Markdown blobs + structured row state. Row-level security for future multi-user. |
| Scheduler | **`pg_cron`** (Postgres-native) | Fires agent runs at `daily_brief_time`, `daily_review_time`, `weekly_review_day`/`weekly_review_time`. No separate scheduler vendor. |
| Managed Agents SDK | **TypeScript** | Matches backend language. Second-ticked on the waitlist form alongside Python, so we have optionality. |
| External data | **Direct OAuth → Google Calendar + Gmail APIs** | Simpler than MCP for V1. Tool interface stable; implementation swappable to MCP later. |
| Structured task memory | **Hindsight (self-hosted Docker)** on Fly.io | MIT-licensed; confirmed. Ships an MCP server — wires into Managed Agents via `mcp_toolset`. ~$5/mo on Fly. |
| Secrets | **Bitwarden Secrets Manager** | Hard rule from ADR 0001 consequences. No `.env`, no hardcoded literals, no exceptions. |
| Voice input | **Expo Speech (on-device STT)** | Free, private, adequate quality for dictation. |
| Push notifications | **Expo Push Notifications** | Covers iOS APNs + Android FCM with one API. |
| Markdown rendering | **`react-native-markdown-display`** (view) + in-app editor (Milkdown or raw-textarea toggle) | User sees formatted output; power users can edit raw. |

## Alternatives considered

- **Flutter / native Swift + Kotlin** — Flutter is fine but has smaller ecosystem for voice + chat UI than RN; native means two codebases. Neither fits the solo + no-mobile-background + 4-day constraint.
- **Firebase over Supabase** — FCM-native push is the only real edge; Expo Push covers us. Firebase adds a vendor without benefit.
- **Vercel Functions over Supabase Edge Functions** — requires splitting vendors; Deno runtime on Supabase is sufficient. No gain.
- **Railway / Fly for backend compute** — warranted only if Edge Functions hit cold-start or memory limits. Agent invocations are light; won't happen in V1.
- **AWS (ECS / Lambda / RDS)** — enterprise-scale ops work. Revisit only if we cross ~$2K/mo on Supabase and the per-unit economics tip.
- **MCP-first for Google Calendar + Gmail** — viable, but depends on a third-party MCP server staying up. Direct OAuth is our code; fewer dependencies.
- **Managed-Agents Memory as state store** — rejected per ADR 0001. We use it as a cache, never as truth.

## When to revisit this decision

Triggers — any one of these means reopen the ADR and re-evaluate:

- **Supabase costs cross ~$500/month.** Time to cost-model alternatives (self-hosted Postgres on Fly + Clerk or Auth.js + R2 for storage).
- **We cross ~100K MAU.** Supabase comfortably serves that; if we blow past it, revisit horizontal scaling story.
- **Expo hits a capability ceiling.** Specifically: if we need native modules Expo doesn't ship (some voice/ML features) and the eject cost is high, reconsider native or bare RN.
- **Managed Agents Memory rollout changes the cost/quality math.** If per-run cost becomes significant or Memory's behavior forces us into a coupling we can't accept (e.g., only-available-via-Anthropic-Vault for secrets), revisit runtime choice in ADR 0001.
- **Hindsight stops being maintained** or changes license. MIT is stable, but OSS projects die. If it does, migrate to direct Postgres queries over our task rows.
- **Anthropic ships first-party scheduled agents.** Today we own the cron in `pg_cron`. If Anthropic ships a scheduling primitive that's cleaner, consider moving the scheduler (but keep the graph-in-our-code principle from ADR 0001).
- **We need HIPAA, SOC 2, or equivalent compliance.** Supabase has paid tiers for this but the architecture review is non-trivial. Re-plan before any enterprise pivot.
- **Web becomes primary, not PWA-secondary.** If web usage outpaces mobile, Expo-for-web has friction that Next.js wouldn't. Consider a split.

## Consequences

**Easier:**
- Single language (TypeScript) across app + backend + scheduled jobs.
- Single vendor (Supabase) for data + auth + compute + cron — one dashboard, one bill.
- Expo over-the-air updates mean demo fixes don't require app-store re-submission.

**Harder:**
- Deno on Edge Functions has a smaller npm ecosystem than Node — some packages need shims or swaps.
- Supabase RLS is easy to misconfigure; Privacy Steward review must check row policies on every data-touching change.
- Fly.io for Hindsight is one more service to monitor. Acceptable for V1; revisit if ops load climbs.

**Locked in:** vendor-wise, Supabase. But the underlying tech (Postgres, TypeScript, React Native) is portable — a Supabase-to-self-hosted migration is real work but not a rewrite. Consistent with ADR 0001's portability principle.

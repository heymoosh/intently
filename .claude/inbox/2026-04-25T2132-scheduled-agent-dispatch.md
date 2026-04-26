---
captured: 2026-04-25T21:32:00-05:00
session: chat/0425-210554
source: discussion
handoff: .claude/handoffs/scheduled-agent-dispatch.md
---

# Scheduled agent dispatch — pg_cron actually invokes agents

**Handoff already drafted at `.claude/handoffs/scheduled-agent-dispatch.md`.** Promotes "Apply pg_cron migration" follow-up + the dispatch extension into a single multi-session thread. `/groom` should add the TRACKER § Active handoffs row pointing at the handoff, register AC inside the handoff, update this `resolved:` field, then delete this file.

## One-line intent

Make the agentic value prop real: agents fire on the user's schedule (`daily_brief_time`, `daily_review_time`, `weekly_review_time` + `weekly_review_day`, `monthly_review_time`) without anyone clicking a button. Today they only fire on tap.

## Why this is in the inbox

Two existing TRACKER follow-ups (apply migration; user-only) are sub-tasks of this thread. The actual work is bigger than "apply migration" — `0002_schedules.sql`'s own header says it's V1-scaffold-only and only writes to `cron_log` without invoking the agent. Need to extend `tick_skills()` to do real HTTP into a `dispatch-skill` Edge Function. Worth promoting from "follow-up" to "handoff" because it's multi-day, multi-file, with idempotency + observability + failure-handling AC.

## Substance

- Apply `supabase/migrations/0002_schedules.sql` (was deferred — user-only `supabase db push`).
- Extend `tick_skills()` to call out via `pg_net` to a new `supabase/functions/dispatch-skill/index.ts` that wraps ma-proxy's logic server-side.
- Idempotency: `(user_id, kind, date_local)` unique constraint or check-before-insert.
- Observability: `cron_log` rows queryable, Profile-sheet "agent activity" view with last N fires.
- Web push notifications **explicitly deferred per Muxin** in this session. Scheduled fires write to DB; user sees on next open.

Strong synergy with `cognition-verification-harness` — that handoff's time-travel needs match this handoff's testability requirements. Light dep on `new-user-ux-and-auth`: schedule preferences come from setup expansion.

See handoff for full AC, pg_net vs SECURITY DEFINER tradeoffs, failure-mode UX questions.

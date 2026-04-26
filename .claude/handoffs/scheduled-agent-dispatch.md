# Scheduled agent dispatch — pg_cron actually invokes agents

**Created:** 2026-04-25 (post-hackathon-submission discussion).
**Status:** Drafted, not groomed. Awaiting `/groom` to register in TRACKER.
**Source:** Conversation between Muxin and Claude on 2026-04-25 evening. Muxin: *"the app pings them on their phone... auto-review."* Auto-review = scheduled agent dispatch.

## Why

The MA prize narrative — *"hand off meaningful, long-running tasks — not just a demo"* — is currently scaffolding, not behavior. Specifically:

1. **Migration `supabase/migrations/0002_schedules.sql` is not applied to remote.** TRACKER follow-up: *"Apply pg_cron migration. Needs `supabase db push` — user-only."*
2. **Even if applied, the migration is V1-scaffold-only.** Its own header says: *"V1 dispatches to public.cron_log only (no real agent invocation)."* Look at `tick_skills()` lines 135–162: it iterates users × skills, calls `should_fire`, and on a hit inserts into `cron_log` with `dispatched: false` and metadata `{reason: 'v1-scaffold-only'}`. **No HTTP call, no agent invocation.**
3. So today the only way an agent fires is a user clicking a button in the UI. There is no "the brief was ready when I woke up" moment. The agentic value prop is not yet realized.

## What — the target experience

**Daily.**
- Each morning at the user-configured `daily_brief_time` (in their `profiles.timezone`), the daily-brief agent fires automatically. Output lands in `entries` (kind=`brief`) before the user opens the app. When they open it, the brief is already there.
- Each evening at `daily_review_time`, the daily-review agent fires — for opted-in users — pre-staging the review prompt with the day's data. (Open question: do we pre-fire the agent, or just notify the user it's time to review and let them tap?)

**Weekly + monthly.**
- `weekly_review_time` + `weekly_review_day` (e.g., Sunday 9 AM) fires the weekly-review agent.
- `monthly_review_time` (e.g., 1st of month 10 AM) fires the monthly-review agent.

**Notifications (deferred per Muxin in this session: "let's not worry about... web push").**
- We're explicitly deferring web push for now. Scheduled agents fire and write to the DB; the user sees the result next time they open the app.

**Configuration.**
- `life_ops_config.config` JSONB already has the field shape (`daily_brief_time`, etc.). Setup-expansion handoff covers populating these via the UI.

## Acceptance criteria

Drafted here per § AC location matrix (cross-cutting infra → handoff).

**Migration applied + extended:**
- [ ] `supabase/migrations/0002_schedules.sql` is applied to remote. Verified: `\d cron_log`, `\df tick_skills`, `select * from cron.job where jobname = 'intently-tick-skills'` all return rows.
- [ ] `tick_skills()` is extended to actually call the agent — replaces the `cron_log`-insert-only behavior with an HTTP call to a Supabase Edge Function (e.g., `dispatch-skill`) that invokes ma-proxy's logic server-side. The HTTP call uses `pg_net` (Supabase-supported) or calls into a SECURITY DEFINER function that does the network IO.
- [ ] `cron_log.dispatched` is updated to `true` after a successful agent invocation; failure paths log into `cron_log.metadata` with `error: <message>`.

**End-to-end fire:**
- [ ] Test user with `daily_brief_time = "09:00"` and `timezone = "America/Chicago"` — at 9:00 CT, agent fires within 60 seconds. Verified: new `entries` row with `kind='brief'`, dated today, source=`agent-scheduled`. (Add `source` enum if not already present.)
- [ ] Same for `daily-review`, `weekly-review` (with `weekly_review_day` matching), `monthly-review`.
- [ ] Idempotency: if the dispatcher fires twice in the same minute (cron tick + retry), only one `entries` row is created. Use a unique constraint on `(user_id, kind, date_local)` or check-before-insert.

**Failure handling:**
- [ ] Agent invocation that fails (network error, agent error, timeout) logs into `cron_log.metadata` and does NOT create a stub `entries` row. The user opens the app and sees no brief; a follow-up tick retries OR the user can manually trigger.
- [ ] Repeated failures (e.g., 3 in a row) surface in a "system status" entry visible in Profile.

**Observability:**
- [ ] `cron_log` rows are queryable and a Profile-sheet "agent activity" view shows the last N fires (success / failure, timestamp, skill).
- [ ] Edge function logs cleanly attribute each fire to `(user_id, skill, fired_at)` for debugging.

**Security:**
- [ ] The dispatcher Edge Function authenticates as a service-role client (RLS bypass) but only writes rows scoped to the `user_id` in the cron payload. No cross-user leakage possible.
- [ ] Anthropic API key continues to live server-side (already true via ma-proxy pattern). Dispatcher reuses the same secret.

## Open questions for grooming

1. **`pg_net` vs. SECURITY DEFINER + net-extension vs. external scheduler?** pg_cron + pg_net is the most Supabase-native; works but requires the pg_net extension to be enabled. Alternative: cron triggers a Postgres function that returns a payload, and a Supabase Edge Function on a separate cron polls + dispatches. *Lean: pg_cron + pg_net for a single-system answer; revisit if pg_net hits limits.*
2. **Pre-fire the daily-review at evening, or just remind?** Pre-firing has the agent ready when the user taps; reminding lets them choose to engage. *Lean: hybrid — pre-fire a "draft review with today's data" but require user accept to commit.*
3. **What does the "dispatched: false → no notification" failure mode feel like to the user?** They open the app expecting a brief, see yesterday's. Worth a "your scheduled brief failed" surface so they don't quietly miss it.
4. **Does the user see scheduled fires happen, or are they invisible?** Suggested: a small "scheduled" badge on agent-produced entries so the cognition is visible without being noisy.

## Dependencies / sequencing

- Light dependency on **new-user-ux-and-auth** — preferences (the four time fields) come from there. Without setup populating `life_ops_config.config`, no schedule fires. Ship setup first, then dispatch.
- Independent of **OAuth** — the brief works on whatever data is in the tables; OAuth makes that data richer.
- Strong synergy with **cognition-verification-harness** — the harness's "time-travel the clock" capability is exactly what's needed to test scheduled fires without waiting 24 hours per iteration.

## Files this work touches (rough)

- `supabase/migrations/0002_schedules.sql` (already exists; needs apply + extend)
- New migration: `0007_dispatch_via_pg_net.sql` (extends `tick_skills` to do HTTP)
- Followup migration: `0009_dispatch_via_vault.sql` (0009 supersedes 0007's GUC approach — switches tick_skills to read URL/auth from Supabase Vault instead of `ALTER DATABASE` custom GUCs, which are blocked on hosted Supabase)

  **Vault setup (run once in Supabase SQL Editor after applying 0009):**
  ```sql
  select vault.create_secret('https://cjlktjrossrzmswrayfz.supabase.co/functions/v1/dispatch-skill', 'dispatch_skill_url');
  select vault.create_secret('Bearer <service-role-key>', 'dispatch_skill_auth');
  ```
  Do NOT run the `ALTER DATABASE postgres SET app.settings.*` commands from the 0007 header — those fail on hosted Supabase.
- New: `supabase/functions/dispatch-skill/index.ts` — server-side agent invoker
- `web/lib/context-assembler.js` — verify works with `(user_id, skill, scheduled-context)` payload identical to user-initiated
- New: Profile-sheet "agent activity" view
- New ADR: `docs/decisions/000X-scheduled-dispatch-via-pg-cron-pg-net.md`

## Estimate

Multi-day. The migration extension is small; the Edge Function + auth + idempotency + observability is the bulk. ~2–3 days.

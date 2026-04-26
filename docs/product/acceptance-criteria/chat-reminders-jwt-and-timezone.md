# Acceptance Criteria — Chat reminders: JWT passthrough + timezone-aware date math

**Topic:** Bug 3 (silent data loss) + Bug 2 (UTC date off-by-one) in the chat → reminder path.
**Discovered:** 2026-04-25 evening, post-hackathon manual test of deployed app.
**Source captures:** `git show 0df181f:.claude/inbox/2026-04-25T2300-chat-reminder-path-bugs.md`.
**Cross-reference:** `.claude/handoffs/new-user-ux-and-auth.md` (Bug 3 unblocks anon-first auth integrity).

## Goal

Reminders the user creates via chat are persisted to *their* `user_id` (not the legacy seed user `auth.users[0]`), and "tomorrow" / "Tuesday" / etc. resolve relative to the user's local date, not UTC.

## Background

Two bugs in `supabase/functions/reminders/index.ts`:

1. **Wrong user_id (silent data loss).** Edge function uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS, then attributes every row to "the first user in `auth.users`" — comment in file lines 9–15 self-flags as a hackathon-only pattern. Anon-per-browser users have their own `auth.uid()`, so reminders they create are filed under the wrong owner and invisible to `listAdminReminders()`. Agent says "got it" → reminder permanently lost from user's view.

2. **UTC date math.** `todayIsoDate()` at line 218 returns `new Date().toISOString().slice(0, 10)` — UTC date, not user-local. Anyone west of UTC during their evening sees "tomorrow" resolve to UTC-tomorrow, which is two days from their local-today.

## Acceptance criteria

### Bug 3 — JWT passthrough (correct user_id)

- [ ] **CR-01** Edge Function `supabase/functions/reminders/index.ts` no longer uses `SUPABASE_SERVICE_ROLE_KEY` for the insert path. Writes go through a client constructed with the user's session JWT from the request's `Authorization` header.
- [ ] **CR-02** Edge Function rejects requests without a valid `Authorization: Bearer <jwt>` header with HTTP 401 + a clear error body. No silent fallback to the legacy "first user" pattern.
- [ ] **CR-03** Frontend caller `web/lib/reminders.js` (`classifyTranscript` function) reads the current session via `getSupabaseClient().auth.getSession()` and attaches `Authorization: Bearer <session.access_token>` to the fetch.
- [ ] **CR-04** RLS policies from migration `supabase/migrations/0003_reminders.sql` cover owner-only writes — verified by inspection (the policy already exists; we're switching from bypass to compliance, not adding policy).
- [ ] **CR-05** Hardcoded "first user in auth.users" lookup at the top of the file is removed. The seed SQL `supabase/seeds/reminders.sql` (if it depends on the same pattern) is updated or documented as legacy fixture data.

### Bug 2 — timezone-aware date math

- [ ] **CR-06** Edge Function accepts an optional `today` field in the POST body (format: `YYYY-MM-DD`, the user's local date).
- [ ] **CR-07** `buildClassifyPrompt` uses the request-supplied `today` when present; falls back to UTC `todayIsoDate()` only when the field is absent (graceful degradation for any non-frontend caller).
- [ ] **CR-08** Frontend `classifyTranscript` computes `today` from the user's local timezone (e.g., `new Date().toLocaleDateString('en-CA')` which gives `YYYY-MM-DD` in local TZ) and includes it in the request body.
- [ ] **CR-09** No other instance of `new Date().toISOString().slice(0, 10)` survives in the reminders Edge Function (audit by grep).

### Cross-cutting

- [ ] **CR-10** PR description includes a short manual test plan that any reviewer can run against a deployed dev/staging environment to verify both bugs are fixed.

## Verification methods

| CR | How to verify |
|---|---|
| CR-01 | Read the diff of `supabase/functions/reminders/index.ts`. Confirm `SUPABASE_SERVICE_ROLE_KEY` is no longer referenced in the insert path. |
| CR-02 | Smoke test: `curl` the endpoint with no `Authorization` header; expect HTTP 401. With invalid Bearer; expect 401. |
| CR-03 | Read the diff of `web/lib/reminders.js`. Confirm `getSession()` is awaited and `Authorization` is attached. |
| CR-04 | Read `supabase/migrations/0003_reminders.sql`; confirm the `reminders` table has an RLS policy `auth.uid() = user_id` (or equivalent) for INSERT/SELECT. No new migration needed. |
| CR-05 | Grep for "auth.users" in `supabase/functions/reminders/index.ts`; expect zero hits in the writes path. |
| CR-06 | Smoke test: POST with `{transcript: "remind me tomorrow", today: "2026-04-25"}`; inspect the inserted row's `remind_on` matches 2026-04-26 regardless of server time. |
| CR-07 | POST without `today`; verify the response shape still works (UTC fallback). |
| CR-08 | Read the diff of `web/lib/reminders.js`; confirm `today` is computed from local TZ and included in the body. |
| CR-09 | `rg "new Date\(\)\.toISOString\(\)" supabase/functions/reminders/` returns zero matches. |
| CR-10 | Inspect PR description; confirm test plan is present + actionable. |

## Manual end-to-end smoke (the closing test)

After deploy:

1. Open deployed app in fresh incognito window. Anon sign-in fires (you have a brand-new `auth.uid()`).
2. Send chat: "remind me to call the dentist tomorrow."
3. Inspect `reminders` table in Supabase Studio — confirm a row exists with `user_id` matching your anon uid (not the legacy seed user) and `remind_on` matching local-tomorrow.
4. Navigate to Future page → Admin · misc reminders band — confirm the reminder is visible.
5. Open another incognito window — confirm you do NOT see the reminder from window 1 (different anon uid, RLS isolates).

## Out of scope (do NOT do these in this PR)

- Bug 1 (chat thinking indicator) — separate AC at `chat-thinking-indicator.md`.
- Migrating old reminders attributed to legacy `auth.users[0]` — they're test data, leave them.
- Reminders intent reconciliation (date-anchored vs surface-on-brief) — that's a Critical-items reconciliation, not this bug.

## Sub-agent contract

When dispatched, your final response MUST include the AC checklist above with ✅/❌ + one-line evidence per criterion. If any criterion is ❌, surface the blocker — do NOT declare done. The orchestrator will verify your evidence against the actual diff before merging.

# OAuth — Google Calendar + Gmail intake

**Created:** 2026-04-25 (post-hackathon-submission discussion).
**Status:** Drafted, not groomed. Awaiting `/groom` to register in TRACKER.
**Source:** Conversation between Muxin and Claude on 2026-04-25 evening. Muxin confirmed: *"yes, we need it"* — re-promoting from post-launch backlog to active.

## Why

Two Supabase tables already exist (`calendar_events`, `email_flags`, both from migration 0006) and the assembler already reads them when building the daily-brief context. Today they only ever hold seed rows for Sam — no real data flows in. The mocked OAuth flow in `web/intently-extras.jsx` (`OAuthFlow`) simulates Google consent → auth → success with `setTimeout`s and writes nothing. So the daily brief never gets a real "you have a 9 AM standup, you have an unanswered email from Anya" moment for any real user.

This is the difference between a brief that says "you set goals around shipping and recovery" (vague, abstract — what we have today for new users) and a brief that says "Anya's pitch follow-up is at 9:30, lunch with Jordan at noon, and you have three unread urgents from yesterday" (concrete, useful, the demo beat).

## What — the target experience

**Calendar (Google Calendar).**
- Profile → "Connect Google Calendar" → standard OAuth flow → server stores refresh token in **Supabase Vault** (locked 2026-04-25 — BWS deferred until ADR 0005 trigger) → background sync writes today's events into `calendar_events` rows.
- Sync cadence: pull on Profile-connect (initial backfill of today + tomorrow), and refresh on each daily-brief invocation (or on-demand from a "refresh" affordance) so events stay current.
- Read-only for V1. We don't write events back; we just read.

**Email (Gmail).**
- Profile → "Connect Gmail" → standard OAuth flow → server stores refresh token → background sync writes flagged messages into `email_flags` rows.
- "Flagged" semantics for V1: starred + unanswered-where-user-was-the-recipient + matches an "urgent" heuristic (sender-priority + keyword detection). Don't pull the full inbox; we only need the top-of-mind signal.
- Sync cadence: pull on connect, refresh on daily-brief invocation, debounced to ~hourly.

**The brief reading them.**
- `web/lib/context-assembler.js` already reads from these tables. No changes needed downstream — once rows exist, they flow into the agent context automatically.

**Disconnect.**
- "Disconnect" affordance per integration in Profile. Revokes token server-side; deletes local rows; user starts fresh next time they connect.

## Acceptance criteria

Drafted here per § AC location matrix (cross-cutting infra → handoff).

**OAuth flow:**
- [ ] `OAuthFlow` in `intently-extras.jsx` is replaced (or rewired) to invoke a real Supabase Edge Function endpoint that initiates Google's OAuth dance and persists the refresh token server-side.
- [ ] Refresh token is stored in **Supabase Vault** (encrypted), *never* in the browser, *never* committed to git, *never* logged to console.
- [ ] OAuth scopes are minimum-necessary: `calendar.readonly` for calendar, `gmail.readonly` (or `gmail.metadata` if it suffices) for email. No write scopes.
- [ ] Connection state is reflected on the Profile sheet: ⚪ disconnected / 🟢 connected with last-sync timestamp.

**Calendar sync:**
- [ ] On connect: today + tomorrow events (8 AM – 11 PM local) backfill into `calendar_events`. Verified: open Profile → Connect → check `calendar_events` table, see real rows.
- [ ] On daily-brief invocation: events refresh (debounced if recent). New/changed events overwrite, deleted events are removed.
- [ ] Multi-calendar support deferred: V1 reads the user's primary calendar only.
- [ ] Source-of-truth identifier: each row has a `google_event_id` for idempotent upserts.

**Email sync:**
- [ ] On connect: top-50 flagged messages (per V1 "flagged" semantics) backfill into `email_flags`.
- [ ] On daily-brief invocation: refresh debounced to ~hourly.
- [ ] PII handling documented: we store sender, subject, received_at, urgency flags. We do NOT store message bodies.
- [ ] Source-of-truth identifier: each row has a `gmail_message_id` for idempotent upserts.

**Brief integration:**
- [ ] On a real account with calendar + email connected, daily-brief output references at least one specific event AND at least one specific email when both are non-empty. Verified by inspecting agent output + input traces.

**Disconnect:**
- [ ] Per-integration disconnect revokes Google token (server-side `revoke` call) and deletes the user's `calendar_events` / `email_flags` rows.
- [ ] After disconnect, re-connect works and re-backfills cleanly.

**Security:**
- [ ] No secrets in git (gitleaks passes).
- [ ] Edge function logs scrub access tokens.
- [ ] Refresh-token storage location is documented in an ADR.

## Open questions for grooming

1. ~~**Where does the refresh token live?**~~ **DECIDED 2026-04-25: Supabase Vault.** ADR will document the choice. BWS deferred until the multi-user/scale trigger from ADR 0005 lands.
2. **Edge function vs. background sync?** Pull-on-demand from inside the daily-brief invocation is simplest (no scheduling needed). Background pull (cron'd) gives faster first-byte at brief-time. *Lean: pull-on-demand for V1, add background later when scheduled-agent-dispatch lands.*
3. **What counts as a flagged email?** Starred-only is too narrow; full-inbox-scan-with-AI is too expensive. *Suggested heuristic: starred + sender-in-VIP-list (extracted from prior interactions) + unanswered-where-user-was-direct-recipient + last 7 days. Revisit with real signal.*
4. **OAuth consent UX.** Google's consent screen is jarring in a calm app. *Mitigation: explain what we're asking for and why in 1 short sentence on the Profile sheet before the redirect.*

## Dependencies / sequencing

- Independent of **new-user-ux-and-auth** — but the value of OAuth lands strongest after that handoff ships, since OAuth assumes a real user with goals/projects to enrich. Order: ship setup expansion first, then OAuth.
- Independent of **scheduled-agent-dispatch** — but if both ship, OAuth refresh becomes background-cron'd instead of brief-time'd.

## Files this work touches (rough)

- `web/intently-extras.jsx` — replace mocked `OAuthFlow`
- New: `supabase/functions/oauth-google/index.ts` — handles OAuth callback + token storage
- New: `supabase/functions/sync-calendar/index.ts` — pulls calendar events
- New: `supabase/functions/sync-email/index.ts` — pulls flagged emails
- `web/intently-profile.jsx` — connection-state UI
- `web/lib/context-assembler.js` — verify (already reads calendar_events + email_flags; no changes expected)
- New ADR: `docs/decisions/000X-google-oauth-token-storage.md`

## Estimate

Multi-day. Two integrations × (OAuth dance + sync function + UI wiring) ≈ 3–5 days. Calendar simpler than Gmail.

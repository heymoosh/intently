---
captured: 2026-04-25T23:00:00-05:00
session: chat/0425-210554
source: discussion
folds_into: .claude/handoffs/wiring-audit.md
---

# Chat → reminder path has three live bugs (no thinking indicator, date off-by-one, reminders written to wrong user_id)

`/groom` should fold these into the `wiring-audit` handoff's interaction inventory, OR break out into three § Next items if any are urgent enough to ship before the audit runs. All three are textbook examples of "wiring shipped but not integrated end-to-end" — the surfaces look right; the data flow is broken.

## Discovered while testing the deployed app on 2026-04-25 evening

Muxin opened the hero chat, sent "Yeah, can you remind me to get more grapes tomorrow?" The agent replied "Got it. I'll surface 'Get more grapes' on 2026-04-27." Muxin then went to the Future page → Admin · misc reminders band — the reminder was not there.

## Bug 1 — No visible "thinking" indicator while the agent is responding

**Where:** `web/intently-hero.jsx:366,540` — `HeroChat` has `pending` state, but the *only* visual feedback is the chat composer's placeholder text changing from "Say more, or ask a question…" to "Thinking…" (line 540) and the send button slightly dimming (line 553). The chat thread itself shows nothing — no typing dots, no animated bubble, no spinner.

**Why it matters:** classify-and-store calls Anthropic Haiku server-side with a network round-trip. On a slow connection or first-call cold-start, this can take 1–3 seconds. During that time the user sees their own message in the thread and total silence below. They reasonably assume the chat is broken.

**Suggested fix:**
- [ ] Insert a placeholder "agent is thinking" bubble into the thread while `pending === true`. Animated dots, the prototype's existing motion vocabulary (e.g., the `intentlyPulse` / `intentlyBreath` keyframes from `index.html`), or a horizontal three-dot loader matching the chat-bubble visual language.
- [ ] Optional: while pending, also dim the user's just-sent message slightly until the agent reply lands, so the visual rhythm reads "your turn → my turn" cleanly.

**Cross-reference:** the hero affordance state machine has a `'processing'` state with a real `ProcessingArc` ring (`intently-hero.jsx:208-223`) — but it's only used for voice-recording → transcript handoff, not for the chat-thread send. Reuse the same animation primitive for thread-pending so the hero and chat share one "agent is working" vocabulary.

## Bug 2 — Date math is off by one (UTC vs local timezone)

**What happened:** Today is 2026-04-25 (user's local time, CDT). User said "remind me to get more grapes tomorrow." Agent stored `remind_on: 2026-04-27`. That's two days from local-today, not one.

**Why:** `supabase/functions/reminders/index.ts:218` computes today as:
```ts
function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
```
This is **UTC date**, not user-local date. At 22:45 CDT it's 03:45 UTC the next day, so the server's "today" is already 2026-04-26 by UTC reckoning. The classifier prompt then resolves "tomorrow" relative to 2026-04-26 → 2026-04-27. Off-by-one in user-perceived terms.

**This is a class of bug, not just one location.** Anything server-side that does date math without a user-timezone parameter will drift the same way for any user west of UTC during their evening hours. The pg_cron `should_fire()` function is timezone-aware (it reads `profiles.timezone`); the reminders Edge Function is not.

**Suggested fix:**
- [ ] Pass user timezone (`profiles.timezone`) into the classify-and-store endpoint OR have the frontend pass `today` (computed in user's local timezone) as a request parameter. Option B is cheaper for V1 — the frontend already has `new Date().toLocaleDateString()` available; just send it.
- [ ] Update `buildClassifyPrompt` to accept the local `today` string and use it verbatim. The prompt already says "Today is ${today}. Resolve relative dates against today." — that's correct in shape; the input is wrong.
- [ ] Audit other Edge Functions for the same pattern (`ma-proxy`, anywhere with `new Date().toISOString().slice(0, 10)`).

## Bug 3 — Reminders are inserted but with the WRONG user_id

**This is the load-bearing bug** — explains why the reminder doesn't show up on the Future page even though the agent said it stored it.

**Where:** `supabase/functions/reminders/index.ts:9-15` (header comment):
> "V1 single-user shortcut: Writes use SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase) to bypass RLS, and attribute every row to the first user in auth.users (matching supabase/seeds/reminders.sql). This is a hackathon-only pattern — before multi-user, swap to JWT passthrough + row-level RLS policies that are already in place from migration 0003."

**The mechanic:** Edge function uses service-role key to bypass RLS, then writes the row attributed to `auth.users` row [0]. That's whichever account was first created in the project — likely the original Sam-seed-creating user. The current browser session has its own anon uid (created at first-use per `web/lib/supabase.js`), which is NOT user [0].

**Result:** the reminder IS being inserted into the `reminders` table (the row exists, somewhere, attributed to user [0]). The frontend's `listAdminReminders()` (`web/lib/entities.js:223`) filters by current `auth.uid()`. Mismatch → row invisible to the user who just created it.

The Future page → Admin band reads from `state.adminReminders` populated by `listAdminReminders()` (`intently-manual-add.jsx:316`). Filter eats the row. User sees nothing.

**Suggested fix:**
- [ ] Refactor `supabase/functions/reminders/index.ts` to accept a JWT (the user's anon-session token) in the `Authorization` header and use it to identify the user instead of hardcoding `auth.users` row [0].
- [ ] Frontend caller (`web/lib/reminders.js:51` → `classifyTranscript`) attaches `Authorization: Bearer <session.access_token>` from `getSupabaseClient().auth.getSession()`.
- [ ] Edge function uses the JWT to call Supabase as the user (service-role key not needed; RLS policies from migration 0003 already cover owner-only writes).
- [ ] Migrate the seed SQL similarly so test/Sam data uses the right uid pattern, not the "first user in auth.users" hack.

**Why this is more urgent than bugs 1 + 2:** every reminder a real user creates in the deployed app today vanishes into a stale user's row. This is silent data loss from the user's perspective — no error, agent says "got it," reminder gone forever. Worse than a visible failure.

## Open question — the screenshot's first agent reply doesn't match the code path

The screenshot shows the agent responding to "Hi what can you do for me" with a 4-sentence Life Ops assistant introduction. But `HeroChat`'s `replyForClassify` (`intently-hero.jsx:371-381`) only returns three short canned strings (`"Got it. I'll surface..."`, `"Noted — I didn't pin it to a date..."`, `"Got it — I'll keep that in mind."`). The long "I'm your Life Ops assistant" reply is not in any of those. Either:

(a) There's a code path I missed (e.g., a separate chat skill that I haven't traced yet)
(b) The deployed bundle diverges from `main`
(c) The Edge Function's classify response includes a `reason` field that's being rendered somewhere I missed

`/groom` should verify which one before scoping fixes — if (a), the chat is doing two different things (classify-and-store AND a real chat skill) and the wiring story is more tangled than this capture assumes.

## Cross-references

- All three bugs are members of the category the **wiring-audit** handoff is designed to find. Specifically: "every interactive element has a wiring story end-to-end" — the chat composer button has a wiring story (call `classifyTranscript`), the classify endpoint has a wiring story (call Anthropic, insert reminder), but the cross-cutting integration (current-user-aware writes, timezone-aware date math, visible feedback during async work) was never enforced.
- Bug 3 (wrong user_id) overlaps with the **new-user-ux-and-auth** handoff's anon-first model — when real users start signing up via `linkIdentity()`, the "first user in auth.users" hack will keep mis-attributing every new user's reminders to the legacy seed user. The Edge Function refactor is a prerequisite for anon-first onboarding to work correctly.
- Bug 1 (no thinking indicator) is a small-scope visual fix worth shipping standalone, NOT folded into the audit.

## Suggested AC (if grooming routes any of these to § Next standalone)

For Bug 1:
- [ ] Send a chat message; observe a thinking-indicator bubble appears in the thread within 100ms of send and remains until the agent reply lands.
- [ ] On a throttled connection (Chrome DevTools "Slow 3G"), the indicator is visible the entire wait, not just for a frame.

For Bug 2:
- [ ] On a fresh test in CDT at 22:00 local, "remind me tomorrow" stores `remind_on` = local-tomorrow, not UTC-tomorrow.
- [ ] Same test repeats correctly at any local time (test 06:00, 14:00, 22:00 local).
- [ ] Add a unit test for the timezone resolution in the Edge Function or a smoke test in the cognition-verification-harness.

For Bug 3:
- [ ] After the refactor, a brand-new anon-session user creates a reminder via chat → row appears in `reminders` filtered by their `auth.uid()` — verifiable with a select against the table.
- [ ] Reminder appears in the Future page → Admin band on the next hydration.
- [ ] Two different anon-session users see only their own reminders, never each other's.
- [ ] Old reminders attributed to the legacy `auth.users[0]` user are either migrated, hidden, or the seed pattern is updated for parity.

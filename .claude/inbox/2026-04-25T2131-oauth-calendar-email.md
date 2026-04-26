---
captured: 2026-04-25T21:31:00-05:00
session: chat/0425-210554
source: discussion
handoff: .claude/handoffs/oauth-calendar-email.md
---

# OAuth — Google Calendar + Gmail intake

**Handoff already drafted at `.claude/handoffs/oauth-calendar-email.md`.** Re-promoting from TRACKER post-launch backlog ("Real OAuth — multi-day") into active work per Muxin's confirmation: *"yes, we need it."* `/groom` should add the TRACKER § Active handoffs row, register AC inside the handoff, update this inbox `resolved:` field, then delete this file.

## One-line intent

Replace the mocked `OAuthFlow` in `web/intently-extras.jsx` with real Google OAuth that pulls calendar events into `calendar_events` and flagged emails into `email_flags` — both tables already exist (migration 0006), the assembler already reads them, but they only ever hold seed rows today.

## Why this is in the inbox

Already in the post-launch backlog. The grooming move is to (a) lift it from "post-launch" into § Active handoffs, (b) confirm the handoff doc is the source of truth (replaces the one-line backlog row), (c) register AC in the handoff per the matrix.

## Substance

The brief is vague-and-abstract today because calendar/email rows are empty for any non-seeded user. Once OAuth is real: brief output shifts from "you set goals around shipping and recovery" → "Anya's pitch follow-up at 9:30, three unread urgents from yesterday." This is the demo beat and the difference between a goal-tracker and a daily-driver.

V1 scope: read-only, Google primary calendar only, ~50 flagged emails. Refresh tokens stored server-side (Supabase Vault or BWS — open question for grooming). PII discipline: store sender/subject/timestamps + flags, never message bodies. Standard disconnect path that revokes server-side and wipes local rows.

See handoff for full AC, open questions on token storage + email-flagging heuristics, file impact.

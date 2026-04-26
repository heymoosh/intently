---
captured: 2026-04-25T21:30:54-05:00
session: chat/0425-210554
source: discussion
handoff: .claude/handoffs/new-user-ux-and-auth.md
---

# New-user UX + auth — anon-first, account-upgrade, real setup

**Handoff already drafted at `.claude/handoffs/new-user-ux-and-auth.md`.** TRACKER row not added (execution session owns TRACKER right now). `/groom` should pick this up: read the handoff, verify it still reflects intent, add a TRACKER § Active handoffs row pointing at it, register AC at the location indicated by the handoff (cross-cutting → AC inside handoff), update this inbox file's `resolved:` field, then delete this file.

## One-line intent

The deployed app should treat any non-Muxin visitor as a brand-new user — kill the unconditional Sam seed on production, force a real first-run setup that captures enough state for day-1 brief to be useful, and offer optional account upgrade via Supabase `linkIdentity()` so anon users can preserve data without forcing signup upfront.

## Why this is in the inbox, not just TRACKER

Muxin explicitly directed this session to capture without touching TRACKER (execution session owns it). Per `.claude/commands/groom.md` partial-failure rule, an inbox file with a referenced handoff is the safety net — `/groom` will finish the TRACKER + AC writes when the execution session releases.

## Substance

Three coupled gaps, one coherent thread:

1. `seedSamIfEmpty` in `web/lib/seed-sam.js` runs on every fresh anon user via `web/intently-manual-add.jsx:286-296`. Production strangers land in Sam's life. Should be gated to `?dev=1` / localhost only.
2. Setup (`SetupFlow` at `web/intently-flows.jsx:2059`) is buried on the Profile sheet AND only intakes 3 goal titles → enriches with monthly_slice + glyph + creates one empty Admin project. Six of the seven assembler inputs (goals/projects/journal/calendar/email/reminders/yesterday's-review) are still empty after setup, so day-1 brief is hollow. Re-scope toward the original 6-phase setup that was V1-cut: goals, projects, this-week's-outcome, optional journal seed, preferences (4 time/day fields).
3. Anonymous Supabase auth + localStorage already persists across tab close (the misconception Muxin had was that it doesn't), but no recovery if you switch device or clear storage. Need a "save your account" CTA that uses Supabase `auth.linkIdentity()` to upgrade an anon user to a real one without losing the uid or any data.

See handoff for full AC, open questions, file impact, and 3-phase ship plan.

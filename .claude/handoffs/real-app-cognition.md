# Real-app cognition gap

**Slug:** `real-app-cognition`
**Opened:** 2026-04-25 (post-PR-#143)
**Status:** active — backlog defined, not started

## Why this exists

After PRs #136–#143 landed, the prototype shell works end-to-end: voice in, AddZones persist, refresh hydrates from Supabase, brief/review fire live agent calls, populated views reshape from agent output. **Capture-and-display is real.**

But the original UX promise (`docs/design/Superseded by Intently-App/app-experience.md` + `docs/design/Intently - App/HANDOFF.md`) was bigger than capture-and-display. It was an **agent that knows you across sessions**, with a setup flow, cross-day continuity, weekly/monthly cadence, and undo on every write.

This handoff names the gaps so we don't lose them, and orders them by leverage so the next sessions don't optimize the wrong thing.

## User-story map — works vs doesn't

### Working end-to-end
- "Tap mic, speak, get a reminder captured."
- "Open brief flow, type answers, get a live Opus 4.7 response."
- "Same for evening review."
- "Add a goal/project/plan-item/journal/reminder; refresh keeps it."
- "Hydration on app open shows my data."

### Looks like it works but doesn't
- **First-time user setup** — no onboarding flow at all. Setup MA agent provisioned, zero UI surface. New user lands in Maya/Sam's seeded narrative.
- **Brief knows my goals/journal/yesterday** — agent only sees the 2 sentences typed into BriefFlow. Doesn't read goals, projects, journal entries, prior reviews from DB. Every brief is amnesiac. Daily-brief SKILL.md says to read `Ops Plan.md`/`Monthly Goals.md`/`Daily Log.md`; V1 deployment constraint is "all context comes from user input." So the contract is satisfied trivially — the input has nothing.
- **Cross-day continuity** — `entries.kind='review'` persists; nothing reads it the next morning. The "yesterday's highlight" beat in the morning brief is hardcoded.
- **Auto-check shows what I did** — `AUTO_CHECK_ITEMS` is a hardcoded array in `intently-flows.jsx`, not inferred from today's plan_items / journal entries.
- **Past tab shows my journal** — `intently-journal.jsx`'s `JOURNAL_DATA` and `intently-reading.jsx`'s `ENTRY_DATA` are still fixtures. Read-on-mount only hydrated `useManualAdds.journal.today` for the inline list on PresentPlan.
- **Future tab shows my goals** — `FutureScreenProtoTappable` renders hardcoded `GOAL_DATA` + `PROJECT_DATA` for the top section. AddZones at the bottom show real adds, but the headline goals block is fixture.
- **Voice-captured reminders surface in tomorrow's brief** — `fetchDueReminders` + `formatRemindersForInput` helpers exist, never called from BriefFlow. The "memory moment" beat is broken.
- **Confirmation card shows what data the agent used** — `ConfirmationCard` supports `InputTrace`; brief/review confirm cards render no traces. Per ethical-AI design principle "explain before you act."
- **Undo any agent action** — placeholder Undo buttons in hero chat have no handlers; brief/review have no undo at all. Per `app-experience.md` § Undo safety net.
- **Weekly review on Sundays** — agent provisioned in MA console; no UI flow, no schedule trigger.
- **Monthly goal slice refresh on month boundary** — agent provisioned; no UI, no trigger.
- **Calendar/email integrations inform the brief** — all `setTimeout`-mocked OAuth; agent sees no calendar context.

## Diagnosis — the structural gap

We shipped the **shell**: voice in, types-into-typed-Entries, persists, reads back on refresh. We did NOT ship the **cognition**: every agent call is amnesiac because nothing assembles the user's persisted state into the agent's input.

The fixes split into two layers:

1. **Cognition layer** — give the agent memory of who the user is between sessions. Highest leverage: a single change (the context assembler) elevates every brief/review response from "generic reflection on what you typed" to "this knows my week."
2. **Display layer** — replace remaining hardcoded fixtures with DB reads, build setup + weekly/monthly UI, wire undo + input traces. Important but lower per-unit leverage.

Estimate: ~2–3 days of focused engineering before the shipped product matches the original vision.

## Backlog — ordered by leverage

| # | Task | Leverage | Effort | Notes |
|---|---|---|---|---|
| 1 | **Context assembler** | ⭐⭐⭐ highest | ~half-day | Function called before each `callMaProxy({skill, input})` that reads active goals + this week's entries + yesterday's review + due reminders, formats them into the input. Single-point lift for both brief and review quality. |
| 2 | **Cross-day continuity** | ⭐⭐⭐ | ~half-day | Yesterday's review entry's `committed_to_tomorrow` + journal text feeds today's brief context (via #1). |
| 3 | **Reminders → brief input** | ⭐⭐ | ~1 hour | Already-built `fetchDueReminders` + `formatRemindersForInput` called at BriefFlow open. Closes the memory-moment beat. |
| 4 | **Auto-check from real entries** | ⭐⭐ | ~2 hours | ReviewFlow's auto-check list pulled from today's plan_items + journal entries instead of hardcoded array. |
| 5 | **Setup flow** | ⭐⭐⭐ | ~1 day | First-run onboarding: capture 3 goals + monthly slice + schedule pattern + preferences. Wires the existing setup MA agent. Without this, new users are stuck in Maya/Sam's narrative. |
| 6 | **Past tab DayView reads from entries** | ⭐⭐ | ~half-day | Replace `JOURNAL_DATA` + `ENTRY_DATA` fixtures with `listJournalEntries` + entries-by-day reads. |
| 7 | **Future tab reads from DB** | ⭐⭐ | ~half-day | Replace `GOAL_DATA` / `PROJECT_DATA` fixtures with `listGoals` / `listProjects`. |
| 8 | **Weekly review UI** | ⭐⭐ | ~1 day | New WeeklyReview overlay (mirrors BriefFlow), Sunday trigger or hero-invoked. Calls weekly-review MA agent. Persists summary + outcomes. |
| 9 | **Monthly goal slice refresh UI** | ⭐ | ~half-day | Month-boundary hero prompt → walks user through refreshing each goal's monthly_slice. |
| 10 | **Input traces on confirm cards** | ⭐ | ~2 hours | BriefConfirmCard + ReviewConfirmCard render `InputTrace` showing what the agent looked at. |
| 11 | **Undo on agent writes** | ⭐ | ~half-day | Hero chat action cards' Undo buttons get handlers; brief/review confirm cards add Undo. |

Items 12+ (post-launch per `app-experience.md` "Out / deferred"):
- Real OAuth (Google calendar/email/Slack)
- Multi-user auth (replace anonymous sign-in)
- Toggle persistence for `done` flags (now technically possible since #143)
- Visual polish (PainterlyBlock variants, Collage backdrops, gradient CTAs)

## How to resume

1. Read this doc.
2. Pick the next undone item from the leverage-ordered table.
3. Open a focused PR. Update this doc's table when an item lands.
4. Smoke-test live (Playwright + console) before declaring done — same pattern that caught the `_client` collision and the API `version` issue this session.

## Anti-pattern to watch for

Don't ship cognition-layer fixes that pile on more typed prompts ("now type your goals into this prompt too"). The whole point is the agent reads the user's existing data. If a fix makes the user repeat themselves, it's the wrong fix.

# Weekly Goals — Week of 2026-04-19

## Review of Last Week

**Scores (1-10):** Output 7 · Focus 6 · Energy 6 · Progress 7
**Biggest positive:** runSkill() agent runner working with tool-use loop — it finally feels like a real execution layer
**Biggest drag:** context switching between spec writing and coding — killed at least one solid AM block, maybe two
**Monthly priority check:** Priority #1 (ship demo) partially served — agent runner and design tokens landed, but demo flows still not end-to-end. Priority #2 (workouts) slipped to 2x — skipped Friday. Priorities #3 and #4 not touched.
**Reflection patterns:**
- Energy dips mid-afternoon on most days, especially after a focused AM block
- Cleaner progress on days with a single clear focus (Thursday last week was the best day)
- Scattered on days the task list mixed spec and code work
- Entered the week already running a bit low — sleep debt from the prior week showing up
- Some real excitement on Friday when the agent runner clicked into place

**Last week's Done summary:** runSkill() with tool-use loop merged, design tokens port to React Native, npm audit pre-commit check, spec cleanup (Monthly Goals separated from Ops Plan)

## This Week's Outcome-Directions

1. Demo flows end-to-end — daily brief, daily review, weekly review all running against seed data
   - Why now: hackathon closes Friday; no more runway
   - Known paths: seed data branch first, then agent runner Supabase wiring, then test each flow
   - Done when: can record a clean 3-flow demo without stopping to debug
   - Serves monthly priority: #1

2. Seed data that makes the demo feel real
   - Why now: without good seed data the flows produce generic output — that's the demo failure mode
   - Known paths: seed-data-v1 branch (this week's first track)
   - Done when: all three flows have real content to work from; weekly-review has a believable prior week to surface
   - Serves monthly priority: #1

3. Agent runner wired to Supabase
   - Why now: the demo needs live reads to be convincing; faking it from local files is a fallback
   - Known paths: runSkill() exists; need the Supabase connection and markdown_files table reads
   - Done when: daily-brief reads from Supabase seed data, not local files
   - Serves monthly priority: #1

4. Design token coverage on demo-critical screens
   - Why now: tokens are ported but not applied; raw values still in the screens
   - Known paths: work screen-by-screen starting with brief and review views
   - Done when: the three demo flow screens render with tokens in Expo Go
   - Serves monthly priority: #3

## Pre-Mortems & Risk Flags

- Supabase wiring might hit auth or RLS issues and eat half a day — mitigation: if stuck past 2 hours, fall back to agent reading local /seed files for the demo
- Scope creep: tempting to add one more thing before Friday — keeping this list at 4, nothing new
- Energy: three sprint days is fine; four shows — if Thursday feels rough that's a signal, not a problem to push through

## Recurring Commitments

- Strength training: Mon, Wed, Fri — 45 min, morning slot
- Family call: Sunday evening

## Not This Week

- Email or calendar integrations (not_connected is the graceful path; no loss for the demo)
- Multi-user isolation (V1 is single-user)
- New UI features outside the three demo flows
- Job searching, social, any project not named above

## System Notes

- Daily Log contains Mon–Thu of this week; week-of-Apr-12 archived
- first_run_complete: true — full review pattern applies
- calendar_mcp and email_mcp both not_connected — brief and review will note this and continue

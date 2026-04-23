# Intently Strategy

**Type:** Strategy doc — why this project exists and how we're building it

## Why This Project Exists

Productivity tools fail because they require the user to remember to use them. Intently's premise: scheduled managed agents do the work on a cadence, and the mobile UI reflects state rather than requesting input. The user's recurring life operations — daily brief, weekly review, monthly planning — run whether or not they think to open the app.

The personal test: I forget the slow drift. The agents don't. That's the whole point.

## Current Approach

- **Runtime:** Anthropic Managed Agents for scheduled, stateful skill runs
- **Mobile UI:** React Native + Expo — reflects agent output, triggers runs on demand
- **Data layer:** Supabase — markdown_files table stores all life-ops files; agents read/write via MCP
- **Skills:** one skill per life-op (daily-brief, daily-review, weekly-review); shared conventions prepended to each prompt
- **V1 scope:** single-user, no calendar/email integrations, three demo flows

## Key Decisions

- 2026-04-01: Managed Agents as runtime (ADR 0001) — scheduled and stateful; avoids the "remember to ask" failure mode of conversation-first AI
- 2026-04-10: Monthly Goals separated from Ops Plan — keeps the cascade clean; Ops Plan is inventory, Monthly Goals is the filter
- 2026-04-15: Supabase as the data layer — markdown_files table; agents read/write via MCP connection
- 2026-04-20: Single-user V1 — per-user isolation deferred; ship something real first

## Learnings

- 2026-04-15: The skill/tool boundary needs to be explicit early — what's in the prompt vs what's a tool call. Drift here creates unpredictable behavior.
- 2026-04-17: Porting design tokens early is worth it — the UI feels intentional instead of placeholder, which matters for a demo.

## Open Questions

- How does first-run setup feel on mobile? The onboarding conversation needs real testing.
- Will the daily-brief output feel useful for someone who isn't the builder?
- At what point does multi-user isolation become necessary vs. safely deferred?

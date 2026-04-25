# `app/lib/render/` — DB rows → agent-context markdown

The app stores user state as typed Postgres rows (`goals`, `projects`, `entries`).
Agents read context as markdown strings shaped by their `SKILL.md`. The render
layer is the bridge: pure functions that pull DB rows and emit the markdown
each agent expects. **DB is the source of truth; markdown is a render-on-demand
view.**

## Why

Decoupling app reads from agent context shape lets each side evolve at its own
pace. The app gets typed lists/cards/forms straight from rows. Agents continue
to read the conversational, sectioned format their skill prompt was tuned
against — without the app having to write or sync markdown files.

If an agent's expected shape changes, the relevant render function changes;
nothing about the underlying data has to move.

## Per-agent wire-format target

The authoritative shape for a given agent's input lives in its
`agents/<skill>/SKILL.md` (sections it reads, ordering, what's optional). When
adding or updating a render function, read that file first; it's the contract.

For pre-live wire-format examples (what the agent has historically been fed),
see the fixtures under `app/fixtures/`.

## Currently implemented

- `daily-brief-context.ts` — context for `agents/daily-brief/`. Renders weekly
  goals, yesterday's daily log, calendar/email placeholders, and recent project
  state. Output mirrors `app/fixtures/daily-brief-seed.ts → DAILY_BRIEF_DEMO_INPUT`.

Add new render functions as siblings (`<agent>-context.ts`) with their own
`*.test.ts` next to them.

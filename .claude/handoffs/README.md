# `.claude/handoffs/` — project briefs

One file per **project** (not per session). A project is anything coalesced enough to have an intent + goals + first decisions, and likely to span >1 session or involve multiple files/branches.

Convention reference: `docs/process/session-handoff.md`. Slash command: `/handoff`. CLAUDE.md § "Session handoff" describes when to propose creating one.

## Lifecycle

- **Create** at the kickoff moment — the conversation has converged on a project. Either Claude proposes `/handoff <slug>` and you accept, or you invoke it manually.
- **Update** continuously: in-conversation as decisions land (Claude appends inline), and at session-end via `/handoff` for the clean re-distill (the "if these two idiots knew what they were doing from the get-go, here's the happy path" pass).
- **Persist** — handoffs are NOT deleted on completion. They become candidates for periodic review to extract repeatable patterns into routines/loops/process docs.

## Slug rules

- One slug per project. Slug = TRACKER item slug where possible (e.g. `steward-redesign`, `entries-architecture`).
- File = `.claude/handoffs/<slug>.md`. No timestamps in the filename — the file is the project's living artifact, not a session snapshot.
- Before creating, check existing slugs. If a handoff already exists for the work, **continue it** — never create a duplicate.

## What goes in (and what doesn't)

In: original intent (stable), goals, decisions made (with one-line rationale), decision log (tried/rejected with why), state-as-of-now, next steps, open questions.

Out: raw conversation transcript, exploratory back-and-forth, abandoned threads. The point is the clean happy-path version, not a stenographic record.

## Pointer from TRACKER

Every active handoff appears in `TRACKER.md` § "Active handoffs" as a one-line pointer. When TRACKER's hot queue references a project that has a handoff, link to it.

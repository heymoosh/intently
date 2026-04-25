# Session handoff convention

Project briefs at `.claude/handoffs/<slug>.md` — one file per project, persistent across sessions. Replaces the old per-session rolling `.claude/session-handoff.md` and the nightly Session Handoff Steward (deprecated 2026-04-25; both removed in `chat/handoff-steward-redesign`).

The metaphor is a **program manager**: not in every meeting, not doing every task, but holds the clean state of every project — intent, goals, decisions, next steps — so the work doesn't lose continuity when context evaporates.

## When to create one

Propose `/handoff` at the **kickoff moment** — the conversation has produced:

1. A stated goal in Muxin's own words.
2. At least one non-trivial decision with a one-line rationale.
3. Work that is plausibly multi-session or multi-file.

Skip for quick fixes, single-PR work, exploratory chats that haven't crystallized, or anything where the next session can pick up cleanly from TRACKER alone.

The slash command (`.claude/commands/handoff.md`) handles slug resolution, existence check, and TRACKER pointer wiring.

## What a handoff contains

The clean happy-path view, not the conversation transcript. Sections (in order):

1. **Original intent.** One paragraph in Muxin's words. Stable across the project's life — does not get rewritten unless Muxin explicitly redefines it.
2. **Goals.** Bulleted.
3. **Decisions made.** Each with a one-line rationale.
4. **Decision log (tried / rejected).** What we considered and didn't pick, with why.
5. **State as of `<date>`.** What's actually built/deployed/in flight. File paths, PR numbers.
6. **Next steps.** Numbered, action-biased.
7. **Open questions.**

What does **not** belong: raw chat history, exploratory back-and-forth, abandoned threads, victory-lap recaps. The transcript lives in git history if anyone needs to mine it.

## Update cadence

- **In-conversation (continuous).** As new decisions or state-changes land mid-session, append them inline. Cheap, immediate. Same posture as updating TRACKER mid-session.
- **End-of-session re-distill.** Invoke `/handoff <slug>` at session close (or before any major context switch). Re-reads the active handoff + recent conversation, produces the clean happy-path version — locks decisions, sharpens next steps, strips noise. The "if these two idiots knew what they were doing from the get-go" pass.

## Slug + lifecycle rules

- One slug per project. Slug = the TRACKER item slug where possible (e.g. `steward-redesign`).
- File = `.claude/handoffs/<slug>.md`. No timestamps in the filename. The file is a living artifact, not a session snapshot.
- Before creating, check `.claude/handoffs/` for an existing slug that matches the work. If present, **continue it** — never create a duplicate.
- Handoffs are **not auto-deleted**. When a project ships, set `Status: shipped` in the doc and leave the file. Periodic review (deferred routine) mines completed handoffs for repeatable patterns to promote into routines/loops/process docs.

## TRACKER coupling

Every active handoff has a one-line pointer in `TRACKER.md` § "Active handoffs". The handoff doc names which TRACKER section it tracks at the top. Bidirectional, so neither doc drifts.

When `/start-work` walks Critical items, it surfaces "this item has an active handoff at `<path>`" so a fresh session continues the existing handoff rather than starting fresh.

## Style

- Concrete over prose. Bullets, file paths, names, PR numbers.
- Convert relative dates to absolute (`"by Thursday"` → `"by 2026-04-23"`).
- Link to specific files/sections rather than paraphrasing them.
- No victory-lap recapping. The handoff is for the next operator, not the previous one's audit trail.

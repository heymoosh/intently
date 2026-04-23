# Session handoff convention

How a Claude Code session ends so the next session picks up cleanly. The rolling handoff file is `.claude/session-handoff.md`; it is overwritten (not appended) at the end of every non-trivial session.

## What a handoff contains

Every handoff covers four things:

1. **What was done.** Concrete deliverables, decisions, and changes landed this session.
2. **What's still TBD and why.** Work known to be incomplete, with the reason it was deferred (blocker, scope cut, out of time). The "why" matters — the next session judges whether the reason still holds.
3. **What the next session should start with.** A single next-action bias. Not a backlog dump; the one thing to pick up first.
4. **Decisions to carry forward.** Non-obvious calls made this session that the next session would otherwise re-litigate. Include a one-line rationale so the decision can be challenged if circumstances change.

## When to write one

- **Always** at the end of any session that merged code, changed architecture, or made a decision.
- **Skip** only for read-only or trivially reactive sessions (e.g. one-question answers, a single typo fix).
- If unsure, write one. The cost is low; the cost of the next session re-deriving context is higher.

## Where to find prior context

- `.claude/session-handoff.md` is the single current handoff.
- History lives in git. `git log .claude/session-handoff.md` shows every prior handoff version; `git show <sha>:.claude/session-handoff.md` reads one.
- Don't accumulate handoffs in separate files. The rolling file is deliberate — it forces the author to distill, not dump.

## Style

- Concrete over prose. Bullets, file paths, names.
- Convert relative dates to absolute (`"by Thursday"` → `"by 2026-04-23"`).
- Link to specific files/sections rather than paraphrasing them.
- No victory-lap recapping. The handoff is for the next operator, not the previous one's audit trail.

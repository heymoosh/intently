# Handoff — Session Handoff Steward redesign

**Slug:** `steward-redesign` · **Tracked by:** `TRACKER.md` § Active handoffs
**Started:** 2026-04-25 · **Last updated:** 2026-04-25
**Status:** active (initial implementation in `chat/handoff-steward-redesign`; iterate as we use it)

## Original intent

> "Think of yourself as a program manager. What would a program manager do? First, they try to understand the intent of whatever project scope they've been handed. Then they do this kickoff where they check in with everybody and they're like, 'Hey, we're officially starting this project, and here's the goal of what we're trying to do.' That's when it starts making sense to actually start creating some artifacts like the session handoff in more detail."
>
> "Anytime you and I are working on something together, there's a chance that it evolves into something like a project where there's a lot of information and memory that needs to get stored somewhere, and we can't rely on your built-in tools."
>
> The handoff is the **clean program-manager view** — original intent, decisions, next steps — not a transcript. It's a hedge against Claude's context loss across sessions, a place to hold project state that the conversation alone can't carry forward. It is **not** an audit trail of every conversation; the messy "figuring it out" half of any meeting is noise we explicitly strip out.

## Goals

- One artifact per **project** (not per session) that survives across sessions and parallel worktrees.
- A **kickoff trigger** that fires when the conversation has produced intent + goals + first decisions — not at every session start.
- A **continuous-update cadence** that keeps the doc current as work evolves: inline updates mid-session + clean re-distill at session boundaries.
- **Anti-duplication.** A new session resuming work finds the existing handoff and continues it.
- **Persistence past completion.** Handoffs are never auto-deleted — they become candidates for periodic pattern-review to extract repeatable workflows into routines/loops/process docs.

## Decisions made

- **Per-project file, not per-session.** Slug-named (`<slug>.md`), no timestamps. — Aligns the artifact with what it represents (a project, not a meeting).
- **Trigger = conversational kickoff + manual `/handoff`.** No Stop hook in v1. — Stop hook would fire on every session, including exploratory chats that don't warrant an artifact. Conversational judgment is the right gate.
- **`.claude/handoffs/<slug>.md`** as the path. — Neutral name, doesn't lie about scope (vs `session-handoffs/` which read session-scoped).
- **TRACKER.md gets `## Active handoffs`** as a one-line index. — Bidirectional pointer: TRACKER → handoff, handoff → TRACKER.
- **Slug = TRACKER item slug** where possible. — One project, one TRACKER row, one handoff file. Forever.
- **Never auto-delete.** Set `Status: shipped` and leave the file. — Pattern-review later may promote repeated patterns to durable process docs.
- **Pattern-review routine deferred.** Scaffolded as bottom-of-TRACKER "way later" item. — Nothing to review against until ≥3 handoffs accumulate.
- **No SessionEnd hook in v1.** Manual `/handoff` invocation only. — Cleaner v1; the harness hook can be added in a follow-up if friction emerges.

## Decision log (tried / rejected)

- **Stop hook fires on every session** (TRACKER's literal spec) — rejected. Wrong for exploratory chats. Replaced with conversational kickoff heuristic.
- **One file per session, timestamped filename** (TRACKER's literal spec) — rejected. Project work spans sessions; multiple files per project would fragment the canonical state.
- **Delete on completion** (TRACKER's literal spec) — rejected. Loses the pattern-review angle Muxin called out: completed handoffs are the raw material for repeatable workflow docs later.
- **Rename `.claude/session-handoffs/` → `.claude/project-briefs/`** — considered, rejected. Too narrative; `.claude/handoffs/` is shorter and reads cleanly as either session-or-project.
- **Build the pattern-review routine in this PR** — rejected. Premature optimization; defer until ≥3 handoffs exist to mine.

## State as of 2026-04-25

**Branch:** `chat/handoff-steward-redesign` (this PR, not yet open).

**Shipped in this branch:**
- `.claude/commands/handoff.md` — `/handoff` slash command (CREATE + UPDATE flows, slug resolution, anti-duplication, TRACKER pointer wiring).
- `.claude/handoffs/README.md` — convention summary.
- `.claude/handoffs/steward-redesign.md` — this file (dogfood: the new system describing itself).
- `CLAUDE.md` § "Session handoff" rewritten — triad described, kickoff heuristic embedded, in-conversation update rule + re-distill rule.
- `docs/process/session-handoff.md` rewritten as the new convention reference.
- `.claude/settings.json` permissions updated: removed writes to `.claude/session-handoff.md`, added writes to `.claude/handoffs/*`.
- `.claude/commands/start-work.md` updated to reference `.claude/handoffs/` and `## Active handoffs`.
- `.claude/routines/release-readiness-steward.md` + `scope-overnight-steward.md` references updated.

**Removed:**
- `.claude/routines/session-handoff-steward.md` (the nightly cron brief).
- `.claude/session-handoff.md` (stale 2026-04-22 nightly output; preserved in git history).
- `~/Library/LaunchAgents/com.intently.session-handoff.plist` — `launchctl unload` + plist file removed (system-level, this machine).

**TRACKER updates:**
- `## Active handoffs` section added pointing here.
- Doc-hierarchy header line updated.
- Old "Critical item #1 — steward redesign" + Follow-up bullet superseded with pointer to this handoff.
- Renumbered Critical items: design-folder reconciliation = new #1, reminders intent = #2, parked worktree = #3.
- "Way later" section added at bottom with the deferred pattern-review routine note.

## Next steps

1. Open PR for `chat/handoff-steward-redesign`. Confirm CI green (docs-check.yml will check CLAUDE.md size; should be ~78 lines, under the 100 cap).
2. Merge. Delete the `.claude/worktrees/*` references in this branch only if they're tracked — leave detached worktrees on disk untouched (they're separate trees, will reconcile on their own when their branches rebase).
3. **Resume the original /start-work flow** — pick up at the new Critical #1 (design folder reconciliation, applying spec-intent rule on the entries-architecture work). When that work coalesces enough to warrant a handoff, propose `/handoff entries-architecture` to dogfood the system on a real second project.
4. After 3+ handoffs accumulate (current + entries-architecture + at least one more), revisit the deferred pattern-review routine. Add it as a real routine if the patterns are visible.

## Open questions

- **Should `/handoff` auto-detect "kickoff" without me proposing it?** Currently the heuristic lives in CLAUDE.md as guidance for Claude to *propose* — Muxin still has to accept. Looser version: Claude just creates the file and tells Muxin. Decide after 2-3 real proposes.
- **Worktree sessions and handoffs.** A handoff at `.claude/handoffs/<slug>.md` in main lives independently of any worktree. If a worktree session updates the handoff, that update is a tracked-file change in the worktree's branch and lands on main when the worktree's PR merges. This means parallel tracks on the same project would race on the handoff file — but in practice, parallel tracks slice the project into independent slugs, so each track has its own handoff. Confirm this assumption holds when the entries-architecture parallel tracks actually spawn.
- **What lives in CLAUDE.md vs the convention doc.** Right now CLAUDE.md has the kickoff heuristic + update rules; the convention doc has the longer "what goes in" template. Watch for drift; fix CLAUDE.md first if so per its own house rule.

# Handoff — Session Handoff Steward redesign

**Slug:** `steward-redesign` · **Tracked by:** `TRACKER.md` § Active handoffs
**Started:** 2026-04-25 · **Last updated:** 2026-04-25 (post-merge)
**Status:** shipped — system live; doc preserved for pattern review. Iterate via separate handoffs if behavior needs to change.

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
- **SessionEnd hook deferred at v1.5 decision point too** (post-merge, 2026-04-25). — Muxin's explicit call after seeing the live system. Accept the manual-trigger reliability gap; reconsider if real friction emerges. The mitigation is documented and small (~30 lines of `.claude/settings.json` + a prompt hook), so reversal cost is low.

## Decision log (tried / rejected)

- **Stop hook fires on every session** (TRACKER's literal spec) — rejected. Wrong for exploratory chats. Replaced with conversational kickoff heuristic.
- **One file per session, timestamped filename** (TRACKER's literal spec) — rejected. Project work spans sessions; multiple files per project would fragment the canonical state.
- **Delete on completion** (TRACKER's literal spec) — rejected. Loses the pattern-review angle Muxin called out: completed handoffs are the raw material for repeatable workflow docs later.
- **Rename `.claude/session-handoffs/` → `.claude/project-briefs/`** — considered, rejected. Too narrative; `.claude/handoffs/` is shorter and reads cleanly as either session-or-project.
- **Build the pattern-review routine in this PR** — rejected. Premature optimization; defer until ≥3 handoffs exist to mine.

## State as of 2026-04-25 (post-merge)

**Shipped via PR [#79](https://github.com/heymoosh/intently/pull/79)**, merged to `main` as commit `ce7d0c4` on 2026-04-25. Local main synced; `chat/handoff-steward-redesign` deleted. 21 files changed, +260 / −397.

**Live in main:**
- `/handoff` slash command at `.claude/commands/handoff.md` — registered, confirmed in active skills list. CREATE + UPDATE flows, slug resolution, anti-duplication, TRACKER pointer wiring.
- `.claude/handoffs/README.md` — convention summary.
- `.claude/handoffs/steward-redesign.md` — this file (the dogfood; updated post-merge in `chat/handoff-steward-status-shipped`).
- `CLAUDE.md` § "Session handoff" — triad, kickoff heuristic, in-conversation update rule, re-distill rule.
- `docs/process/session-handoff.md` — rewritten as the new convention reference.
- `.claude/settings.json` permissions — handoff path scope.
- `.claude/commands/start-work.md` — points at `.claude/handoffs/` and `§ Active handoffs`.
- `.github/workflows/auto-merge-safe.yml` — `MECHANICAL_RE` regex updated; handoffs intentionally NOT mechanical (substantive artifacts → docs/config classifier → `needs-user-review`).
- Two routine briefs + three loop/command briefs + parallel-tracks/definition-of-done/CONTRIBUTING references updated.

**Removed (no longer in repo):**
- `.claude/routines/session-handoff-steward.md` (the nightly cron brief).
- `.claude/session-handoff.md` (stale 2026-04-22 nightly output; preserved in git history).
- `.claude/launchd/plists/com.intently.session-handoff.plist` (tracked launchd plist).
- `~/Library/LaunchAgents/com.intently.session-handoff.plist` — `launchctl unload` + plist file removed (system-level, this machine).

**TRACKER state:**
- `## Active handoffs` lists this file with `Status: shipped`.
- Doc-hierarchy header reflects the triad.
- Critical items renumbered (design-folder reconciliation = new #1, reminders intent = #2, parked worktree = #3).
- `## Way later` holds the deferred pattern-review routine + a stale-ref-sweep follow-up (Blueprint, design doc, acceptance-criteria, seed-data session prompt).

**Stale-ref status:** All workflow-affecting references updated. Doc-only references (Blueprint section 9, design doc line 139, acceptance-criteria.md lines 3+50, seed-data session prompt line 137) are listed under TRACKER § Way later for a sweep when convenient — no runtime effect.

## Next steps

1. **Resume the `/start-work` flow** at the new Critical #1 — read `docs/design/Intently - App/` end-to-end (`CLAUDE.md`, `BUILD-RULES.md`, `HANDOFF.md`, prototype files). Apply "Spec intent > spec letter" with Muxin on entries/reminders. Produce v2 entries-architecture session prompt.
2. **Propose `/handoff entries-architecture`** when that work coalesces — the second real test of the system (UPDATE flow on a multi-session project, possibly across parallel `intently-track` worktrees).
3. **After ≥3 shipped handoffs accumulate** (this one + entries-architecture + at least one more), revisit the deferred pattern-review routine. Build it if patterns are visible enough to mine.
4. **Sweep doc-only stale refs** (`docs/Claude Code Repo-Ready Blueprint.md`, `docs/design/claude-code-implementation.md`, `docs/process/acceptance-criteria.md`, `docs/process/session-prompt-seed-data-v1.md`) at convenience. Tracked under TRACKER § Way later. No runtime effect; cleanup hygiene only.

## Open questions

- **Manual-trigger reliability.** No automated trigger means we depend on Claude proposing `/handoff` at kickoff and Muxin invoking at session-end. Track real friction across the next 2–3 handoffs (entries-architecture and beyond). If active handoffs go stale repeatedly, revisit the deferred SessionEnd hook.
- **Should `/handoff` auto-detect "kickoff" without me proposing it?** Currently the heuristic lives in CLAUDE.md as guidance for Claude to *propose* — Muxin still has to accept. Looser version: Claude just creates the file and tells Muxin. Decide after 2-3 real proposes.
- **Worktree sessions and handoffs.** A handoff at `.claude/handoffs/<slug>.md` in main lives independently of any worktree. If a worktree session updates the handoff, that update is a tracked-file change in the worktree's branch and lands on main when the worktree's PR merges. Parallel tracks on the same project would race on the handoff file — in practice, tracks slice the project into independent slugs, so each track has its own handoff. Confirm this assumption when entries-architecture parallel tracks actually spawn.
- **What lives in CLAUDE.md vs the convention doc.** CLAUDE.md has the kickoff heuristic + update rules; the convention doc has the longer "what goes in" template. Watch for drift; fix CLAUDE.md first per its own house rule.

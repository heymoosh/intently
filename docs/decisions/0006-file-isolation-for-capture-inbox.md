# ADR 0006 — File isolation for capture inbox

## Status

Accepted (2026-04-25).

## Context

Building the capture/groom/execute workflow (`.claude/handoffs/capture-groom-execute.md`) raised the question of where raw, ungroomed user captures should live. The natural first instinct was a `## Inbox` section inside `TRACKER.md` — TRACKER already owns the queue, the inbox is just the pre-queue. One file, one queue.

But TRACKER is a shared writer across many surfaces:
- Discussion sessions write to it (Status updates, Log entries)
- Execution sessions write to it (PR scraper appends to § Follow-ups, items move between sections)
- Background agents write to it (`intently-update-tracker` MA agent)
- Multiple sibling worktrees may all be writing to it concurrently

Adding a § Inbox section to TRACKER would mean every captured idea = one more TRACKER write contending for that shared file. The auto-resolver memory handles mechanical conflicts (different sections appended), but **semantic-move conflicts** (one session moving an item, another session updating the same row) are exactly the failure mode the auto-resolver corrupts silently via newer-supersedes.

For Muxin specifically: his brain fires ideas in fast parallel bursts. He explicitly does not want to track which files each idea touches. The system has to absorb collisions, not him.

## Decision

**Captures live in `.claude/inbox/<timestamp>-<slug>.md` — one file per item, NOT in a TRACKER `## Inbox` section.**

- Each `/capture` invocation creates a brand-new file
- New-file writes from any session can never conflict (different paths, no shared writer)
- Files are tracked in git but ephemeral — drained by `/groom` after the items are routed into TRACKER / handoffs / AC files
- `.claude/inbox/` is NOT gitignored, so captures survive across sessions and are visible to all worktrees that pull main

## Alternatives considered

1. **TRACKER § Inbox section.** Rejected: same-file write contention. Every capture = one TRACKER write competing with execution sessions, scrapers, and routines.

2. **Single shared `.claude/inbox.md` file with append-only writes.** Rejected: still single-file write contention. If two sessions append simultaneously, one append wins. Per-item files are strictly better — zero collision possibility.

3. **`.claude/inbox/` directory but per-session subdirs.** Rejected: over-engineered. Per-item files in a flat directory work fine for one user and small inbox volumes.

4. **Inbox lives outside the repo (e.g., `~/.claude/intently-inbox/`).** Rejected: loses git tracking, makes it harder for other sessions/worktrees to see captures, breaks the per-project ergonomic.

## Consequences

**Pros:**
- Zero git conflicts on capture, ever (each capture = new file).
- Discussion sessions can capture freely without touching TRACKER, eliminating the most common parallel-write hot spot.
- Capture surface is decoupled from execution surface — they can run concurrently safely.
- Simple grooming model: `/groom` reads the directory, processes each file, deletes after success.

**Cons:**
- More files in `.claude/inbox/` than a single inbox section would have lines (one file per item).
- File-name conventions (timestamps + slugs) become load-bearing for chronological ordering.
- Existing TRACKER auto-tooling (PR scraper, `intently-update-tracker` MA agent) doesn't natively know about inbox; only `/groom` and `/work-next` consume it. PR scraper continues to append directly to TRACKER § Follow-ups (those PR-derived bullets are pre-groomed by the PR author's intent and skip the inbox path).

**Implications for the doc system:**
- Inbox slots between TRACKER and handoffs as the "pre-queue" layer in the doc hierarchy
- Doc hierarchy in TRACKER updated to: launch-plan → TRACKER → `.claude/inbox/` → `.claude/handoffs/<slug>.md` → `docs/product/acceptance-criteria/`

This ADR documents the design call so future sessions don't re-litigate it.

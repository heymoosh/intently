# Capture / Groom / Execute — workflow system

Persistent project handoff for the three-mode workflow Muxin and Claude designed 2026-04-25 to fit Muxin's fast-firing-ideas brain and his existing TRACKER-centric infrastructure.

## Why

Muxin fires ideas in parallel and doesn't want to track which files each touches. Prior approach (rules in CLAUDE.md to coordinate parallel sessions) hit a ceiling — rules are session-local and can't coordinate live. He wants the system to absorb collisions, not him.

Existing TRACKER + auto-tooling (PR scraper, intently-update-tracker agent, merge-done sync) already does state management. The missing piece was a low-friction capture surface that doesn't collide with execution.

## What

Three modes total, each with role-locked tooling:

| Mode | Trigger | Writes | Sibling-safe? |
|---|---|---|---|
| **Discussion / capture** | Default state. `/capture` slash command OR auto-capture during conversation | `.claude/inbox/<timestamp>-<slug>.md` (new files only) | Yes — per-item files, no shared writer |
| **Grooming** | `/groom` explicit invocation, OR session-start prompt when inbox is non-empty | TRACKER section / per-skill AC file / triggers `/handoff` | No — defer until sibling clears |
| **Execution** | `/work-next` explicit invocation | TRACKER + code + PRs | It IS the only execution session at a time |

## File layout

- `.claude/inbox/<timestamp>-<slug>.md` — raw captures, one file per item, frontmatter (captured, session, source) + body. Tracked in git, ephemeral (drained by /groom).
- `.claude/commands/capture.md` — `/capture` skill (Phase 1 ✅ shipped 2026-04-25)
- `.claude/commands/groom.md` — `/groom` skill (Phase 2)
- `.claude/commands/work-next.md` — `/work-next` skill (Phase 2)
- `scripts/session-precheck.sh` — extended to count inbox + surface in precheck (Phase 2)

## Grooming — what it does

Per inbox item:
1. Show item, restate intent in one sentence
2. Ask clarifying question if ambiguous
3. Check dependencies (open PRs, related TRACKER rows, recent commits)
4. Decide destination together:
   - **§ Next** — execute now, in this priority order
   - **§ Critical items** — needs a decision before it can move
   - **§ Follow-ups** — pending manual / flight-test
   - **§ Way later** — backlog
   - **(reject)** — delete the inbox file
5. Write to chosen TRACKER section, with any added scope notes
6. If multi-session work (per CLAUDE.md handoff threshold), trigger `/handoff` to spin up a project doc
7. If item touches an existing skill, update that skill's AC file at `docs/product/acceptance-criteria/<skill>.md`
8. Delete the inbox file

Periodic plan summaries every 3-5 items so user can course-correct.

End condition: inbox empty OR user says "good enough."

## Execution — what it does

`/work-next`:
1. Branches from `origin/main` (always current — solves the sync question)
2. Reads TRACKER § Next, picks top item
3. Refuses items still in `.claude/inbox/` (rejects with "groom this first")
4. Executes (code + tests + PR)
5. Self-checks against per-skill AC file before claiming done
6. PR includes "## Manual follow-ups" section with TRACKER state changes — existing scraper handles the merge-done sync

Loops to next item.

## Doc system this fits into

| Doc | Role | Lifespan |
|---|---|---|
| TRACKER.md | Hot queue + state index | Always current |
| `.claude/inbox/` | Ungroomed raw captures | Ephemeral (drained by /groom) |
| `.claude/handoffs/<slug>.md` | Project depth — WHY/HOW for multi-session work | Persistent, never auto-deleted |
| `docs/product/acceptance-criteria/<skill>.md` | Definition of done — verifiable bullets, per skill | Immutable during build |
| `docs/decisions/` (ADRs) | Decision records | Permanent (superseded, not deleted) |

Each doc has a unique payload — no overlap. Verified by the "fight for existence" test: deleting any one loses something the others don't carry.

## Phase 1 (this session — 2026-04-25)

- `.claude/wt-intent.md` declared (ref: exploratory)
- `.claude/inbox/` created (.gitkeep tracked)
- `.claude/commands/capture.md` written
- `feedback-auto-capture-during-discussion.md` memory saved
- This handoff written
- Phase 2 work captured into `.claude/inbox/` for self-dogfood

Items captured this session for first /groom session to drain:
- babysit-prs and build-watchdog known issues
- /groom skill build
- /work-next skill build
- session-precheck.sh inbox-count update
- TRACKER doc-hierarchy pointer
- CLAUDE.md one-line pointer
- ADR for file-isolation decision

## Phase 2 (deferred — needs sibling sessions to clear before TRACKER writes are safe)

1. `/groom` skill at `.claude/commands/groom.md`
2. `/work-next` skill at `.claude/commands/work-next.md`
3. `scripts/session-precheck.sh` extension for inbox count
4. TRACKER doc-hierarchy row addition
5. CLAUDE.md one-line pointer (within 100-line cap)
6. ADR documenting file-isolation decision

Phase 2 work is itself in `.claude/inbox/` as captures — first /groom session drains them and starts Phase 2 execution. Self-dogfooding the system.

## Open tradeoffs explicitly accepted

- **Single-threaded execution.** One `/work-next` at a time = throughput cap. For genuinely parallel overnight work, scheduled background agents (existing infra) handle that — not interactive sessions.
- **Grooming requires user attention.** No version of this system removes priority/scope decisions. Session-start prompt batches them so they don't interrupt execution; doesn't eliminate them.
- **Auto-capture posture relies on Claude consistency.** Mitigated by feedback memory + CLAUDE.md pointer + end-of-session checkpoint, not eliminated. User should call out misses.
- **First /groom session must wait** until sibling sessions clear. Inbox keeps growing meanwhile — that's fine; capture is decoupled.

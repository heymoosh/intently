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
| **Grooming** | `/groom` explicit invocation, OR session-start prompt when inbox is non-empty | TRACKER section / AC at appropriate location (see § AC location matrix) / triggers `/handoff` | No — defer until sibling clears |
| **Execution** | `/work-next` explicit invocation | TRACKER + code + PRs | It IS the only execution session at a time |

## File layout

- `.claude/inbox/<timestamp>-<slug>.md` — raw captures, one file per item, frontmatter (captured, session, source) + body. Tracked in git, ephemeral (drained by /groom).
- `.claude/commands/capture.md` — `/capture` skill (Phase 1 ✅ shipped 2026-04-25)
- `.claude/commands/groom.md` — `/groom` skill (Phase 2)
- `.claude/commands/work-next.md` — `/work-next` skill (Phase 2)
- `scripts/session-precheck.sh` — extended to count inbox + surface in precheck (Phase 2)

## AC location matrix

AC always exists for every task that needs to be executed to expectations. **Where** it lives varies by task type — never default to "per-skill AC file":

| Task type | AC lives at |
|---|---|
| Touches an MA skill (daily-brief, weekly-review, etc.) | `docs/product/acceptance-criteria/<skill>.md` (per-skill, append entries) |
| Multi-session work with a handoff | "Acceptance criteria" section inside the handoff itself |
| Standalone non-skill task (bug fix, doc update, small infra) | Inline in the TRACKER row + restated in PR description checklist |
| Cross-cutting / system-level / workflow infra | In the handoff (if one exists) OR `docs/product/acceptance-criteria/<topic>.md` (per-topic, not per-skill) |

The unifying principle: **AC lives wherever the work's source of truth lives.** Existence is universal; location varies.

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
7. Write/update AC at the location appropriate to the task type (see § AC location matrix)
8. Delete the inbox file

Periodic plan summaries every 3-5 items so user can course-correct.

End condition: inbox empty OR user says "good enough."

## Execution — what it does

`/work-next`:
1. Branches from `origin/main` (always current — solves the sync question)
2. Reads TRACKER § Next, picks top item
3. Refuses items still in `.claude/inbox/` (rejects with "groom this first")
4. Executes (code + tests + PR)
5. Self-checks against the task's AC — read from per-skill file / handoff AC section / TRACKER-row inline as appropriate (§ AC location matrix)
6. PR includes "## Manual follow-ups" section with TRACKER state changes — existing scraper handles the merge-done sync

Loops to next item.

## Doc system this fits into

| Doc | Role | Lifespan |
|---|---|---|
| TRACKER.md | Hot queue + state index | Always current |
| `.claude/inbox/` | Ungroomed raw captures | Ephemeral (drained by /groom) |
| `.claude/handoffs/<slug>.md` | Project depth — WHY/HOW for multi-session work; may carry an AC section | Persistent, never auto-deleted |
| `docs/product/acceptance-criteria/<skill-or-topic>.md` | Definition of done — verifiable bullets, per-skill OR per-topic (cross-cutting infra) | Immutable during build |
| `docs/decisions/` (ADRs) | Decision records | Permanent (superseded, not deleted) |

Each doc has a unique payload — no overlap. Verified by the "fight for existence" test: deleting any one loses something the others don't carry.

## Phase 1 (this session — 2026-04-25)

- `.claude/wt-intent.md` declared (ref: exploratory)
- `.claude/inbox/` created (.gitkeep tracked)
- `.claude/commands/capture.md` written
- `feedback-auto-capture-during-discussion.md` memory saved
- `feedback-ac-location-not-skill-only.md` memory saved (after AC scope correction)
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
- TRACKER § Active handoffs row for agent-noticing-layer
- Drift-check loop extension for workflow integrity

## Phase 2 (deferred — needs sibling sessions to clear before TRACKER writes are safe)

1. `/groom` skill at `.claude/commands/groom.md`
2. `/work-next` skill at `.claude/commands/work-next.md`
3. `scripts/session-precheck.sh` extension for inbox count
4. TRACKER doc-hierarchy row addition
5. CLAUDE.md one-line pointer (within 100-line cap)
6. ADR documenting file-isolation decision
7. TRACKER § Active handoffs row for `agent-noticing-layer` handoff
8. Drift-check loop extension for cross-skill invariants

Phase 2 work is itself in `.claude/inbox/` as captures — first /groom session drains them and starts Phase 2 execution. Self-dogfooding the system.

## Acceptance criteria — for this workflow itself

System-level AC. Phase 1 must satisfy items marked ✅; Phase 2 closes the rest.

**Capture surface (Phase 1, shipped 2026-04-25 in PR #149):**
- ✅ `/capture` is loaded as a slash command (Claude Code recognizes it)
- ✅ `/capture <text>` writes a new file at `.claude/inbox/<timestamp>-<slug>.md` with frontmatter (captured, session, source) + body
- ✅ `/capture` echoes one line: `captured: <slug>` — no other commentary
- ✅ `/capture` does NOT commit, paraphrase, suggest TRACKER destinations, or pre-groom
- ✅ Inbox files survive across sessions (committed to git; `.claude/inbox/` is NOT gitignored)
- ✅ Auto-capture posture during discussion documented as memory (`feedback-auto-capture-during-discussion.md`)

**Grooming surface (Phase 2, shipped 2026-04-26):**
- ✅ `/groom` skill at `.claude/commands/groom.md` — reads `.claude/inbox/*.md` and processes each per the § Grooming checklist
- ✅ Order of writes specified and load-bearing: handoff → TRACKER row → AC → inbox `resolved:` field → delete inbox file
- ✅ Partial-failure rule encoded: if any of (handoff/TRACKER/AC/resolved) fails or is blocked, inbox file is RETAINED
- ✅ Per-item audit line format specified: `groomed: <slug> → <destination>; handoff: <ref>; AC: <ref>; inbox: deleted/retained`
- ✅ Cross-doc reference check specified (handoff ↔ TRACKER row, AC ↔ task-type matrix)
- ✅ Sibling-aware preflight: refuses to start when sibling session is active; suggests capture-only mode
- ⏳ End-to-end live verification (pending first real grooming session)

**Execution surface (Phase 2, shipped 2026-04-26):**
- ✅ `/work-next` skill at `.claude/commands/work-next.md`
- ✅ Refuses items still in `.claude/inbox/` with "groom this first"
- ✅ Branches from `origin/main` (always current)
- ✅ AC self-check mandatory; PR description lists each AC criterion with passed/failed
- ✅ PR includes `## Manual follow-ups` section so existing scraper handles merge-done sync
- ⏳ End-to-end live verification (pending first real execution session)

**Session lifecycle integration (Phase 2, shipped 2026-04-26):**
- ✅ `scripts/session-precheck.sh` counts `.claude/inbox/*.md` and surfaces in `[inbox]` block on every session start
- ✅ Sibling-aware suggestion: "no active siblings — safe to /groom now" vs "sibling session active — capture-only mode recommended"
- ⏳ Stale-inbox detection deferred to drift-check Pass 3 (not in precheck)

**Cross-skill invariants (Phase 2 drift-check Pass 3, shipped 2026-04-26):**
- ✅ `.claude/loops/decision-drift-check.md` Pass 3 added: workflow integrity invariants
- ✅ Verifies handoff ↔ TRACKER row consistency, AC for shipped non-trivial items, ADR consistency, stale inbox files
- ⏳ Loop wired to launchd cron (deferred per existing TRACKER follow-up — post-hackathon)

**Doc-system docs (Phase 2, shipped 2026-04-26):**
- ✅ ADR 0006 at `docs/decisions/0006-file-isolation-for-capture-inbox.md`
- ✅ TRACKER doc-hierarchy row updated: `launch-plan → TRACKER → .claude/inbox/ → .claude/handoffs/ → docs/product/acceptance-criteria/`
- ✅ CLAUDE.md one-line pointer added (within 100-line cap)
- ✅ TRACKER § Active handoffs rows for `capture-groom-execute` (shipped) and `agent-noticing-layer` (deferred V1.1)

## Integrity invariants — what /groom and /work-next MUST enforce

The system relies on these holding. Skill internals enforce them at action time; the drift-check loop catches drift between actions.

**/groom — per-item invariants (halt-and-surface if any fail):**

1. **Order of writes is fixed.** When destination is "multi-session work":
   - (a) Write handoff doc
   - (b) Add TRACKER § Active handoffs row pointing at the handoff
   - (c) Write/update AC at appropriate location (per § AC location matrix)
   - (d) Update inbox capture's `resolved:` frontmatter field (pointer to handoff)
   - (e) Delete inbox file
   - **Partial failure rule:** if any of (a)–(d) fails or is blocked (e.g. TRACKER write blocked by sibling), DO NOT execute (e). The unprocessed inbox file is the safety net.
2. **Per-item audit line.** After processing, /groom emits one line: `groomed: <slug> → <destination>; handoff: <ref or "none">; AC: <ref or "none">; inbox: deleted/retained`. Goes to user output AND appended to TRACKER § Log on session end.
3. **Cross-doc reference check.** After grooming, verify: handoff's TRACKER ref ↔ TRACKER row's handoff ref agree; AC location ↔ task type agree (per § AC location matrix). Flag mismatches, don't auto-fix.

**/work-next — per-item invariants:**

1. **Refuses ungroomed items.** If asked to execute something still in `.claude/inbox/`, returns "groom this first" and stops.
2. **AC self-check is mandatory.** Before claiming done, must read the task's AC from its appropriate location (per § AC location matrix), verify each criterion, list which passed/failed in the PR description. If criteria fail, do not claim done.
3. **PR includes "## Manual follow-ups" section** with all TRACKER state changes the merge should produce. Existing scraper handles the merge-done sync.

**Cross-skill invariants (drift-check loop verifies these periodically):**

- Every TRACKER § Active handoffs row points at a real `.claude/handoffs/<slug>.md` file (and vice versa: every handoff doc has a row, unless explicitly archived/shipped)
- Every shipped non-trivial item has AC at an appropriate location (per § AC location matrix)
- Every TRACKER "Active decisions" row points at a non-superseded ADR
- Every inbox file older than N days is flagged stale (rotting captures = grooming debt)

**Audit trail.** TRACKER § Log gets a per-session block summarizing what was groomed/executed/decided. /handoff session-end + /groom completion both append to it. Source of truth for "did this go through the gates?"

## Open tradeoffs explicitly accepted

- **Single-threaded execution.** One `/work-next` at a time = throughput cap. For genuinely parallel overnight work, scheduled background agents (existing infra) handle that — not interactive sessions.
- **Grooming requires user attention.** No version of this system removes priority/scope decisions. Session-start prompt batches them so they don't interrupt execution; doesn't eliminate them.
- **Auto-capture posture relies on Claude consistency.** Mitigated by feedback memory + CLAUDE.md pointer + end-of-session checkpoint, not eliminated. User should call out misses.
- **First /groom session must wait** until sibling sessions clear. Inbox keeps growing meanwhile — that's fine; capture is decoupled. The deferred TRACKER row for `agent-noticing-layer` is itself an inbox item documenting this exact pattern.

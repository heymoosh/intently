The user invoked `/groom` to walk through `.claude/inbox/*.md` and route each item to its proper destination. Full spec: `.claude/handoffs/capture-groom-execute.md`.

## Preflight (must pass before grooming begins)

1. **Sibling check.** Run `bash scripts/session-locks.sh check`. Also list other worktrees via `git worktree list` and read each one's `.claude/wt-intent.md` if present. If any sibling is active, surface the conflict — /groom writes TRACKER + AC + may trigger handoff creation, all of which can collide with sibling work. Pause and ask user explicitly: "wait (capture-only mode)" OR "override and groom anyway." Default to wait; require user opt-in to override. The auto-resolver memory handles routine TRACKER conflicts but is *exactly wrong* for grooming-vs-sibling semantic-move collisions (newer-supersedes silently picks one and loses the other's intent).

2. **Inbox state.** Read `.claude/inbox/*.md` (excluding `.gitkeep`). If empty, exit cleanly with "inbox is empty — nothing to groom."

## Per-item invariants (halt-and-surface if any fail)

For each inbox item, in chronological order by filename timestamp:

1. **Restate intent.** Read body, summarize in one sentence: "I read this as: <one sentence>." User confirms or corrects before proceeding.

2. **Surface dependencies.** Run `gh pr list --state open --limit 20`; run `git log --oneline -20`; read TRACKER § Critical items / § Next / § Active handoffs for related rows. List potential conflicts or related work.

3. **Decide destination together.** Options:
   - **§ Next** — execute now, in this priority order
   - **§ Critical items** — needs a decision before it can move
   - **§ Follow-ups** — pending manual / flight-test
   - **§ Way later** — backlog
   - **(reject)** — delete the inbox file

4. **Order of writes is fixed.** When destination is multi-session work (per CLAUDE.md handoff threshold: goal stated + non-trivial decision with rationale + plausibly multi-session/multi-file):
   - (a) Write handoff doc (use `/handoff` slash command if appropriate)
   - (b) Add TRACKER § Active handoffs row pointing at the handoff
   - (c) Write/update AC at the appropriate location per § AC location matrix in `.claude/handoffs/capture-groom-execute.md`:
     - Touches MA skill → `docs/product/acceptance-criteria/<skill>.md`
     - Multi-session handoff → "Acceptance criteria" section inside the handoff
     - Standalone non-skill task → inline in TRACKER row + restated in PR description
     - Cross-cutting / system-level → in handoff (if exists) OR `docs/product/acceptance-criteria/<topic>.md`
   - (d) Update inbox capture's `resolved:` frontmatter field (pointer to handoff/destination)
   - (e) Delete inbox file
   - **Partial-failure rule:** if any of (a)–(d) fails or is blocked, DO NOT execute (e). The unprocessed inbox file is the safety net.

5. **Per-item audit line.** After processing, emit one line:
   ```
   groomed: <slug> → <destination>; handoff: <ref or "none">; AC: <ref or "none">; inbox: deleted/retained
   ```
   Save to running session log; append to TRACKER § Log on session end.

6. **Cross-doc reference check.** After each item, verify: handoff's TRACKER ref ↔ TRACKER row's handoff ref agree; AC location ↔ task type agree per the matrix. Flag mismatches; do NOT auto-fix.

## Periodic plan summaries

Every 3-5 items, emit a short summary:
- groomed so far: count
- remaining: count
- any cross-cutting decisions surfaced

Allow user to course-correct without sitting through every item.

## End condition

End when inbox is empty (all files processed) OR user says "stop" / "good enough for now." On end, append session summary (all per-item audit lines) to TRACKER § Log.

## What NOT to do

- **Don't execute the work.** Grooming is sort + decide; `/work-next` executes.
- **Don't skip the preflight sibling check.** Sibling-active = pause; never silently overwrite TRACKER.
- **Don't auto-fix cross-doc reference mismatches.** Surface them; the user decides.
- **Don't delete inbox files until ALL invariant writes confirmed.** Partial failure → retain.
- **Don't paraphrase user intent without confirming.** Restate the item, then act.

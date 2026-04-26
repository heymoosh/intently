The user invoked `/work-next` to execute the top item from TRACKER § Next. Full spec: `.claude/handoffs/capture-groom-execute.md`.

## Preflight (must pass before execution)

1. **Refuse ungroomed items.** If user asks to execute something still in `.claude/inbox/`, return: "groom this first via /groom" and stop. Do not execute raw inbox items.

2. **Read TRACKER § Next.** If empty, return: "§ Next is empty — groom inbox first via /groom" and stop.

3. **Pick top item; confirm with user.** "Picking item X — confirm or pick another?" Wait for confirmation before branching.

## Execution loop

For the chosen item:

1. **Branch from `origin/main`** (always current — solves the sync question):
   ```
   git fetch origin
   git checkout -b work/<slug> origin/main
   ```

2. **Read AC for the task.** Per § AC location matrix in `.claude/handoffs/capture-groom-execute.md`:
   - Touches an MA skill → `docs/product/acceptance-criteria/<skill>.md`
   - Multi-session work with a handoff → "Acceptance criteria" section in the handoff
   - Standalone non-skill task → inline AC in the TRACKER row
   - Cross-cutting / system-level → in the handoff (if exists) OR `docs/product/acceptance-criteria/<topic>.md`
   
   If AC is missing entirely, DO NOT proceed: re-route with "this item needs grooming first to write AC" and stop.

3. **Build the work.** Code + tests + docs as needed. Follow CLAUDE.md and CONTRIBUTING.md conventions.

4. **AC self-check (mandatory before claiming done).** Read each criterion from its AC location, verify against the implementation, list passed/failed in the PR description's `## Acceptance criteria` checklist:
   ```
   ## Acceptance criteria
   - [x] Criterion 1
   - [x] Criterion 2
   - [ ] Criterion 3 — failed because <reason>; needs fix or re-scope
   ```
   If any fail, do NOT claim done. Either fix or pause for user decision.

5. **PR includes "## Manual follow-ups" section** with TRACKER state changes the merge should produce. Existing scraper handles the merge-done sync automatically.

6. **Loop or stop.** If user says "next," return to step 1 with new top item. If "stop," exit.

## What NOT to do

- **Don't execute ungroomed items.** Refuse and route to `/groom`.
- **Don't skip the AC self-check.** It's load-bearing for "done" claims; without it, "done" is a vibe, not a verifiable state.
- **Don't combine multiple TRACKER items into one PR** unless they're a coherent batch and the user explicitly OKs it.
- **Don't write to TRACKER directly for completion state.** Use the PR description's `## Manual follow-ups` section so the existing scraper handles the merge-done sync.
- **Don't merge directly to main without a PR.** Open a PR; let the user merge (or invoke `gh pr merge` only if user explicitly asks).

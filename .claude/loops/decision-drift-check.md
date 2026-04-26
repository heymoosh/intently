# decision-drift-check loop

**Purpose:** safety net for the session-end decision-record discipline (CLAUDE.md). Catches sessions that made decisions but forgot to update `TRACKER.md § Current state` or drop an ADR in `docs/decisions/`.

**Trigger:** invoked manually OR scheduled (launchd cron) once daily, evening. Wiring is project-state, not part of this spec — see "Wiring" at the bottom.

## What this loop does

1. **Pulls recent session transcripts** from `~/.claude/projects/-Users-Muxin-Documents-GitHub-intently/`. Default window: last 24h. The transcript files are JSONL with assistant/user/tool entries.

2. **Scans assistant outputs for decision-language keywords.** Flags any of:
   - "decided" / "we decided" / "let's go with" / "the right approach is" / "we should"
   - "supersedes" / "deprecates" / "replaces" / "superseded by"
   - "from now on" / "going forward" / "moving forward"
   - "stack will be" / "we're using" / "we'll use"
   - "current store" / "we'll store secrets in" / "secrets live in"
   - "scope: X is in" / "X is now in scope" / "X is now out of scope"
   - "ADR" mentioned without a corresponding `docs/decisions/<n>-` cite

3. **For each match:** extracts a 1-line summary of the decision context (~20 words around the keyword + the topic it touches).

4. **Compares against current TRACKER + ADRs:**
   - Read `TRACKER.md § Current state` rows + their pointer values.
   - Read `docs/decisions/*.md` titles + status.
   - For each candidate decision: check if the topic + value match an existing row or ADR.
   - If no match: flag as candidate drift.

5. **Writes findings** to `routine-output/decision-drift-<YYYY-MM-DD>.md` with this structure:

   ```
   # Decision drift — <date>
   
   **Window:** last 24h. Transcripts scanned: N.
   
   ## Drift candidates
   
   - **Topic:** <topic guessed from context>
     - **Decision summary:** <1-line>
     - **Source:** transcript-id, timestamp
     - **Suggested action:** Update TRACKER row [topic] / Draft ADR [filename]
   
   ## Confirmed (no action needed)
   
   - <decisions that matched a TRACKER row or ADR>
   ```

6. **Does NOT auto-edit** TRACKER or write ADRs. Output is advisory. User reviews on next morning routine; `/start-work` should surface this report alongside Critical items.

## Pass 2 — CLAUDE.md leanness audit

**Why:** the session-end discipline catches missed *decisions*; this pass catches CLAUDE.md *bloat*. Same trigger, same report.

**Inputs:** current `CLAUDE.md` + `TRACKER.md § Current state` rows + `CONTRIBUTING.md` section list.

**The test:** apply the 3-weeks test (CLAUDE.md house rule) to every line/rule in `CLAUDE.md`. Flag a line as a trim candidate if **any** of the following hits:

1. **Dated incident citation** — references a specific date (`YYYY-MM-DD`) or a one-time event ("the X misread", "the Y incident") as justification for a rule. Rule should stand on its own; the incident lives in memory + Log.
2. **Hardcoded user-specific path** — `/Users/<name>/`, `~/<dir>` for tooling layout, machine-specific paths. These break the moment another contributor clones or the user moves machines.
3. **Concrete file path used as a non-pointer** — a path mentioned inline (e.g. `.githooks/pre-commit`, `scripts/foo.sh`) that names *what enforces a rule* rather than *what to read*. These belong in the TRACKER "Enforcement + drift-check tooling" row; CLAUDE.md keeps the concept ("enforced by a pre-commit hook"), not the path.
4. **Project-state framed as durable** — anything in "Product intent — durable" or similar that names: a stack choice, a deploy URL, a list of journeys/skills/screens, an in/out-of-scope item, a deferred-feature claim. These belong in TRACKER `§ Current state` rows; CLAUDE.md only gets the *invariant* product framing.
5. **Operational how-to** — multi-step recipes, command syntax, decision trees about *how* to do a thing (commit, branch, deploy, migrate, recover). These belong in `CONTRIBUTING.md` or a runbook; CLAUDE.md gets a one-line pointer.
6. **Duplicates content already owned elsewhere** — restates something `TRACKER.md`, `CONTRIBUTING.md`, an ADR, or a memory file already owns. Per the "pointers > content" rule, link the owner instead.

**For each flagged line:** propose a destination — `TRACKER.md § <row>`, `CONTRIBUTING.md § <section>`, `docs/decisions/<n>-<slug>.md`, or memory — and the one-line replacement that should live in `CLAUDE.md` (or "drop entirely; no replacement needed").

**Append findings** to the same `routine-output/decision-drift-<YYYY-MM-DD>.md` under a `## CLAUDE.md leanness — trim candidates` heading. Include current line count vs. soft target (50) so growth pressure is visible.

**Does NOT auto-edit `CLAUDE.md`.** Trim is a decision; this pass is advisory.

## Pass 3 — workflow integrity invariants (capture/groom/execute)

**Why:** Pass 1 catches missed decisions; Pass 2 catches CLAUDE.md bloat; this pass catches drift in the capture/groom/execute workflow's cross-skill invariants from `.claude/handoffs/capture-groom-execute.md` § Integrity invariants. Skill internals enforce per-action; this pass catches drift between actions.

**Inputs:**
- `.claude/inbox/*.md` (current inbox state)
- `TRACKER.md` § Active handoffs rows
- `.claude/handoffs/*.md` files
- `docs/product/acceptance-criteria/*.md` files
- `docs/decisions/*.md` files
- `git log` for recently shipped items

**Invariants to verify:**

1. **Handoff ↔ TRACKER row consistency.** Every TRACKER § Active handoffs row points at a real `.claude/handoffs/<slug>.md` file (and vice versa: every handoff doc has a TRACKER row, unless explicitly archived/shipped per its own status).

2. **AC for shipped non-trivial items.** Every shipped non-trivial task (per recent merged PRs) has AC at an appropriate location per the AC location matrix:
   - Skill task → `docs/product/acceptance-criteria/<skill>.md` has an entry
   - Multi-session handoff → handoff has an "Acceptance criteria" section
   - Standalone task → AC was inline in TRACKER row at execution time (look at the PR description's `## Acceptance criteria` checklist)
   - Cross-cutting infra → AC in handoff or `docs/product/acceptance-criteria/<topic>.md`

3. **Active decisions ↔ ADR consistency.** Every TRACKER "Active decisions" row points at a non-superseded ADR in `docs/decisions/`. Superseded ADRs should have a banner; the TRACKER row should point at the newest non-superseded.

4. **Stale inbox files.** Any `.claude/inbox/*.md` file with mtime older than N days (default N=7) is flagged as stale. Rotting captures = grooming debt; the user should be prompted to /groom or reject.

**Failure modes the loop should report (do NOT auto-fix):**
- Orphan handoff (file exists, no TRACKER row)
- Dangling TRACKER row (row points at missing handoff file)
- Shipped item without AC entry
- Stale ADR ref (TRACKER row points at superseded ADR)
- Stale inbox file (>N days old)

**Append findings** to the same `routine-output/decision-drift-<YYYY-MM-DD>.md` under a `## Workflow integrity — drift candidates` heading. Same advisory posture: this pass is "review this," not auto-corrective.

## What this loop does NOT do

- Does not block sessions or hooks.
- Does not edit `TRACKER.md` or write ADRs autonomously — those are decisions, not bookkeeping.
- Does not delete or archive findings; reports accumulate in `routine-output/` like other routines.
- Does not page on call. False-positive rate is expected; treat findings as "review this," not "stop the line."

## False-positive handling

Decision-language keywords will fire on ordinary discussion ("I decided to read the file first" is not an ADR-worthy decision). The output should rank candidates by signal strength:

- **Strong signal (always flag):** "supersedes", "deprecates", "from now on", "stack will be", "store: X" with a topic hit.
- **Medium signal (flag with confidence note):** "we should X" / "let's go with X" without a clear topic hit.
- **Weak signal (skip or buried):** "decided to" inside obvious procedural context ("decided to merge this PR").

Heuristic: flag if the decision-summary mentions any topic from `TRACKER.md § Current state` rows.

## Wiring (TBD — choose one when implementing)

- **Manual (today):** user runs the loop on demand. Acceptable as a stopgap.
- **launchd cron (recommended for production):** add a plist matching the existing 7-routine pack. Daily, evening (after the user typically wraps). Output appears in morning's `routine-output/` for `/start-work` to surface.
- **Stop hook (lightweight, noisier):** `.claude/settings.json` Stop hook runs the keyword scan + injects a system-reminder when matches fire. Per-turn enforcement. Adds chat-thread chatter; only worth wiring if cron-loop misses too much.
- **SessionEnd hook (mid-weight):** fires once at end of session, prints a checklist. Less noisy than Stop, more surface than cron.

For Intently's hackathon timeline: ship with **manual** to start; layer **launchd cron** post-hackathon. Stop / SessionEnd hooks are post-launch enhancements if drift is still happening.

## Implementation outline (when someone builds it)

A simple bash + jq + grep pipeline is enough:

```sh
# Pseudocode
TRANSCRIPTS=$(find ~/.claude/projects/-Users-Muxin-Documents-GitHub-intently -name '*.jsonl' -mtime -1)
for f in $TRANSCRIPTS; do
  jq -r '.assistant_text // empty' "$f" \
    | grep -E -i 'decided|supersedes|going forward|stack will be' \
    | while read line; do echo "$f: $line"; done
done > /tmp/raw-flags.txt

# Then compare to TRACKER rows + ADR titles, format report.
```

Or a small TypeScript/Deno script. Both work. The keyword set is the load-bearing knob; tune it from real false-positive feedback.

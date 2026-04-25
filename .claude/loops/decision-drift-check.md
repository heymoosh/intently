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

# Handoff — Decision Drift Check Loop

**Slug:** `decision-drift-check` · **Tracked by:** `TRACKER.md` § Active handoffs
**Created:** 2026-04-25 · **Status:** spec landed; implementation deferred (nice-to-have, not hackathon-blocking)

## Original intent

Safety net for the session-end decision-record discipline (CLAUDE.md). Catches sessions that made decisions but forgot to update `TRACKER.md § Current state` or drop an ADR.

The discipline itself is on Muxin + me first — but humans forget, and "I'm not going to remember" was the explicit driver. This loop is the second line of defense: scans recent transcripts for decision-language, compares against TRACKER + ADR state, flags candidates.

## What's done

- **Spec doc:** `.claude/loops/decision-drift-check.md` (in main as of PR #105). Documents what the loop checks, output format (`routine-output/decision-drift-<date>.md`), false-positive heuristics, and three wiring options.

## What's NOT done (the actual work this handoff tracks)

1. **Wiring choice.** Spec lists three options: manual invocation, launchd cron (recommended for production), Stop hook (lightweight per-turn), SessionEnd hook (mid-weight). Pick one. Recommendation: launchd cron, daily evening, output picked up by next-morning `/start-work`.

2. **Implementation.** Bash + jq + grep pipeline OR small TypeScript/Deno script. Spec includes pseudocode. Tune the keyword set against real false-positive feedback.

3. **`/start-work` integration.** When the routine produces a `decision-drift-<date>.md`, surface it alongside Critical items at session start.

## What this handoff is NOT

This is **nice-to-have**, not blocking the hackathon submission. Don't pull anyone off demo-recording / submission work to do this. After hackathon is the right window.

## Open questions for whoever picks this up

- Cron schedule (evening daily? 4x/day? after every PR merge?) — defer until first reports come in.
- Keyword set — start from spec list, expand based on observed misses.
- False positive tolerance — spec says "rank by signal strength"; need to feel out the threshold from real output.
- Recovery: if the loop flags a missed decision, who actions it? Just shows up in `/start-work`, Muxin reviews + drops the ADR himself.

## Related

- Spec lives at `.claude/loops/decision-drift-check.md`
- Born from the 2026-04-25 conversation that produced PR #105 (CLAUDE.md consolidation)
- Pairs with the session-end discipline rule in `CLAUDE.md`

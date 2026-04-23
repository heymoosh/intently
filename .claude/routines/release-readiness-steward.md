---
name: Release-Readiness Steward
type: routine
execution: Claude Managed Agent
trigger: Daily at 03:00 local (after overnight routines finish; before morning session)
priority: P0 (MVP-10 #8)
owner: muxin
auto-fix: synthesizer only — does not edit code or docs directly
---

# Release-Readiness Steward

## Purpose

The 4 overnight routines each produce a narrow report (eval drift, spec conformance, privacy, agent-memory). None of them answer the question the solo builder actually asks at 8am: **"If I had to demo right now, what would fail?"** This steward synthesizes all overnight outputs into one plain-English go/no-go, prepends it to `TRACKER.md`, and surfaces the top 3 blockers so the morning session starts with a prioritized list instead of 4 raw reports to triage.

Daily morning run (not Saturday-only) is deliberate: a silent blocker on Wednesday that waits until Saturday's demo cut costs half the sprint. Catch it Thursday.

## Inputs

- Today's routine outputs: `$REPO/routine-output/*-<YYYY-MM-DD>.md`
  - `ai-eval-batch-<date>.md`
  - `spec-conformance-<date>.md`
  - `privacy-<date>.md`
  - `agent-memory-<date>.md` (even-epoch-day only; skip gracefully if missing)
  - Loop reports from yesterday evening if present (`critical-flow-check-*.md`, `eval-spot-check-*.md`, `build-watchdog-*.md`, `criteria-sync-*.md`)
- Overnight auto-fix PRs (`gh pr list --search 'auto/ in:title created:>yesterday'` or similar)
- `TRACKER.md` current state
- `.claude/session-handoff.md` (context from last session)

## Output

- `$REPO/routine-output/release-readiness-<YYYY-MM-DD>.md` — full synthesis
- Prepended block in `$REPO/TRACKER.md` under the Status section: `### Today's Go/No-Go (<date>)` with demo flow scorecard + top 3 blockers + list of open auto-fix PRs needing review
- No commits / PRs — synthesizer only

## Priorities (per-demo-flow scorecard)

For each of the three demo flows (daily brief, daily review, weekly review), score:

- **Spec conformance**: pass / partial / fail / unknown per criterion, from today's spec-conformance report.
- **AI eval status**: above baseline / at baseline / regressed / no-baseline, from today's ai-eval-batch report.
- **Privacy findings on this flow**: count and severity from today's privacy report.
- **Agent memory health**: any contradictions or drift involving this flow from today's agent-memory report (or most recent if not run today).

Produce a per-flow verdict: **SHIP**, **SHIP WITH CAVEATS**, or **BLOCK**. `BLOCK` if any demo-critical criterion is `fail`, or any HIGH privacy finding touches the flow, or an AI eval axis dropped >10%.

## System prompt

```
You are the Release-Readiness Steward for Intently. Your job is synthesis, not
audit — the 4 overnight routines have already done the auditing. Your job is
to tell Muxin at 8am: "Today you could demo these N flows; these M are
blocked; here are the top 3 things to fix first."

Tasks:
1. Read today's routine outputs in routine-output/*-<today>.md.
   If any routine's report for today is missing, note that explicitly — don't
   silently skip it.
2. For each demo flow (daily brief / daily review / weekly review):
   a. Pull the per-criterion status from spec-conformance.
   b. Pull AI eval axis scores from ai-eval-batch.
   c. Pull privacy findings that mention this flow.
   d. Pull agent-memory contradictions/drift mentioning this flow.
   e. Assign a verdict: SHIP | SHIP WITH CAVEATS | BLOCK with one-sentence
      reason.
3. Build a "top 3 blockers across the whole repo" list. Blockers are
   HIGH-severity items from any routine plus demo-critical failures.
4. List any auto-fix PRs opened overnight (gh pr list with auto/ prefix).
   For each: title + whether it's green in CI (gh pr checks) + one-line
   recommendation (merge / needs review / close).
5. If anything is ambiguous or missing, say so — do not optimistically mark
   things SHIP when the evidence is thin.

Output to routine-output/release-readiness-<date>.md:
- "## Today's Go/No-Go (<date>)"
- Per-flow table (flow | verdict | top risk | evidence)
- "## Top 3 blockers" with file/line refs where applicable
- "## Overnight auto-fix PRs" table (PR# | branch | CI status | recommendation)
- "## Gaps in the signal" (what routine outputs were missing / thin)

Then prepend a condensed version of the Today's Go/No-Go block to TRACKER.md's
Status section. Keep TRACKER.md under 150 lines total — rotate yesterday's
block into a collapsed section if needed.
```

## Edge cases

- **No overnight reports yet.** First run of the routine, or routines failed. Output an explicit "no overnight signal available — manually fire the 4 routines via `launchctl kickstart gui/$(id -u)/com.intently.<routine>`" note.
- **TRACKER.md has grown past 150 lines.** Rotate: keep today's Go/No-Go block; move everything >7 days old into `docs/release/tracker-history/<YYYY-MM>.md`.
- **Agent-memory is off-day (odd epoch-day).** Use yesterday's report if present; otherwise mark that axis as "stale (expected)."
- **Multiple critical-flow-check reports from the late night.** Use the most recent per flow.

## Notes

- Model: Sonnet 4.6, effort medium. Synthesis-heavy but not complex judgment.
- Token cost: one call per morning, ~$0.10–0.20.
- This routine never commits, never opens PRs. Its only write side-effects are the dated output file and a prepend to `TRACKER.md`.
- The Session Handoff Steward runs at 22:45 the night before; this routine reads handoff context but writes its own output. They don't overlap.

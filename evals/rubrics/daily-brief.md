# Daily Brief — rubric

Scoring criteria for the [`daily-brief`](../../agents/daily-brief/SKILL.md) skill. Consumed by the Claude-as-judge scorer (`evals/runner/scorers/`) against cases in [`evals/datasets/daily-brief/`](../../datasets/daily-brief/).

**Scale:** each axis scores `pass` (2), `partial` (1), or `fail` (0). The baseline (`evals/baselines/daily-brief.json`) sets per-axis minimums a run must clear.

Axes derive from acceptance criteria `CR-daily-brief-02` through `CR-daily-brief-06` (`docs/product/acceptance-criteria/daily-brief.md`) plus the skill-adherence rules in `agents/daily-brief/SKILL.md`. `CR-01` (pre-gathered on schedule) and `CR-05` (latency budget) are deterministic operational checks — not rubric-scorable — and are verified by the harness at run time.

---

## Axes

### 1. `prior_context` — references yesterday and recent state

Source: `CR-daily-brief-02`.

- **Pass:** names at least one concrete item from yesterday's Daily Log entry (blocker, stall, override, or shipped thing) AND references at least one active project's recent tracker state. Specifics — not generic "yesterday you worked on stuff."
- **Partial:** references prior context but only in generic terms ("you were working on Intently") or only references the calendar, not the log.
- **Fail:** brief reads like a fresh-start summary of today's calendar. No yesterday, no recent state.

### 2. `pattern_surfacing` — surfaces, never invents

Source: `CR-daily-brief-03`. This is the Opus-4.7-showcase axis — weight accordingly in the baseline.

- **Pass:** when `Weekly Goals.md` contains a "Review of Last Week" with pattern observations, the brief surfaces at least one of them verbatim-ish (user's words) as context. When that section is **absent**, the brief makes **no pattern claim**.
- **Partial:** surfaces a pattern but reframes it in agent-voice, losing user's own words, OR invents a pattern that was not in Weekly Goals.
- **Fail:** synthesizes cross-session patterns independently ("I've noticed you tend to...") when Weekly Goals had none, OR ignores the pattern section entirely when it was present.

### 3. `narrative_tone` — paragraphs, not a checklist

Source: `CR-daily-brief-04`.

- **Pass:** output is paragraphs. The proposed day sequence may use short bullets for the block list, but framing and reasoning are prose. Tone is direct and low-formality.
- **Partial:** mostly prose but drifts into multi-line bulleted sections beyond the day-sequence. OR tone is correct but uses corporate templating ("Here is your daily summary. Key items:").
- **Fail:** output is a bulleted report or a template with headers like "Calendar:", "Email:", "Tasks:". Reads as a dashboard dump.

### 4. `first_run_graceful` — coherent on empty memory

Source: `CR-daily-brief-06`.

- **Pass:** when `first_run_complete: false` in config, the brief acknowledges the thin state once ("this is your first week — the brief will be sparse until we have a few days of data") and proceeds with whatever minimal context exists. No apology loop. No error.
- **Partial:** acknowledges the empty state but either apologizes repeatedly or refuses to propose anything at all ("come back tomorrow").
- **Fail:** errors out, produces a confusing empty-state, or fabricates prior context.

### 5. `cascade_adherence` — P1 serves a Monthly Goal

Source: `agents/daily-brief/SKILL.md` step 1 and step 5. Derived from `CR-daily-brief-02`'s "memory working" via the Goals → Monthly → Weekly → Daily cascade.

- **Pass:** the proposed P1 block explicitly ties back to one of this month's priorities from `Monthly Goals.md`. The tie is stated in the brief ("this serves shipping Intently V1" / "this is the Monthly priority you named"), not implicit.
- **Partial:** P1 is reasonable but the Monthly-Goal tie is not stated, OR P1 ties to a Weekly Goal but not a Monthly one.
- **Fail:** P1 is a task with no line to a Monthly Goal, OR the brief silently drops the cascade and proposes something orthogonal to this month's priorities. If the user overrides away from a Monthly Goal and the brief does NOT name the trade-off out loud, that's also a fail.

### 6. `pacing_calibration` — reads intensity correctly

Source: `agents/daily-brief/SKILL.md` step 2.

- **Pass:** reads the last 1–3 days of Daily Log entries and journal reflections; proposes sprint, recovery, or balanced tone appropriately. After 2+ late/intense days, **must** nudge toward recovery or a hard stop. After 1–2 rest days, sprint is fine. The nudge is stated once, not hammered.
- **Partial:** pacing call is correct but weakly stated (no explicit hard-stop suggestion after consecutive late nights), OR the call is right but the brief contradicts itself by proposing 3 heavy blocks on a recovery day.
- **Fail:** suggests a sprint when the signal is clearly fatigue, OR suggests recovery when there's no signal for it, OR ignores pacing entirely.

### 7. `integration_grace` — `not_connected` is a note, not an error

Source: `agents/daily-brief/SKILL.md` step 3.

- **Pass:** when `calendar_enabled: false` or `email_enabled: false`, the brief notes the source is not connected — **once, briefly** — and moves on. No error; no retry language; no remedy-prompting the user to set it up.
- **Partial:** notes the missing integration but dwells on it (multiple sentences, or suggests the user set it up), OR silently omits without noting.
- **Fail:** errors on a missing integration, OR fabricates calendar/email content when the integration is off.

### 8. `conversation_first` — proposes, asks, does not write early

Source: `agents/daily-brief/SKILL.md` step 5 and step 6.

- **Pass:** the day sequence is framed as a proposal ("what if we…", "here's a candidate shape"). The brief ends by asking the user about energy / overrides. The brief does **not** write to `Daily Log.md` in this turn.
- **Partial:** proposes the sequence and asks, but also pre-writes an initial draft entry to Daily Log. OR proposes without asking.
- **Fail:** writes today's plan to `Daily Log.md` before the user has confirmed the sequence, OR presents the plan as a decree rather than a proposal.

---

## Judge prompt scaffold

When the Claude-as-judge scorer is invoked against a case, the judge receives:

- The full case input (scenario markdown + config flags).
- The expected-output reference for shape hints (not for literal matching).
- This rubric.
- The agent output under evaluation.

Score each axis independently. Return `{ axis: score }` as an `AxisScores` object (see `evals/runner/types.ts`). Prefer `partial` over `pass` when an axis is close but missing one pass criterion — the baseline will be tuned against that.

---

## Runner-compatible shape (for iter 6 baseline authoring)

```json
{
  "skill": "daily-brief",
  "axes": [
    { "name": "prior_context",       "description": "References yesterday's Daily Log and recent tracker state.", "scale": { "min": 0, "max": 2 } },
    { "name": "pattern_surfacing",   "description": "Surfaces patterns from Weekly Goals; does not invent.",      "scale": { "min": 0, "max": 2 } },
    { "name": "narrative_tone",      "description": "Paragraphs, not a checklist. Direct, low-formality.",        "scale": { "min": 0, "max": 2 } },
    { "name": "first_run_graceful",  "description": "Coherent on empty memory; acknowledges without apology.",    "scale": { "min": 0, "max": 2 } },
    { "name": "cascade_adherence",   "description": "P1 block ties explicitly to a Monthly Goal.",                 "scale": { "min": 0, "max": 2 } },
    { "name": "pacing_calibration",  "description": "Reads intensity from recent Daily Log; nudges appropriately.","scale": { "min": 0, "max": 2 } },
    { "name": "integration_grace",   "description": "`not_connected` sources noted briefly and skipped.",          "scale": { "min": 0, "max": 2 } },
    { "name": "conversation_first",  "description": "Proposes + asks; no Daily Log write before confirmation.",    "scale": { "min": 0, "max": 2 } }
  ]
}
```

Iter 6 lands `evals/baselines/daily-brief.json` with per-axis `minScores` starting at 1 (partial) pending the first live run.

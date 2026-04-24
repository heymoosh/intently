# expected-output — scenario-01

This is a **reference output** for `scenario-01.md`. It documents the shape, ordering, and tone an acceptable daily-brief should produce — not a ground-truth exact match. The rubric (iter 5) is what actually scores a run.

---

## What the brief must surface

1. **Pacing note — recovery lean.** The skill should read two consecutive late nights (Mon-late-pattern not present, but Tue evening reflection notes fatigue and Wed is explicitly the "2nd late night this week") and the weekly-review pattern "two good evenings when I quit by 21:00 — the late nights didn't actually produce more shippable code." It should nudge toward a lighter-hand day or an explicit hard stop at 21:00. **Must not** suggest a sprint tone.

2. **Calendar highlights, not a full dump.** Two meetings today. The brief calls them out conversationally — the 09:00 pairing block and the 15:30 1:1. No need to restate times twice.

3. **"Email not connected" — noted once, briefly, no error.** One sentence max. The graceful-fallback rule is explicit.

4. **Where you left off yesterday.** Pulls from Wed's PM done block: skill loader shipped, tool scaffolds half-done, tokens compile script mid-stream. Mentions the tokens script's known rough spot (font-family translation). This is the orientation step — must be concrete, not generic.

5. **Today's 1–2 most important things — tied to Monthly Goal #1.** P1 block today is Managed Agents wiring + tool scaffolds finish. This serves Monthly Goal "Ship Intently V1." If the brief's P1 doesn't tie back to a Monthly priority, it has silently dropped the cascade rule — that's a regression.

6. **Deadline creep — Intently V1 by Saturday.** Two days left. The brief should name it without catastrophizing.

7. **Proposed day sequence — conversational, not a decree.** Structure:
   - Morning block (P1): Managed Agents invocation + finish tool scaffolds. Ties to "Ship Intently V1."
   - Afternoon block (P2): tokens compile script — the annoying font-family bit.
   - Evening: hard stop by 21:00 (pacing nudge, stated once).
   - Optional: the strength session open slot Thursday PM could go in P3 if the user wants it.

8. **Asks the user.** Explicit question at the end: what does today's energy look like, any overrides. **Does not write to Daily Log yet.**

## Tone markers

- Warm but efficient. Not corporate. Not chipper.
- First-person-ish: "you've been sprinting" rather than "the user has been sprinting."
- **No guilt-tripping** about the late nights. The pattern was already surfaced by the user themselves in Weekly Goals and Wed's evening reflection — the skill just reflects it back, it doesn't pile on.
- **No health nudges.** `health_file_enabled: false` in config — the skill must silently skip the health step. If health shows up in the output, that's a config-adherence regression.

## Anti-patterns the brief must avoid

- **Suggesting a sprint day** — fails pacing.
- **Silent cascade drop** — P1 block that doesn't serve a Monthly Goal.
- **Writing to `Daily Log.md` before the sequencing conversation** — violates step 6 of the skill explicitly.
- **Treating "email not connected" as an error** — graceful-fallback rule.
- **Referencing `Health.md`** — gated off in config.
- **Reading an archive week** — only the current-week Daily Log is in-scope.
- **Restating the meetings verbatim or listing everything chronologically** — that's a schedule, not a brief.

## Example shape (illustrative, not prescriptive)

```
Good morning. You've been leaning hard — two late nights and Wednesday's reflection
says your body's already talking to you. Let's make today count but wrap it clean.

Calendar is manageable: pairing with Kaya at 9, Anya at 3:30. Email isn't connected
today, so I'm not flagging anything there.

Where you left off: skill loader's in (PR #2 merged), tool scaffolds got halfway —
`read_calendar` mocked, `read_emails` is the deferred one. Tokens compile script
is still mid-stream; the font-family translation was biting.

Two days to demo. What would land the most tonight:

- **Morning (P1):** finish tool scaffolds + start the Managed Agents invocation
  surface. This is the wiring day you named last night; it directly serves shipping
  Intently V1 for Saturday.
- **Afternoon (P2):** the font-family bit on the tokens compile — bounded, doable
  between meetings.
- **Hard stop 21:00.** Last week you shipped more on the days you quit on time.
  Don't out-negotiate yourself tonight.

The Thursday-or-Friday strength slot is still open — want to put it in today or
move to tomorrow morning?

What does energy look like? Anything I should swap?
```

That's a candidate shape, not the canonical one. Variations in phrasing are fine; the **content checklist** above is what a rubric axis should score.

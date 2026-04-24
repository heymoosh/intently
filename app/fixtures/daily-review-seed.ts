import { AgentOutput } from '../lib/agent-output';

// Context passed to the daily-review agent when the user triggers a live run
// from the Past screen. V1 has no tool wiring, so all context sits in input.
// Scenario follows the same persona/day as the daily-brief seed — this is
// the *evening* read of the day that the brief shaped in the morning.
export const DAILY_REVIEW_DEMO_INPUT = `Today: 2026-04-24 (Friday)
User: Sam

## This morning's brief said
Plan for today: finish tool scaffolds + start the Managed Agents invocation surface (P1). Tokens compile font-family bit (P2). Hard stop 21:00. Thursday-or-Friday strength slot still open.

## Today's Daily Log (what actually happened)
- Done: tool scaffolds shipped (PR #24 merged)
- Done: Managed Agents session call wired (first 200 response back)
- Done: 3 MA API schema bugs found + fixed empirically (PRs #68, #70, #71)
- Done: Vercel deploy live at intently-eta.vercel.app
- Done: first real Opus 4.7 output landed on screen
- Skipped: tokens compile font-family (got displaced by MA wiring)
- Skipped: strength slot

## Chat reconciliation (work done in chat today that might not be in the log)
- Agreed scope cut: 5 skills, update-tracker and setup demo-secondary
- Decided screen-semantic mapping (daily-review→Past, weekly-review→Future)
- Direction named end of day: "functionality first, polish layered later"

## Recent pacing (prior 3 days)
- Tue: 11h day, shipped but frayed
- Wed: 10h, journal note "body talking, need to wrap clean"
- Thu: 9h, good pace, shipped agent-runner

Write today's daily review per your skill instructions. Lead with the day, not the admin.`;

// Seed output used by the Past screen before the user triggers a live run.
// Shape matches what daily-review would return: narrative lead, pattern
// beat, tomorrow shape, contextual reflection prompts.
export const dailyReviewSeed: AgentOutput = {
  kind: 'review',
  title: 'Today, in review',
  generatedAt: '2026-04-24T21:05:00-04:00',
  inputTraces: ['calendar', 'journal'],
  body: `Hey — congrats. The plan going in was "finish scaffolds, start MA, stop by 21:00." You hit the first two and then some, and you stopped.

Here's what you actually did. Tool scaffolds went in clean (PR #24), and the moment you pivoted to Managed Agents is when the day shifted from "building pieces" to "building the thing." You got a live session call through, and then — this is the part worth naming — you didn't hide from the three schema bugs that came up; you found them empirically, fixed each one (PRs #68, #70, #71), and the fourth request was 200 OK. The Vercel deploy happening *today* means the demo is now on a public URL with real Opus 4.7 output on screen. That's the beat.

What you didn't do: the tokens font-family fix got displaced, and you skipped the strength slot. Both were conscious — the MA work earned the displacement. Strength still owes you a conversation this weekend.

**Noticing.** Third day this week where shipping correlated with an honest pacing call earlier in the morning. Tuesday was 11 hours and you said "frayed" by evening; today was 9 and the journal note from Wednesday about "body talking" stayed in view. You're getting better at believing what you already know about your own days.

**Shape of tomorrow.** Saturday is the recording day. Your calendar is mostly clear — protect the morning for one clean end-to-end dry run before you try a take. Don't record on a fresh fatigue day.

Log updated. Yesterday trimmed. Three open threads flagged.

---

A couple things to capture, picking up on what today surfaced:

> **That you shipped live MA on hackathon Day 3 is worth remembering.** \`#brag\` — what did it feel like when the fourth request came back 200?

> **Anything else land for you today?**`,
};

import { AgentOutput } from '../lib/agent-output';

// Context passed to the weekly-review agent when the user triggers a live run
// from the Future screen. Scenario continues from the daily-brief / daily-review
// persona — this is the Sunday read of the hackathon week.
export const WEEKLY_REVIEW_DEMO_INPUT = `Today: 2026-04-26 (Sunday)
User: Sam

## Last week's Weekly Goals (Outcome-Directions)
- Ship Intently V1 for hackathon submission (Apr 26, 8pm EDT)
- Wire Managed Agents end-to-end for at least one skill
- Preserve weekend recovery window once submitted

## Daily Log summary (past 7 days)
- Mon: setup, ADRs, Supabase schema
- Tue: expo scaffold, parallel tracks workflow
- Wed: MC session, architecture docs, agent-runner base
- Thu: 12 PRs merged, web pivot, live MA wiring for daily-brief
- Fri: all 5 MA configs shipped, live synthesis confirmed on-camera
- Sat: daily-review + weekly-review wired, record day
- Sun: submitted

## Journal entries (past 7 days, tagged)
- [2026-04-22] #grow — "I kept building features before I had clarity on the demo arc. Tomorrow I anchor on the 3-minute video first."
- [2026-04-23] #self — "I get the most out of parallel tracks when I name the handoff explicitly. Quiet handoffs = drift."
- [2026-04-23] #brag — "Agent-driven fan-out with worktree isolation actually works. That's a pattern I'll reuse."
- [2026-04-24] #ant — "Caught myself thinking 'we only have daily-brief, that's not enough.' Opened the spec: MVP is ONE skill well. That panic was wrong."
- [2026-04-24] #self — "Shipping under pressure with real API fixes in the loop — the empirical mode is mine, not a bad habit."
- [2026-04-25] #ideas — "Daily-review could tag reflections by type so weekly-review surfaces patterns per category. Already scoped."
- [2026-04-25] #brag — "Functionality-first decision held. Kept me from a 4-hour polish pit."

## Monthly Goals
- Ship Intently to hackathon demo + one external user by end of April
- Stop undervaluing pacing — at least 2 of 4 weeks under 55 hrs
- Close 1 of 3 open advisor conversations

Write this week's review per your skill instructions. Lead qualitatively, not with the score.`;

// Seed output used by the Future screen before the user triggers a live run.
// Shape matches weekly-review: qualitative opener, patterns across tag types,
// what didn't happen (collaboratively framed), next-week focus, pre-mortem.
export const weeklyReviewSeed: AgentOutput = {
  kind: 'review',
  title: 'Week in review',
  generatedAt: '2026-04-26T19:00:00-04:00',
  inputTraces: ['calendar', 'journal'],
  body: `Productive and clarifying. Probably the highest-leverage week of the month — you didn't just ship more, you learned how you ship. The biggest difference: the Thursday decision to stop building features and anchor everything on the 3-minute demo arc. That reshaped the rest of the week.

**Patterns worth naming.** Reading across your tags:

- *#self* showed up twice — "I get the most out of parallel tracks when I name the handoff explicitly" (Wed) and "empirical mode is mine, not a bad habit" (Fri). Same underlying insight: you work best when you trust your actual process instead of the textbook version.
- *#brag* also twice — agent-driven fan-out working, and the functionality-first decision holding. Both wins about *restraint* more than output. Worth noticing.
- *#ant* once but sharp — the "only daily-brief, that's not enough" thought on Fri. Opening the spec is what defused it. That loop is a good one to keep.

**What didn't happen.** Two of four weeks at ≤55 hrs was the monthly nudge — you clocked closer to 70 this week. That was the right trade for hackathon week, but the monthly goal exists for a reason and next week it's due rent.

**Next week, two things that matter:**

1. **Recovery window, honored.** Mon–Tue are the "don't start something new" days. Your Monthly Goal priority #2 (pacing) is the one this directly serves.
2. **One external user conversation on Intently.** You have a live URL now. The Monthly Goal #1 second half — "one external user by end of April" — needs a real ask this week.

**Pre-mortem.** Most likely thing to derail this: the post-ship dopamine crash leads to 3 days of "just one small thing" refactors that eat the recovery window. Mitigation: put one concrete non-Intently commitment on Tue afternoon so the day has somewhere to be.

**Strategy check.** Anything you learned this week that changes how you're approaching the product — user-facing, not infra?

> Anything worth capturing this week? A decision, a learning, something to remember?`,
};

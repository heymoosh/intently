import { AgentOutput } from '../lib/agent-output';

// Seed output used by the Present screen before live Managed Agents wiring
// lands. Shape matches what a real daily-brief agent run will produce so the
// card rendering pipeline is proven before Friday's live integration.
//
// Persona + scenario mirror evals/datasets/daily-brief/scenario-01.md.
export const dailyBriefSeed: AgentOutput = {
  kind: 'brief',
  title: 'Good morning, Sam',
  generatedAt: '2026-04-24T07:30:00-04:00',
  inputTraces: ['calendar', 'journal'],
  body: `You've been leaning hard — two late nights and Wednesday's reflection says your body's already talking to you. Let's make today count but wrap it clean.

Calendar is manageable: **pairing with Kaya at 9**, **Anya at 3:30**. Email isn't connected today, so I'm not flagging anything there.

Where you left off: skill loader is in (PR #2 merged), tool scaffolds got halfway — \`read_calendar\` is mocked, \`read_emails\` is the deferred one. Tokens compile script is still mid-stream; the font-family translation was biting.

Two days to demo. What would land the most tonight:

- **Morning (P1):** finish tool scaffolds + start the Managed Agents invocation surface. This is the wiring day you named last night; it directly serves shipping Intently V1 for Saturday.
- **Afternoon (P2):** the font-family bit on the tokens compile — bounded, doable between meetings.
- **Hard stop 21:00.** Last week you shipped more on the days you quit on time.

The Thursday-or-Friday strength slot is still open — want to put it in today or move to tomorrow morning?

What does energy look like? Anything I should swap?`,
};

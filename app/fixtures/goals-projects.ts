// goals-projects.ts — Sam-flavored goal + project fixtures for the Future
// drill-down screens. Adapted from docs/design/Intently - App/intently-flows.jsx
// (GOAL_DATA + PROJECT_DATA + PROJECT_EXTRAS) and rewritten for the V1 persona
// (Sam, hackathon week → ship V1, tighten practice, get better at review).
//
// Voice anchors: daily-brief-seed.ts ("body talking", "wrap clean"), daily-
// review-seed.ts ("functionality first, polish layered later"), weekly-review-
// seed.ts (#brag/#self/#ant/#grow/#ideas tags). Reflections quote those entries
// directly so the three tenses look at the same life.
//
// Production wiring will replace this with the goals/projects tables (PR #83);
// fixture-only is the right scope for this drill-down PR.

export type MilestoneStatus = 'done' | 'doing' | 'todo';

export type Milestone = {
  text: string;
  month: string;
  status: MilestoneStatus;
};

export type Reflection = {
  date: string;
  quote: string;
};

export type Goal = {
  id: string;
  title: string;
  created: string;
  intention: string;
  month: string;
  monthNarrative: string;
  glyph: string;
  // Painterly-block 4-stop palette: [base, accent1, accent2, highlight].
  // Track B's PainterlyBlock will consume this once it lands; for now the
  // first stop is rendered as a flat panel by the GoalDetail hero stub.
  pal: [string, string, string, string];
  milestones: Milestone[];
  projectIds: string[];
  reflections: Reflection[];
};

export type TrackerStatus = 'done' | 'doing' | 'todo';

export type TrackerRow = {
  text: string;
  deadline: string;
  status: TrackerStatus;
};

export type Project = {
  id: string;
  name: string;
  blurb: string;
  // Hex string the card uses for its accent stripe + glyph chip. Aligns with
  // the design folder's TintClay/TintLilac/TintMoss/TintButter palette.
  tint: string;
  glyph: string;
  count: number;
  done: number;
  goalId: string | null;
  intention: string;
  impact: string;
  status: string;
  tracker: TrackerRow[];
};

// Sam's three goals — the trio the demo lands on. Order matters: Intently V1
// is the primary lever (April is hackathon month), daily practice is the
// pacing thread that's been showing up in journal, code review is the slower
// craft goal that earns time once shipping settles.
export const GOAL_DATA: Goal[] = [
  {
    id: 'intently',
    title: 'Ship Intently V1 — and the version that comes after.',
    created: 'Mar 2026',
    intention:
      "Not just a hackathon submission — the first real product I ship under my own name. The agent-native loop has to be felt, not described. Get it good enough that one external user dogfoods it before May.",
    month:
      "April: ship V1 by hackathon deadline (Apr 26, 8pm), then get one external user actually using it before month end.",
    monthNarrative:
      "Live URL is up. Daily-brief is wired end-to-end with real Opus 4.7 output on screen. The pivot you keep dodging: stop building features and book the user conversations. The MVP is one skill done well — you already named that on Friday and the agent saw you back away from it.",
    glyph: 'rocket',
    pal: ['#F0EBE0', '#B9D0B5', '#D9A24A', '#FBF8F2'],
    milestones: [
      { text: 'Live URL with real agent output', month: 'Apr', status: 'done' },
      { text: 'Submission shipped to hackathon', month: 'Apr', status: 'doing' },
      { text: 'One external user actually using it', month: 'Apr', status: 'todo' },
      { text: 'V1.1 — agent memory promotion pipeline', month: 'May', status: 'todo' },
      { text: '5 weekly active users', month: 'Jul', status: 'todo' },
    ],
    projectIds: ['intently-v1', 'intently-demo', 'intently-followups'],
    reflections: [
      {
        date: 'Apr 24',
        quote:
          "Caught myself thinking 'we only have daily-brief, that's not enough.' Opened the spec: MVP is ONE skill well. That panic was wrong.",
      },
      {
        date: 'Apr 23',
        quote:
          "Agent-driven fan-out with worktree isolation actually works. That's a pattern I'll reuse.",
      },
    ],
  },
  {
    id: 'practice',
    title: 'A daily practice that holds, even on heavy weeks.',
    created: 'Jan 2026',
    intention:
      "The thing I keep losing on big weeks. Hard stops, strength slot, journal landing somewhere I'll re-read it. Not optimization — just the shape of a week I'd want again.",
    month:
      "April: protect the 21:00 hard stop, keep the strength slot from getting eaten by ship pressure.",
    monthNarrative:
      "Three days this week where shipping correlated with an honest pacing call earlier in the morning. Wednesday's 'body talking' note stayed in view on Friday. The strength slot still owes you a conversation — you skipped it twice this week and named it both times.",
    glyph: 'leaf',
    pal: ['#EAF1E9', '#7FA27A', '#B9D0B5', '#FBF8F2'],
    milestones: [
      { text: 'Weekly journal review held 4 weeks straight', month: 'Apr', status: 'doing' },
      { text: 'Strength slot kept on hackathon week', month: 'Apr', status: 'todo' },
      { text: 'Two of four weeks under 55 hrs', month: 'May', status: 'todo' },
      { text: 'Mid-day check-in lands as a habit, not a chore', month: 'Jun', status: 'todo' },
    ],
    projectIds: ['pacing', 'journal-rhythm'],
    reflections: [
      {
        date: 'Apr 23',
        quote:
          "Leaned hard today. Body talking. Need to wrap clean.",
      },
      {
        date: 'Apr 25',
        quote:
          "Functionality-first decision held. Kept me from a 4-hour polish pit.",
      },
    ],
  },
  {
    id: 'review',
    title: 'Be the kind of code reviewer worth pairing with.',
    created: 'Feb 2026',
    intention:
      "Less reflexive nitpick, more saying the actual thing — when the diff is fine, when the architecture isn't, when I don't know yet. The reviews I remember from others were honest, not thorough. Aim for that.",
    month:
      "April: one review per week where I ship the hard call out loud, not buried in a thread.",
    monthNarrative:
      "Two of four 1:1 reviews this month landed clean. The hard-thing muscle is still twitchy — you said it cleanly on Kaya's PR last week and immediately wanted to soften it in the follow-up Slack. That walk-back is the pattern.",
    glyph: 'handshake',
    pal: ['#F7E8E0', '#E6B9A4', '#D9A24A', '#FBF8F2'],
    milestones: [
      { text: 'Weekly review rhythm holds', month: 'Apr', status: 'doing' },
      { text: 'Three reviews where the hard thing got said in-line', month: 'Jun', status: 'todo' },
      { text: 'Lead one cross-team architecture review', month: 'Sep', status: 'todo' },
    ],
    projectIds: ['review-rhythm'],
    reflections: [
      {
        date: 'Apr 23',
        quote:
          "I get the most out of parallel tracks when I name the handoff explicitly. Quiet handoffs = drift.",
      },
    ],
  },
];

// Active projects rolled to those goals, plus one Admin project for misc
// reminders (HANDOFF §1.4 — Admin project is the system project under no goal).
//
// Tints reuse the design folder's painterly-tint families translated into
// hex literals (TintClay→terra, TintLilac→cream-lilac blend, TintMoss→sage,
// TintButter→amber). When the central token list adds these as named colors,
// fold these references back to tokens.ts.
export const PROJECT_DATA: Project[] = [
  {
    id: 'intently-v1',
    name: 'Intently V1 — submission cut',
    blurb:
      "Ship-the-thing scope: three demo flows, live agent output, no kanban anywhere.",
    tint: '#E6B9A4', // terra-200, painterly clay
    glyph: 'compass',
    count: 7,
    done: 5,
    goalId: 'intently',
    intention:
      "The smallest cut of Intently that lands the agent-native moment on camera. Three skills wired (brief, daily-review, weekly-review), one live URL, one persona consistent across the demo.",
    impact:
      "Without a submitted artifact by Sunday 8pm, the hackathon framing evaporates. This is the project that turns the year of architecture work into something a stranger can react to.",
    status:
      "5 of 7 demo beats green. Goal/Project drill-down + final voiceover pass are the two remaining.",
    tracker: [
      { text: 'Daily-brief wired end-to-end with live Opus output', deadline: 'Apr 24', status: 'done' },
      { text: 'Daily-review wired against seed input', deadline: 'Apr 25', status: 'done' },
      { text: 'Weekly-review wired against seed input', deadline: 'Apr 25', status: 'done' },
      { text: 'Goal + Project drill-down screens', deadline: 'Apr 25', status: 'doing' },
      { text: 'Demo video voiceover recorded', deadline: 'Apr 26', status: 'todo' },
      { text: 'Submission form filled', deadline: 'Apr 26', status: 'todo' },
      { text: 'Live URL stays up through judging window', deadline: 'Apr 30', status: 'doing' },
    ],
  },
  {
    id: 'intently-demo',
    name: 'Demo video — three-minute cut',
    blurb:
      "Storyboard, voiceover, screen recordings. The 3-minute ask that shows the loop.",
    tint: '#CFC8B7', // stone-300, painterly lilac-cream
    glyph: 'presentation',
    count: 5,
    done: 2,
    goalId: 'intently',
    intention:
      "A three-minute video that lands one beat: the agent IS the interface. No feature tour, no architecture diagram — three demo flows back to back, voiceover that names what's happening.",
    impact:
      "The judges won't run the live URL. Whatever they take from Intently comes from this video. It carries the whole submission.",
    status:
      "Storyboard done, two screen recordings cut. Voiceover pass + final assembly are the unblocks.",
    tracker: [
      { text: 'Storyboard locked', deadline: 'Apr 23', status: 'done' },
      { text: 'Brief flow recording', deadline: 'Apr 25', status: 'done' },
      { text: 'Daily-review recording', deadline: 'Apr 26', status: 'doing' },
      { text: 'Voiceover recorded + cut', deadline: 'Apr 26', status: 'todo' },
      { text: 'Final assembly rendered + uploaded', deadline: 'Apr 26', status: 'todo' },
    ],
  },
  {
    id: 'intently-followups',
    name: 'External user dogfood — first one',
    blurb:
      "One person, end-to-end, on the live URL. Find them, brief them, watch them.",
    tint: '#FAEFD6', // amber-50, painterly butter
    glyph: 'flag',
    count: 4,
    done: 0,
    goalId: 'intently',
    intention:
      "One real user actually running their morning brief on the live URL — not a demo, not a walkthrough. Get the first 'this is mine' reaction in the wild.",
    impact:
      "The thing that turns Intently from 'project I built' into 'product that exists.' Without a real user reaction, the hackathon submission is the ceiling.",
    status:
      "Three names on the shortlist. Outreach starts Mon after recovery window.",
    tracker: [
      { text: 'Pick the three to reach out to', deadline: 'Apr 28', status: 'todo' },
      { text: 'Outreach sent', deadline: 'Apr 29', status: 'todo' },
      { text: 'First brief run by an external user', deadline: 'May 1', status: 'todo' },
      { text: 'Capture their reaction in journal', deadline: 'May 1', status: 'todo' },
    ],
  },
  {
    id: 'pacing',
    name: 'Hard stops + strength slot',
    blurb:
      "The two pacing levers I keep losing on heavy weeks.",
    tint: '#B9D0B5', // sage-200, painterly moss
    glyph: 'clock',
    count: 3,
    done: 1,
    goalId: 'practice',
    intention:
      "Hard stop at 21:00 most weeknights, strength slot defended like a meeting. Both keep getting eaten on big weeks. Treat them as commitments, not preferences.",
    impact:
      "The actual delta between the version of me that ships sustainably and the version that ships in bursts and crashes. Every burnout cycle starts here.",
    status:
      "21:00 stop held 3 of 5 nights this week. Strength slot skipped twice and named both times — the noticing is closer to the holding than it has been.",
    tracker: [
      { text: '21:00 hard stop held 4 of 5 nights', deadline: 'Apr 28', status: 'doing' },
      { text: 'Strength slot kept on Saturday', deadline: 'Apr 26', status: 'done' },
      { text: 'Mid-day check-in habit on weekdays', deadline: 'May 5', status: 'todo' },
    ],
  },
  {
    id: 'journal-rhythm',
    name: 'Weekly journal re-read',
    blurb:
      "Saturday morning ritual — re-read the week's entries before reviewing it.",
    tint: '#EAF1E9', // sage-50, painterly light moss
    glyph: 'book',
    count: 4,
    done: 2,
    goalId: 'practice',
    intention:
      "30 minutes Saturday morning, scroll back through the week's journal entries before drafting the weekly review. The pattern lives in the entries, not in memory.",
    impact:
      "Without re-reading, the weekly review is just last-thing recency bias. With it, the review reflects what actually happened.",
    status:
      "Held two weeks running. This Saturday is the first hackathon-week test.",
    tracker: [
      { text: 'Apr 12 re-read', deadline: 'Apr 12', status: 'done' },
      { text: 'Apr 19 re-read', deadline: 'Apr 19', status: 'done' },
      { text: 'Apr 26 re-read', deadline: 'Apr 26', status: 'doing' },
      { text: 'May 3 re-read', deadline: 'May 3', status: 'todo' },
    ],
  },
  {
    id: 'review-rhythm',
    name: 'Code review practice',
    blurb:
      "One review per week where the hard call gets named in-line, not after.",
    tint: '#F7E8E0', // terra-50, painterly peach
    glyph: 'eye',
    count: 4,
    done: 2,
    goalId: 'review',
    intention:
      "Every week, find the one PR where the hard call needs to be made and make it in-line — not in a follow-up thread. Either 'this architecture isn't right' or 'I don't know enough to say yet.' Both are honest.",
    impact:
      "The reviewers I learned the most from were the ones who said the actual thing. This is how I become that person for someone else.",
    status:
      "Two clean weeks. Kaya's PR last week was the cleanest in-line call so far. The walk-back in Slack is the next layer.",
    tracker: [
      { text: 'Week 16: in-line architecture call', deadline: 'Apr 19', status: 'done' },
      { text: "Week 17: clean read on Kaya's PR", deadline: 'Apr 26', status: 'done' },
      { text: 'Week 18 review', deadline: 'May 3', status: 'todo' },
      { text: 'Stop walking back the call in follow-up', deadline: 'May 17', status: 'todo' },
    ],
  },
  // Admin — system project for misc reminders. No goalId. Per HANDOFF §1.4
  // ("There is one system project per user, Admin, which is where unclustered
  // misc reminders live").
  {
    id: 'admin',
    name: 'Admin',
    blurb: 'Misc reminders that don\'t belong to a goal.',
    tint: '#E2DCCE', // stone-200, neutral cream
    glyph: 'check-circle',
    count: 3,
    done: 1,
    goalId: null,
    intention: 'The bucket for things that need doing but don\'t earn goal-time.',
    impact: 'Keeps the goal-rolled projects clean of admin-shaped reminders.',
    status: 'Three open. One due this week.',
    tracker: [
      { text: 'Renew passport', deadline: 'May 30', status: 'todo' },
      { text: 'Submit hackathon form', deadline: 'Apr 26', status: 'doing' },
      { text: 'File March receipts', deadline: 'Apr 15', status: 'done' },
    ],
  },
];

// Lookup helpers — keep components straight TS, not data spelunking.

export function getGoalById(id: string): Goal | null {
  return GOAL_DATA.find((g) => g.id === id) ?? null;
}

export function getProjectById(id: string): Project | null {
  return PROJECT_DATA.find((p) => p.id === id) ?? null;
}

export function getProjectsForGoal(goalId: string): Project[] {
  return PROJECT_DATA.filter((p) => p.goalId === goalId);
}

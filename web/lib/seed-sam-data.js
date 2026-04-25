// Sam's seed life — distilled from `seed/*.md` into JS objects shaped for our
// entity tables. Used by web/lib/seed-sam.js to populate a fresh user's DB so
// the cognition layer (context assembler) has real content to read.
//
// Sam is the canonical demo persona (NOT Muxin): a knowledge worker building
// an AI productivity app during a 6-day hackathon. Demo day is Thursday (day
// 4 of 6). See seed/README.md for full premise.
//
// Source files this distills:
//   - seed/Goals.md           → SAM_GOALS
//   - seed/Monthly Goals.md   → SAM_MONTHLY (April 2026 priorities)
//   - seed/Weekly Goals.md    → SAM_WEEKLY (week of 2026-04-19)
//   - seed/Ops Plan.md        → SAM_PROJECTS (project dashboard P1/P2/P3)
//   - seed/Daily Log.md       → SAM_DAILY_LOG (Mon-Thu hackathon week)
//   - seed/Journal.md         → SAM_JOURNAL (recent entries)
//   - seed/Projects/*/Tracker.md → notes embedded in project bodies

const SAM_GOALS = [
  {
    title: 'Ship Intently — get to 10 real users by August',
    monthly_slice: 'April: ship V1 demo by hackathon close (Apr 25). Win the demo if possible; the bigger prize is real users in the post-hackathon window.',
    glyph: 'rocket',
    palette: ['#5B4A82', '#9B7AB8', '#C4A5DC', '#F0DCC4'],
    position: 0,
  },
  {
    title: 'Stay strong — 3x/week strength habit, 185 lbs by November',
    monthly_slice: 'April: hold 3x/week through the sprint. Don\'t let a crunch drop workouts to 1x — that pattern repeats and the weight stays put.',
    glyph: 'leaf',
    palette: ['#5B7A4A', '#82A86F', '#B8D0BE', '#F0EBC4'],
    position: 1,
  },
  {
    title: 'Stay present for the people who matter',
    monthly_slice: 'April: one family dinner or call per weekend. The sprint is not an excuse to disappear.',
    glyph: 'handshake',
    palette: ['#7A4A5B', '#B87A82', '#DCBEC4', '#F0DCC4'],
    position: 2,
  },
];

// Active projects from Ops Plan (P1/P2/P3).
// `goal_index` references SAM_GOALS by position (0 = Intently, 1 = Health, 2 = Family).
const SAM_PROJECTS = [
  {
    title: 'Intently',
    goal_index: 0,
    body_markdown: 'Hackathon Sprint. 🟡 In Progress.\n\nNext: finish seed data, wire agent runner to Supabase, record demo flows.\n\nLog:\n- 2026-04-23: Started seed-data-v1 track\n- 2026-04-22: /next-tracks dispatcher merged (PR #34)\n- 2026-04-21: npm audit pre-commit hook finalized\n- 2026-04-20: Hackathon day 1 — confirmed build plan',
    todos: [
      { text: 'Finish seed data files (all 13)', done: true },
      { text: 'Wire agent runner to Supabase (markdown_files reads)', done: false },
      { text: 'Record clean 3-flow demo', done: false },
      { text: 'Open draft PR for seed-data-v1 branch', done: false },
    ],
    status: 'active',
    is_admin: false,
  },
  {
    title: 'Design System Port',
    goal_index: 0,
    body_markdown: 'Token application screen-by-screen. 🟡 In Progress.\n\nNext: apply tokens to daily-brief and daily-review screens, verify in Expo Go.',
    todos: [
      { text: 'Tokens applied to brief screen', done: false },
      { text: 'Tokens applied to review screen', done: false },
      { text: 'Verified rendering in Expo Go', done: false },
    ],
    status: 'active',
    is_admin: false,
  },
  {
    title: 'Health Routine',
    goal_index: 1,
    body_markdown: 'Maintenance. 🟢 Healthy.\n\nNext: Friday strength session — don\'t skip at end of hackathon week.',
    todos: [
      { text: 'Mon strength workout', done: true },
      { text: 'Wed strength workout', done: true },
      { text: 'Fri strength workout', done: false },
    ],
    status: 'active',
    is_admin: false,
  },
  {
    title: 'Admin',
    goal_index: null,
    body_markdown: 'Catch-all for misc reminders that don\'t belong to a goal.',
    todos: [],
    status: 'active',
    is_admin: true,
  },
];

// Recent journal entries (last 2 weeks). Drives "yesterday's highlight" beat
// + tone calibration in the brief. These land in `entries` with kind='journal'.
// `days_ago` is relative to "today" at seed time (Thursday, hackathon day 4).
const SAM_JOURNAL = [
  {
    days_ago: 1,
    body_markdown: 'Day 3 of the hackathon. Tired in a way that feels productive, if that makes sense — like the tiredness is evidence something real is happening. Merged /next-tracks today. The project is starting to feel like a coherent thing, not just a pile of files and ideas. Still a lot to do before Friday. Trying not to look at the full list at once.',
    glyph: 'pen',
    mood: 'dusk',
  },
  {
    days_ago: 3,
    body_markdown: 'Hackathon started today. I\'ve been building up to this for weeks and now it\'s just: ok, go. Morning workout helped set the tone. Wrote the week plan. The part I\'m most excited about is seeing the demo flows run end-to-end — will the daily-brief output feel useful? Will it feel like something a real person would actually want? That\'s the question.',
    glyph: 'rocket',
    mood: 'morning',
  },
  {
    days_ago: 5,
    body_markdown: 'Saturday. Helped mom rearrange her office. Took about three hours, mostly spent talking. Didn\'t think about the code once. Forgot how much I needed that. The brain does something different when the task is physical and someone else sets the agenda.',
    glyph: 'handshake',
    mood: 'midday',
  },
  {
    days_ago: 8,
    body_markdown: 'Rough day. Kept switching between the spec and the code and finished neither. The context switching cost is real — probably lost two hours to it. Going to try single-task AM blocks for the rest of the week. The days with one clear focus are so much cleaner.',
    glyph: 'mountain',
    mood: 'rain',
  },
  {
    days_ago: 10,
    body_markdown: 'Noticing I\'ve been tired for about a week. Not sick-tired, just running a little low. Skipped last Friday\'s workout and I think that\'s part of it. The workouts don\'t feel optional — they\'re fuel. Getting back on schedule this week.',
    glyph: 'leaf',
    mood: 'midday',
  },
];

// Yesterday's review entry — gives today's brief continuity.
const SAM_YESTERDAY_REVIEW = {
  days_ago: 1,
  body_markdown: 'Wednesday landed. /next-tracks dispatcher merged — that\'s the one I was nervous about. Energy held through the AM block but afternoon got scattered when I tried to plan seed data and code at the same time. Pattern from last week showing up again: don\'t mix spec and code in one session. Tomorrow: seed data is the AM block, single focus. Carrying into tomorrow: write seed data files first thing, no email, no Slack until 11.',
  glyph: 'moon',
  mood: 'night',
  // Structured tail per the new daily-review JSON contract:
  json_tail: {
    journal_text: '/next-tracks landed; afternoon scattered when I mixed planning and code.',
    friction: [{ text: 'Context-switched between spec writing and seed data planning — lost an hour.' }],
    tomorrow: [{ text: 'Seed data files first thing, single focus, no Slack until 11.', tier: 'P1' }],
    calendar: [{ text: 'No meetings tomorrow morning — protect the AM block.' }],
  },
};

// This week's plan items (Thursday — today). Each row mapped to morning/afternoon/evening band.
// From seed/Daily Log.md Thursday entry.
const SAM_TODAY_PLAN = [
  { band: 'morning',   text: 'Intently: finish seed data files (all 13 files), open draft PR', tier: 'P1' },
  { band: 'afternoon', text: 'Intently: wire agent runner to Supabase (markdown_files reads)', tier: 'P2' },
  { band: 'afternoon', text: 'Design System Port: apply tokens to daily-brief + daily-review', tier: 'P2' },
  { band: 'evening',   text: 'Review seed data for gaps; verify daily-brief reads right files', tier: 'P3' },
];

// Pending reminders captured by voice over the past week.
const SAM_REMINDERS = [
  { text: 'Friday strength session — non-negotiable', remind_in_days: 1 },
  { text: 'Renew dental insurance — deadline Apr 30', remind_in_days: 7 },
  { text: 'Reply to Jordan re: career convo', remind_in_days: 0 },
];

// Today's calendar (sparse — Sam noted "no meetings tomorrow morning" in
// yesterday's review). Just a couple afternoon items.
const SAM_CALENDAR_TODAY = [
  { hours_from_now: 5, duration_min: 30, title: 'Standup with co-builder', source: 'seed' },
  { hours_from_now: 8, duration_min: 60, title: 'WIP AI Weekly demo (drop-in)', source: 'seed' },
];

// Today's email flags (urgent / awaiting reply only).
const SAM_EMAIL_FLAGS = [
  { hours_ago: 2, sender: 'Jordan Park', subject: 'Re: career convo — when works for you?', is_urgent: false, awaiting_reply: true },
  { hours_ago: 14, sender: 'Hackathon Submissions', subject: 'Reminder: deadline Apr 25 8pm EDT', is_urgent: true, awaiting_reply: false },
];

Object.assign(window, {
  SAM_GOALS,
  SAM_PROJECTS,
  SAM_JOURNAL,
  SAM_YESTERDAY_REVIEW,
  SAM_TODAY_PLAN,
  SAM_REMINDERS,
  SAM_CALENDAR_TODAY,
  SAM_EMAIL_FLAGS,
});

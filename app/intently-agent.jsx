// intently-agent.jsx — the mock agent pipeline.
//
// classify(text) → { kind, body, band?, reason } — keyword-based intent routing
// for what the user typed/said. Mirrors HANDOFF §6.2: hero takes input, classify
// drafts a typed Entry, ConfirmationCard previews it before the store mutates.

function classify(rawText) {
  const text = (rawText || '').trim();
  if (!text) return null;

  const lower = text.toLowerCase();

  // Plan items: "morning: walk", "afternoon ship the deck", "add to evening: read"
  const bandMatch = lower.match(/^(morning|afternoon|evening)\s*[:,\-]?\s*(.+)/);
  if (bandMatch) {
    const band = bandMatch[1].charAt(0).toUpperCase() + bandMatch[1].slice(1);
    const body = bandMatch[2].trim();
    return {
      kind: 'plan',
      band,
      body,
      reason: `Adding to ${band.toLowerCase()}'s plan.`,
    };
  }
  const addToBand = lower.match(/^add (?:to )?(morning|afternoon|evening)[:,\-\s]+(.+)/);
  if (addToBand) {
    const band = addToBand[1].charAt(0).toUpperCase() + addToBand[1].slice(1);
    return { kind: 'plan', band, body: addToBand[2].trim(), reason: `Adding to ${band.toLowerCase()}'s plan.` };
  }

  // Reminders: "remind me to ...", "remember to ...", "don't forget ..."
  if (/^(?:remind\s+me\s+to|remember\s+to|don'?t\s+forget(?:\s+to)?)\s+/i.test(text)) {
    const body = text.replace(/^(?:remind\s+me\s+to|remember\s+to|don'?t\s+forget(?:\s+to)?)\s+/i, '');
    return { kind: 'reminder', body, reason: 'Saving as a reminder in Admin.' };
  }

  // Goals: "new goal: ...", "goal: ..."
  const goalMatch = text.match(/^(?:new\s+)?goal\s*[:\-]\s*(.+)/i);
  if (goalMatch) {
    return { kind: 'goal', body: goalMatch[1].trim(), reason: 'Drafting a new goal.' };
  }

  // Projects: "project: ..."
  const projectMatch = text.match(/^project\s*[:\-]\s*(.+)/i);
  if (projectMatch) {
    return { kind: 'project', body: projectMatch[1].trim(), reason: 'Drafting a new project.' };
  }

  // Explicit journal: "journal: ...", "today: ..."
  const journalMatch = text.match(/^(?:journal|today)\s*[:\-]\s*(.+)/i);
  if (journalMatch) {
    return { kind: 'journal', body: journalMatch[1].trim(), reason: "Saving to today's journal." };
  }

  // Default: journal entry. Anything that starts with "I " or is just prose lands here.
  return { kind: 'journal', body: text, reason: "Saving as a journal entry on today." };
}

// Apply a classified intent against the manual-add store mutators (m.* functions).
// Returns true on success.
function applyClassification(intent, m, opts = {}) {
  if (!intent) return false;
  const source = opts.source || 'agent';
  switch (intent.kind) {
    case 'plan':
      m.addPlanItem(intent.band, intent.body, { source });
      return true;
    case 'reminder':
      m.addAdminReminder(intent.body);
      return true;
    case 'goal':
      m.addGoal(intent.body);
      return true;
    case 'project':
      m.addProject(intent.body);
      return true;
    case 'journal':
    default:
      m.addJournal('today', intent.body, { kind: 'journal', source });
      return true;
  }
}

// generateDailyBrief — pure function that derives today's brief content from
// the persistent store. Mirrors HANDOFF §2.4 / §6.1 / §9.4 step 3.
//
// `state` is the same shape as `useManualAdds().state`. We pull the most
// recent journal/review entry whose timestamp is *before* today as the
// yesterday-highlight, with a graceful fallback to hand-authored copy.
function generateDailyBrief(state) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const entries = (state && state.journal && state.journal.today) || [];
  const priors = entries.filter((e) => {
    if (!e.at) return false;
    return new Date(e.at).getTime() < todayStart;
  });
  // Most recent prior journal/review entry — that's "yesterday's mark."
  const recent = priors
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .find((e) => e.kind === 'review' || e.kind === 'journal');

  const yesterdayQuote = recent
    ? recent.text
    : null; // null → caller renders the seeded fallback copy

  return {
    date: today.toISOString().slice(0, 10),
    yesterdayQuote,
    generatedAt: today.toISOString(),
  };
}

Object.assign(window, { classify, applyClassification, generateDailyBrief });

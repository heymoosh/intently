/**
 * Tool scaffolds with mock implementations.
 *
 * These are the four tools the Managed Agents SDK will call into: `read_calendar`,
 * `read_emails`, `read_file`, `write_file`. Every execute() here returns fixture
 * data — real Google Calendar / Gmail / Supabase wiring lands once OAuth is
 * registered (TRACKER Next #2) and Supabase Edge Functions are scaffolded.
 *
 * The shape each tool declares here is the contract real implementations must
 * honor. Changing a tool's input/output shape is a breaking change for every
 * agent skill that calls it.
 */

export type ToolContext = {
  userId: string;
  now: Date;
};

export type Tool<TInput, TOutput> = {
  name: string;
  description: string;
  execute(input: TInput, ctx: ToolContext): Promise<TOutput>;
};

// ---------- read_calendar ----------

export type CalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  description?: string;
};

export type ReadCalendarInput = {
  start: string;
  end: string;
  calendarIds?: string[];
};

export type ReadCalendarOutput = {
  events: CalendarEvent[];
};

export const readCalendar: Tool<ReadCalendarInput, ReadCalendarOutput> = {
  name: 'read_calendar',
  description:
    "Read the user's calendar events between start and end (inclusive). ISO 8601 date or datetime strings. Optional calendarIds filter; omitted = all calendars.",
  async execute(input, ctx) {
    assertIsoRange(input.start, input.end);
    const dayStart = input.start.slice(0, 10);
    const events: CalendarEvent[] = [
      {
        id: `cal.fixture.${dayStart}.01`,
        calendarId: 'primary',
        title: 'Morning review block',
        start: `${dayStart}T09:00:00-04:00`,
        end: `${dayStart}T10:00:00-04:00`,
      },
      {
        id: `cal.fixture.${dayStart}.02`,
        calendarId: 'primary',
        title: 'Deep work — Intently demo',
        start: `${dayStart}T10:30:00-04:00`,
        end: `${dayStart}T12:30:00-04:00`,
        location: 'home office',
      },
      {
        id: `cal.fixture.${dayStart}.03`,
        calendarId: 'primary',
        title: 'Sync with Michael Cohen',
        start: `${dayStart}T15:00:00-04:00`,
        end: `${dayStart}T15:30:00-04:00`,
        attendees: ['michael@anthropic.com'],
      },
    ];
    // ctx.userId would scope which calendar account to hit in the real impl.
    void ctx;
    return { events };
  },
};

// ---------- read_emails ----------

export type EmailMessage = {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  snippet: string;
  receivedAt: string;
  labels?: string[];
};

export type ReadEmailsInput = {
  query?: string;
  limit?: number;
  since?: string;
};

export type ReadEmailsOutput = {
  messages: EmailMessage[];
};

export const readEmails: Tool<ReadEmailsInput, ReadEmailsOutput> = {
  name: 'read_emails',
  description:
    "Read the user's recent emails, optionally filtered by Gmail query syntax. Default limit 20. since = ISO 8601 timestamp.",
  async execute(input, ctx) {
    const limit = clampLimit(input.limit ?? 20);
    const baseTs = input.since ?? ctx.now.toISOString();
    const fixtures: EmailMessage[] = [
      {
        id: 'email.fixture.01',
        threadId: 'thread.fixture.01',
        from: 'stripe@stripe.com',
        to: ['muxin@example.com'],
        subject: 'Your receipt from Stripe',
        snippet: 'Payment of $9.00 for your subscription...',
        receivedAt: baseTs,
        labels: ['INBOX', 'CATEGORY_UPDATES'],
      },
      {
        id: 'email.fixture.02',
        threadId: 'thread.fixture.02',
        from: 'teammate@example.com',
        to: ['muxin@example.com'],
        subject: 'Intently hackathon — tomorrow am?',
        snippet: 'Want to pair on the agent loop debugging tomorrow morning?',
        receivedAt: baseTs,
        labels: ['INBOX'],
      },
      {
        id: 'email.fixture.03',
        threadId: 'thread.fixture.03',
        from: 'calendar-notification@google.com',
        to: ['muxin@example.com'],
        subject: 'Invitation: Sync with Michael Cohen',
        snippet: 'Michael Cohen has invited you to a meeting...',
        receivedAt: baseTs,
        labels: ['INBOX', 'CATEGORY_UPDATES'],
      },
    ];
    const messages = input.query
      ? fixtures.filter((m) => fixtureMatchesQuery(m, input.query!))
      : fixtures;
    return { messages: messages.slice(0, limit) };
  },
};

// ---------- read_file ----------

export type MarkdownFile = {
  path: string;
  content: string;
  updatedAt: string;
  version: string;
};

export type ReadFileInput = {
  path: string;
};

export type ReadFileOutput = {
  file: MarkdownFile;
};

export class FileNotFoundError extends Error {
  constructor(path: string) {
    super(`File not found: ${path}`);
    this.name = 'FileNotFoundError';
  }
}

const FIXTURE_FILES: Record<string, string> = {
  'Goals.md':
    '# Goals\n\n- Ship Intently V1 by 2026-04-26\n- Stay healthy through the sprint\n',
  'Weekly Goals.md':
    '# Weekly Goals — 2026-04-20 → 04-26\n\n## P1\n- Demo flows end-to-end\n\n## P2\n- Eval coverage for the three flows\n',
  'Daily Log.md':
    '# Daily Log — week of 2026-04-20\n\n## 2026-04-22\n- ✅ Supabase schema\n- ✅ Expo shell\n- 🟡 Skill loader\n',
};

export const readFile: Tool<ReadFileInput, ReadFileOutput> = {
  name: 'read_file',
  description:
    "Read a markdown file from the user's cloud store by relative path (e.g. 'Goals.md', 'Projects/Intently/Tracker.md'). Throws FileNotFoundError if missing.",
  async execute(input, ctx) {
    assertSafePath(input.path);
    const content = FIXTURE_FILES[input.path];
    if (content === undefined) {
      throw new FileNotFoundError(input.path);
    }
    return {
      file: {
        path: input.path,
        content,
        updatedAt: ctx.now.toISOString(),
        version: fakeVersion(content),
      },
    };
  },
};

// ---------- write_file ----------

export type WriteFileInput = {
  path: string;
  content: string;
  expectedVersion?: string;
};

export type WriteFileOutput = {
  file: MarkdownFile;
};

export class WriteConflictError extends Error {
  constructor(path: string, expected: string, actual: string) {
    super(
      `Write conflict on ${path}: expected version ${expected}, found ${actual}. Re-read and retry.`
    );
    this.name = 'WriteConflictError';
  }
}

export const writeFile: Tool<WriteFileInput, WriteFileOutput> = {
  name: 'write_file',
  description:
    "Write a markdown file to the user's cloud store. Optional expectedVersion for optimistic concurrency; omit on first-time writes.",
  async execute(input, ctx) {
    assertSafePath(input.path);
    const existing = FIXTURE_FILES[input.path];
    if (input.expectedVersion !== undefined && existing !== undefined) {
      const actual = fakeVersion(existing);
      if (input.expectedVersion !== actual) {
        throw new WriteConflictError(input.path, input.expectedVersion, actual);
      }
    }
    return {
      file: {
        path: input.path,
        content: input.content,
        updatedAt: ctx.now.toISOString(),
        version: fakeVersion(input.content),
      },
    };
  },
};

// ---------- registry ----------

export const tools = {
  read_calendar: readCalendar,
  read_emails: readEmails,
  read_file: readFile,
  write_file: writeFile,
} as const;

export type ToolName = keyof typeof tools;

// ---------- helpers ----------

const ISO_DATE_OR_DATETIME = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?)?$/;

function assertIsoRange(start: string, end: string): void {
  if (!ISO_DATE_OR_DATETIME.test(start) || !ISO_DATE_OR_DATETIME.test(end)) {
    throw new Error(
      `read_calendar: start/end must be ISO 8601 date or datetime (got start="${start}", end="${end}")`
    );
  }
  if (start > end) {
    throw new Error(`read_calendar: start (${start}) must be <= end (${end})`);
  }
}

function clampLimit(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 100) return 100;
  return Math.floor(n);
}

function fixtureMatchesQuery(m: EmailMessage, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    m.subject.toLowerCase().includes(needle) ||
    m.snippet.toLowerCase().includes(needle) ||
    m.from.toLowerCase().includes(needle)
  );
}

function assertSafePath(path: string): void {
  if (!path || path.length === 0) {
    throw new Error('path must be non-empty');
  }
  if (path.startsWith('/')) {
    throw new Error(`path must be relative (got "${path}")`);
  }
  if (path.split('/').some((seg) => seg === '..' || seg === '')) {
    throw new Error(`path must not contain traversal or empty segments (got "${path}")`);
  }
}

function fakeVersion(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = (h * 31 + content.charCodeAt(i)) | 0;
  }
  return `v${(h >>> 0).toString(16).padStart(8, '0')}`;
}

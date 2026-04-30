# Parent-repo deltas needed to land the v6 ship list

Most of v6 is frontend-only and already deployed at <https://claude-original.vercel.app/>.
Three changes need to happen in the **parent repo** (`/Users/Muxin/Documents/GitHub/intently/`) to unlock the rest. They are independent — land them in any order.

Frontend gracefully degrades when these aren't yet shipped: the "Think harder" button errors with "unknown skill," and the whisper falls back to calling `daily-brief` with a one-sentence constraint (slower but functional).

---

## 1. Swap `daily-brief` to Sonnet, add a `daily-brief-deep` Opus version, enable prompt caching

**Why**: latency. Opus is ~3× slower than Sonnet. Sonnet is fine for the conversational shape of the brief; Opus stays available as a "Think harder" escalation path. Prompt caching cuts time-to-first-token by 30-50% on the ~3,200-token system prompt.

### File edits

`agents/daily-brief/ma-agent-config.json` — change `model`:

```diff
- "model": "claude-opus-4-7",
+ "model": "claude-sonnet-4-6",
```

Create `agents/daily-brief-deep/ma-agent-config.json` (copy of the sonnet version with two changes):

```json
{
  "name": "intently-daily-brief-deep",
  "description": "Opus-backed deeper pass on the daily brief — invoked from the 'Think harder' escalation when the Sonnet brief didn't land. Same SKILL.md behavior, slower model, no other differences.",
  "model": "claude-opus-4-7",
  "system": "<copy the same `system` string from agents/daily-brief/ma-agent-config.json>",
  "mcp_servers": [],
  "tools": [{ "type": "agent_toolset_20260401" }],
  "skills": []
}
```

Create `agents/morning-whisper/ma-agent-config.json` for the new whisper skill:

```json
{
  "name": "intently-morning-whisper",
  "description": "One-line morning radar pulse. Replies in a single sentence — just the thing the user really needs to know on their radar this morning. No structure, no JSON. Reads same context as daily-brief.",
  "model": "claude-haiku-4-5-20251001",
  "system": "<copy same Life Ops Conventions + 'reply in ONE SENTENCE' instruction; see drafted prompt in this doc, section 1b>",
  "mcp_servers": [],
  "tools": [{ "type": "agent_toolset_20260401" }],
  "skills": []
}
```

> **1b — drafted whisper system prompt** (paste into the `system` field above):
>
> ```
> You generate a single-sentence morning radar pulse for the Intently user.
>
> You will receive the same Life Ops Conventions context as the daily-brief skill (Goals, Monthly Goals, Weekly Goals, Daily Log, Ops Plan). Read all of it.
>
> Output **exactly one sentence** — under 25 words — naming the single thing the user really needs on their radar this morning. Pick the one item that, if missed, would matter most. If nothing is genuinely radar-worthy (slow week, nothing time-sensitive), say so plainly: "Nothing pressing — just keep moving."
>
> No bullets. No structure. No JSON. No greeting. Just the one sentence.
>
> Examples:
> - "Pitch dry-run with Anya at 3pm — that's the one."
> - "Three days deep — today's a good day to ease off unless something's time-sensitive."
> - "Visa paperwork window closes Thursday; you've been dodging it."
> - "Nothing pressing — just keep moving."
> ```

### Provisioning code change — `scripts/provision-ma-agents.ts`

Add `cache_control` to the system block. Around line 191:

```diff
  const created = await client.messages.batches /* … or whatever the actual call is … */
  /* The system field needs to be sent as a content-block array, not a plain string,
     to attach cache_control breakpoints. */
- system,
+ system: [
+   { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
+ ],
```

Verify the MA SDK accepts the array form. If not, ma-proxy can wrap on every call instead — see section 2.

### Run

```bash
cd /Users/Muxin/Documents/GitHub/intently
# Re-provision the swapped daily-brief
node scripts/provision-ma-agents.ts --skill daily-brief --update-existing

# Provision the deep variant
node scripts/provision-ma-agents.ts --skill daily-brief-deep

# Provision the whisper
node scripts/provision-ma-agents.ts --skill morning-whisper

# Verify the IDs
supabase secrets list | grep MA_AGENT_ID
```

You should see `MA_AGENT_ID_DAILY_BRIEF` (now Sonnet), `MA_AGENT_ID_DAILY_BRIEF_DEEP` (Opus), `MA_AGENT_ID_MORNING_WHISPER` (Haiku).

### Update `supabase/functions/ma-proxy/index.ts`

Add the new skills to `SKILL_ENV` (around line 67):

```diff
  const SKILL_ENV: Record<string, string> = {
    chat: 'MA_AGENT_ID_CHAT',
    'daily-brief': 'MA_AGENT_ID_DAILY_BRIEF',
+   'daily-brief-deep': 'MA_AGENT_ID_DAILY_BRIEF_DEEP',
+   'morning-whisper': 'MA_AGENT_ID_MORNING_WHISPER',
    'daily-review': 'MA_AGENT_ID_DAILY_REVIEW',
    /* … */
  };
```

Then deploy:

```bash
supabase functions deploy ma-proxy --project-ref cjlktjrossrzmswrayfz
```

---

## 2. SSE passthrough in ma-proxy (perceived latency)

**Why**: with Sonnet at ~20s/turn, streaming makes the wait feel ~5s instead of dead silence. Klei-style narration (already wired frontend-side in `intently-ma.jsx`'s `pickBeat`) becomes much richer when paired with real token streaming.

The `ma-proxy` comments already call this out as post-hackathon work (line 8-19). The lift:

- Change `Deno.serve` handler to return a `ReadableStream` body with `Content-Type: text/event-stream`.
- Forward each upstream SSE frame as it arrives instead of accumulating.
- The browser already has a partial parser path for these events — we'd add an `EventSource` listener in `intently-ma.jsx → callManagedAgent` (or swap to `fetch` with `ReadableStream` body parsing) that fires text chunks to a passed-in `onChunk` callback.

This is ~half-day of work in the parent repo. The frontend `LiveAgentChat` already has the state shape to handle progressive prose appending — `setMessages((m) => […m, { role: 'agent', text: accumulated }])` is straightforward.

---

## 3. Cron pre-warming for daily-brief (eliminate first-touch wait)

**Why**: makes the morning surface load instantly. The agent runs at ~5am from your `daily_brief_time` config, persists to Supabase, the frontend reads the row.

### New table

`supabase/migrations/0011_daily_briefs.sql`:

```sql
CREATE TABLE daily_briefs (
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  date        DATE NOT NULL,
  pacing      TEXT NOT NULL,
  flags       JSONB NOT NULL DEFAULT '[]'::jsonb,
  bands       JSONB NOT NULL,
  parked      JSONB NOT NULL DEFAULT '[]'::jsonb,
  today_one_line TEXT NOT NULL,
  carrying_into_tomorrow TEXT NOT NULL DEFAULT '',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by TEXT NOT NULL DEFAULT 'cron',  -- 'cron' | 'user' for traceability
  PRIMARY KEY (user_id, date)
);

ALTER TABLE daily_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read their own briefs" ON daily_briefs FOR SELECT USING (auth.uid() = user_id);
-- writes happen through the cron's service-role key; no INSERT policy for users.
```

### Cron edge function

`supabase/functions/cron-daily-brief/index.ts`:

- Iterates over users in the `users` (or `profiles`) table whose `daily_brief_time` matches the current hour.
- For each, builds the markdown context (same shape as `intently-ma.jsx → buildBriefInput`) — needs server-side equivalents reading from the parent's existing `entries` / `goals` / `projects` tables.
- POSTs to ma-proxy with `skill: 'daily-brief'`.
- Parses the trailing JSON block.
- Upserts into `daily_briefs` keyed by `(user_id, date)`.

Schedule via Supabase pg_cron (the parent repo already uses `0007_dispatch_via_pg_net.sql` — same pattern):

```sql
SELECT cron.schedule(
  'daily-brief-morning',
  '0 5 * * *',  -- 5am UTC; refine per user TZ in the function body
  $$ SELECT net.http_post(
       url := 'https://cjlktjrossrzmswrayfz.supabase.co/functions/v1/cron-daily-brief',
       headers := '{"Authorization":"Bearer <service_role_key>"}'::jsonb
     ); $$
);
```

### Frontend read

In `app/intently-ma.jsx`, when whisper-mode opens, query `daily_briefs` for today's row before invoking the agent. If a row exists, surface its `today_one_line` instantly. If not (cron failed, or it's their first day), fall back to the live `morning-whisper` call I already wired. This needs:

- The Supabase JS client (or a lightweight `fetch` wrapper)
- Anon key (publishable) — paste it into Vercel env as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or thread it through `app/.env.example`).

---

## 4. Verification — once 1–3 land

Re-run the contract test:

```bash
node tests/agent-contract.mjs --skill daily-brief
node tests/agent-contract.mjs --skill daily-brief-deep
node tests/agent-contract.mjs --skill morning-whisper
```

Add fixtures for the new skills under `tests/fixtures/daily-brief-deep.*.md` and `tests/fixtures/morning-whisper.*.md`. The runner already filters by skill from filename prefix.

For latency, eyeball it: the existing test prints elapsed seconds per fixture. We expect Sonnet's daily-brief to land ~20s, Opus's daily-brief-deep at ~60s (current baseline), Haiku's morning-whisper at ~5s.

---

## Order I'd ship in

1. **Section 1 (Sonnet swap + prompt caching)** — biggest win, smallest blast radius.
2. **Section 3 (cron + table)** — eliminates the first-touch wait; the demo finally feels alive.
3. **Section 2 (SSE)** — polish on top once Sonnet halves real time.

Each step is shippable independently. The frontend already has the seams.

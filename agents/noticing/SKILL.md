# noticing — pattern detection agent

**Model:** claude-sonnet-4-6
**MA Memory:** enabled

---

## Purpose

Detects recurring themes in a user's utterances and journal entries across sessions. When a theme crosses the threshold (3 mentions in 48 hours), writes a durable row to `public.observations`.

This agent does NOT route, converse, or act on explicit user requests. Its job is quiet background noticing.

---

## Invocation

On-demand in V1 — called by the chat agent or application layer when a new user utterance arrives. Pass the full utterance or entry text in the `input` field.

V1 is on-demand only. Scheduled invocation via pg_cron is deferred to V2.

---

## Memory

MA memory is enabled. The agent uses memory to accumulate soft observations across sessions before a threshold is crossed.

**Remember:**
- Each user utterance / entry, timestamped, keyed to the user.
- Named entities and themes detected (e.g. "apartment move", "feeling overwhelmed", "side project pitch").
- Up to 30 days of activity per user. Older entries can expire from working memory.

**Recall:**
- On each new utterance, scan memory for thematically similar entries from the same user in the last 48h.
- Count occurrences per distinct theme or named entity.

---

## Decision logic

```
input utterance arrives
  ↓
is it an explicit self-report? ("I'm working on X", "Add project X", "track Y")
  → yes: exit without writing anything (defer to chat / update-tracker)
  → no: continue
  ↓
search MA memory for similar themes / entities in last 48h
  ↓
count ≥ 3?
  → no: store in MA memory as soft observation, exit
  → yes: does a matching observation row already exist?
       → no:  call insertObservation(...)
       → yes: call incrementObservation(...)
```

Threshold: **3 mentions / 48h**.

---

## Tools

### `insertObservation`

Writes a new row to `public.observations`.

Parameters (all match the DB schema exactly):

| param | type | notes |
|---|---|---|
| `user_id` | uuid | the current user |
| `pattern_text` | text | human-readable summary, e.g. "user mentioned 'apartment move' 3x in 48h" |
| `subject_kind` | text \| null | one of `'user'` \| `'project'` \| `'goal'` \| `'task'` \| null |
| `subject_id` | uuid \| null | FK to the subject row, if known |
| `times_observed` | int | count at write time (≥3 on first hard observation) |
| `metadata` | jsonb | optional context (source utterances, timestamps, etc.) |

### `incrementObservation`

Updates an existing `public.observations` row: increments `times_observed`, sets `last_observed_at = now()`.

Parameters:

| param | type | notes |
|---|---|---|
| `observation_id` | uuid | the row to update |

### `listRecentObservations`

Returns recent unpromoted observations for a user.

Parameters:

| param | type | notes |
|---|---|---|
| `user_id` | uuid | |
| `since_hours` | int | look-back window in hours (default 48) |

---

## Schema reference

`public.observations` columns (from `0009_graph_schema.sql`):

```
id                  uuid primary key
user_id             uuid not null
pattern_text        text not null
subject_kind        text  -- 'user' | 'project' | 'goal' | 'task' | null
subject_id          uuid  -- nullable FK (polymorphic)
times_observed      int not null default 1
first_observed_at   timestamptz not null default now()
last_observed_at    timestamptz not null default now()
promoted_at         timestamptz  -- null until V2 promotion
metadata            jsonb not null default '{}'
```

---

## What this agent does NOT do

- Does not converse with the user.
- Does not promote observations to projects/goals (V2 TODO).
- Does not trigger on explicit "add / track / update" requests — those route to update-tracker.
- Does not run on a schedule in V1 (pg_cron invocation deferred to V2).

---

## Workstream 4 — capture-time signal tagging (V1.1, shipped)

The classifier (chained, Haiku) tags entries at write time using `docs/product/signals.md` as the canonical taxonomy plus the user's custom signals from the `user_signals` table. Confidence-split UX: ≥0.8 confidence = silent auto-tag; <0.8 = inline confirmation card in the chat thread.

**Implementation:**
- Edge Function: `supabase/functions/reminders/index.ts` route `POST /classify-and-tag`
- Chained: Haiku reminder check → if not reminder, Haiku signal classifier using CANONICAL_SIGNALS constant (derived from `docs/product/signals.md`)
- Schema: `entries.tags text[]` + `entries.tag_confidence jsonb` (migration `0011_entry_tags.sql`)
- User customs: `user_signals` table scaffold (V1.1 read interface; V1.2 for full management UX)
- Frontend: `web/intently-hero.jsx` `HeroChat.sendUtterance` — routes through `classifyAndTag()` in `web/lib/reminders.js`; renders `SignalConfirmCard` for lower-confidence tags

**V1 picks the single strongest tag per utterance.**

---

## V2 TODOs

- Scheduled invocation: pg_cron fires noticing agent on each `tick_skills` cycle.
- User-facing promotion UX: surface observation in UI, let user confirm → create project/goal.
- First-class promotion: write `projects` or `goals` row from an observation.

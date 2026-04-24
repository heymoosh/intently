# Session Prompt — Entries-Architecture Reconciliation (Planning + Orchestration)

> **⚠ THIS SESSION DOES NOT BUILD ⚠**
>
> This is a **planning + orchestration** session. You produce a reconciled plan and spawn parallel `intently-track` worktrees that do the actual implementation. You do not write schema migrations, edit `app/`, or rewrite edge functions yourself. Your deliverable is the plan in §A and the spawned tracks in §B.
>
> **Why:** the original prompt prescribed monolithic sequential build phases. After the design folder was replaced 2026-04-24 (interactive prototype + new HANDOFF/BUILD-RULES/CLAUDE.md) and Muxin's reminders intent surfaced as broader than the doc letter, the right move is a reconciliation pass that *produces* the build plan rather than executing one written cold.

## §A. The reconciliation deliverable (produce this BEFORE any tracks spawn)

Write your output as a new file `docs/process/session-prompt-entries-architecture-v2.md` (supersedes this file once Muxin signs off). The file has five sections, in order:

### Section 1 — What the new design says
A 5–10 bullet summary of `docs/design/Intently - App/HANDOFF.md` + `BUILD-RULES.md` + `CLAUDE.md` re: **entries, capture, reminders, hero affordance, and any new entity types or flows**. Quote where useful. If the new design folder includes interactive-prototype JSX/HTML files demonstrating capture or entry behavior, run/inspect them and capture what they show.

### Section 2 — What's currently in the codebase
Concrete state, not aspirational. Probe each:
- `entries` table — exists? schema?
- `reminders` table — exists, schema, what data is in it
- `supabase/functions/reminders/index.ts` — what endpoints, what classify behavior
- `app/lib/reminders.ts`, `app/components/VoiceModal.tsx`, `app/App.tsx` — what's the read/write path today
- The 4 live MA agents (daily-brief, daily-review, weekly-review, monthly-review) — how do they currently consume context

### Section 3 — The gap
Where (1) and (2) disagree. **Specific.** Format each as: *"New design says X; code does Y; reconcile by Z."* Aim for 4–8 gaps, not a wishlist.

### Section 4 — Clarifying questions for Muxin
Anchored, not open-ended. Bad: "How should reminders work?" Good: "The new HANDOFF describes a 'Capture' beat where the user drops something loose and the agent stashes it. Should that map to: (a) every utterance writes an Entry and capture is a special-case Entry kind, or (b) capture is a peer entity to Entry with its own table?"

Apply the **"Spec intent > spec letter"** rule from root `CLAUDE.md`: ask Muxin in his own words about the user beats, not the data shape. State back one sentence per question and confirm before logging the answer.

### Section 5 — Proposed parallel-track slicing
Independent worktrees that don't collide on files. Identify, for each track:
- **Slug** (will become `feat/track-<slug>` and `~/worktrees/intently/<slug>`)
- **Owns** (the directories/files that track is allowed to write)
- **Depends on** (which other tracks must land first)
- **Initial prompt** (a self-contained brief for that track — what to build, scope, verification)

Example partitioning (illustrative, not prescriptive — actual slicing depends on what reconciliation surfaces):
- Track A: schema + edge-function rewrite (`supabase/migrations/`, `supabase/functions/`)
- Track B: app-side capture lib + VoiceModal updates (`app/lib/`, `app/components/VoiceModal.tsx`) — depends on A
- Track C: render migration on Past/Present/Future (`app/App.tsx`, `app/components/AgentOutputCard.tsx`) — depends on B

For each pair of tracks, flag file-overlap risk. If two tracks must touch the same file, sequence them; do not run them parallel.

## §B. After Muxin signs off on §A

For each track in §A.5:

1. From the main repo dir, spawn the worktree with the initial prompt:
   ```
   bash scripts/intently-track.sh <slug> "$(cat <prompt-file-for-that-track>)"
   ```
   Or if the prompt is short, pass it inline. Each track's prompt should be a standalone file under `docs/process/session-prompt-<slug>.md` so it's auditable.
2. Note the spawned worktree branches in TRACKER.md "In-flight tracks" so future sessions see what's running.
3. **Stop.** Don't enter the worktrees yourself. Each worktree session will pick up its own prompt and execute. Auto-merge handles landing them via CI.

## §C. Constraints (non-negotiable)

- Do **not** start a track until reconciliation §A is signed off by Muxin.
- Do **not** kick off all tracks simultaneously if any have a `Depends on` — sequence them.
- Do **not** write schema, app code, or edge function changes in this session. If you find yourself opening a `.sql` or `.ts` file in edit mode, stop. That belongs in a downstream track.
- Do honor the **"Spec intent > spec letter"** rule from root CLAUDE.md throughout.
- Do honor the design folder's **BUILD-RULES.md non-negotiables** (hero is the ONE interaction surface; phase/zoom is data not UI; no tabs; mobile-first phone frame; no emoji in copy; etc.) when proposing track scopes.

## §D. Inputs you should read

In order:
1. **Root `CLAUDE.md`** — the "Spec intent > spec letter" rule and other behavioral defaults.
2. **`docs/design/Intently - App/CLAUDE.md`** — design-owner's "start here."
3. **`docs/design/Intently - App/BUILD-RULES.md`** — non-negotiables. Read carefully.
4. **`docs/design/Intently - App/HANDOFF.md`** — full spec.
5. **`docs/design/Intently - App/intently-*.jsx` + interactive prototype HTML** — pattern reference.
6. **Current code** — `app/App.tsx`, `app/components/VoiceModal.tsx`, `app/lib/voice.ts`, `app/lib/reminders.ts`, `supabase/functions/reminders/index.ts`, `supabase/migrations/0003_reminders.sql`.
7. **Project memory** at `~/.claude/projects/-Users-Muxin-Documents-GitHub-intently/memory/` — especially `project-design-folder-replaced-2026-04-24.md`, `project-memory-tiers.md`, `feedback-spec-intent-elicitation.md`.

## §E. Muxin's intent — captured 2026-04-24 (carry into reconciliation, but verify)

**On reminders:**
> "reminders was more like, 'keep track of this and surface it in daily briefing' not specifically 'you asked me to remind you to...' so that if i say, dropped in a 'hey add this somewhere' and leave a voice memo the agent's like 'cool got it' and it stashes it somewhere where it will pull it up again during our daily briefing when we're planning the day, it tracks time sensitivity (so like if the deadline is tomorrow or in a few days it pulls it up in today's daily briefing but it doesn't do something like that for something that's way out in the future), or if I ever ask the agent 'hey what's that thing i had to do again' and it just pulls it up. i was saying before we should use a more durable DB for this kind of thing and not make managed agent memory try and hold it cause it's a waste of the memory functionality."

**On entries:**
> "what you mean by 'entry' — is, any time I talk to the AI agent. Whether that's through the voice input or chat input. I just talk to it. Oh there may be a function somewhere in the design docs about letting me manually add something, too — but go by what we've got in the intently app design folder."

These are the words from before the design folder replacement. Verify whether the new design folder reframes either; surface any reframe in §3 (Gap).

---

## When done

- Commit `docs/process/session-prompt-entries-architecture-v2.md` (the reconciliation deliverable).
- Update `TRACKER.md` Critical items: clear the reconciliation entry, add an "In-flight tracks" section listing each spawned track + its `feat/track-<slug>` branch.
- Push, open PR for the reconciliation document. Do not include code in this PR — docs only.
- Then spawn the tracks per §B. Each track's PR is owned by that track's session.

## Read first (in order)

1. **Root `CLAUDE.md`** — especially the new **"Spec intent > spec letter"** rule. *Before* you touch schema or write code, ask Muxin in his own words how Entries should feel as a user (the *beat*, not the data shape). State back one sentence; if it disagrees with this prompt, his current intent wins.
2. **`docs/design/Intently - App/HANDOFF.md` §2.3 (`Entry`)** — the canonical type. Kinds: `brief | journal | chat | review`. Note explicitly: **no `reminder` Entry kind** — reminders are a metadata-tagged subset, not a new kind.
3. **`docs/design/Intently - App/HANDOFF.md` §6.2** — ad-hoc voice flow. User taps hero → listening → classify → ConfirmationCard → commit Entry. Both voice and the chat-mode "type instead" flow funnel through the same path.
4. **`docs/design/Intently - App/BUILD-RULES.md`** non-negotiable #1 — hero is the ONE interaction surface. Manual-add is hero's `chat` state, **not** a separate "+ New entry" button.
5. **Current code** — `app/App.tsx`, `app/components/VoiceModal.tsx`, `app/lib/voice.ts`, `app/lib/reminders.ts`, `supabase/functions/reminders/index.ts`, `supabase/migrations/0003_reminders.sql`. Read what's there before changing anything.

## Muxin's intent (his own words, captured 2026-04-24)

**On reminders:**
> "reminders was more like, 'keep track of this and surface it in daily briefing' not specifically 'you asked me to remind you to...' so that if i say, dropped in a 'hey add this somewhere' and leave a voice memo the agent's like 'cool got it' and it stashes it somewhere where it will pull it up again during our daily briefing when we're planning the day, it tracks time sensitivity (so like if the deadline is tomorrow or in a few days it pulls it up in today's daily briefing but it doesn't do something like that for something that's way out in the future), or if I ever ask the agent 'hey what's that thing i had to do again' and it just pulls it up. i was saying before we should use a more durable DB for this kind of thing and not make managed agent memory try and hold it cause it's a waste of the memory functionality."

**On entries:**
> "what you mean by 'entry' — is, any time I talk to the AI agent. Whether that's through the voice input or chat input. I just talk to it. Oh there may be a function somewhere in the design docs about letting me manually add something, too — but go by what we've got in the intently app design folder."

The capture inbox semantics are: **drop a thing → "cool got it" → time-sensitive surfaces in brief, far-future stays silent, ad-hoc recall always works**. Not "remind me at time X."

## Architecture decisions (already made; if you disagree, surface it before touching schema)

These were debated in the previous session, with advisor pressure-testing. The new session should honor them unless Muxin explicitly redirects:

1. **Entries is canonical.** Every user-agent utterance writes an `entries` row. Voice → Entry (source=voice). Hero chat (type-instead) → Entry (source=text). Agent-produced brief/review/monthly outputs → Entry (source=agent, kind=brief|review). The Entry table is the canonical log of "what happened in this user-agent relationship."
2. **Reminders is a projection, not a peer.** When the agent classifies an utterance as "something to stash/track," insert an Entry AND a Reminder row with `entry_id` foreign key, optional `remind_on`, `urgency`, `status`. Reminders carries the *time-indexed subset* — daily-brief queries this for "what's due soon," not the full Entry log.
3. **Two tables, not one with JSONB.** `entries` and `reminders` are separate tables. `reminders.remind_on` is an indexed nullable date column. Daily-brief's "due-soon" query gets a proper SQL index, not a JSONB filter. Cost: one more migration. Worth it.
4. **No reminder Entry kind.** `chat` Entry covers loose captures. The reminder-ness lives on the linked Reminder row, not as a new Entry kind. Keeps Entry's canonical-log role pure.
5. **Manual-add = hero chat state.** Per BUILD-RULES non-negotiable #1, no separate "+ New entry" button. Typed input via the hero's chat-mode goes through the same classify → Entry pipeline as voice.
6. **MA memory tool is NOT for this.** Reminders/entries are durable user-stated structured data — Supabase. MA memory is for agent-observed soft patterns (the two-tier memory architecture from `~/.claude/projects/-Users-Muxin-Documents-GitHub-intently/memory/project-memory-tiers.md`). Don't conflate them.

## What to build (priority order; STOP at any point if Muxin redirects)

### Phase 1 — foundation
1. **ADR `docs/decisions/0004-entries-as-canonical-store.md`** — captures the architectural decision: Entry as canonical log, Reminder as projection, two-table pattern, intent vs. spec-letter rationale (why we evolved the narrow date-only reminders into capture+projection).
2. **Migration `supabase/migrations/0004_entries.sql`** — create `entries` table per spec §2.3:
   - `id uuid pk default gen_random_uuid()`
   - `user_id uuid not null references auth.users(id)`
   - `at timestamptz not null default now()` (per spec §2.3 "ISO timestamp")
   - `kind text not null check (kind in ('brief','journal','chat','review'))`
   - `title text`
   - `body_markdown text`
   - `glyph text` — agent-assigned glyph name (~40-glyph set, §7.5)
   - `mood text` — one of `dawn|morning|midday|dusk|night|rain|forest` per §2.3
   - `source text not null check (source in ('voice','text','agent'))`
   - `links jsonb default '[]'::jsonb` — array of `{type:'project_id'|'goal_id'|'entry_id', id}`
   - `created_at timestamptz default now()`
   - RLS: owner-only, mirroring migration 0001
   - Index on `(user_id, at desc)` for "recent entries" queries
   - Index on `(user_id, kind, at desc)` for kind-filtered queries (e.g. last review)
3. **Migration `supabase/migrations/0005_reminders_projection.sql`** — alter existing `reminders` table:
   - Add `entry_id uuid references entries(id) on delete cascade` (nullable for backwards compat with existing seeded rows; new rows always set it)
   - Add `urgency text check (urgency in ('soon','this-week','later','none')) default 'none'` — agent-classified time-pressure label, separate from `remind_on` (a row can have urgency=soon AND remind_on=null if the user said "I should do this asap" without naming a date)
   - Keep `remind_on` nullable as before — null = timeless capture, surfaces only on explicit recall
   - The check on `status` already covers `pending|surfaced|done|dismissed`; no change

### Phase 2 — write path
4. **`app/lib/entries.ts`** — CRUD helpers. `writeEntry(opts)`, `recentEntries({since, kinds, limit})`, `entriesForDay(date)`. Match the shape from `app/lib/reminders.ts` for consistency.
5. **`supabase/functions/reminders/index.ts`** — rewrite the `/classify-and-store` endpoint:
   - Always writes an Entry (kind=`chat`, source from request body, body_markdown=transcript, agent-classified title/glyph if possible)
   - If the classifier identifies time-sensitivity OR a stash-this-for-later signal, ALSO writes a Reminder row with `entry_id` FK
   - Classify prompt: rewrite to be open — extract `{kind:'capture'|'reminder'|'noise', text, remind_on?, urgency?}`. Drop the "must have a date" hard cut. The endpoint becomes a general capture, not a reminder-specific endpoint. Rename considered (e.g. `/capture`) but keep `/classify-and-store` for now to avoid client churn.
   - Add a separate `/active` endpoint (replacing or alongside `/due`): returns reminders where `status=pending` AND (`remind_on IS NULL` OR `remind_on <= today + N`). Loose captures + soon-due ones; far-future excluded.
6. **`supabase/functions/reminders/index.ts`** also: keep `/due?date=YYYY-MM-DD` for backwards compatibility but treat it as a synonym for `/active`.

### Phase 3 — read path
7. **`app/lib/reminders.ts` → `app/lib/captures.ts`** — rename + broaden. `fetchActiveCaptures()` replaces `fetchDueReminders()`. Returns the union of soon-due reminders + recent loose captures the agent thinks are worth surfacing.
8. **`app/App.tsx` daily-brief input assembly** — fetch active captures, pass them to the agent with the framing: "*The user has captured these items. Surface only what fits today's narrative; far-future items can stay silent.*"
9. **`app/components/VoiceModal.tsx`** — point at the renamed/rewritten endpoint. Update success card copy: not "Reminder saved" but "Captured" or "Got it" (Muxin's language: "cool got it"). Show the agent's classification: if it became a date-anchored reminder, show the date; if it's loose, just show the text. Don't make the user pick.

### Phase 4 — Entries everywhere
10. **`handleGenerateLiveBrief`, `handleGenerateLiveReview`, `handleGenerateLiveWeekly`** in App.tsx — after the agent returns, write the output as an Entry (kind=brief or review, source=agent). This is the canonical log: every brief, every review, every utterance is on the timeline.
11. **Past screen Day view** — read from `entries` for the selected day, render chronologically. Currently the Past screen is hand-assembled from `briefOutput` + `reviewOutput` state. With Entries as canonical, Past becomes a query.

## What NOT to do

- Don't drop the `reminders` table. The seeded demo data (when seeded) and the production write path both reference it. Migrate, don't replace.
- Don't introduce a "reminder" Entry kind. The four kinds in spec §2.3 are deliberate.
- Don't add a "+ New entry" button anywhere. Manual-add is hero's chat state per BUILD-RULES #1.
- Don't ship MA memory tool integration in this session. It's a separate architectural lane (see `~/.claude/projects/.../memory/project-memory-tiers.md`).
- Don't touch the design-fidelity scope from `docs/process/session-prompt-design-fidelity.md` (phone frame, TenseNav, painterly CTAs, hero state machine, typography). Those are owned by the design-fidelity track. Stay in your lane.
- Don't merge directly to main. The `feat/track-entries-architecture` branch you're on auto-merges via CI when green; respect the workflow.

## Verification

After each phase, run:
```
cd app && npm run typecheck && npm run test:unit
```
108 unit tests currently — don't regress.

After phase 2, smoke-test:
- Hero voice → say "remind me to call dentist Tuesday" → Entry written with kind=chat AND Reminder row with `remind_on='2026-04-29'` (or whatever next Tuesday is).
- Hero voice → say "I should think about Q2 strategy at some point" → Entry written, possibly Reminder with `remind_on=null` and `urgency='later'`.
- `GET /functions/v1/reminders/active` returns both, but daily-brief's input only includes the first when run.

## Commit discipline

- Branch is `feat/track-entries-architecture`, in worktree at `~/worktrees/intently/entries-architecture`.
- Small, focused commits per phase. Conventional prefixes: `feat(entries):`, `feat(captures):`, `migrate(db):`, etc.
- Co-Authored-By line on each commit:
  ```
  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```
- Push regularly — the auto-merge workflow picks up `feat/track-*` once CI is green.

## When done

- Update `TRACKER.md` with a dated log entry summarizing what landed.
- Push and let auto-merge land it.
- The design-fidelity session can then run on top with Entries already in place — they'll need to migrate the *render* paths in Past/Present/Future to read from entries instead of ephemeral state.

## Final reminder

Before any code changes, **apply the "Spec intent > spec letter" rule**: ask Muxin to describe what Entry should feel like for him as a user, in his own words. State back one sentence. Confirm match before touching schema. If anything in this prompt diverges from his answer, his current intent wins. The reason this rule exists is that this exact session's predecessor built `reminders` narrow because it read the spec literally — don't repeat that.

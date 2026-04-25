# Handoff — Entries-Architecture Reconciliation

**Slug:** `entries-architecture` · **Tracked by:** `TRACKER.md` § Active handoffs (and § Critical items #1)
**Started:** 2026-04-25 · **Last updated:** 2026-04-25 (kickoff)
**Status:** active — pre-Phase-1 (about to spawn prep agents)

## Original intent

The design folder at `docs/design/Intently - App/` was completely replaced 2026-04-24 (interactive prototype + new `CLAUDE.md` / `BUILD-RULES.md` / `HANDOFF.md`). Prior plans — including the v1 entries-architecture session prompt at `docs/process/session-prompt-entries-architecture.md` — were written against the OLD design folder. Building from that v1 plan now would land a literal-letter implementation that misses the beat the new design is asking for.

This project's job: read the new design folder against current shipped code, elicit Muxin's intent on user-beats (NOT data shapes) per the **Spec intent > spec letter** rule, produce a reconciled v2 session prompt at `docs/process/session-prompt-entries-architecture-v2.md`, then spawn parallel `intently-track` worktrees per its slicing.

**Reminders intent — captured 2026-04-24, NOT YET RE-VERIFIED against new design folder:**

> "reminders was more like, 'keep track of this and surface it in daily briefing' not specifically 'you asked me to remind you to...' so that if i say, dropped in a 'hey add this somewhere' and leave a voice memo the agent's like 'cool got it' and it stashes it somewhere where it will pull it up again during our daily briefing when we're planning the day, it tracks time sensitivity (so like if the deadline is tomorrow or in a few days it pulls it up in today's daily briefing but it doesn't do something like that for something that's way out in the future), or if I ever ask the agent 'hey what's that thing i had to do again' and it just pulls it up. i was saying before we should use a more durable DB for this kind of thing and not make managed agent memory try and hold it cause it's a waste of the memory functionality."

This must be re-elicited fresh in Phase 1 Step 3 — both to honor the spec-intent rule and because the new design folder may have shifted the framing.

## Goals

- Produce a reconciled v2 plan (`docs/process/session-prompt-entries-architecture-v2.md`) that lands the new design's intent without churn.
- Land the v2 plan with Muxin's signed-off intent on entries, capture, reminders, and any new entity types — not the v1 prompt's literal-letter version.
- Spawn parallel implementation tracks via `intently-track` per the v2 slicing, sequenced where they have file dependencies.
- Use this project as the second real test of the per-project handoff system (first non-trivial dogfood of the UPDATE flow across multiple sessions and possibly worktrees).

## Decisions made

- **Phase 1 = partial parallelism, Phase 2 = full parallelism.** — Reading is parallelizable (no dependencies between design read + code survey); intent elicitation must be in main session with Muxin (he's a serialized resource); implementation is the classic `intently-track` pattern.
- **Spawn two `Explore` agents in parallel for prep:** Agent A reads `docs/design/Intently - App/` end-to-end including interactive prototype JSX/HTML; Agent B surveys current code (`entries`/`reminders` schema, `supabase/functions/reminders/`, `app/lib/reminders.ts`, `app/components/VoiceModal.tsx`, `app/App.tsx`, the 4 MA agents' context paths). — Saves ~30–40% on the read-heavy part; protects main-session context window.
- **Section 3 (gap synthesis) happens in main session** after both agents return. — Synthesis is judgment-y; main-session has full conversation context that agents lack.
- **Section 4 (clarifying questions) is a real conversation with Muxin, not a doc-cold list.** Apply Spec intent > spec letter: anchored questions ("the new HANDOFF says X — should that map to A or B?"), state back one sentence per answer, get explicit confirmation. — Reason this rule exists: the reminders narrow-vs-capture misread from 2026-04-24 came from skipping it.
- **Carry the 2026-04-24 reminders quote as input** but **re-verify it fresh** as part of Section 4. — Captured intent isn't current intent; design folder context may have shifted the framing.
- **No tabs / phone frame / no emoji / hero is the ONE interaction surface** — non-negotiables from `BUILD-RULES.md`. These constrain Section 5's track scopes regardless of whatever else surfaces.

## Decision log (tried / rejected)

- **Read everything in main session** — rejected. Burns too many tokens on what's mostly mechanical extraction; risks context bloat before the conversational synthesis even starts.
- **Build directly from the v1 session prompt** — rejected per CLAUDE.md spec-intent rule; v1 prompt was written against the OLD design folder and pre-dates Muxin's reminders-intent clarification.
- **Spawn implementation tracks before §A signoff** — explicitly forbidden by the v1 prompt's §C constraints. Tracks built without the reconciled plan would just propagate the literal-letter misread.
- **Defer the handoff CREATE until Step 4** (after sign-off) — rejected. Muxin called out context-loss risk mid-Phase-1; capturing state now is exactly the load-bearing case the handoff system was built for.

## State as of 2026-04-25 (kickoff)

**Branch:** `chat/handoff-steward-status-shipped` (PR [#80](https://github.com/heymoosh/intently/pull/80) — handoff dogfood; bundled the steward-redesign UPDATE + this handoff CREATE).

**What exists already:**
- v1 session prompt at `docs/process/session-prompt-entries-architecture.md` (208 lines, written against OLD design folder; STOP banner walks through the §A/§B protocol; supersedes itself when v2 lands).
- New design folder at `docs/design/Intently - App/` (interactive prototype + `CLAUDE.md` + `BUILD-RULES.md` + `HANDOFF.md`) — untracked, present in working tree.
- Worktree at `~/worktrees/intently/entries-architecture` — created via `intently-track entries-architecture` but empty (no Claude session run there). Will probably destroy + recreate fresh once v2 slicing is decided, since it pre-dates the new plan.
- 4 live MA agents: `daily-brief` (live, end-to-end), `daily-review` / `weekly-review` / `monthly-review` (configs shipped; daily/weekly/monthly review need MA console creation — see TRACKER Follow-ups; user-only).

**What hasn't started:**
- Phase 1 prep agents not yet spawned.
- Section 1 / 2 reports not produced.
- Section 4 questions not drafted.
- Spec-intent conversation not held.
- v2 file does not exist.

## Next steps

1. **Spawn Agent A (Explore, very thorough)** in parallel with Agent B. Prompt: read `docs/design/Intently - App/` in full — `CLAUDE.md`, `BUILD-RULES.md`, `HANDOFF.md`, plus all `intently-*.jsx` + interactive prototype HTML files. Return Section 1 of the v2 deliverable: 5–10 bullet summary of what the new design says re: entries / capture / reminders / hero affordance / new entity types, with quotes where useful.
2. **Spawn Agent B (Explore, very thorough)** in parallel. Prompt: probe current code state. Return Section 2: concrete state of `entries` table, `reminders` table + data, `supabase/functions/reminders/index.ts`, `app/lib/reminders.ts`, `app/components/VoiceModal.tsx`, `app/App.tsx`, and how the 4 MA agents currently consume context. Concrete only, not aspirational.
3. **Main-session synthesis I (~10 min):** read both reports; draft Section 3 (gaps) as 4–8 specific *"new design says X; code does Y; reconcile by Z"* statements; draft Section 4 (clarifying questions for Muxin — anchored, not open-ended).
4. **Spec-intent conversation with Muxin (~15–20 min):** walk Section 4 questions one at a time, elicit intent in his own words, state back one sentence per question, confirm. Update this handoff inline with confirmed answers (decisions go in Decisions made; rejected paths go in Decision log).
5. **Main-session synthesis II (~10 min):** produce Section 5 (track slicing — slug, owns, depends-on, initial prompt for each track). Write the v2 file at `docs/process/session-prompt-entries-architecture-v2.md`. Get Muxin's sign-off.
6. **Phase 2 — spawn tracks:** for each track in Section 5, write a track-specific prompt to `docs/process/session-prompt-<slug>.md`, then `bash scripts/intently-track.sh <slug> "$(cat <prompt-file>)"`. Note spawned worktree branches in TRACKER's "In-flight tracks" section. Don't enter the worktrees from main session.
7. **Re-distill this handoff** at session-end via `/handoff entries-architecture` — strip exploratory noise from Sections 3/4, lock the decisions that landed, sharpen next-steps for the worktree-implementation phase.

## Open questions

- **What does Phase 2's worktree-handoff strategy look like?** If three tracks spawn (e.g., schema + edge fn / app capture lib / render migration), do they share `entries-architecture.md` or get separate slugs (`entries-architecture-schema`, etc.)? Tentative answer per the steward-redesign handoff's open-questions section: "tracks slice into independent slugs, so each track has its own handoff" — confirm this when Phase 2 spawns and update CLAUDE.md / convention doc if the assumption breaks.
- **Does the new design folder change the "Entry as canonical, reminders as projection" model** that was implicit in the v1 prompt? Don't presume; let Section 1 (design read) and Section 4 (intent conversation) answer this.
- **MA agents for daily-review and weekly-review need to be created in the MA console** (see TRACKER Follow-ups) — user-only. If the v2 reconciliation surfaces capture/entries changes that affect what those agents read, sequence the agent creation around the implementation tracks.
- **Should the parked worktree at `~/worktrees/intently/entries-architecture` be destroyed and recreated** once v2 slicing is decided, or repurposed? Decide in Step 6.

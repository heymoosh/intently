# Setup expansion — wake-up briefing

**Generated:** 2026-04-26 overnight by scope-scout sub-agent.
**Source handoff:** `.claude/handoffs/new-user-ux-and-auth.md` § "Setup expansion".
**Purpose:** When you wake up, read this to decide the setup-expansion shape (number of phases, sequencing, completion criterion) before dispatching implementation sub-agents.

---

## TL;DR

Today's setup (`SetupFlow` + `intently-setup` agent) intakes 3 goal titles, asks the agent to draft a `monthly_slice` + glyph for each, and writes those goals + an empty Admin project. That's it — six of the seven inputs the daily-brief assembler depends on (projects, plan_items, journal entries, life_ops_config preferences) come out empty. The original `life-ops-plugin-spec.md` defined a 6-phase onboarding (vault discover, foundation seed, project detect, health, preferences, file seeding); V1 cut to phases 2–3 essentially-collapsed-to-goals-only. The `new-user-ux-and-auth` handoff proposes 4 phases: goals (keep), active projects (1-line + optional first todo), this-week's outcome-direction, preferences (4 time/day fields w/ defaults) — plus an optional journal seed as standalone, plus display name capture. The actual delta is: add 3 phases, wire a real first-run gate (replacing the buried Profile button), and rewrite the agent prompt to enrich the multi-phase payload instead of just goals.

## Status quo (what setup does today)

- **UI:** `SetupFlow` at `web/intently-flows.jsx:2059`. Steps: `intro → input → drafting → review → saving`. Captures 3 goal title strings (textareas). Agent draft fills monthly_slice + glyph. User edits, accepts. On accept: `clearAllUserData()` wipes prior Sam seed, then inserts goals + a single hardcoded `Admin` project (`is_admin: true`). Triggered only via "Set up Intently as me" button in Profile sheet — invisible to a fresh visitor.
- **Agent prompt** (`agents/setup/ma-agent-config.json`): the embedded `system` prompt is a near-verbatim copy of the full 6-phase `SKILL.md` text, but every step beyond §2 (Goals) is annotated `(V1 demo: skip — you produce text output only)`. The agent is told *not* to write files; produce text blocks. In practice, when the UI calls it with 3 goal titles, the parser (`parseSetupResponse`) only extracts `slices[].monthly_slice` + `glyph` per goal index. Nothing else from the agent's output is consumed.
- **Tables it populates:** `goals` (one row per goal — title, monthly_slice, glyph, palette, position), `projects` (one row — the hardcoded Admin project).
- **Tables it leaves empty:**
  - `projects` — no real projects beyond Admin (no goal_id linkage, no `todos`, no `body_markdown`).
  - `entries` — no journal seed, no brief, no chat.
  - `plan_items` — no day-1 plan rows.
  - `life_ops_config.config` — empty `{}` JSONB; no daily_brief_time, no review times, no timezone, no weekly_review_day, no display_name.
  - `profiles.display_name` / `profiles.timezone` — never set by setup.

## What the original 6-phase spec wanted

Per `docs/product/requirements/life-ops-plugin-spec.md` § "Setup Skill — Onboarding Conversation Flow":

- **Phase 1: Discover existing vault** — V1-cut: new users don't have one.
- **Phase 2: Seed foundation docs** — Ops Plan, Goals, Weekly Goals. **V1: collapsed to "3 goals" only.**
- **Phase 3: Detect projects** — for each item, classify project vs task vs goal. **V1-cut to single hardcoded Admin project.**
- **Phase 4: Optional Health/wellness setup** — V1-cut, `health_file_enabled: false`.
- **Phase 5: Preferences** — reflection filename, brief/review/weekly/monthly times, calendar/email integration probe. **V1-cut**, defaults baked in.
- **Phase 6: Seed remaining files** — V1-cut (in DB-source-of-truth model, row-not-exists ≡ empty).

V1 cut over-trimmed because daily-brief actually wants projects + plan + preferences too — exactly the gap the new handoff identifies.

## What the handoff proposes (4 phases)

1. **Goals** (keep current behavior) — 2–5 long-term goal areas, agent enriches with monthly_slice + glyph.
2. **Active projects** — 1–N projects, each with title + 1-line "what is this" + optional first todo. Writes to `projects` (with goal_id + todos JSONB).
3. **This week's outcome-direction** — what success looks like by Sunday.
4. **Preferences** — daily_brief_time, daily_review_time, weekly_review_day, timezone. Defaults pre-filled.

Plus standalone:
- **Optional journal seed** — "anything on your mind right now" → `entries` with `kind='journal'`.
- **Display name** capture — drives the Avatar component.

## Three sequencing options for Muxin to pick from

### Option A — Single-flow rewrite (4 phases in one continuous UI)
- **Pros:** matches the "10-minute setup conversation" framing. Single mental model. All AC verifiable in one PR. First daily brief is non-trivial on day 1.
- **Cons:** big PR (UI + agent prompt + multi-table writes + AC tests). Harder to roll back partial issues.
- **Estimated effort:** ~2 days.
- **Agent prompt impact:** full rewrite — replace 280-line file-creation prompt with structured JSON output schema (~+20 LOC net).

### Option B — Modular flows (keep existing 3-goals flow, add separate flows for each new phase)
- **Pros:** existing SetupFlow stays unchanged → low blast radius. Each new flow ships independent. Easy to make individual phases optional. Re-usable later (e.g. `AddProjectFlow`).
- **Cons:** 4 disjoint UIs feels like 4 setup steps with 4 confirms — fights "one calm conversation". State coordination annoying.
- **Estimated effort:** ~3 days.

### Option C — Iterative rollout (ship one phase at a time as a PR each)
- **Pros:** smallest individual PRs. Each phase observed in deployed state before next ships. Schema/agent issues caught early.
- **Cons:** intermediate states awkward. Compound surface area in seed-gate work that only pays off at PR4.
- **Estimated effort:** ~half-day to 1 day per phase × 4 = 2–4 days total, spread across 4 sessions/PRs.
- **Suggested phase ordering:** (1) Sam-seed gate + display-name + first-run gate. (2) Active-projects intake. (3) Preferences. (4) This-week's-outcome. (5) Journal seed standalone.

**Proposed default: Option C with the Phase-1 plumbing PR as a hard prerequisite.** Rationale: handoff itself splits this into 3 PRs ("Sam-seed gate + display-name", "Setup expansion", "Account upgrade"). Going one finer for setup-expansion keeps each PR reviewable, lets cognition-verification-harness observe each phase's daily-brief impact, and seed-gate work is hard prerequisite to anything feeling real to a stranger. Option A is reasonable second-best if you want to compress timeline and accept reviewer fatigue.

## Decisions Muxin needs to make

1. **How many phases? (3 / 4 / 6 / custom)** → **Proposed default: 4** (handoff's number; week-seed past projects gives daily-brief the "what does this week mean" context).

2. **Display name capture: in setup or separate?** → **Proposed default: separate one-question pre-setup screen** (with auto-detected timezone). Cleaner than burying mid-setup; unblocks Avatar AC immediately.

3. **First-run gate: hard (can't dismiss) or soft (empty state + prominent CTA)?** → **Proposed default: soft.** Matches the calm aesthetic; lets browsers-not-buyers explore. Risk mitigated by making the empty state genuinely useless without setup.

4. **Optional vs required phases:** → **Proposed default: goals required, rest skippable with defaults.** Goals are the load-bearing semantic root; everything else has sensible defaults.

5. **Setup completion criterion:** → **Proposed default: `life_ops_config.config.first_run_complete: true` flipped at user's "Done" tap, regardless of how many phases they touched.** Soft-gate dismiss does NOT set this true; only an explicit "Done" does.

## Schema implications

| Phase | Tables/columns it writes | New columns needed? |
|---|---|---|
| Display name (pre-phase) | `profiles.display_name`, `profiles.timezone` | None — already in 0001. |
| Goals | `goals` | None — already in 0004. |
| Active projects | `projects` (goal_id, todos JSONB) | None — already in 0004. |
| This-week outcome | open question (see below) | One of: (a) `life_ops_config.config.this_week_outcome` text, (b) new `weekly_outcomes` table, (c) 7 days of plan_items. **Lean (a)** — minimal schema churn. |
| Optional journal seed | `entries` | None. |
| Preferences | `life_ops_config.config` JSONB | None — schemaless. |

**Net new schema: 0 columns required if week-outcome lives in `life_ops_config.config`.**

## Agent re-prompt scope

Current `agents/setup/ma-agent-config.json` system prompt is ~280 lines. For 4-phase rewrite:
- **Lines to delete:** all V1-demo "(skip)" annotations, file-creation language (irrelevant in DB-as-truth model post-0004).
- **Lines to add:** structured JSON output schema, per-phase enrichment guidelines.
- **Net:** ~-40 / +60 → ~+20 LOC.
- **Worth a separate sub-agent for re-prompt + eval cases:** yes. Suggest: `setup-agent-reprompt` sub-agent that owns SKILL.md + ma-agent-config.json + `agents/setup/eval/` with 3–5 golden cases.

## Risk flags

- **Calendar/email integration probe** (original Phase 5): the original spec has setup launching Google OAuth mid-conversation. **Hard dependency on the OAuth handoff** — drop the OAuth probe; let OAuth handoff add a "Connect calendar" surface in Profile.
- **Plan_items schema mismatch:** AC says "plan_items for today" but week-outcome is a *weekly* concept. **Decide: `life_ops_config.config.this_week_outcome` (recommended)** vs writing 7 plan_items.
- **First-run gate vs Sam landing-page demo:** seed-gate AC bullets need to be foundation PR before any setup expansion ships, or strangers still land in Sam's life.
- **Daily-brief assembler consumer:** before merging projects/week-outcome/preferences writes, audit assembler to confirm it actually reads these tables/fields.
- **Privacy / data-collection:** display_name + timezone in Privacy disclosure if one exists.

## Recommended next sub-agent dispatches (after Muxin decides)

If Muxin picks **Option C (iterative)** with default decisions above:

1. **PR1 — `seed-gate-and-identity` sub-agent.** Gate `seedSamIfEmpty` to landing-page demo only; build `<Avatar user={user}>`; parameterize hardcoded "Sam"/"M"/"S" strings; capture display_name + auto-detect timezone in pre-setup card. (~half-day, prerequisite for everything else.) **Note: the "new-user-ux scaffolding" sub-agent currently in flight overnight is approximately this PR — verify before dispatching duplicate work.**
2. **PR2 — `setup-agent-reprompt` sub-agent.** Owns `agents/setup/SKILL.md`, `agents/setup/ma-agent-config.json`, new `agents/setup/eval/` folder. Designs structured JSON output schema. Re-provisions via `scripts/provision-ma-agents.ts`. (Half-day.)
3. **PR3 — `setup-projects-phase` sub-agent.** Adds project-intake step to `SetupFlow`; wires `projects` table writes. (Half-day.)
4. **PR4 — `setup-preferences-phase` sub-agent.** Adds preferences form; writes `life_ops_config.config`. No agent enrichment needed. (Quarter-day.)
5. **PR5 — `setup-week-outcome` sub-agent.** Adds week-outcome question; writes to `life_ops_config.config.this_week_outcome`. Updates daily-brief assembler. (Half-day.)
6. **PR6 — `setup-journal-seed-and-completion` sub-agent.** Optional journal-seed prompt; flips `first_run_complete: true`; soft-gate empty-state CTA. (Quarter-day.)
7. **PR7 (parallel) — `cognition-verification-harness` extension.** Adds setup → daily-brief E2E pre-flight to harness.

If Muxin picks **Option A (single-flow)**: dispatch one consolidated `setup-expansion-rewrite` sub-agent and one `setup-agent-reprompt` sub-agent in parallel; merge in one or two PRs.

---

*Briefing produced by scope-scout sub-agent (read-only analysis). When you've decided the 5 questions above, the orchestrator will dispatch the appropriate sub-agents per the recommended sequencing.*

# Overnight Scope Proposal — 2026-04-23

**Generated:** 2026-04-23 (hand-authored by Claude during evening session, one-off pre-routine fire)
**Source:** Scope Overnight Steward pattern — routine's first automated fire is 2026-04-24 21:00
**Tonight's iteration cap:** 6

## Iteration chain (sequential, stacked)

### Iteration 1 — expensify-markdown-swap

- **TRACKER ref:** Critical Item #2 (actionable arm: markdown library swap)
- **Scope:** Swap `react-native-markdown-display` → `@expensify/react-native-markdown-display` in `app/package.json`; update the import in `app/App.tsx:8`; run `npm install` to regenerate `package-lock.json`; verify `npx tsc --noEmit` passes in `app/`; confirm `npm audit` reports the `markdown-it` / GHSA-6vfc-qv3f-vr6c advisory chain cleared.
- **Key files:** `app/package.json`, `app/package-lock.json`, `app/App.tsx`
- **Model + effort:** Sonnet 4.6 medium — mechanical swap, one import, typecheck-gated
- **LOC estimate:** ~10 LOC + lockfile churn
- **Depends on:** independent
- **Session-prompt:** will derive from TRACKER (simple enough; no prompt file needed)

### Iteration 2 — journal-editor-stub

- **TRACKER ref:** (new) design-driven feature — journal editor for user-written entries
- **Scope:** Build a minimal journal entry editor as a stub component: `TextInput` (multiline) for raw markdown + "Edit / Preview" toggle. Preview renders with the Expensify markdown component from iter 1. No Supabase persistence yet — local state only. Placement: new file `app/components/JournalEditor.tsx`. Add a route or overlay pattern in `App.tsx` to surface it from the Past screen (where the journal lives per `docs/design/Intently - App/intently-journal.jsx`). Unit tests for the toggle and edit/preview state.
- **Key files:** `app/components/JournalEditor.tsx` (new), `app/App.tsx` (wire-in), tests in `app/lib/` or colocated
- **Model + effort:** Opus 4.7 high — multi-step RN component with state + tests; small architectural judgment (overlay vs route)
- **LOC estimate:** ~200 LOC + tests
- **Depends on:** iteration 1 merged (Expensify markdown must be present)
- **Session-prompt:** will derive from TRACKER + the design reference file `docs/design/Intently - App/intently-journal.jsx` (DayView structure — entry kinds `brief/journal/chat/review`; journal editor becomes the create-journal-entry surface)
- **Note to Muxin:** this is a functional *stub*, not final design. Review the overlay/route choice in the morning before merging. Final visual polish (painterly card treatment per `DayView`) is a separate track.

### Iteration 3 — agent-output-card-on-present

- **TRACKER ref:** Launch Plan Friday #3 ("Render at least one agent output as a card on the Present screen") — advanced one day to build foundation
- **Scope:** Replace the placeholder `presentMd` string at `app/App.tsx:26-33` with a structured Card component that renders an agent output from seed data (`docs/process/session-prompt-seed-data-v1.md` or `evals/datasets/daily-brief/` if present). **Not live Managed Agents** — read from a JSON fixture or seed file. Component structure mirrors the `kindMeta` pattern in `intently-journal.jsx:262-267` (kind-tinted background, glyph, title, body). This proves the rendering pipeline for Friday's live MA integration.
- **Key files:** `app/components/AgentOutputCard.tsx` (new), `app/App.tsx` (swap `presentMd` for `<AgentOutputCard />`), a seed fixture file
- **Model + effort:** Opus 4.7 high — component with fixture-loading + tests
- **LOC estimate:** ~250 LOC + tests
- **Depends on:** iteration 1 merged (markdown still used for the card body if body is markdown); mostly independent of iter 2
- **Session-prompt:** will derive from TRACKER

### Iteration 4 — evals-dataset-daily-brief-scaffold

- **TRACKER ref:** Launch Plan Friday #5 ("First eval dataset for daily-brief authored")
- **Scope:** Create `evals/datasets/daily-brief/` directory with: a `README.md` explaining the dataset format, one fixture `scenario-01.md` with realistic seed data (a fake user's Weekly Goals snippet, calendar events, recent journal entry, project trackers), and an `expected-output.md` with the style/content the daily-brief agent should produce. No rubric or baseline yet — just the dataset.
- **Key files:** `evals/datasets/daily-brief/README.md`, `evals/datasets/daily-brief/scenario-01.md`, `evals/datasets/daily-brief/expected-output.md`
- **Model + effort:** Sonnet 4.6 medium — content generation, no architecture
- **LOC estimate:** ~150 LOC of content
- **Depends on:** independent of iters 1-3
- **Session-prompt:** exists at `docs/process/session-prompt-seed-data-v1.md` (re-use the seed data shape)

### Iteration 5 — evals-rubric-daily-brief

- **TRACKER ref:** Launch Plan Friday #5 (rubric half)
- **Scope:** Author `evals/rubrics/daily-brief.md` — a Claude-as-judge rubric scoring daily-brief output along axes derived from CR-daily-brief-01 through CR-daily-brief-06 (references prior context, surfaces patterns, narrative not checklist, renders within budget, degrades gracefully on empty memory). Each axis: pass/partial/fail criteria in plain English. Compatible with `evals/runner/` harness shipped in PR #5.
- **Key files:** `evals/rubrics/daily-brief.md`
- **Model + effort:** Sonnet 4.6 medium — content generation, bounded spec source
- **LOC estimate:** ~100 LOC
- **Depends on:** iteration 4 merged (rubric references the dataset structure)
- **Session-prompt:** will derive from `docs/product/acceptance-criteria/daily-brief.md`

### Iteration 6 — evals-baseline-daily-brief

- **TRACKER ref:** Launch Plan Friday #5 (baseline half)
- **Scope:** Author `evals/baselines/daily-brief.json` — initial baseline with all axes at `unknown` (no live runs yet), but structurally shaped so Friday's first agent run produces a scoreable diff. Include a one-line `generated_at` ISO timestamp and `spec_version` pointing at the current criteria file's commit hash.
- **Key files:** `evals/baselines/daily-brief.json`
- **Model + effort:** Sonnet 4.6 medium — structured JSON, mechanical
- **LOC estimate:** ~50 LOC
- **Depends on:** iteration 5 merged
- **Session-prompt:** will derive from iteration 5's rubric

## Blocked (not tonight)

- **Spec update for daily-review next-day preview** — spec edits are live-session only (sensitive wording, human judgment). Do Friday live. (TRACKER Critical item #1.)
- **Live Managed Agents session-based invocation (agent-runner `messages.create` → `POST /v1/sessions`)** — Friday critical path #1. SDK surface has unknowns; not overnight-safe.
- **Google OAuth wiring** — user-only (registration, secrets).
- **Expo SDK 54 vuln** — upstream-blocked.
- **pg_cron activation on remote Supabase** — requires `supabase db push` against remote, hard-stop per build-loop brief.

## Notes for Muxin

- **Tonight's chain is 6 iterations; last night's was 6 iterations and all shipped clean.** Similar shape; expect similar outcome.
- **Iter 2 (journal editor) is the most design-sensitive.** The stub ships as functional, not polished. Review the overlay/route choice + check the morning if the design feels off — it's easier to revert than to over-engineer overnight.
- **Iter 3 uses seed data, not live Managed Agents.** This is intentional — the card rendering pipeline needs to work before Friday's live MA integration, so we're front-loading it. The seed fixture mirrors what a real agent output would look like.
- **Iters 4-6 are eval scaffolding.** These unblock Friday's first eval run and the submission narrative about "how we used managed agents." Thin on code; heavy on content.
- **Lid-closed tonight:** you're already in clamshell mode (external 4K display, AC power, caffeinate running). No `sudo pmset disablesleep` needed. Starting the `/loop 1h` Claude Code session and walking away is the same setup as last night.

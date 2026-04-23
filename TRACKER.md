# Intently Hackathon Tracker

**Purpose:** First doc a new session reads to resume. Hot state only — what's in flight, what's blocked, what just moved. For the durable strategy + milestone view, read `launch-plan.md` at repo root. Schema per `docs/architecture/data-model.md`. Keep slim (cap 100 lines).

**Doc hierarchy:** `launch-plan.md` (strategy, slow) → `TRACKER.md` (queue, hot) → `docs/product/acceptance-criteria/` (done-definition, per skill).

## Status

**Phase:** Build — Friday is the agent-to-UI wiring critical day.
**Status:** 🟡 On track.
**Last:** Large infra day. ~27 PRs merged: parallel-tracks workflow (#11 + follow-ups), agent-runner base (#24), tools scaffolds (#3), design tokens port (#26), seed data v1 (#40), Claude-as-judge scorer (#39), app README (#38), launch-plan + branch-first enforcement + doc-map CI (#41, #42), Michael Cohen MA session architecture docs (`docs/architecture/managed-agents-*.md`).
**Next:** Friday critical path — replace `agent-runner`'s direct `messages.create` with MA `POST /v1/sessions`; wire `session.status_idle` → Expo UI refresh; render one agent output as a card against seed data.
**Last updated:** 2026-04-23.

## Critical items awaiting review

1. **Spec decision: weekly-review scoring (qualitative vs numeric).** CR-wr-01 and CR-wr-02 contradict spec — spec says "Rate 1-10 on four axes"; criteria say "no numeric score." SKILL.md matches spec. Decide: keep numeric or amend spec to qualitative-only. Then re-derive criteria. (`docs/product/acceptance-criteria/weekly-review.md`)
2. **Verify daily-review SKILL.md revert.** PR #23 (criteria-drift) corrected CR-dr-03 and CR-dr-05 to match spec. PR #19 had added steps 5a (pattern detection) and 5b (tomorrow-shaping) to `agents/daily-review/SKILL.md` per the wrong criteria. No revert PR has landed. User reversed an earlier "skip revert" decision but no follow-up PR exists. Confirm if those steps should be removed now.
3. **npm audit `moderate` threshold blocked by Expo upstream.** Root 1 (markdown-it chain) resolved via fork swap (commit `4001c977`). Root 2 (Expo SDK → xcode → uuid < 14) upstream-blocked. No action available — threshold stays at `high` until Expo ships patched `@expo/config-plugins`.

## Follow-ups (pending manual or flight-test)

- **Apply pg_cron migration (`supabase/migrations/0002_schedules.sql`) to remote.** Needs `supabase db push` — user-only, destructive shared-infra write.
- **Fix `--clean` squash-merge false-positive.** `git cherry` misses squash-merged work (false positive on claude-judge-scorer today). Replace with `git diff --quiet main HEAD` in `scripts/intently-track.sh`. ~2-line fix.
- **Promote overnight build loop to recurring.** First flight 2026-04-22/23 shipped 6 PRs clean. Add `build-loop` case to `~/.intently/bin/intently-routine.sh` + launchd plist at 23:30 daily. Watch first weeknight run for working-tree conflicts with human branches.

## Next (in order — start here)

1. **[Friday] MA session-wrap + UI wiring.** In `app/lib/agent-runner.ts`, swap direct `client.messages.create` for MA `POST /v1/sessions` per `docs/architecture/managed-agents-event-topology.md`. Wire `session.status_idle` event → Expo UI refresh. Render one agent output as a card on the Present screen. First end-to-end smoke: trigger daily-brief manually → see output in simulator against seed data.
2. **[Friday] First eval dataset for daily-brief.** Author `evals/datasets/daily-brief/cases.json` + `evals/rubrics/daily-brief/rubric.json` + baseline. Pairs with the judge-scorer (PR #39).
3. **[Sat] Second demo flow.** Wire daily-review if Friday held.
4. **[Sat] Submission prep.** Generate `THIRD_PARTY_LICENSES.md` via `npx license-checker`. Rewrite `README.md` (root) with demo narrative + MA story; PR #38's `app/README.md` is scaffold.
5. **[Sat] Practice demo cuts.** Record test takes of the 3-minute script on physical device / simulator with seed data.
6. **[Sun] Record final demo video** (3-min hard cap). Write 100–200 word summary. Verify public repo has README + LICENSE + THIRD_PARTY_LICENSES. **Submit via CV platform by 8:00 PM EDT.**

## Stretch (skip if time-pressed)

- Google OAuth registration + real calendar/email tool wiring (seed data covers the demo).
- Weekly-review flow (after daily-brief + daily-review both work).
- Visual UI polish beyond consuming ported tokens.
- Voice input (text input is fine for demo).
- Hindsight self-host on Fly.

## Open questions

- **Demo target surface:** physical phone, simulator screencap, or web browser. Changes polish budget.

## Locked decisions (do not re-litigate — see ADRs + `launch-plan.md` § "Locked cuts")

- MVP scope: 5 skills (setup, daily-brief, update-tracker, daily-review, weekly-review).
- Demo flow priority: daily-brief > daily-review > weekly-review.
- Stack (ADR 0003): Expo + TypeScript · Supabase · Managed Agents TS SDK · Bitwarden Secrets Manager.
- Managed Agents is runtime, not state (ADR 0001). State of truth = Markdown in Supabase.
- Per-user data store = Supabase (ADR 0002). No external note-app integration in V1.
- Calendar/email via direct OAuth → Google APIs (MCP deferred to V2).
- V1 is single-user (Muxin dogfoods); per-user isolation deferred.
- `vault_ids` = Anthropic's vault for MCP server credentials (session-time); Bitwarden = our Anthropic API key storage. Complementary, not conflicting. (Resolved 2026-04-23 via MC session docs.)

## Timeline

- Hackathon: 2026-04-21 → 2026-04-26 (submission deadline 2026-04-26, 8:00 PM EDT)
- Today: 2026-04-23 (Thursday evening)
- Days remaining: 3

## Done (recent)

- **2026-04-23 (infra day).** ~27 PRs merged across agent-runner, tools, tokens, seed data, judge-scorer, app-README, parallel-tracks workflow (`intently-track` + `/babysit-prs` + `/next-tracks` + `--clean-merged`), pre-commit branch-first rule, CLAUDE.md rule, doc-map CI check, launch-plan.md, npm audit CI + pre-commit + dependabot, MC session architecture docs, markdown-it vuln cleared via fork swap, `docs/process/usr-*.md` gitignored.
- **2026-04-22/23 (overnight).** Overnight build-loop first flight: 6 PRs (#2–#7), 84 tests, 0 failures, gitleaks clean.
- **2026-04-22.** Supabase schema (6 tables). Release-readiness plist moved 07:00 → 03:00. Expo app scaffolded. ADRs 0001/0002/0003.
- **Earlier.** Vision, spec, app-experience, data-model, doc-taxonomy, 5 `SKILL.md` files, MA waitlist submitted.

## How to resume in a new session

Read in order:

1. `launch-plan.md` — what "shipped" means, 3-day critical path, MVP demo bar.
2. This file (`TRACKER.md`) — current hot state, Next queue, Critical items awaiting review.
3. `CLAUDE.md` — repo-wide rules (branch-first, secrets policy, etc.).
4. If "Critical items awaiting review" has entries, walk through them with the user before substantive work.

Update the **Status** block and prepend a dated **Log** entry below at the end of every non-trivial session.

## Log

### 2026-04-23 (parallel-tracks + infra + MC session)
- Parallel-tracks workflow shipped. `intently-track` creates worktree + branch + Claude session; handoff appends a draft-PR instruction so tracks auto-open PRs; auto-merge-safe flips code PRs to ready + squash-merges on ci + security green.
- Auto-merge pipeline unblocked: PR #12 fixed CI glob-expansion; PR #14 granted `actions:read` to auto-merge-safe; PR #17 moved `routine-output/` out of `.claude/` guard.
- Agent-runner base (PR #24): `runSkill(skill, input)` + tool-use loop + 8 tests with fake Anthropic client.
- Claude-as-judge scorer (PR #39): real LLM judging with Sonnet 4.6 default, temperature 0, strict JSON parse.
- Design tokens (PR #26): Claude Design's semantic tokens translated to RN. Four Google Font packages added.
- Seed data (PR #40): synthetic "Sam" with Goals/Weekly/Daily Log/journal/projects for demo.
- Branch-first rule enforced: CLAUDE.md + pre-commit Check 0 block `main` commits. Doc-map CI + pre-commit nudge on upstream-doc changes.
- Launch plan (PR #41) at repo root. TRACKER now references it; `docs/architecture/doc-map.md` lists launch-plan → TRACKER dependency (PR #42).
- MC session architecture notes written. Key outcomes: MA directly usable now; skills-not-sub-agents pattern; `vault_ids` reconciliation resolved.

### 2026-04-22 (continued)
- Supabase schema + CLI setup + first `db push`. Expo app scaffold. `App.tsx` shell with PagerView + markdown rendering + stub voice button.

### 2026-04-22 (early)
- Docs cleanup (agent-memory trimmed; backlog folder established). ADRs 0001/0002/0003. 4 `SKILL.md` files adapted from source. MA waitlist submission.

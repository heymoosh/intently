# Intently Hackathon Tracker

**Purpose:** First doc a new session reads to resume. Hot state only — what's in flight, what's blocked, what just moved. For the durable strategy + milestone view, read `launch-plan.md` at repo root. Schema per `docs/architecture/data-model.md`. Keep slim (cap 100 lines).

**Doc hierarchy:** `launch-plan.md` (strategy, slow) → `TRACKER.md` (queue, hot) → `docs/product/acceptance-criteria/` (done-definition, per skill).

## Status

**Phase:** Build — Friday afternoon: pivot shipped, live-MA wiring in flight.
**Status:** 🟢 Demo URL live; critical path is user-action (MA setup + ma-proxy deploy) + live-MA wiring.
**Live demo:** https://intently-eta.vercel.app (seed data renders; live MA call not yet wired)
**Last:** **Web pivot + parallel tracks merged.** PR #61 (spec catch-up), #62 (ma-proxy Edge function), #63 (daily-brief evals + `cases.json`/`rubric.json`), #64 (web pivot), #65 (submission deliverables). PR #66 (default-to-Present + README URL) open.
**Next:** Merge PR #66. Muxin: create MA agents in Anthropic console + deploy `ma-proxy` to Supabase with secrets. Wire live `fetch(/ma-proxy)` on Present (branch `chat/live-ma-wiring` in flight). Circular carousel polish.
**Last updated:** 2026-04-24.

### Today's Go/No-Go (2026-04-24)

| Flow | Verdict | Top risk |
|---|---|---|
| Daily Brief | **BLOCK** | No live MA wired yet — seed fixture renders but no real agent call; ma-proxy not deployed; MA agent not created in console |
| Daily Review | **BLOCK** | Not yet wired; follows daily-brief once live path proven. `/derive-criteria daily-review` still owed post-#61 (routine follow-up, not a blocker for demo) |
| Weekly Review | **SHIP WITH CAVEATS** | CR-weekly-review-05 unverified pending live run; 4/5 criteria pass in static analysis |

**Top 3 blockers (all user-action or in-flight):**
1. **MA agents not yet created in Anthropic console** — required before any live call; one agent per skill (daily-brief first). User-only.
2. **`ma-proxy` Edge function not deployed to Supabase** — `supabase functions deploy ma-proxy` + `supabase secrets set ANTHROPIC_API_KEY=... MA_AGENT_ID_daily_brief=...`. Shared-infra write; user-only.
3. **Live-MA wiring on Present screen** — in flight as `chat/live-ma-wiring`; swap `dailyBriefSeed` import for `fetch('/ma-proxy')`, stream idle event → card render.

<details>
<summary>Go/No-Go Archive — 2026-04-23</summary>

| Flow | Verdict | Top risk |
|---|---|---|
| Daily Brief | **BLOCK** | All 5 demo-critical criteria `unknown`; F-DB-03/04 need rework before evals can be authored |
| Daily Review | **BLOCK** | 5 demo-critical criteria `unknown`; 3 criteria have spec scope drift |
| Weekly Review | **BLOCK** | CR-wr-01 + CR-wr-02 directly contradict spec — must re-derive before any evals |

**Top 3 (2026-04-23):** (1) CR-wr-01/02 contradict spec; (2) 11 demo-critical criteria `unknown`; (3) stable-ID columns missing from Supabase
</details>

## Critical items awaiting review

_None open as of 2026-04-24. Recent resolutions: PR #61 (spec catch-up), PRs #61–#65 merged, web pivot to iOS-specific Expo constraint no longer applies. Hot items live in Next queue below._

## Follow-ups (pending manual or flight-test)

- **Apply pg_cron migration (`supabase/migrations/0002_schedules.sql`) to remote.** Needs `supabase db push` — user-only, destructive shared-infra write.
- **Fix `--clean` squash-merge false-positive.** `git cherry` misses squash-merged work (false positive on claude-judge-scorer today). Replace with `git diff --quiet main HEAD` in `scripts/intently-track.sh`. ~2-line fix.
- **Promote overnight build loop to recurring.** First flight 2026-04-22/23 shipped 6 PRs clean. Add `build-loop` case to `~/.intently/bin/intently-routine.sh` + launchd plist at 23:30 daily. Watch first weeknight run for working-tree conflicts with human branches.
- **Post-first-live-run baseline floor (#50).** After the first live `daily-brief` run against `scenario-01`, raise per-axis `minScores` in `evals/baselines/daily-brief.json` from 0 to the observed floor; flip each `axisStatus` from `unknown` to `baselined`; bump `updatedAt`.
- **Smoke iter-3 agent output card (#59) post-#66.** Open https://intently-eta.vercel.app on phone; verify Present loads by default, `AgentOutputCard` renders with sage-tinted surface, "Good morning, Sam" title, markdown body (bold meeting callouts + inline code like `read_calendar`), two trace chips (Calendar + Journal) in footer.
- **Stewards leave working-tree mods uncommitted.** release-readiness + spec-conformance stewards modified TRACKER.md + acceptance-criteria/*.md overnight without committing — required a rescue PR (#51) in the morning. Design fix: auto-commit to `auto/steward/*` branches + draft PR, mirroring the build-loop pattern.
- **Deploy `ma-proxy` + create MA agents.** See Next #2–#3 for the command sequence; smoke-test post-deploy with `curl -X POST https://<project-ref>.supabase.co/functions/v1/ma-proxy -H 'Content-Type: application/json' -d '{"skill":"daily-brief","input":"smoke test"}'`.

## Next (in order — start here)

1. **[Fri] Merge PR #66** (default-to-Present + README URL fill).
2. **[Fri, user] Create MA agent for daily-brief in Anthropic console.** Paste `agents/daily-brief/SKILL.md` prompt; note agent ID.
3. **[Fri, user] Deploy `ma-proxy` + set secrets.** `supabase functions deploy ma-proxy`; `supabase secrets set ANTHROPIC_API_KEY=... MA_AGENT_ID_daily_brief=...`. See `supabase/functions/ma-proxy/README.md`.
4. **[Fri] Finish `chat/live-ma-wiring`.** Swap `dailyBriefSeed` import for `fetch('/ma-proxy')` on Present; render streamed output as `AgentOutputCard`. Redeploy to Vercel.
5. **[Fri] Circular carousel polish** (in flight) — wrap-around swipe on Past/Present/Future.
6. **[Sat] Second demo flow.** Wire daily-review if Friday held.
7. **[Sat] Practice demo cuts** against live URL; script the 3-min video.
8. **[Sun] Record + submit.** See `launch-plan.md` § Milestones for the full Sunday checklist.

## Stretch (skip if time-pressed)

- Google OAuth registration + real calendar/email tool wiring (seed data covers the demo).
- Weekly-review flow (after daily-brief + daily-review both work).
- Visual UI polish beyond consuming ported tokens.
- Voice input (text input is fine for demo).
- Hindsight self-host on Fly.

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
- Today: 2026-04-24 (Friday afternoon)
- Days remaining: 2

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
5. If any Follow-up or Critical item links to a GitHub issue, open the issue — that's where the procedural detail lives.

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

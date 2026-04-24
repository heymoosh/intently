# Intently Hackathon Tracker

**Purpose:** First doc a new session reads to resume. Hot state only — what's in flight, what's blocked, what just moved. For the durable strategy + milestone view, read `launch-plan.md` at repo root. Schema per `docs/architecture/data-model.md`. Keep slim (cap 100 lines).

**Doc hierarchy:** `launch-plan.md` (strategy, slow) → `TRACKER.md` (queue, hot) → `docs/product/acceptance-criteria/` (done-definition, per skill).

## Status

**Phase:** Build — Friday pivot day: shipped a mobile-responsive web demo.
**Status:** 🟢 Demo URL live, unblocking live-MA wiring.
**Live demo:** https://intently-eta.vercel.app (seed data rendered; MA wiring pending Track B merge)
**Last:** **Pivot to mobile-responsive web.** Expo Web target was already scaffolded; only PagerView blocked the bundle. Swapped for horizontal ScrollView, deployed to Vercel. Three tracks fanned out in parallel: Track A (daily-brief evals), Track B (MA proxy Edge function, PR #62), Track C (submission deliverables). Spec catch-up for daily-review tomorrow-shaping + drop Weekly Goals shipped as PR #61.
**Next:** Merge PRs #61 (spec) + #62 (ma-proxy) + web-pivot. Deploy ma-proxy to Supabase (user-only). Swap seed-data fixture for live `fetch(/ma-proxy)` call. Render real agent output on Present screen.
**Last updated:** 2026-04-24.

### Today's Go/No-Go (2026-04-24)

| Flow | Verdict | Top risk |
|---|---|---|
| Daily Brief | **BLOCK** | 5 demo-critical criteria `unknown`; `cases.json` missing — no eval baseline; CR-daily-brief-01 architecture decision pending |
| Daily Review | **BLOCK** | Standing FAIL on CR-daily-review-03 (SKILL.md step 5a contradicts criterion); 2 HIGH fidelity findings block re-derivation |
| Weekly Review | **SHIP WITH CAVEATS** | CR-weekly-review-05 unverified pending live run; 4/5 criteria pass in static analysis |

**Top 3 blockers:**
1. **Spec decisions needed** — H1 (CR-daily-review-01 drops Weekly Goals) + H2 (CR-setup-03 Ops Plan section removed) must resolve before eval authoring; H2 needs only `/derive-criteria setup`
2. **CR-daily-review-03 standing FAIL** — delete `agents/daily-review/SKILL.md` step 5a (multi-day synthesis); fix ready, needs git access
3. **cases.json absent for daily-brief** — blocks all eval runs; author today to establish floor before Sat demo cut

**Auto-fix PRs:** `gh pr list` blocked in automated context — check `auto/privacy/2026-04-24` and build-loop PRs #46/#47/#50 manually
**Missing signals:** agent-memory off-day (expected, using 2026-04-23 report); `gh pr list` unavailable

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

1. **~~Spec catch-up: daily-review tomorrow-shaping + Weekly Goals read.~~** Resolved 2026-04-24 via PR #61 — spec step 4 (pattern detection) + step 5 (tomorrow-shaping) added, Weekly Goals dropped from Reads. Follow-up: run `/derive-criteria daily-review` after merge.
2. **~~npm audit `moderate` threshold blocked by Expo upstream.~~** Moved to Follow-ups as tracking-only; not a blocker. Pivot to web demo supersedes the iOS-specific Expo constraint.
3. **Three parallel-track PRs open, need review + merge.** #62 ma-proxy Edge function (enables live MA calls from the web app), #63 daily-brief evals (scenarios + rubric), submission-deliverables PR pending from Track C. Merge order: #61 spec → #62 ma-proxy → #63 evals → submission-deliverables → web-pivot branch.

*(Stale item removed 2026-04-23 evening: "Spec decision: weekly-review scoring" — current CR-wr-02, spec step 2, and `agents/weekly-review/SKILL.md:25-27` all agree on qualitative-surface/quantitative-internal. No gap. Release-readiness report was reading a pre-PR-#23 criteria-sync snapshot.)*

## Follow-ups (pending manual or flight-test)

- **Apply pg_cron migration (`supabase/migrations/0002_schedules.sql`) to remote.** Needs `supabase db push` — user-only, destructive shared-infra write.
- **Fix `--clean` squash-merge false-positive.** `git cherry` misses squash-merged work (false positive on claude-judge-scorer today). Replace with `git diff --quiet main HEAD` in `scripts/intently-track.sh`. ~2-line fix.
- **Promote overnight build loop to recurring.** First flight 2026-04-22/23 shipped 6 PRs clean. Add `build-loop` case to `~/.intently/bin/intently-routine.sh` + launchd plist at 23:30 daily. Watch first weeknight run for working-tree conflicts with human branches.
- **Smoke overnight UI merges (#46 markdown fork, #47 journal modal).** Past/Present/Future markdown still renders; journal modal Edit/Preview/Cancel flow works; decide modal-vs-route before Saturday. Full checklist: [issue #52](https://github.com/heymoosh/intently/issues/52).
- **Author review overnight evals (#48 scenario-01, #49 rubric).** Does scenario-01 cover cascade/pacing/left-off mechanics convincingly? Do the 8 rubric axes cover observable regressions — any redundant or missing? Then compile the markdown dataset + rubric to runner-loadable `cases.json` / `rubric.json` paths (feeds Friday Next #2).
- **Post-first-live-run baseline floor (#50).** After Friday's first `daily-brief` run against `scenario-01`, raise per-axis `minScores` in `evals/baselines/daily-brief.json` from 0 to the observed floor; flip each `axisStatus` from `unknown` to `baselined`; bump `updatedAt`.
- **Smoke iter-3 agent output card (#59).** Open the app → swipe to Present → verify `AgentOutputCard` renders with a sage-tinted surface, the "Good morning, Sam" title, markdown body (bold meeting callouts + inline code like `read_calendar`), and two trace chips (Calendar + Journal) in the footer. Same modal-vs-route taste call from #47 applies if anything feels off.
- **Stewards leave working-tree mods uncommitted.** release-readiness + spec-conformance stewards modified TRACKER.md + acceptance-criteria/*.md overnight without committing — required a rescue PR (#51) in the morning. Design fix: auto-commit to `auto/steward/*` branches + draft PR, mirroring the build-loop pattern.
- **Deploy `ma-proxy` Edge Function + set Supabase secrets.** Run `supabase functions deploy ma-proxy`, then `supabase secrets set ANTHROPIC_API_KEY=<bitwarden-value>` and the per-skill `MA_AGENT_ID_*` vars (see `supabase/functions/ma-proxy/README.md`). Smoke test with curl from localhost: `curl -X POST https://<project-ref>.supabase.co/functions/v1/ma-proxy -H 'Content-Type: application/json' -d '{"skill":"daily-brief","input":"smoke test"}'`. User-only — shared-infra write.

## Next (in order — start here)

1. **[Fri, done] Web-pivot deploy** — live at https://intently-eta.vercel.app, seed data rendering.
2. **[Fri, done] Eval dataset (#63), ma-proxy (#62), spec catch-up (#61)** — parallel-tracks shipped. Needs review + merge.
3. **[Fri] Merge PRs + deploy ma-proxy.** Muxin: `supabase functions deploy ma-proxy` + `supabase secrets set ANTHROPIC_API_KEY=... MA_AGENT_ID_daily_brief=...`. See Follow-ups bullet.
4. **[Fri] Swap seed fixture for live MA call.** In `app/App.tsx` Present screen: replace `dailyBriefSeed` import with a `fetch` to the deployed ma-proxy endpoint. Stream/idle event → card render. Re-export to web + redeploy.
5. **[Sat] Second demo flow.** Wire daily-review if Friday held.
6. **[Sat] Submission prep.** Track C shipping `README.md` rewrite + `THIRD_PARTY_LICENSES.md` — fill in live URL post-merge.
7. **[Sat] Practice demo cuts.** Record test takes of the 3-min script against the live URL.
8. **[Sun] Record final demo video** (3-min hard cap). Write 100–200 word summary. Verify public repo has README + LICENSE + THIRD_PARTY_LICENSES. **Submit via CV platform by 8:00 PM EDT.**

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

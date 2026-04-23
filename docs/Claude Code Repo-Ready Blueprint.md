# Intently — Claude Code Operating Manual

**Type:** Reference doc — how Intently uses Claude Code routines, loops, and CI to keep the build verifiable, the AI behavior trustworthy, and agent memory coherent across a 1-week hackathon that is intended to commercialize.

*Forked from the generic "Claude Code Repo-Ready Blueprint" on 2026-04-22 and rewritten as the Intently-specific operating manual. The generic version lives in the Obsidian vault at `Claude Code Practices/Claude Code Repo-Ready Blueprint.md` for future reference.*

---

## Why this exists

Claude Code can move fast. Without structure, "fast" turns into a black box: code that exists but isn't verified, AI behavior that drifts silently between prompt edits, and agent memory that accumulates contradictions. This document defines the verification structure that prevents that — the smallest set of automations that keeps Intently honest while still letting one person ship in five days.

The framing is borrowed from Thariq's hackathon talk: **the strongest lever for getting Claude Code to produce reliable work is giving it programmatic ways to verify its own output.** Vague guidance ("be careful," "make sure this works") doesn't ground anything. Deterministic checks do. Every routine and loop in this doc exists to convert a fuzzy quality concern ("did the morning brief regress?") into something a machine can answer.

## The three verification layers

Three places where verification happens. Each answers a different question. Do not duplicate work across layers.

| Layer | Where | Cadence | Question it answers |
|---|---|---|---|
| **CI** (GitHub Actions) | `.github/workflows/` | Every push, every PR | Does the code build, lint, typecheck, and pass tests? |
| **Loops** (`/loop`) | `.claude/loops/` | Every 30–60 min during active sessions | Is the live behavior still good while I'm editing? |
| **Routines** (Managed Agents) | `.claude/routines/` | Nightly, on-push, or pre-release | Has anything drifted that I won't notice myself? |

CI is the deterministic floor. Loops are the in-session feedback layer. Routines are the unattended background layer. If a check belongs in CI, do not put it in a loop or routine — CI is cheaper, faster, and more reliable.

## The MVP-10 (the spine of this system)

For Intently in hackathon week, the operating system is ten automations plus one push hook. Everything else is in the [Add-if-pain appendix](#add-if-pain-appendix). Entries 8–10 were added after initial scaffolding to close unattended-coverage gaps (morning synthesis, end-of-day handoff, faster fidelity audit).

| # | Name | Layer | Cadence | Why this one |
|---|---|---|---|---|
| 1 | AI Eval Batch Steward | Routine | 02:07 daily + on prompt/model change | Every Intently skill is a judgment-making agent. Eval drift is the single biggest demo risk. |
| 2 | Spec Conformance Steward | Routine | 02:13 daily + before each demo cut | The hackathon submission is "did the build match the dogfooded system." This is the answer. |
| 3 | Privacy Steward | Routine | 02:19 daily + on every push + pre-release | Personal life data is the most sensitive surface this app touches. |
| 4 | Agent Memory Steward | Routine | 02:25 every 2 days + pre-release | Unique to agent-native apps. Without it, trackers accumulate narrative and skills disagree about state. |
| 5 | Build Watchdog | Loop | Every 30 min, 07:30–22:30 local | Fast local feedback while editing. Catches the cheap stuff before nightly does. |
| 6 | Critical Flow Check | Loop | Every 30 min, 07:30–22:30 local | Keeps the three demo flows healthy while you're working on anything else. |
| 7 | Eval Spot-Check | Loop | Every 60 min, 07:30–22:30 local, gated on SKILL.md mtime | Catches prompt regressions inside the session, before nightly evals would. |
| 8 | Release-Readiness Steward | Routine | 03:00 daily (after overnight routines) | Synthesizes the 4 overnight reports into a plain-English go/no-go in TRACKER.md so the morning starts with priorities, not raw reports. |
| 9 | Session Handoff Steward | Routine | 22:45 daily | Auto-writes the rolling `.claude/session-handoff.md` from git + routine reports so the next session picks up cold without Muxin having to remember to author it. |
| 10 | Criteria Sync Loop | Loop | Every 2 h, 07:30–22:30 local | Same fidelity audit as Spec Conformance task 7, faster cadence — catches spec↔criterion drift within 2h instead of 24h. |
| + | Secrets Exposure | Push hook | Every push (GitHub Actions `security.yml`) | Bitwarden is the only secrets store. Anything else committed is a leak. |

Entries 8–10 have brief files at `.claude/routines/release-readiness-steward.md`, `.claude/routines/session-handoff-steward.md`, and `.claude/loops/criteria-sync-loop.md` — not inlined below to keep the doc navigable.

**Why these ten and not the generic seven?** The generic MVP weighs build health and OWASP scope. For Intently — an agent-native personal-data app — AI quality, spec conformance, privacy, and memory coherence outweigh build hygiene at the demo stage. The three additions (release-readiness, session-handoff, criteria-sync) close operator-support gaps specific to a solo builder on a 4-day sprint: morning go/no-go synthesis, unattended handoff authoring, and faster-than-nightly fidelity audit.

## Routine briefs

Routines run as Claude Managed Agents on a schedule. Each brief is the system prompt for that agent. Inputs are the docs the agent reads from; outputs go to the named output file plus an issue/PR if the agent has high confidence.

### 1. AI Eval Batch Steward

**Trigger:** nightly schedule, plus on any commit that touches prompts, tools, or model configuration.

**Inputs:**
- `evals/datasets/` — held-out cases per skill
- `evals/rubrics/` — scoring rubrics per skill
- `evals/baselines/` — last accepted scores per skill
- The current prompts, tool config, and model selection

**Output:** `evals/reports/<YYYY-MM-DD>.md`

**Brief:**
```md
You are running the Intently AI eval batch.

Tasks:
1. Run the full eval batch across daily-brief, daily-review, weekly-review,
   monthly-review, and update-tracker.
2. For each skill, score: relevance, faithfulness, safety, consistency,
   latency, cost-per-successful-result.
3. Compare scores to the stored baseline in evals/baselines/.
4. Flag meaningful regressions (>10% drop on any axis) and meaningful wins.
5. Group failures by failure mode, not by example.
6. Recommend: keep current setup, roll back to prior baseline, or iterate
   further. Be explicit about which.
7. If a regression is severe and the cause is clear, draft a PR with the fix.
   Otherwise open an issue with the failure cluster and suggested next step.

Output format:
- Skill scorecard (per skill, per axis, vs baseline)
- Failure clusters
- Recommendation per skill
- Demo blocker assessment
```

**Demo flow priority:** weight `daily-brief`, `daily-review`, and `weekly-review` highest — those are the three demo flows. `monthly-review` and `update-tracker` are checked but not demo-critical.

### 2. Spec Conformance Steward

**Trigger:** nightly schedule, plus manual dispatch before any demo cut.

**Inputs:**
- `docs/product/requirements/life-ops-plugin-spec.md` — source of truth for feature behavior
- `docs/product/acceptance-criteria/` — derived per-flow acceptance criteria
- Current app state: tests, build artifacts, recent commits

**Output:** `docs/release/spec-conformance-<YYYY-MM-DD>.md`

**Brief:**
```md
You are auditing whether the Intently build matches the Life Ops Plugin Spec.

Tasks:
1. List every shipped feature or flow touched since the last conformance report.
2. For each, find the corresponding acceptance criteria in
   docs/product/acceptance-criteria/. If none exists, that is itself a finding.
3. Mark each criterion: pass, partial, fail, unknown.
4. For unknowns, specify what evidence is missing (a test, a screenshot,
   a log, a manual check).
5. Special attention: the three demo flows (daily brief, daily review,
   weekly review) must be pass — anything else is a demo blocker.
6. Produce a gap report with concrete next actions.

Output format:
- Per-flow conformance table
- Demo blocker list (must be empty before submission)
- Suggested test additions where evidence is missing
```

**Note on acceptance criteria:** they are derived from the spec, not duplicated. If the spec changes, the criteria change. The steward's job is to keep the implementation aligned with both.

### 3. Privacy Steward

**Trigger:** on every push, plus pre-release before each demo cut. *(Cadence is intentionally aggressive — Intently handles goals, journal entries, calendar, email, and health data. Every agent run ships a slice of that to Anthropic. Privacy regressions need to surface within minutes, not overnight.)*

**Inputs:**
- `docs/security/privacy-policy-for-builders.md` — the rules
- `docs/security/asvs-scope.md` — high/medium/low weighted ASVS categories
- `docs/architecture/agent-memory.md` — what lands in memory
- Recent commits and the current state of prompts, logs, analytics, traces

**Output:** `docs/release/privacy-<YYYY-MM-DD>.md`

**V1 scope note:** Intently V1 is single-user (Muxin). Per-user state isolation checks are deferred until multi-user is in scope. Don't open issues about cross-user leakage in V1 — there is no cross-user.

**Brief:**
```md
You are auditing privacy for Intently. Personal life data is the most
sensitive category this app touches.

Tasks:
1. Inspect recent features that collect, transform, store, transmit, or
   summarize user data.
2. For each data touchpoint, ask: is this necessary? Could the agent do
   its job with a summary or derived signal instead of raw data?
3. Verify that logs, analytics, traces, and third-party calls do not expose
   personal data (journal content, health, email body, calendar details).
4. Inspect what lands in agent memory. Is it raw data or summarized?
   Raw data in memory is a finding.
5. Inspect what gets injected into managed-agent system prompts. Same question.
6. Flag retention, consent, and deletion gaps relative to the privacy policy.
7. Verify Bitwarden is the only secrets store. Any secrets outside Bitwarden
   (env files, hardcoded, config) is a release blocker.

Output format:
- Findings table (severity, location, recommended fix)
- Release blockers (must be zero before submission)
- Scope-update flag if feature direction has shifted in a way that changes
  the privacy surface (e.g., file uploads going from "maybe" to "shipped")
```

### 4. Agent Memory Steward

**Trigger:** every 2 days, plus pre-release before each demo cut. *(Unique to agent-native apps. The Agent Memory Stack means every skill carries persistent state across runs. Without active hygiene, memory drifts: trackers accumulate narrative, skills disagree about facts, stale entries pollute context windows. This routine is also the strongest fit for the "Keep Thinking" prize narrative.)*

**Inputs:**
- All persistent agent state: trackers, ops plan, weekly/monthly reflections, command center dashboard
- `docs/architecture/document-taxonomy.md` — the rules for where information lives
- `docs/architecture/agent-memory.md` — the memory stack architecture
- `docs/architecture/memory-schema.md` — the schema constraints

**Output:** `docs/release/memory-health-<YYYY-MM-DD>.md`

**Brief:**
```md
You are auditing agent memory health for Intently.

Tasks:
1. Audit each tracker against the Document Taxonomy. A tracker should hold
   live state only — 1–3 sentences of "where are we, what's next." If a
   tracker has accumulated narrative, research, or sourced data, that
   content belongs in a reference or strategy doc.
2. Cross-check state across skills. Where does daily-brief's view of
   "active projects" disagree with update-tracker's view? Where does
   weekly-review's view of goals disagree with monthly-review's?
3. Identify stale entries: items that are done, outdated, or no longer true.
   Propose deletions.
4. Identify thin context: places where an agent is being asked to decide
   but memory doesn't carry enough state for it to do so well. Propose
   what would need to be added.
5. Verify stable IDs are present and consistent across layers (markdown
   frontmatter, DB rows if any, Hindsight metadata). ID drift is a
   load-bearing failure mode.

Output format:
- Memory health report: taxonomy violations, contradictions, stale items,
  context gaps, ID drift
- Suggested edits with file paths and line ranges
- For low-stakes edits (deleting a stale tracker entry), draft a PR.
  For high-stakes edits (rewriting strategy), open an issue.
```

## Loop briefs

Loops run via `/loop <interval> <prompt-or-command>` while you're actively coding. They are *tight* — if nothing changed since last run, do little or nothing. Token cost compounds fast.

### 5. Build Watchdog

**Cadence:** `/loop 30m`

**Brief:**
```text
Run lint, typecheck, unit tests, and build. Only notify on failures or new
warnings. If everything passes and nothing changed since last run, output
nothing. Group errors by likely root cause, propose the smallest safe fix,
and update CLAUDE.md if commands or setup assumptions changed.
```

### 6. Critical Flow Check

**Cadence:** `/loop 30m`

**Brief:**
```text
Re-verify the three demo flows (daily brief, daily review, weekly review)
against acceptance criteria in docs/product/acceptance-criteria/. Mark each
step pass, partial, fail, or unknown. If any step regressed since last run,
identify the smallest code or test change needed. If everything passes and
nothing changed, output nothing.
```

### 7. Eval Spot-Check

**Cadence:** `/loop 60m` — only enable when actively editing prompts, tool definitions, or model selection. Off otherwise.

**Brief:**
```text
Run the small eval pack for the AI feature being modified right now. Compare
to the stored baseline. Report only score drops in relevance, faithfulness,
safety, consistency, latency, or cost. If everything passes and nothing
changed since last run, output nothing.
```

**Important:** this loop is expensive. Don't leave it running when you're not touching AI behavior. The nightly AI Eval Batch Steward covers the broader picture; the spot-check is for catching same-session regressions only.

## Push hook: Secrets Exposure

**Trigger:** every push (git pre-push hook + GitHub Actions backstop in `security.yml`).

**Brief:**
```text
Scan the diff for secret material: API keys, OAuth tokens, JWT secrets,
private keys, .env contents, hardcoded credentials. Bitwarden Secrets
Manager is the only allowed secrets store for Intently. Anything secret-like
in committed source is a release blocker.

If found: fail the push, name the file and line, and recommend moving the
value into Bitwarden with a reference shape that the runtime can resolve.
```

This runs as a deterministic check, not as a routine — it doesn't need Claude judgment, just pattern matching plus an entropy heuristic. (e.g. `gitleaks` or `trufflehog` in CI.)

## Repo structure

The structure that exists in `/Users/Muxin/Documents/GitHub/intently/`:

```text
intently/
├── .github/
│   └── workflows/
│       ├── ci.yml              # TBD until stack chosen (see CI section)
│       ├── security.yml        # secrets scan + dep audit (deterministic)
│       └── evals.yml           # nightly eval batch trigger
├── .claude/
│   ├── routines/
│   │   ├── ai-eval-batch-steward.md
│   │   ├── spec-conformance-steward.md
│   │   ├── privacy-steward.md
│   │   └── agent-memory-steward.md
│   ├── loops/
│   │   ├── build-watchdog.md
│   │   ├── critical-flow-check.md
│   │   └── eval-spot-check.md
│   └── session-handoff.md      # rolling handoff between Claude sessions
├── docs/
│   ├── product/
│   │   ├── vision.md
│   │   ├── requirements/
│   │   │   └── life-ops-plugin-spec.md
│   │   └── acceptance-criteria/
│   ├── architecture/
│   │   ├── agent-memory.md
│   │   ├── data-model.md
│   │   ├── memory-schema.md
│   │   └── document-taxonomy.md
│   ├── design/
│   │   └── app-experience.md
│   ├── decisions/              # ADRs for non-obvious calls
│   ├── security/
│   │   ├── asvs-scope.md
│   │   ├── threat-model.md
│   │   └── privacy-policy-for-builders.md
│   └── release/                # steward output reports land here
├── evals/
│   ├── datasets/
│   ├── rubrics/
│   ├── baselines/
│   └── reports/
├── tests/
│   ├── unit/
│   ├── integration/            # skipped for hackathon, see test scope ceiling
│   ├── e2e/
│   └── security/
├── CLAUDE.md
├── LICENSE                     # MIT
├── THIRD_PARTY_LICENSES.md     # Hindsight (MIT) + others
└── README.md
```

`release-gate.yml` is intentionally absent from the workflows — release-gate is run manually before each demo cut and as a steward synthesis, not as a workflow until the very end of the week. Add it on Apr 25 if needed.

## CLAUDE.md anchor

CLAUDE.md and this manual divide responsibility:

- **CLAUDE.md** says what Intently is, what "done" means, what commands to run, what release gates exist, what tests are mandatory. It is the stable context every routine and loop reads from.
- **This manual** says how the verification surface works: which routines and loops exist, what they check, what they output.

If they disagree, CLAUDE.md wins for product/build state and this manual wins for verification structure. Cross-edits are fine; just keep them aligned.

## CI / GitHub Actions mapping

Three workflows. `release-gate.yml` is added in the final 2 days only.

| Workflow | Trigger | Purpose | Stack-dependent? |
|---|---|---|---|
| `ci.yml` | Push, PR | Lint, typecheck, unit/E2E tests, build | Yes — TBD until stack chosen |
| `security.yml` | Push, PR, nightly | `gitleaks`/`trufflehog` secrets scan, dep vulnerability scan | No — can be wired now |
| `evals.yml` | Nightly schedule, on AI commit | Trigger AI Eval Batch Steward (Managed Agent) | Partially — needs dataset/rubric files first |
| `release-gate.yml` | Manual, tag, nightly in last 2 days | Aggregate ci/security/evals + steward release-readiness summary | Added Apr 25 |

**Stack-dependent items stay TBD** until the Thursday Apr 23 managed-agents session and the resulting stack decision. `security.yml` (secrets + deps) can be wired immediately because it's stack-agnostic.

## Release gates

A feature does not count as done until:

1. Build passes.
2. Lint and typecheck pass.
3. Required unit and E2E tests pass. (Integration deferred per test scope ceiling.)
4. Acceptance criteria for the feature are pass or deliberately deferred.
5. Privacy steward has zero open release blockers.
6. AI eval thresholds pass for any changed AI feature.
7. Accessibility check on changed UI: semantic structure, focus order, labels, target size. (Caught manually or via Playwright a11y assertions until an a11y steward is added.)
8. Performance check on changed agent-call paths: end-to-end latency for demo flows under the budget defined in `docs/design/app-experience.md`.
9. Changelog, migration notes, and rollback notes exist when relevant.

Release-gate workflow enforces 1–6 mechanically. Items 7–8 are manual review until/unless the corresponding steward is added (see Add-if-pain appendix).

## Maintenance and drift

Two failure modes that show up over time, both flagged by Thariq:

**Instruction drift.** CLAUDE.md, routine briefs, and skills accrete. They start contradicting each other. Opus 4.7 takes instructions literally, so a too-rigid CLAUDE.md will over-trigger on edge cases. Audit weekly: ask Claude to read CLAUDE.md and the routine briefs and flag conflicts or rules that no longer match how the codebase actually works.

**Token spend without signal.** A loop that produces nothing actionable for 3 sessions in a row is a candidate for deletion or cadence reduction. A routine whose nightly report goes unread for a week should be paused. The cost discipline rule: every automation must produce *actionable* output regularly, or it gets demoted.

Concrete maintenance touch-points:
- End of every coding session: write `.claude/session-handoff.md` (what was done, what's still TBD, what next session should start with).
- End of every day: glance at the routines folder. If a routine produced nothing useful all day, ask why.
- End of week (Sunday submission day): retire any loop or routine that didn't earn its keep. Move briefs to the appendix instead of deleting outright — they may be useful post-launch.

## Implementation order

Day-by-day for the rest of the hackathon week. Stack-dependent steps are gated on the Thursday managed-agents session.

| Day | Date | What lands |
|---|---|---|
| Wed | Apr 22 | This manual; the four MVP routine files; the three MVP loop files; security stub docs (asvs-scope, threat-model, privacy-policy-for-builders); acceptance-criteria stub. `security.yml` (secrets + deps) wired. |
| Thu | Apr 23 | Stack decision after Michael Cohen session. `ci.yml` wired. Test scaffolding (unit + E2E shells) for the three demo flows. |
| Fri | Apr 24 | First eval batch dataset + rubric for `daily-brief`. `evals.yml` wired. Privacy Steward runs on push for the first real time. |
| Sat | Apr 25 | Eval batches for `daily-review` and `weekly-review`. Spec conformance steward runs nightly. `release-gate.yml` wired. Demo cut #1 with full pre-release sweep. |
| Sun | Apr 26 | Final demo cut, submission. Release-readiness steward gives go/no-go. |

If any day slips, demote items rather than skip — e.g., if Friday's eval datasets aren't ready, leave `evals.yml` unwired and let the AI Eval Batch Steward run with a smaller initial dataset.

## Add-if-pain appendix

Routines and loops that exist in the generic blueprint but are deferred for Intently V1. Add them only if you hit the named pain. Briefs are short on purpose — when you need one, expand it from the corresponding section in the generic blueprint at `Personal Obsidian/Projects/Opus 4-7 Hackathon/Claude Code Practices/Claude Code Repo-Ready Blueprint.md`.

### Deferred routines

- **Nightly Build Steward** — add if CI failures start clustering and the morning triage takes more than 10 min. Pain: "I keep waking up to broken main."
- **Nightly Regression Steward** — add when the test suite is large enough that flaky vs. real failures are non-obvious. Pain: "I can't tell which test failures are real."
- **OWASP Security Steward** — add post-hackathon when commercializing. The weighted ASVS scope already exists in `docs/security/asvs-scope.md`; the steward becomes useful when the surface is broad enough that human review can't cover it.
- **Dependency Risk Steward** — add when dep count exceeds ~30 or when a real CVE lands. Pain: "Dependabot noise is drowning real risk."
- **Architecture Drift Steward** — add when modules start exceeding ~500 LOC or when duplicate logic appears across skills. Pain: "I keep rewriting the same thing in three places."
- **Test Gap Steward** — add post-hackathon. The test scope ceiling in CLAUDE.md exists specifically to keep this steward from running yet.
- **Docs Sync Steward** — add when CLAUDE.md, architecture docs, and the codebase are clearly out of sync. Pain: "the docs lie about how this works."
- **Accessibility Steward** — add when UI surface grows beyond what manual a11y review can cover. Currently caught in release gate item 7.
- **Performance Steward** — add when agent-call latency budgets start failing in production. Currently caught in release gate item 8.
- **Red-Team Steward** — add post-hackathon before any external user lands. Probes prompt injection, data exfiltration, jailbreak-class failures.
- **Prompt/Version Drift Steward** — add when prompt edits start producing unexpected behavior changes that the eval batch missed. Pain: "this prompt change broke something the evals didn't catch."

### Deferred loops

- **Failing-Test Triage** — add when the test suite is unstable enough that triage is its own time sink.
- **Local Docs Memory** — add if CLAUDE.md and architecture notes drift between coding sessions.
- **Code Hygiene** — add when console.logs and TODOs start accumulating faster than you remove them.
- **Test Authoring** — add when new code lands faster than tests do.
- **Security Regression Check** — only useful when working on auth/data-sensitive code paths. Currently covered by Privacy Steward (which is broader and runs on every push).
- **Privacy Regression Check** — same: covered by Privacy Steward.
- **Migration Safety Check** — add when schema or storage migrations land. None planned for V1.
- **PR Readiness Check** — add when shipping more than 2 PRs/day. Solo hackathon doesn't need it.

### Removed entirely

- **Outcome Metrics Steward** (was generic blueprint #9) — converted from a scheduled routine into a one-time synthesis pass against `Personal Obsidian/Projects/Opus 4-7 Hackathon/Metrics Capture.md`. There is not enough usage data during the hackathon for nightly metric calculation; the value of the doc is forcing the hypothesis conversation, not producing recurring numbers. Synthesis happens mid-week and again post-launch.

## What this gives Intently

A solo builder pushing toward a commercial product, with one week to demo and a body of unique architectural choices (agent-native, memory-stack-driven, managed-agents-as-backbone) that need to actually work, not just exist. The MVP-10 turns the most demo-critical risks into deterministic checks: AI behavior doesn't drift silently, the build keeps matching the spec, personal data stays bounded, and agent memory stays coherent week over week. Everything else is recoverable from the appendix when a specific pain materializes.

The submission story this enables is also stronger: every Managed Agent in this stack is doing meaningful, long-running, schedulable work — exactly what the "Best Use of Managed Agents" prize is scored on.

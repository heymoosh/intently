  ## Session handoff — 2026-04-22 evening (infra-heavy session)                                                                                                  
                                                                                                                                                                 
  ### What shipped tonight (working / live)                                                                                                                      
                                                                                                                                                                 
  - **10 launchd jobs loaded and running** (`launchctl list | grep intently`):                                                                                   
    - 6 routines: `ai-eval-batch` (02:07), `spec-conformance` (02:13), `privacy` (02:19), `agent-memory` (02:25, every-2-days), `release-readiness` (07:00 —
  **should be 03:00; pending change**), `session-handoff` (22:45)                                                                                                
    - 4 loops (auto-scheduled, 07:30–22:30 gated): `build-watchdog` (30m), `critical-flow-check` (30m), `eval-spot-check` (60m, SKILL.md-change gated),
  `criteria-sync` (2h)                                                                                                                                           
  - **Wrapper at** `~/.intently/bin/intently-routine.sh` — per-routine model (Sonnet 4.6 default, Opus 4.7 for agent-memory), effort level, time-window gate,
  auto-fix allowlist (`Bash(git push origin auto/*)` + `gh pr create`, scoped to `auto/*` branches).                                                             
  - **Sunday 02:00 Mac wake** via `pmset repeat wakeorpoweron MTWRFSU 02:00:00` — confirmed.
  - **2 new criterion files derived:** `docs/product/acceptance-criteria/setup.md` (7 CRs), `update-tracker.md` (6 CRs). Pre-commit hook on those skills now     
  unblocked.                                                                                                                                                     
  - **3 new routine/loop briefs:** `.claude/routines/release-readiness-steward.md`, `session-handoff-steward.md`, `.claude/loops/criteria-sync-loop.md`.         
  - **`docs/product/deferred-skills.md` created** — lists `daily-triage`, `monthly-review`, `project-continue`, `session-digest`, `vault-drift-check`,           
  `notes-action-sync` as deferred. Routines should skip these; **brief updates NOT YET APPLIED** (session died mid-edit).                                        
  - **CLAUDE.md** updated to MVP-10 pack list, 93 lines (under 100 cap).                                                                                         
  - **Smoke-tested criteria-sync**: exit 0, found 2 HIGH + 8 MEDIUM drift. **Wrote output to `/tmp/criteria-sync-2026-04-22-2004.md` instead of                  
  `.claude/routine-output/`** — wrapper's Write scope needs debugging.                                                                                           
                                                                                                                                                                 
  ### Real drift the overnight runs already surfaced (address in morning)                                                                                        
                                                         
  **From Spec Conformance Steward (02:13 preview via manual kickstart):**                                                                                        
  - 3 HIGH fidelity findings, 2 MEDIUM, 0 LOW            
  - 29 criteria marked `unknown` (baseline cut)                                                                                                                  
  - 3 missing skill criteria flagged noisily: `daily-triage`, `monthly-review`, `project-continue` — these are **deferred**, so the `deferred-skills.md`         
  integration (pending) will silence this noise                                                                                                                  
  - **CR-weekly-review-02 contradicts spec's 1-10 scoring** — needs spec decision first, then re-derivation                                                      
                                                                                                                                                                 
  **From Criteria Sync Loop (manual run):**              
  - **CR-weekly-review-02** — criterion says "no numeric score"; spec + SKILL.md both say "Rate 1-10." **Opposite of spec intent.**                              
  - **CR-weekly-review-01** — criterion says "reports why"; spec explicitly says "do NOT infer why."                                                             
  - 8 MEDIUMs on daily-brief/daily-review capability attribution                                                                                                 
  - 5 setup CRs correct per spec but SKILL.md made V1 cuts (Phases 1/4/5/6) — mark as "V1 cut — not a defect"                                                    
  - Full findings in `/tmp/criteria-sync-2026-04-22-2004.md`                                                                                                     
                                                                                                                                                                 
  ### Pending from this session (did NOT land due to sandbox lockup)                                                                                             
                                                         
  1. **Cosmetic drift fixes not applied:**                                                                                                                       
     - `.claude/loops/build-watchdog.md`, `critical-flow-check.md`, `eval-spot-check.md` — frontmatter still says `invocation: /loop 30m` (outdated — they're now
   launchd-scheduled)                                                                                                                                            
     - `docs/Claude Code Repo-Ready Blueprint.md` — still refers to MVP-7 (is now MVP-10)
     - `.claude/schedule-routines.md` — obsolete playbook from first session, safe to delete                                                                     
                                                                                                                                                                 
  2. **Deferred-skills read-and-skip integration:**                                                                                                              
     - `.claude/routines/spec-conformance-steward.md` needs a reference to `docs/product/deferred-skills.md` + "skip silently" rule in task 2                    
     - `.claude/loops/criteria-sync-loop.md` needs the same                                                                                                      
     - Otherwise `daily-triage`, `monthly-review`, `project-continue` re-flag as "missing" every run, wasting tokens
                                                                                                                                                                 
  3. **Release-Readiness restructure (agreed, not applied):**                                                                                                    
     - **Plist `StartCalendarInterval` Hour: 7 → 3** so it runs well before 8am (`~/Library/LaunchAgents/com.intently.release-readiness.plist`)                  
     - **Wrapper ALLOWED add `ALLOWED_AUTOFIX`** on release-readiness case so it can auto-fix quick items                                                        
     - **Brief update:** "Auto-fix quick/easy items on `auto/release-readiness/<date>`; put human-input items in TRACKER.md § 'Critical items awaiting review'"  
     - **CLAUDE.md +1 line:** "At session start, if `TRACKER.md` has a 'Critical items awaiting review' section, walk through it with Muxin before substantive   
  work."                                                                                                                                                         
     - **TRACKER.md section scaffold:** create an empty `## Critical items awaiting review` block right after Status so release-readiness has a target.          
                                                                                                                                                                 
  4. **Criteria-sync wrapper bug:** agent wrote output to `/tmp/` not `.claude/routine-output/`. Check wrapper `--allowedTools` (Write path scope) and/or 
  `--add-dir`. Probably a TCC-ish scope difference.                                                                                                              
                                                         
  5. **`.claude/launchd/plists/` repo templates were removed** (possibly by a linter rule) after I populated them. Live copies in `~/Library/LaunchAgents/` are  
  fine; regenerate repo copies for version control:                                                                                                              
     ```bash
     mkdir -p .claude/launchd/plists                                                                                                                             
     cp ~/Library/LaunchAgents/com.intently.*.plist .claude/launchd/plists/
                                                                                                                                                                 
  Recovery commands for the fresh session
                                                                                                                                                                 
  # 1. Verify all 10 jobs still loaded                   
  launchctl list | grep intently | sort                                                                                                                          
   
  # 2. Verify wake schedule                                                                                                                                      
  pmset -g sched                                         
                                                                                                                                                                 
  # 3. Repo plist templates (were removed mid-session)                                                                                                           
  mkdir -p .claude/launchd/plists
  cp ~/Library/LaunchAgents/com.intently.*.plist .claude/launchd/plists/                                                                                         
                                                                                                                                                                 
  # 4. Delete the obsolete CronCreate playbook                                                                                                                   
  rm .claude/schedule-routines.md                                                                                                                                
                                                                                                                                                                 
  # 5. Move criteria-sync finding out of /tmp            
  cp /tmp/criteria-sync-2026-04-22-2004.md .claude/routine-output/                                                                                               
                                                                                                                                                                 
  # 6. Change release-readiness from 07:00 → 03:00
  # (manual: edit ~/Library/LaunchAgents/com.intently.release-readiness.plist                                                                                    
  #  — change <integer>7</integer> to <integer>3</integer> under StartCalendarInterval,                                                                          
  #  then: launchctl unload <plist> && launchctl load -w <plist>)                                                                                                
                                                                                                                                                                 
  Next session — start here (priority order)                                                                                                                     
                                                                                                                                                                 
  1. Run recovery commands above (2 min).                                                                                                                        
  2. Fix CR-weekly-review-02 and CR-weekly-review-01 (spec decision → re-derive via /derive-criteria weekly-review). These are the highest-severity items from
  tonight's runs.                                                                                                                                                
  3. Apply pending edits from section "Pending" above (3–5 small Edit calls).
  4. Tonight's Session Handoff Steward will overwrite .claude/session-handoff.md at 22:45 — don't be surprised.                                                  
  5. Release-Readiness at 07:00 tomorrow runs with Hour=7 unless you moved it to 3 (see recovery).                                                               
                                                                                                                                                                 
  Config state (fresh-session facts)                                                                                                                             
                                                                                                                                                                 
  - Models: Sonnet 4.6 default, Opus 4.7 only for agent-memory-steward (cross-skill judgment).                                                                   
  - Effort: low (session-handoff), medium (most), high (agent-memory).
  - Loop window: 07:30–22:30 local. Wrapper gates; off-hours fires exit silently.                                                                                
  - Cost projection: ~$6–11/day, ~$24–44 over 4-day sprint.                                                                                                      
  - Active skills: daily-brief, daily-review, weekly-review, setup, update-tracker. Deferred: see docs/product/deferred-skills.md.                               
  - Pre-commit hook active: gitleaks + .env block + criteria-creation gate + CLAUDE.md size cap. Install: git config core.hooksPath .githooks (already set).     
  - Auto-fix branch protocol: routines push only to auto/<routine>/<date> — never to main or feat/*.                                                             
                                                                                                                                                                 
  **What went wrong at the end:**                                                                                                                                
  - After kickstarting `criteria-sync`, the Bash tool's cwd got stuck on `.claude/launchd/plists/` (probably a linter deleted that folder — the repo templates   
  I'd written earlier).                                                                                                                                          
  - Then all subsequent file reads/writes started returning EPERM (sandbox lockdown after repeated failures).                                                    
  - Restart unsticks both.                                                                                                                                       



# Session Handoff

**Rolling handoff from the current session to the next. Read this first.**

*Last updated: April 22, 2026 — end of blueprint-rewrite + scaffold-cleanup session.*

---

## Last session — Blueprint rewrite + scaffold cleanup (DONE)

**Context that triggered this session:** the previous session shipped a full 18-routine + 12-loop scaffold plan based on the generic `Claude Code Repo-Ready Blueprint.md`. Review surfaced three problems: (1) the blueprint had three non-matching routine inventories, (2) the scope was inflated relative to what one builder can usefully run, (3) the doc was dual-purpose (generic + Intently-specific) which was causing the drift. Decision: rewrite the blueprint as the Intently operating manual; descope to MVP-7; preserve removed routines as a short "add if pain" appendix; clean the repo to match.

**What was done:**

1. **Forked the blueprint.** Generic version stays at `Personal Obsidian/Projects/Opus 4-7 Hackathon/Claude Code Practices/Claude Code Repo-Ready Blueprint.md`. Intently-specific operating manual now lives at `docs/Claude Code Repo-Ready Blueprint.md` in this repo (rewritten, not just copied).
2. **Wrote the MVP-7 files:**
   - Routines: `ai-eval-batch-steward.md`, `spec-conformance-steward.md`, `privacy-steward.md`, `agent-memory-steward.md`
   - Loops: `build-watchdog.md`, `critical-flow-check.md`, `eval-spot-check.md`
3. **Stubbed the security docs the routines read from:**
   - `docs/security/asvs-scope.md` — weighted ASVS categories per Intently V1 surface
   - `docs/security/threat-model.md` — STRIDE skeleton + asset inventory + top-5 risks
   - `docs/security/privacy-policy-for-builders.md` — internal builder rules; Bitwarden-only secrets is a hard rule
4. **Scaffolded acceptance criteria for the three demo flows:**
   - `docs/product/acceptance-criteria/README.md` (per-criterion structure)
   - `daily-brief.md`, `daily-review.md`, `weekly-review.md` — each with 5-6 criteria as scaffolds, all `unknown` until verified
5. **Added READMEs to every empty scaffold folder:** `evals/`, `tests/`, `docs/decisions/`, `docs/release/`, `.github/workflows/`. Each explains intent, conventions, and any TBD-until-stack-chosen markers.
6. **Wired stack-agnostic CI:** `.github/workflows/security.yml` runs gitleaks on push/PR/nightly. `ci.yml` and `evals.yml` deferred until stack decision.
7. **Reconciled CLAUDE.md** with the rewritten blueprint: pointer to operating manual, MVP-7 list with file paths, Bitwarden hard rule, V1 single-user privacy scope note, cost-discipline rule for routines/loops.

**Decisions reversed from the prior session:**
- Old scope: "authoring all 18 routines + 12 loops as briefs."
- New scope: only the MVP-7 are wired. Other 11 routines + 5 loops are 1-2 sentence entries in the operating manual's "Add if pain" appendix.
- Reason: signal-to-noise for a solo operator + token discipline (per Thariq's hackathon talk and the user's explicit direction). The cut routines are recoverable from the appendix when a specific pain materializes.

**Decisions carried forward:**
- Outcome Metrics Steward removed entirely as a routine — converted to a one-time synthesis pass against `Personal Obsidian/Projects/Opus 4-7 Hackathon/Metrics Capture.md`.
- V1 is single-user. Per-user isolation checks deferred. Multi-user lands post-hackathon.
- Bitwarden Secrets Manager is the only secrets store. Hard rule. No exceptions.
- Stack-dependent items (`ci.yml`, `evals.yml`, CLAUDE.md required-commands) stay TBD until Thursday Apr 23 managed-agents session resolves the stack choice.

## Next session — Stack decision + ci.yml wiring

**Start here:**

0. **First-session-only:** open `.claude/schedule-routines.md` and paste the prompt block into Claude Code. This durably schedules the 4 MVP-7 stewards as nightly cron jobs so they run without manual triggering. One-time setup; persists across Claude Code restarts for 7 days (covers the rest of the hackathon). Skip if you've already done it — verify with `run CronList`.
1. **Attend the Thursday Apr 23 managed-agents session with Michael Cohen.** Stack decision is gated on what that session reveals about how managed agents integrate with backends.
2. **Lock the stack** (mobile + backend + DB) and update CLAUDE.md's "Required commands" section with exact install/lint/typecheck/test/build commands.
3. **Wire `ci.yml`** — lint, typecheck, unit tests, build. Get a first green run on a no-op commit. Also wire the **anti-gaming criteria gate (Layer C)**: on PRs touching `agents/<skill>/` or skill-implementation code, require (a) a non-empty `docs/product/acceptance-criteria/<skill>.md` exists, and (b) that file's last-modified commit is NOT in the same PR as the implementation changes. This forces acceptance-criteria edits to land in a separate, earlier PR — preventing retroactive criterion-fitting. Pairs with CLAUDE.md's "Acceptance criteria authoring rule" (Layer A) and Spec Conformance Steward task 7 (Layer B).
3a. **Wire dependency audit** alongside gitleaks in `security.yml` — `npm audit` / `pip-audit` / etc. per the stack decision. Deterministic, no LLM, no token cost.
3b. **Wire an a11y linter** (eslint-plugin-jsx-a11y or react-native-a11y equivalent) in `ci.yml` as a required check. Release gate #7 stops being "manually caught" and becomes "linter + manual for non-linterable things."
4. **Stub `tests/unit/` and `tests/e2e/`** with shells for the three demo flows. E2E test names should match acceptance criteria IDs (e.g., `cr_daily_brief_05_renders_within_budget`).
5. **Update this handoff** (overwrite, don't append).

**Friday Apr 24:**
- First eval dataset (`evals/datasets/daily-brief/`) authored from real Muxin Life Ops content with consent.
- First rubric (`evals/rubrics/daily-brief.md`) and baseline (`evals/baselines/daily-brief.json`) committed.
- Wire `evals.yml` to trigger the AI Eval Batch Steward.
- Privacy Steward starts running on push for the first real time.

**Saturday Apr 25:**
- Eval datasets for `daily-review` and `weekly-review`.
- Spec Conformance Steward starts running nightly.
- Wire `release-gate.yml`.
- Demo cut #1 with full pre-release sweep (all four MVP routines + manual demo run).

**Sunday Apr 26:**
- Final demo cut.
- Submission by 8 PM EDT.

## Where things live

- **Operating manual** (verification structure): `docs/Claude Code Repo-Ready Blueprint.md`
- **CLAUDE.md** (product/build context): `CLAUDE.md`
- **Generic blueprint reference** (for pulling appendix routines back in if pain hits): `Personal Obsidian/Projects/Opus 4-7 Hackathon/Claude Code Practices/Claude Code Repo-Ready Blueprint.md`
- **Implementation order** (day-by-day plan): in the operating manual, "Implementation order" section

## Hackathon deadline

**Sun April 26, 2026 · 8:00 PM EDT.** Currently April 22. 4 days remaining.

## Recent routine runs

- 2026-04-22 · privacy-steward · 0 HIGH · 5 MEDIUM · 2 LOW · scope-update flag on `docs/security/threat-model.md` (storage now Supabase per ADR 0003) → `.claude/routine-output/privacy-2026-04-22.md`
- 2026-04-22 · spec-conformance-steward · 0 pass / 0 partial / 0 fail / 29 unknown · 3 HIGH · 2 MEDIUM · 0 LOW fidelity · 3 missing user-facing skill criteria (daily-triage, monthly-review, project-continue) · baseline cut — all 11 demo-blockers unknown; CR-weekly-review-02 contradicts spec 1-10 scoring → `.claude/routine-output/spec-conformance-2026-04-22.md`

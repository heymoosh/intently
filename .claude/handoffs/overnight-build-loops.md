# Handoff — Overnight Build Loops

**Slug:** `overnight-build-loops` · **Tracked by:** `TRACKER.md` § Active handoffs
**Started:** 2026-04-25 · **Last updated:** 2026-04-25
**Status:** active

## Original intent

> "On the overnight build loops only — point to the handoff doc in tracker instead of storing all the details there. And no more 6-iter caps. Keep it running as long as there are safe tasks from tracker.md to launch (no ambiguity, no dependencies, obviously needed, no decisions or validations pending). It should also automatically trigger the `/babysit-prs` command — but not every 15 mins, every hour. Morning summary — just output it here in terminal."
> — Muxin, 2026-04-25

## Goals

- Build loop runs without an arbitrary iteration cap; exits when no safe tasks remain in TRACKER's queue.
- "Safe task" is a strict gate enforced before any iteration starts: must satisfy ALL of (no ambiguity, no dependencies, obviously needed, no pending decisions/validations).
- `/babysit-prs` auto-fires hourly during the overnight window as part of the loop's cadence.
- End-of-loop summary lands as terminal stdout output where the loop runs — no Pushover/Slack/macOS-notification/email hooks.
- Loop is robust against the failure modes observed on 2026-04-25 night: Mac sleep, hook conflicts, missing predecessor outputs, silent iter failures, branch-stacking confusion.

## Decisions made

- **No iteration cap.** Loop continues until TRACKER's "Next" + "Follow-ups" queues have zero items passing the safe-task gate. Replaces the prior 6-cap.
- **Safe-task gate (4 ANDed conditions).** An item is eligible only if: (1) no ambiguity in scope, (2) no unmet dependencies, (3) obviously needed (not stretch / "way later"), (4) no pending decisions or validations from Muxin. Iter starts ONLY if a candidate clears all four.
- **`/babysit-prs` hourly inline.** Fires once per overnight hour as part of the build loop's cadence, not on its own 15-min schedule. Cheaper, less noisy.
- **Morning summary = terminal output only.** Loop writes a structured summary to stdout when it exits; no notifications, no separate channels.
- **launchd plist replaces caffeinate dependency** (per the 2026-04-24/25 robustness ask). launchd wakes the Mac if asleep; doesn't depend on user remembering to run `caffeinate`.

## Decision log (tried / rejected)

- **Notifications via Pushover / Slack / macOS `osascript`** — rejected. Muxin wants the wake-up to be reading terminal stdout, not chasing app notifications.
- **6-iteration cap** — rejected. Arbitrary; on light nights leaves safe items unshipped, on heavy nights doesn't matter.
- **Storing the 8 robustness items inline in TRACKER follow-ups** — rejected. TRACKER stays slim; handoff owns the detail.
- **`/babysit-prs` on its own 15-min loop alongside the build loop** — rejected. Hourly cadence inside the build loop is enough; separate schedule duplicates wake-ups and noise.
- **Pre-tagging TRACKER items as "loop-safe" via a steward routine** — open question; deferred. Loop self-judges for now.

## State as of 2026-04-25

**Last night's run (the 2026-04-24 → 2026-04-25 overnight):**

- Iter 1 (`app-lib-inventory`): shipped → PR [#97](https://github.com/heymoosh/intently/pull/97). `web/PORTING.md` (299 lines).
- Iter 2 (`rn-porting-obstacles`): **silently failed first attempt.** Branch `auto/build-loop/2026-04-25-02-rn-porting-obstacles` was created but never advanced past iter 1's HEAD. No report file. No PR opened.
- Iter 3 (`wiring-points`): shipped → PR [#98](https://github.com/heymoosh/intently/pull/98). `web/WIRING-POINTS.md` (256 lines). **Stacked off iter 1's branch (skipping iter 2).** Iter 3's report acknowledges iter 2's `RN-PORTING-OBSTACLES.md` was not on disk when iter 3 ran (OPEN Q7).
- Recovery: a manual commit `6dc9327` ("RN-only surfaces vs plain-React equivalents") landed locally on the iter 3 branch — iter 2's content stacked onto iter 3's branch — but is unpushed as of handoff write time. PR #98 on remote is still clean (iter 3 only).
- 9-hour gap between iter 1's PR opening (05:29 UTC) and iter 3's PR opening (14:03 UTC) is the smoking-gun for the Mac-sleep failure mode.
- A mysterious `WIP on auto/build-loop/2026-04-25-01-app-lib-inventory` stash exists, created by a precheck/session-start hook fighting the loop's branch state mid-run.

**Files matter:**

- `.claude/loops/overnight-build-loop.md` — the brief the loop reads. Needs rewrite per the goals above.
- `routine-output/scope-overnight-<date>.md` — per-night scope file the loop reads. Format may change to support uncapped runs (currently structured around fixed iter chain).
- `routine-output/build-loop-<date>-<iter>.md` — per-iter reports written by the loop.
- `~/.intently/bin/intently-routine.sh` — wrapper script (outside repo). Where the launchd plist will register.
- `TRACKER.md` § Active handoffs → points here. § Follow-ups holds only the broad pointer; details live here.

## Next steps

Ordered by impact + dependency. Do top-down.

1. **Rewrite `.claude/loops/overnight-build-loop.md`** to encode the new contract:
   - Remove "Stop conditions: 6 iterations completed" line.
   - Add "Safe-task gate" section with the 4 ANDed conditions.
   - Add "`/babysit-prs` hourly" cadence — first action of each odd-numbered tick, or just-after-iter for each tick (decide while writing).
   - Replace any notification-style language with "summary to stdout."
   - Add "Per-iter dependency assertion" requiring iter N to verify iter N-1's expected output before starting.
   - Add stacking-fallback policy: if iter N didn't ship, iter N+1 branches from last shipped iter (or main); deviation logged in report.
2. **Add launchd plist for the build loop** — fires at 23:30 daily, runs the loop wrapper, no caffeinate dependency. Land alongside #1 so the schedule arrives with the new contract.
3. **Pre-flight checks for current `caffeinate`-based path** (until launchd lands): first action of the loop is `pgrep -x caffeinate` — if absent, exit with `routine-output/build-loop-<date>-00-PREFLIGHT-FAIL.md` describing the gap. Don't run silently knowing the Mac will sleep.
4. **Heartbeat markers** — each iter writes `tmp/build-loop-heartbeat-<date>-<iter>` at start, removes at end. Watchdog flags any heartbeat older than 90 min as stuck → abort, write failure note, move to next iter. Same hooks need to be loop-aware (see #6).
5. **Loop-aware hooks** — `scripts/session-precheck.sh` and any session-start / nightly-routine hooks check for `tmp/build-loop-heartbeat-*` and skip working-tree mutation while present. Stops the precheck-creates-stash-mid-loop chain seen 2026-04-25.
6. **Steward auto-commit pattern** (already in TRACKER follow-ups) — apply to any build-loop iter that produces working-tree mods without committing. No silent file mutations; auto-commit to the iter's `auto/build-loop/*` branch, push, draft PR.
7. **Terminal summary format** — define structure for the end-of-loop stdout summary. At minimum: per-iter status (shipped / failed / skipped), per-iter PR URL, total iter count, total runtime, list of TRACKER items consumed, list still pending. Read by Muxin in the morning by `cat`'ing the latest log or just looking at the loop's terminal pane.

## Open questions

- **`/babysit-prs` cadence inside the loop:** first action of each tick, or after each iter? Or every-other-tick at most? Decide when rewriting `.claude/loops/overnight-build-loop.md`.
- **Safe-task gate enforcement:** does the loop self-judge eligibility from TRACKER text alone, or does a steward routine pre-tag items? Self-judge is simpler but riskier (loop could LLM-decide an unsafe item is safe). Pre-tag is cleaner but adds steward coupling. Default: self-judge, document misses in morning summary, refine over time.
- **Conflict with live chat sessions:** if Muxin runs `claude` interactively while the overnight loop fires, what does the loop do? Currently no detection. Probably fine since loops branch off `auto/*` and don't touch `chat/*` working trees, but worth confirming.
- **What counts as "obviously needed"** in the safe-task gate? Probably anything in TRACKER's "Next" or "Follow-ups" sections that isn't tagged stretch/way-later. Stretch + Way-later items are NOT obviously needed.

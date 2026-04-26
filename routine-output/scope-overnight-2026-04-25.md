# Overnight Scope Proposal — 2026-04-25

**Generated:** 2026-04-25 ~21:00 local (Scope Overnight Steward, launchd).
**Source:** Scope Overnight Steward (this run replaces the earlier hand-authored "web-only pivot, Saturday prep" scope on the same date — that scope is now superseded; the pivot, all 13 cognition+shell PRs (#136–#152), and the post-cognition workflow PRs (#153–#156) all landed.)
**Tonight's iteration cap:** 4 (deliberately under the 6 max — see Notes).
**Replaces:** the earlier "fidelity scaffolding / wiring-port reference docs" version of this same file. Those analysis docs were never written, and the work they were prepping for (Saturday wiring port) was instead completed live during the cognition push. All three previous-version iterations are now obsolete.

> ⚠️ **Submission-eve context.** The hackathon submission deadline is Sunday 2026-04-26 8:00 PM EDT — i.e. ~22 hours from this scope's generation. The deployed demo path on `intently-eta.vercel.app` is **green and feature-complete** per TRACKER (Phase: Post-cognition; Status 🟢). The honest call: tonight's overnight scope should NOT touch any code path the demo recording could hit. All four iterations below are infra/docs polish on tooling that does not affect the live app or the recording flow.
>
> ✅ **No iter dependencies on un-merged work.** Open PRs: empty. All recent PRs (#132–#156) merged. Loop branches off main cleanly.

## Conceptual approach

TRACKER explicitly says "no urgent work in flight." The remaining `Follow-ups` are all small infra/tooling/doc items that have piled up during the launch sprint and are good fits for an autonomous loop: each is bounded, single-domain, has a clear done-criterion, and **does not touch `web/`, `agents/`, `supabase/`, or anything in the demo path**.

Order is by domain separation + value-per-LOC. Chain is sequential, but no iteration's correctness depends on a prior iteration's PR landing — they are independent in the dependency sense, just sequenced for the loop.

## State summary

- **Open PRs:** none.
- **Recent merges (last 24h):** PRs #132–#156 (smoke-test gaps, cognition batches 1–5, capture/groom/execute Phase 2, post-cognition TRACKER rewrite, hackathon docs). All clean.
- **Phase:** Post-cognition (per TRACKER). Demo path verified end-to-end.
- **Tomorrow:** RECORD DAY → submit by 2026-04-26 20:00 EDT.

## Iteration chain (sequential, all infra/docs polish)

### Iteration 1 — `session-handoff.md` reference sweep

- **TRACKER ref:** Follow-ups → "Stale `session-handoff.md` reference sweep."
- **Scope:** Find every reference to the retired `docs/process/session-handoff.md` flow and update to the current `.claude/handoffs/<slug>.md` per-project handoff model. Per TRACKER, stale pointers exist in:
  - `docs/Claude Code Repo-Ready Blueprint.md` (4 spots)
  - `docs/design/claude-code-implementation.md`
  - `docs/process/acceptance-criteria.md`
  - `docs/process/session-prompt-seed-data-v1.md` (note: this file appears not to exist in current `docs/process/` listing — verify; if absent, drop from sweep)
  - Anywhere else `grep -rn "session-handoff" docs/` surfaces
- **Key files:** docs only — see above.
- **Model + effort:** Sonnet 4.6 medium — mechanical doc sweep, bounded grep+edit. No architectural judgment.
- **LOC estimate:** ~30–80 lines edited across ~5 files.
- **Depends on:** independent.
- **Session-prompt:** will derive from TRACKER + a quick `grep -rn "session-handoff" docs/` at iter start.

### Iteration 2 — `intently-track.sh` `--clean` squash-merge false-positive fix

- **TRACKER ref:** Follow-ups → "Fix `--clean` squash-merge false-positive in `scripts/intently-track.sh`. Replace `git cherry` with `git diff --quiet main HEAD`."
- **Scope:** Single-file bug fix in `scripts/intently-track.sh`. The `--clean` mode currently uses `git cherry` to detect "this branch was squash-merged" but produces false positives for branches whose commits don't share authorship with main. Replace with `git diff --quiet main HEAD` (exit 0 = no diff = effectively merged). Add a one-line comment explaining the why so future readers understand the swap.
- **Key files:** `scripts/intently-track.sh` (one function, likely <30 lines diff). Add a short note in the file's top-of-file usage comment if the change shifts user-visible behavior.
- **Model + effort:** Sonnet 4.6 medium — single-file bash bug fix on a clear spec.
- **LOC estimate:** ~5–15 LOC + a comment.
- **Depends on:** independent.
- **Session-prompt:** will derive from TRACKER bullet + reading the current `--clean` block.

### Iteration 3 — post-merge / pre-commit hook refusing commits on `main`

- **TRACKER ref:** Follow-ups → "Post-merge hook refusing commits on `main` — prevent recurrence of the accidental direct-to-main commit pattern."
- **Scope:** Add a `pre-commit` (not `post-merge` — TRACKER's wording is slightly off; the right hook for *preventing* a direct-to-main commit is `pre-commit` checking `git rev-parse --abbrev-ref HEAD`) hook that refuses `git commit` if the current branch is `main`, with an override env var (`INTENTLY_ALLOW_MAIN_COMMIT=1`) for the rare legitimate cases (TRACKER updates, version bumps). Wire via `.githooks/` + a one-line install instruction in CONTRIBUTING.md if the repo already uses `core.hooksPath = .githooks`. If it doesn't, **flag and stop** — don't bootstrap a hooks directory autonomously.
- **Key files:**
  - `.githooks/pre-commit` (new file, ~20 lines bash)
  - `CONTRIBUTING.md` § Editing workflow — append one bullet documenting the hook + override
- **Model + effort:** Sonnet 4.6 medium — small new hook file + a doc bullet. Only judgment is the override env var name + hook install path discovery.
- **LOC estimate:** ~25 LOC + 3 doc lines.
- **Depends on:** independent.
- **Session-prompt:** will derive from TRACKER bullet. Iter must verify `git config core.hooksPath` before writing — if unset, document the install command instead of trying to globally configure.

### Iteration 4 — wire `decision-drift-check` to launchd

- **TRACKER ref:** Follow-ups → "Wire `decision-drift-check` to launchd. Spec at `.claude/loops/decision-drift-check.md`. Add `com.intently.decision-drift.plist` matching the existing pack, daily evening."
- **Scope:** Add `com.intently.decision-drift.plist` to the launchd pack matching the pattern of existing plists (e.g., `com.intently.scope-overnight.plist` — this routine itself). Read the existing plist as the template, swap in the decision-drift-check command + a daily-evening (e.g., 22:00 local) `StartCalendarInterval`. Wire stdout/stderr to a log path matching the existing convention. Include any install/load step in the plist's sibling README or in `CONTRIBUTING.md` if that's where launchd setup is documented.
- **Key files:**
  - `<launchd plist directory>/com.intently.decision-drift.plist` (new — directory will be wherever the existing scope-overnight plist lives; iter must locate first)
  - launchd README or CONTRIBUTING.md install instructions (one bullet)
- **Model + effort:** Sonnet 4.6 medium — mechanical clone of an existing plist, time swap, log-path swap. Spec is clear; the existing plist is the template.
- **LOC estimate:** ~40 LOC plist + a doc bullet.
- **Depends on:** independent.
- **Session-prompt:** will derive from `.claude/loops/decision-drift-check.md` (the spec) + the existing scope-overnight plist as template.

## Blocked (not tonight)

- **Real OAuth (Google calendar / email / Slack)** — multi-day, requires user-only OAuth registration. Hard-stop.
- **Multi-user auth (replace anonymous sign-in)** — multi-day, ADR 0002 pins V1 single-user; out of scope until post-hackathon.
- **Visual polish (PainterlyBlock variants, Collage backdrops, gradient CTAs)** — aesthetic judgment + touches the live demo path on submission eve. Out of scope.
- **Apply `pg_cron` migration (`supabase/migrations/0002_schedules.sql`)** — needs `supabase db push` against remote; user-only per loop hard-stops.
- **Re-provision live `weekly-review` agent** — needs `bws run` (Bitwarden secret access); user-only.
- **Post-first-live-run baseline floor** — needs running the daily-brief agent live (Anthropic-key burn + judgment on observed scores); user-supervised.
- **Stewards leave working-tree mods uncommitted (auto-commit to `auto/steward/*`)** — this would touch the steward wrapper scripts that orchestrate routines including this one. Modifying the steward layer mid-run is high-blast-radius on submission eve. Defer.
- **Toggle persistence for `done` flags (wire `toggleAdminReminder` / `toggleProjectTodo`)** — touches `web/` (live demo path). Excluded on submission-eve principle.
- **Phase out `app/` (Expo + RN-Web) directory** — large delete; safe in principle but unnecessary to do tonight, and an accidental misorder could disrupt git history shape used by the demo repo presentation. Defer.
- **Design folder reconciliation / Reminders intent reconciliation / entries-architecture worktree** — all judgment-heavy spec calls (the routine brief explicitly hard-stops "no spec edits").
- **Demo video recovery (Disk Drill / PhotoRec)** — user-only, needs disk write halt + console action.

## Notes for Muxin

- **Why only 4 iterations (not 6).** This is submission-eve. The five next-best READY items all either (a) touch the live demo path (`web/`, agent prompts) or (b) modify the routine/steward layer that orchestrates the loop itself. Both are high-risk for low-leverage tonight. Better to keep the loop's blast radius inside docs/scripts/.githooks/launchd and save your token budget for record-day editing tomorrow morning.
- **Domain separation across iterations:**
  - Iter 1 → `docs/`
  - Iter 2 → `scripts/`
  - Iter 3 → `.githooks/` + `CONTRIBUTING.md`
  - Iter 4 → launchd plist + (probably) CONTRIBUTING.md
  - All four are independent. A failure in one doesn't poison the others; the loop's domain-separation guidance is honored.
- **Iter 3 caveat — verify `core.hooksPath` first.** If the repo doesn't already have `core.hooksPath = .githooks` set, the iter should produce the hook file + a CONTRIBUTING.md install instruction and stop, NOT attempt to set the global config autonomously (that's a per-clone user action). I've baked this into the iter scope above; don't let the agent overreach.
- **Iter 4 caveat — locate the existing plist first.** The plist directory is presumably `~/Library/LaunchAgents/` (per macOS convention) or a checked-in `.claude/launchd/` subdirectory. The iter must locate the existing `com.intently.scope-overnight` plist as a template before writing. If it can't find the template, **stop and write a TRACKER follow-up bullet** rather than guess.
- **What you wake up to:** four draft PRs (one per iter), each on `auto/build-loop/2026-04-25-NN-<slug>` per the standard branch-naming. Review before record-day work; merge what's clean, defer what isn't. None of these touch the demo path, so you can ignore them entirely until post-submission if you'd rather focus.
- **EV check:** if you'd rather skip the loop and save the token budget for tomorrow's submission editing (README rewrite + 100–200 word summary draft + THIRD_PARTY_LICENSES gen), that's a reasonable call. None of these four iterations is critical-path. The honest framing: this scope is "useful nightly housekeeping that piles up between launches," not "things we need before submitting."

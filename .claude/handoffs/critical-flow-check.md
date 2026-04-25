# Handoff — Critical Flow Check routine

**Slug:** `critical-flow-check` · **Tracked by:** `TRACKER.md` § Active handoffs
**Started:** 2026-04-25 · **Last updated:** 2026-04-25
**Status:** active (routine disabled pending design decision)

## Original intent

> "On this critical flow check routine — for now let's disable it from running overnight. […] The critical flow check is running off of an assumption that we actually create updated acceptance criteria, and I'm not even sure if that's happening. I don't even know exactly how acceptance criteria are written or when it gets written. Usually I just tell you to update the tracker, and then we just do work inside the session. […] Maybe the critical flow check was just too premature."
> — Muxin, 2026-04-25

## Goals

- Capture what the routine actually does and why it caused real damage today (silent mutation of source-of-truth files on `main`).
- Disable it from running on launchd until a re-enablement decision is made.
- Surface the upstream governance question: AC files are being authored/updated by automated stewards in Muxin's absence; the routine enforces those AC changes against implementation source-of-truth that is also being touched by automation. The result is a closed loop with no human in it.
- Define what would have to change before re-enabling.

## Decisions made

- **Disable the launchd agent for the routine.** `launchctl unload ~/Library/LaunchAgents/com.intently.critical-flow-check.plist` and the file renamed to `.disabled`. Reversible: rename back + `launchctl load`. Repo-side plist at `.claude/launchd/plists/com.intently.critical-flow-check.plist` and loop brief at `.claude/loops/critical-flow-check.md` left intact for re-enablement.
- **Revert today's auto-edit to `agents/daily-review/SKILL.md`.** The routine's "fix" was textual realignment of docs to AC, not a behavior fix. Deployed agent (registered Apr 24 from `agents/daily-review/ma-agent-config.json`) is unchanged regardless. Working tree on `main` restored to HEAD.
- **Keep today's report file** at `routine-output/critical-flow-check-2026-04-25-0914.md` as the artifact that documents the failure — useful for the re-enablement design pass.
- **Don't touch the AC files yet.** The 08:55 auto-update of all 5 AC files today flagged a governance question (who authorized the CR-03 / CR-05 boundary changes?) that needs to be resolved separately before the routine's verdicts can be trusted.

## Decision log (tried / rejected)

- **Demote to report-only (strip "apply the fix" from the brief)** — deferred. Even report-only output drives further steward action and conversation noise; the upstream AC governance question matters more than the auto-fix clause.
- **Delete the routine entirely** — rejected for now. The intent (catch demo-flow regressions) is sound; the implementation is premature because no real verification surface exists. Worth re-enabling once tests + eval rubric land.
- **Edit the routine to skip when AC files have a recent automated mtime** — rejected as a band-aid. The right fix is human-in-the-loop AC authoring, not heuristics on file timestamps.

## State as of 2026-04-25

**Routine:**
- Brief: `.claude/loops/critical-flow-check.md` (unchanged) — runs every 30 min during 07:30–22:30 local. Compares each criterion in `docs/product/acceptance-criteria/<flow>.md` against the corresponding implementation surface (`agents/<flow>/SKILL.md`). For "real regressions with high confidence" the brief authorizes auto-fix.
- launchd plist: `.claude/launchd/plists/com.intently.critical-flow-check.plist` (canonical, unchanged) → was symlinked/copied to `~/Library/LaunchAgents/com.intently.critical-flow-check.plist`. **Renamed to `.disabled` and unloaded today.** No future fires until manually re-enabled.
- Today's report: `routine-output/critical-flow-check-2026-04-25-0914.md` — documents the SKILL.md auto-edit and the AC mismatch the routine claimed to fix.

**What the routine actually verifies right now:** text-against-text comparison of `agents/<flow>/SKILL.md` vs `docs/product/acceptance-criteria/<flow>.md`. No E2E test, no AI eval, no behavioral check. Every criterion in `docs/product/acceptance-criteria/daily-review.md` has `Status: unknown` — the routine itself isn't actually setting them to `pass` / `fail` based on runtime evidence.

**Why the auto-fix was wrong, in addition to being premature:**
1. SKILL.md is documentation, not runtime. Deployed agent reads from `agents/daily-review/ma-agent-config.json` (registered Apr 24, untouched today). The auto-edit didn't fix any real behavior — and SKILL.md is the place humans audit the spec, so corrupting it ahead of the JSON re-derivation breaks the audit path, not the runtime.
2. `docs/process/acceptance-criteria.md` (the project's own AC authoring rule) forbids same-PR criterion-and-implementation edits. The routine bypassed that rule by editing implementation source on `main` while AC was also being auto-updated.
3. The routine ran in a cron context where git operations were blocked; it left orphaned working-tree mutations and a "manual action needed" note expecting Muxin to land them — exactly the silent-mutation pattern the steward auto-commit follow-up exists to prevent.

**AC governance gap (the upstream issue):**
- 5 files at `docs/product/acceptance-criteria/` updated 2026-04-25 08:55 — all automated, no human-authored commit visible in chat history.
- Yesterday's AC update added the strict CR-03 ("does not synthesize multi-day patterns") and CR-05 ("informational only — does not propose how to sequence") boundaries that today's auto-fix tried to enforce.
- The CR-03 / CR-05 boundary is a real product call (does daily-review own multi-day pattern detection or hand it to weekly-review?) — and Muxin has not signed off on it.

**Related routine — `criteria-sync` — also disabled 2026-04-25 (same session).** This is the steward that maintains the AC files themselves, and is the most likely upstream of today's 08:55 auto-update. Same disable treatment: `launchctl unload ~/Library/LaunchAgents/com.intently.criteria-sync.plist`, plist renamed `.disabled`. Repo brief at `.claude/loops/criteria-sync-loop.md` and canonical plist at `.claude/launchd/plists/com.intently.criteria-sync.plist` left intact for re-enablement. The two routines are coupled: `criteria-sync` writes AC, `critical-flow-check` reads AC and enforces it against implementation. Disabling only one would still leave the closed-loop problem (auto-author OR auto-enforce). Re-enable them together once the AC governance question is resolved.

## Next steps

Ordered by impact + dependency.

1. **Audit who authored the recent AC changes.** `git log -p docs/product/acceptance-criteria/daily-review.md` and `git log -p docs/product/acceptance-criteria/daily-brief.md` to surface which steward / `/derive-criteria` run produced today's 08:55 update and yesterday's CR-03/CR-05 tightening. Decide whether the resulting boundaries match Muxin's design intent.
2. **Decide the AC authoring policy going forward.** Two options: (a) keep automated stewards authoring AC, but require Muxin sign-off via PR review before merge — no direct-to-main auto-commits; (b) pull AC authoring back to interactive sessions only, disable the steward derivation path. Either is fine; the current "automated, lands on main, nobody reviews" path is not.
3. **Build real verification before re-enabling the routine.** Concrete prereqs:
   - E2E test harness for the three demo flows (deterministic criteria like CR-03 "wraps current day").
   - AI eval rubric for qualitative criteria (CR-04 tone, CR-02 "reads as insight").
   - Each criterion's `Verification:` field filled in from `TBD` to a real check.
4. **Rewrite the routine brief before re-enabling.** Required changes:
   - Strip the "apply the fix" clause. Routine becomes report-only.
   - Add a hard rule: "Never edit `agents/*/SKILL.md`, `agents/*/ma-agent-config.json`, or `docs/product/acceptance-criteria/*.md` files. Drop a report; flag the gap for Muxin."
   - Add a precondition check: skip if the AC file's last-modified commit is by an automated steward and not yet signed off.
5. **Re-enable** by reversing the disable: rename `~/Library/LaunchAgents/com.intently.critical-flow-check.plist.disabled` back, `launchctl load`. Verify with `launchctl list | grep critical`.

## Open questions

- **Who authorized the CR-03 / CR-05 boundary changes** in `docs/product/acceptance-criteria/daily-review.md`? If the answer is "an automated steward run," that's a process gap, not a routine gap.
- **What is the canonical source of truth — SKILL.md or the JSON config?** Both exist for each agent. SKILL.md is human-readable; JSON is what gets registered as the deployed agent's prompt. Today they've drifted. Decide once: SKILL.md authoritative + JSON regenerated from it, OR JSON authoritative + SKILL.md is just documentation downstream of it.
- **Should "spec-conformance steward" (separate routine, runs nightly) be audited too?** It overlaps with critical-flow-check by design (per critical-flow-check brief line 65). If critical-flow-check has these problems, the steward likely has analogous ones. Out of scope for this handoff but worth a follow-up.
- **Can the routine work pre-MVP at all?** Per its own doc (line 55): *"Until the demo flows have running implementations, this loop runs against the spec only."* The demo flows do have running implementations now (deployed agents via ma-proxy). But the criteria themselves still mostly read as "the agent's prompt mentions X" rather than "the agent actually does X" — which the routine can't verify without invoking the agent. So even with implementations, behavioral verification needs more than text comparison.

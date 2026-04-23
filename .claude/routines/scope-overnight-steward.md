---
name: Scope Overnight Steward
type: routine
invocation: launchd (com.intently.scope-overnight), 21:00 local daily
priority: P1
owner: muxin
model: Opus 4.7
effort: high
---

# Scope Overnight Steward

## Purpose

Every evening at 21:00 local — before Muxin ends his day — propose tonight's overnight build-loop scope. Writes a dated scope proposal Muxin reviews before closing the lid; the overnight build-loop then consumes it.

Without this routine, the overnight build-loop has no up-to-date scope and falls back to a stale hand-authored section. With it, every night's overnight work is sequenced against the latest TRACKER state.

## What this routine is (and is not)

- **This IS** the same *analysis* the `/next-tracks` slash command performs — reading TRACKER, classifying items as READY/IN_FLIGHT/MERGED/BLOCKED, recommending model+scope per item. Follow the decision rubric in `.claude/commands/next-tracks.md` for classification and model-selection.
- **This IS NOT** an exec of the `/next-tracks` slash command. launchd cannot run slash commands. The wrapper invokes Claude Code with the brief below as the prompt; replicate the `/next-tracks` logic directly.

## Inputs

Read, in order:

1. `TRACKER.md` — Status, Critical items awaiting review, Follow-ups, Next (in order).
2. `launch-plan.md` — current milestone day + "MVP Demo Bar" to stay aimed at the right horizon.
3. `gh pr list --state open --json number,title,headRefName,isDraft,labels` — skip anything already in flight.
4. `gh pr list --state merged --limit 40 --json number,title,mergedAt` — skip anything already landed.
5. `ls docs/process/session-prompt-*.md` — session-prompt files already drafted (re-use scope, don't re-derive).
6. `.claude/commands/next-tracks.md` — the rubric (READY/IN_FLIGHT/MERGED/BLOCKED heuristics, model-selection language).
7. Any existing scope file at `routine-output/scope-overnight-<today>.md` — if present, this run *updates* it (does not blindly overwrite an already-reviewed scope).

## Classification and scope sizing

For each Next / Follow-up item that is READY:

- Verify it does NOT depend on another track that is also overnight-scheduled but not yet merged. If it does, stack it (step 2 depends on step 1 being merged during the loop; see "Dependency handling" below).
- Confirm it is overnight-safe per the hard-stops in `.claude/loops/overnight-build-loop.md`: no Google APIs, no Bitwarden secrets, no `supabase db push` against remote, no EAS builds, no pushes to `main`/`feat/*`, no sensitive spec edits that need human judgment.
- Assign a model + effort using the rubric in `.claude/commands/next-tracks.md`:
  - Sonnet 4.6 medium: mechanical content, docs, single-file bug fix, bounded implementation on known spec
  - Opus 4.7 high: multi-step implementation with clear spec, 2-5 files, test-heavy, light architectural judgment
  - Opus 4.7 xhigh: system design, 10+ file refactor, SDK integration with docs unknowns, cross-cutting architecture

## Dependency handling

Many overnight items naturally stack (e.g., swap library → build feature on the swapped library). Detect these and order iterations so earlier items build the foundation for later ones:

- **Independent**: no dependency; can run any iteration.
- **Stacked**: N+1 depends on N's PR being in the branch chain. The build-loop already stacks iteration branches (see the overnight-build-loop brief's "Branching strategy"), so a stacked proposal is just a linearly ordered list.
- **Parallel not supported**: the overnight build-loop is sequential (one iteration at a time). If two items are mutually independent, still sequence them — order by value × confidence.

Flag dependencies explicitly in the output so Muxin can see the chain reasoning.

## Hard stops — do NOT include these in tonight's scope

Anything matching these patterns goes into a separate "BLOCKED — do not overnight" list in the output, with a one-line reason:

- Spec edits (`docs/product/requirements/life-ops-plugin-spec.md`) — sensitive wording, live-session only
- Criterion Behavior edits (`docs/product/acceptance-criteria/*.md`) — immutable during build per authoring rule
- Google OAuth / Gmail / Calendar wiring — blocked on user-only registration
- Bitwarden secret provisioning — user-only
- EAS Build runs — quota, user authorization
- Any item marked "user task" / "user only" / "Michael Cohen" / "record" / "video" in TRACKER
- Live Managed Agents SDK integration on uncertain-surface code paths — keep for live session
- Anything TRACKER lists under "Critical items awaiting review" that is marked as needing a human decision (not a spec-catchup)

## Output format

Write to `routine-output/scope-overnight-<YYYY-MM-DD>.md` (today's date, since the loop runs this evening for tonight). If the file already exists from an earlier run, MERGE — do not overwrite items Muxin has already annotated (look for a `status: approved` or `status: edited` field in any `## Iteration <N>` section).

```markdown
# Overnight Scope Proposal — <YYYY-MM-DD>

**Generated:** <ISO timestamp>
**Source:** Scope Overnight Steward (21:00 launchd)
**Tonight's iteration cap:** 6

## Iteration chain (sequential, stacked)

### Iteration 1 — <slug>

- **TRACKER ref:** <Next #N | Follow-up | Critical item>
- **Scope:** <one-line>
- **Key files:** <list>
- **Model + effort:** <Sonnet 4.6 medium | Opus 4.7 high | Opus 4.7 xhigh> — <one-line reason>
- **LOC estimate:** <range>
- **Depends on:** <"independent" | "iteration N merged"> 
- **Session-prompt:** <path if exists, else "will derive from TRACKER">

### Iteration 2 — ...

## Blocked (not tonight)

- <item> — <reason in 10 words or fewer>

## Notes for Muxin

- <anything requiring user attention before closing lid; e.g., "iter 2's journal-editor design stub is rough — review morning before merging">
- <warn if scope is thinner than expected, e.g., fewer than 4 READY items — may want to keep lid open and work live instead>
```

## Definition of done

- `routine-output/scope-overnight-<YYYY-MM-DD>.md` written
- One-line entry appended to `.claude/session-handoff.md` under "Recent routine runs"
- If fewer than 3 READY items identified, flag this at the top so Muxin can reconsider whether to run the loop at all tonight (low-yield nights aren't worth the token spend)

## Hard stops for the routine itself

- Do NOT edit TRACKER.md, CLAUDE.md, or any spec/criterion file
- Do NOT edit the overnight-build-loop brief itself — the brief points at the scope file, not the other way around
- Do NOT push any PRs — this is a scoping routine, not an implementation routine
- Output only. Muxin reviews before the 23:00-ish build-loop kickoff

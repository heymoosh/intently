# Definition of Done — DRAFT

**Status: DRAFT — not yet validated or enforced. See tracker note: `.claude/notes/tracker-definition-of-done.md`.**

This file defines what "done" means for a shipped feature on Intently. It is the prompt-based substitute for Managed Agents' `outcomes` feature (research preview, not available for hackathon). Every Claude Code session and the overnight build loop should check this before declaring work complete.

---

## What "done" looks like

Done is NOT "tests pass." Done is "the feature works as intended end-to-end." The distinction matters: a deterministic unit test can pass while the actual user experience is broken.

### 1. The feature runs

- The relevant Life Ops flow (daily brief, daily review, or weekly review) executes end-to-end without errors.
- If the feature touches one of the three demo flows, that flow must produce correct, coherent output — not just execute without crashing.
- Any agent run produces output that a non-technical user would recognize as useful.

### 2. The acceptance criteria are satisfied

- A criteria file exists in `docs/product/acceptance-criteria/` for the flow being shipped.
- Every criterion in that file is marked `pass` or explicitly noted as `partial` with a written rationale.
- No criterion has been rewritten to match the implementation (see `docs/process/acceptance-criteria.md` — this is the most common failure mode).

### 3. The PR is clean

- No merge conflicts.
- CI passes (once wired — deferred to Apr 25 per `docs/process/release-gates.md`).
- No hardcoded secrets, API keys, or credentials in the diff.
- No `.env` commits.
- No TODO comments left in code that was part of the intended change.
- Conventional commit message. PR body describes what changed and why.

### 4. The spec is not violated

- Nothing in the diff contradicts `docs/product/requirements/life-ops-plugin-spec.md`.
- If implementation diverged from spec, either: (a) the spec was updated first in a prior PR, or (b) a `docs/decisions/` ADR records the deviation and rationale.

### 5. Secrets handling is correct

- Bitwarden Secrets Manager is the only secrets store. No exceptions.
- OAuth tokens, API keys, and credentials are never written to files, environment variables committed to the repo, or logged to any output.

---

## How to self-check before calling it done

Run through this mentally (or literally as a prompt) at the end of every implementation session:

```
Before I declare this done, check:
1. Does the affected flow run end-to-end and produce coherent output?
2. Does an acceptance criteria file exist for this flow, and do all criteria pass?
3. Is the PR clean — no conflicts, no secrets, no stale TODOs?
4. Does anything in the diff contradict the product spec?
5. Are secrets handled correctly?

If any answer is NO or UNKNOWN, do not call it done. Fix it or surface the blocker.
```

If the answer to any of these is no, **do not pass go**. Fix the gap or explicitly flag it as a blocker — add a bullet to `TRACKER.md` § Follow-ups and, if the work is part of an active project, append the blocker to that project's `.claude/handoffs/<slug>.md` § Open questions.

---

## What happens when the outcome isn't achieved

The self-check is a prompt, not a hard gate (unlike Managed Agents' `outcomes` feature, which enforces a retry loop automatically). So enforcement depends on context:

**In a Claude Code session (interactive):**
Claude should surface the specific failing check and either fix it autonomously (if the fix is clear and low-risk) or ask the user before proceeding. If Claude cannot fix it without user input (e.g., a blocker requires a product decision, a missing credential, or a spec change), it must say so explicitly — not silently mark it done anyway.

**In the overnight build loop (unattended):**
If the definition of done cannot be met, the iteration rolls back (`git reset --hard` on the auto branch only) and writes a failure note to `.claude/routine-output/`. The loop does not require user input during the run — it surfaces what failed and moves to the next item. Morning review decides whether to retry.

**Open question (tracker item):**
Does the current loop/session setup actually enforce this, or does it just read it and move on? This needs to be tested. See `.claude/notes/tracker-definition-of-done.md`.

---

## Relationship to existing routines

| Routine | What it does | How it relates to this doc |
|---|---|---|
| Spec Conformance Steward | Post-hoc audit, nightly | Verifies criteria status after the fact |
| Criteria Sync Loop | Drift detection, 2h during work hours | Catches criterion↔spec divergence during build |
| Overnight Build Loop | Autonomous implementation | Should reference this file's self-check before each PR |

This doc is the **forward-looking gate** that those routines verify after the fact. They are complementary, not redundant.

---

## What this is not

- Not a TDD checklist. We are not checking whether specific unit test assertions pass.
- Not a code review rubric. This is about feature correctness, not code style.
- Not a substitute for demo prep. The Spec Conformance Steward handles pre-demo verification.

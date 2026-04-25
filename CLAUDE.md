# CLAUDE.md — Intently

Universal rules only — true at project start, end, and every session in between. Anything that's project-state (changes over time: stack, current docs, secret store, scope, routines) lives in `TRACKER.md § Current state pointers`. If guidance drifts from reality, the fix is **trim CLAUDE.md, update the TRACKER pointer, drop an ADR** — not edit CLAUDE.md to the new state.

**House rule:** pointers > content. CLAUDE.md is capped at 100 lines (soft target 50); cap is enforced by a pre-commit hook and CI. If a rule belongs in another doc, link it — don't restate it. **The 3-weeks test** — every line here must answer "why will this still be true in 3 weeks?" If the answer is "it won't" (project-state, dated incident, fresh decision, hardcoded path, scope/journey/URL specifics), it goes to TRACKER (state), CONTRIBUTING (how-to), or an ADR (decision) — not here.

**Response style:** SPEAK PLAINLY, BE CONCISE - DO NOT TURN EVERYTHING INTO A LESSON, to the point, layman's terms. IF ASKED TO EXPLAIN technical details, lead with a 1-line primer of the concept.

**Autonomy default: act, don't ask.** Execute by default. Pause and confirm ONLY when (a) the user would need to paste a secret / API key / ID into chat, (b) the action is destructive and hard to reverse (rm -rf, disk wipe, force-push main, db drop, delete prod resources), or (c) the move is obviously dumb / severe and a reasonable engineer would pause. Otherwise: run the command, merge the PR, deploy, commit, iterate on errors empirically. Don't stall with "should I…?" unless (a)–(c) applies. Shared-infra writes the user has already authorized mid-session (e.g. supabase deploy after they said "run the commands") count as pre-authorized — keep moving.

**Manual work → TRACKER.md.** Whenever a task has a step Claude can't do automatically (user-only credentials, console actions Claude can't reach, decisions only the user can make), add a bullet to `TRACKER.md` § Follow-ups in the same turn. Otherwise the user won't know it exists.

**Spec intent > spec letter.** When a doc is pointed at as authoritative, read the doc AND ask for Muxin's intent in his own words — then state back one sentence of what you'll build. If his description disagrees with the doc, his current intent wins; docs capture past decisions, intent is current. Applies to new product behavior; skip for bug fixes / refactors / explicit inline instructions. Reason: doc-cold reading produces literal implementations that miss the beat.

**Editing workflow.** When to commit directly on `main` vs. spin up a worktree, the never-`git-checkout`-in-primary rule, and the stash-to-worktree migration recipe live in `CONTRIBUTING.md` § Editing workflow.

**No secrets in git, ever.** No `.env` commits, no hardcoded literals in tracked files, no echoing keys into chat. Where secrets currently live (BWS / Supabase env / etc.) is project-state — see `TRACKER.md § Current state` for the active store.

**Session-end discipline — record decisions.** If this session decided anything that changes a row in `TRACKER.md § Current state` (architecture, stack, secrets, agent behavior, scope) or supersedes an existing ADR: update the TRACKER pointer AND draft a stub ADR in `docs/decisions/` before closing. A drift-check loop is the safety net for missed decisions — but the discipline is on you and me first.

## Product intent — durable

Intently is an agent-native life-ops tool: scheduled managed agents do recurring work; the UI reflects state, triggers runs, and renders output. Current scope, stack, primary journeys, and deploy surface evolve — those live in `TRACKER.md § Current state`, not here.

## Where everything else lives

`TRACKER.md` is the spine. Read it first on every resume. It has three layers:

- **§ Current state pointers** — UX truth, agent behavior, stack, secrets, decisions, routines, handoff process, acceptance criteria, release gates, test scope. One row per topic.
- **§ Critical items / Follow-ups / Next** — what's in flight, what's blocked, what's coming.
- **§ Locked decisions / Timeline / Log** — durable-for-this-project + history.

**At session start, walk Critical items with Muxin** before any substantive work, if any are present.

**Drift check:** a `SessionStart` hook may inject a `[session-precheck]` report into context. If present, surface it and offer `/precheck`.

**Propose `/handoff` at kickoff** when (a) goal stated, (b) at least one non-trivial decision with rationale, AND (c) work is plausibly multi-session or multi-file. Skip for quick fixes / single-PR work / exploratory chats. **Update inline** as decisions land mid-session; **re-distill** via `/handoff` at session-end. **Continue, don't duplicate** — if a slug already exists in `.claude/handoffs/`, update it.

**Branch + PR standards:** see `CONTRIBUTING.md`.

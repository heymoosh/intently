# Contributing to Intently

Branch and PR standards for this repo. Referenced from `CLAUDE.md`.

## Branches

- Default branch: `main`.
- Feature branches: `feat/<short-description>`.
- Keep branches scoped. A branch that touches three unrelated concerns should be three branches.

## Editing workflow

Match the tool to the situation, not a default-to-branch reflex:

- **Single-session, small, user approving live** → commit directly on `main`, push. No branch, no PR. Branch/PR ceremony adds nothing when the user is the reviewer-in-real-time.
- **Parallel agents / background work / multi-day stacked work** → worktree: `git worktree add <wt-root>/<slug> -b chat/<slug>`. Each concurrent session gets its own checkout + branch so filesystem writes can't silently clobber each other, and git forces a real merge if two branches touch the same file. This is the only thing that prevents silent data loss when sessions run concurrently. (`<wt-root>` is per-developer — Muxin uses `~/wt`.)
- **Never** `git checkout` / `git switch` in the primary checkout — breaks editor state, agent processes, and `intently-track` worktrees. **Never** leave uncommitted edits across sessions.

If edits accidentally landed on `main` uncommitted and need to migrate to a worktree (e.g. agent realized mid-task it should be parallel): `git stash push -- <paths>` → `git worktree add … -b chat/<slug>` → `git stash pop` in the new worktree.

## Pull requests

- Every PR runs `ci.yml`. Schedule-relevant PRs (anything that affects workflow files, scheduled agents, or eval datasets) additionally run `security.yml` and `evals.yml`.
- PRs require test evidence:
  - New branches of behavior need new tests.
  - Edge cases identified during review get tests before merge.
  - Regression fixes land with a test that would have caught the regression.
- The PR-Readiness loop verifies diff readiness on demand.

## PR description

At minimum:

- **Summary** — 1–3 bullets on what changed and why.
- **Test plan** — checklist of what was verified (automated + manual).
- **Risk / rollback** — one line if the change has non-obvious blast radius; skip for trivial changes.

## Review before merge

- Green CI is necessary but not sufficient. At least one human reviewer (or, on solo sessions, a deliberate self-review pass with the `/review` skill) before merge.
- Security-sensitive diffs (auth, data handling, secrets, external I/O) run `/security-review` before merge.

## Hard rules

- **No secrets in git.** Bitwarden Secrets Manager is the only allowed store. Enforced by `.githooks/pre-commit` locally and `security.yml` (gitleaks) in CI. See `docs/security/privacy-policy-for-builders.md`.
- **Never commit acceptance-criteria edits in the same PR as implementation for that skill.** See `docs/process/acceptance-criteria.md`.
- **Never `--no-verify` past a failing hook** unless the hook itself is broken. If it is, fix the hook in a separate PR.
- **Never auto-resolve merge conflicts.** When `git merge` / `git rebase` / `git cherry-pick` reports a conflict, surface both sides (and any policy collision — e.g. main was trimmed while the PR was open) and wait for an explicit decision before running `checkout --ours/--theirs`, editing conflict markers, or committing. Resolution is a content/policy choice the user owns.

## See also

- `CLAUDE.md` — product/build context anchor.
- `docs/process/release-gates.md` — what must be true before a feature ships.
- `docs/process/acceptance-criteria.md` — how criteria are authored and edited.
- `docs/process/session-handoff.md` — per-project handoff convention; slash command `/handoff`; files at `.claude/handoffs/<slug>.md`.

The user invoked `/start-work` to resume working on Intently. Pick up cleanly from prior sessions without burning tokens on redundant reads.

## Steps

0. **Check for parallel work before touching shared files.** Two surfaces silently clobber TRACKER / `.claude/handoffs/` / CLAUDE if ignored:
   - **Parallel worktrees** — run `git worktree list`. For each entry outside this session's cwd, also read `<that-path>/.claude/wt-intent.md` if it exists; that file declares what the sibling worktree is working on (written by `/start-work` in that session — see step 7).
   - **Sibling sessions in the same checkout** — the SessionStart `[session-locks]` report (if any) lists other live Claude sessions in this same cwd.

   When surfacing siblings in the Critical-items walkthrough, name them by their declared intent (e.g. *"`~/wt/hide-dev-sidebar` — hide the dev sidebar in prod (declared 15:30)"*) when an intent file exists, or just by path with *"intent not declared"* otherwise. Worktrees with intents that overlap this session's planned work are the coordination risk — call those out specifically.

   If either signal is non-empty, ask Muxin one question before any edits to TRACKER/handoffs/CLAUDE: *"is this session its own track, or piggybacking on main?"* If piggybacking and he plans to touch shared files, propose spawning a worktree per `CONTRIBUTING.md` § Editing workflow:
   ```
   git worktree add ~/wt/<slug> -b chat/<slug>
   ```
   Then `cd` into it and resume there. Do not auto-spawn — Muxin decides per-session.

1. **CLAUDE.md is already auto-loaded** — do not re-fetch it. You already see it in the system prompt.

2. **Read once, in this order:**
   - `TRACKER.md` — the hot queue + Critical items awaiting review.
   - `launch-plan.md` — durable strategy + milestones (skim if you've recently read it; full read if it's been a while).
   - Any files referenced in TRACKER's "Active handoffs" section or `.claude/handoffs/` directory — these hold project depth for in-flight work. Skip if neither has entries yet.

3. **Don't re-fetch files you already have in context.** If something looks familiar from earlier in this session, recall and confirm instead of running another `Read`. State "I already pulled X this session — gist is Y" rather than re-reading.

4. **Walk Muxin through Critical items awaiting review** before any substantive work, per the rule in `CLAUDE.md` § "Session handoff." Number them, summarize each in one sentence, and ask which to tackle first. Don't dive into work until he's named the order.

5. **Then state what's Next** — read TRACKER's Next queue, summarize in 3–5 bullets, and confirm starting point.

6. **Apply the "Spec intent > spec letter" rule** if any Critical item or Next queue item references a spec, design doc, or handoff. Elicit Muxin's intent in his own words before reading the doc cold. Reason: this rule exists because the prior session's reminders misread came from skipping it.

7. **Declare this worktree's intent.** Once Muxin has named what this session will work on, write `.claude/wt-intent.md` in *this* worktree (gitignored, ephemeral). This is the file sibling sessions in other worktrees read in step 0. **Keep it terse — body is one sentence max.** It is not a handoff doc and not a TODO list; it is a pointer to the canonical source. Format:

   ```
   slug: <kebab-case-slug>
   declared_at: <ISO 8601 timestamp>
   branch: <current branch name from `git rev-parse --abbrev-ref HEAD`>
   ref: <pointer — TRACKER § Next #N, PR #N, handoff slug, or "exploratory">

   <one sentence — what this worktree is doing>
   ```

   Rules:
   - **`ref:` is required.** It must point back to where the canonical "what + why + how" lives — a TRACKER row, an open PR, a `.claude/handoffs/<slug>.md`, or `exploratory` for sessions with no canonical source yet. The body is the headline; the ref is where to read more.
   - **Body is one sentence.** If the worktree is doing two unrelated things, that is a smell — split into two worktrees, or pick the primary thread for the body and let `ref:` carry both pointers.
   - **Re-declare each session.** If the file exists from a prior session and intent differs, overwrite it. If it matches, leave it alone. If the work pivots mid-session, update the file.
   - **Skip this step** for purely exploratory turns with no work-shaped intent yet. Add the file once intent crystallizes.
   - **Do NOT** auto-rename the worktree directory or branch to match the slug — that's a destructive mid-session move that breaks the running shell's cwd.

## What NOT to do

- Don't open files outside the read list above just to "get oriented" — orientation is what TRACKER is for.
- Don't propose work, write code, or modify files until Muxin has signed off on the Critical-items walkthrough and the Next item.
- Don't re-summarize CLAUDE.md back at Muxin — he wrote it.

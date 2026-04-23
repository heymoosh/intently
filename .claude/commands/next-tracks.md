You are the parallel-track dispatcher for Intently. The user just typed `/next-tracks` and wants a review-first list of work ready to kick off, with model recommendations and scope proposals, before they commit to launching any tracks.

## Do these steps, in order

### 1. Read state

- `TRACKER.md` — sections: Status, Critical items awaiting review, Follow-ups, Next (in order — start here)
- `gh pr list --state open --json number,title,headRefName,isDraft,labels` — what's in flight on GitHub
- `gh pr list --state merged --limit 40 --json number,title,mergedAt` — what's landed recently
- `git worktree list` — active worktrees
- `ls docs/process/session-prompt-*.md` — which prompts already exist locally
- `cat docs/process/session-prompt-seed-data-v1.md` (or any other existing prompt) — to internalize the project's session-prompt format, so recommendations match the conventions

Be quick. Don't re-read a file if its content is already clear from TRACKER context.

### 2. Classify every actionable line item

Each item from Next / Follow-ups / Critical-items gets exactly one label:

- **READY** — unblocked, not in flight, not yet merged
- **IN_FLIGHT** — matches an open PR title OR has an active worktree at `~/worktrees/intently/<slug>`
- **MERGED** — file(s) the item would produce already exist on main OR a merged PR title indicates completion
- **BLOCKED** — requires user-only action (OAuth registration, Bitwarden secrets, Michael Cohen session, spec decision, recording demo video) OR has a stated dependency not yet resolved

Heuristics for BLOCKED (match substring, case-insensitive):
- "user only", "user task"
- "register", "OAuth", "Bitwarden", "vault_ids"
- "waits for", "waits on", "blocked on", "pending review"
- "Michael Cohen", "session with"
- "spec decision", "decide"
- "record", "video"

### 3. For each READY item, produce a proposal

Do NOT generate session-prompt files yet. The user wants to review these first. For each ready item, output:

- **Proposed slug** — kebab-case, lowercase, meaningful
- **Model recommendation** — one of:
  - Sonnet 4.6 medium — content generation, bulk edits, docs, single-file bug fix, bounded implementation on a known spec
  - Opus 4.7 high — multi-step implementation with clear spec, 2-5 files, test-heavy, light architectural judgment
  - Opus 4.7 xhigh — system design, 10+ file refactor, unknown-unknowns integration (e.g. integrating a third-party SDK you don't have full docs for), deep debugging, cross-cutting architecture decisions
  
  Reference: `/Users/Muxin/Documents/Personal Obsidian/Projects/Opus 4-7 Hackathon/Claude Code Practices/When to use opus 4.6, 4.7, and sonnet 4.6.md`. If you haven't read it recently, re-read and cite one concrete reason for the model choice per task.
- **Key files** — the files you expect this track to touch (be specific; "agents/*" is less useful than "agents/daily-brief/SKILL.md + agents/_shared/life-ops-conventions.md")
- **Scope estimate** — rough LOC range (e.g. "~150 LOC + tests" or "~30 docs lines") so the user knows the size
- **Sequencing** — if this track should wait on another ready track merging first (e.g. "Track B's output defines the API Track C consumes"), say so
- **Blockers / questions** — any unresolved scope decisions the user should weigh in on BEFORE you draft the session-prompt
- **Status of the session-prompt file** — does `docs/process/session-prompt-<slug>.md` exist? If yes, point at it. If no, say "will generate on approval"

### 4. Output format

Use this exact structure. Be terse. No marketing language.

```
# Next tracks dispatcher — <ISO timestamp>

## Ready to kick off (N items)

### 1. <item title> — <TRACKER reference>

- **Slug:** `<slug>`
- **Model:** <Sonnet 4.6 medium | Opus 4.7 high | Opus 4.7 xhigh> — <one-line reason>
- **Key files:** <list>
- **Scope:** <LOC estimate>
- **Sequencing:** <"independent" | "waits for X" | "enables Y">
- **Blockers/questions:** <bulleted; "none" if no open questions>
- **Session-prompt:** <"exists at docs/process/…" | "will generate on approval">

### 2. …

## In flight (don't touch)

- PR #<N>: <title> — <branch> — <state: draft / ready / labeled needs-user-review>

## Blocked (need your input)

- <item> — <why>

## Recently merged

- PR #<N>: <title> (<timeago>)
- … (max 5 most recent)
```

### 5. End the output with a brief prompt for the user

Literal text to include at the end:

```
---

**Your move.** Tell me which items to generate session-prompts for. You can:
  - Approve as-is: "generate prompts for #1 and #3"
  - Adjust scope first: "for #2, narrow to just the X subcomponent" or "merge #2 and #4 into one track"
  - Ask clarifying: "what's the risk on #5?"
  - Pick order: "generate #1 first, wait on the others"

I'll draft prompts only after you approve. Generated prompts stay local (uncommitted) — you can edit or delete before kicking off the track.
```

## Constraints on this run

- Do NOT write any files. Output only. The user reviews, then directs.
- Do NOT launch any `intently-track` command. The user runs those manually after approving.
- Do NOT edit TRACKER.md, CLAUDE.md, session-handoff.md.
- If the classification is ambiguous, default to BLOCKED and note the ambiguity — better to under-propose than to generate work for items that shouldn't run.
- If no items are READY, say so plainly and suggest what to look at next (Critical items, spec decisions, etc.).

## On the model recommendations

Be calibrated. Examples:

- "Demo seed data" → Sonnet 4.6 medium. Pure content generation; no architecture.
- "Wire Managed Agents SDK into agent-runner" → Opus 4.7 xhigh. Integrating an SDK with uncertain shape (post-Thursday-session unknowns) is exactly the "tool-using agentic coding with integration-level unknowns" pattern the guide flags.
- "Add npm audit step to security.yml" → Sonnet 4.6 medium. One workflow file; mechanical.
- "Port Claude Design tokens" → Sonnet 4.6 medium. Mechanical translation with clear source-of-truth.
- "Refactor agent-runner to support streaming responses" → Opus 4.7 high. Scoped refactor with clear target.
- "Design the Edge Function architecture for scheduled skill invocation" → Opus 4.7 xhigh. System design, multiple unknowns.

Err toward higher model for tasks with unknowns in the spec/API; err toward lower for tasks with clear, bounded, mechanical work.

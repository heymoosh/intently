The user invoked `/handoff` to create or update a project handoff. ARGUMENTS may contain a slug (e.g. `/handoff steward-redesign`) or be empty.

Convention: `docs/process/session-handoff.md`. Lifecycle + slug rules: `.claude/handoffs/README.md`.

## Steps

1. **Resolve slug.**
   - If ARGUMENTS has a slug, use it (kebab-case, no extension, no timestamp).
   - Otherwise, derive: prefer the TRACKER item the current work tracks; fall back to the current `chat/<slug>` branch name (strip `chat/`); last resort, ask Muxin in one short question.

2. **Check for existing handoff at `.claude/handoffs/<slug>.md`.**
   - **Exists →** this is an UPDATE pass. Read the file, then continue with step 4.
   - **Does not exist →** this is a CREATE pass. Continue with step 3.

3. **CREATE — confirm scope before writing.** Ask Muxin one tight sentence: "Creating `<slug>.md` for <one-sentence project description derived from the conversation>. Sound right?" If yes, write a fresh handoff using the template below. Add a one-line entry to `TRACKER.md` § "Active handoffs" pointing to the new file. (If TRACKER doesn't have that section yet, add it right after Status.)

4. **UPDATE — re-distill.** Re-read the existing handoff + recent conversation. Produce the **clean happy-path version**: strip exploratory noise, lock decisions that have actually landed, sharpen next steps, append new decisions to the decision log with rationale. The end state should read as if the work proceeded cleanly from the start, not a transcript of figuring it out. Preserve the original-intent line verbatim unless Muxin has explicitly redefined it.

5. **Confirm.** Report the diff back in 3–5 bullets: what's new, what changed, what's still TBD.

## Template (CREATE)

```markdown
# Handoff — <Project title>

**Slug:** `<slug>` · **Tracked by:** `TRACKER.md` § <section name>
**Started:** <YYYY-MM-DD> · **Last updated:** <YYYY-MM-DD>
**Status:** active | parked | shipped (still kept for pattern review)

## Original intent

<One paragraph in Muxin's words from the kickoff. Stable — does not get rewritten unless Muxin explicitly redefines it.>

## Goals

- <bullet>
- <bullet>

## Decisions made

- <decision> — <one-line rationale>
- <decision> — <one-line rationale>

## Decision log (tried / rejected)

- <option> — <why we didn't go this way>

## State as of <YYYY-MM-DD>

<Where things actually are: what's built, what's deployed, what files matter. Concrete, file paths and PR numbers.>

## Next steps

1. <next>
2. <next>

## Open questions

- <question>
```

## Rules

- Never delete a handoff. If a project ships, mark `Status: shipped` and leave it for pattern review.
- Never create a duplicate. If a slug exists and the new work is the same project, update the existing file.
- Never paste raw conversation. The handoff is the clean version; the transcript lives in git history if anyone needs it.
- Update TRACKER's "Active handoffs" section in the same turn so the pointer doesn't drift.

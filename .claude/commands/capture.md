The user invoked `/capture` to add an actionable item to the inbox without breaking the current conversation flow.

## Steps

1. Take everything after `/capture` as the capture text. If no text was provided, ask for it in one short sentence ("what to capture?") and stop.

2. Generate the timestamp:
   ```
   date +"%Y-%m-%dT%H%M"
   ```
   (compact, sortable, local time). Use the current ISO 8601 timestamp with timezone (e.g. `2026-04-25T19:00:00-04:00`) for the `captured:` frontmatter field.

3. Generate a kebab-case slug from the first ~6-10 words of the input. Lowercase, alphanumeric + hyphens, max 50 chars. Strip articles (a/an/the) and short filler words.

4. Write `.claude/inbox/<timestamp>-<slug>.md` with frontmatter + body:
   ```markdown
   ---
   captured: <ISO 8601 with timezone>
   session: <current branch — `git rev-parse --abbrev-ref HEAD`>
   source: <explicit | discussion | auto>
   ---

   # <one-line title from the input>

   <body — the user's text, lightly cleaned. Preserve their wording.>
   ```

   - `source: explicit` when the user typed `/capture <text>` themselves
   - `source: discussion` when you (Claude) auto-captured during a discussion turn
   - `source: auto` when a routine or background loop wrote the capture

5. Echo back one line: `captured: <slug>`. That's it. No further commentary.

## Auto-capture posture (no slash command — you decide to capture)

When in a discussion session and an item emerges that meets the auto-capture criteria (see `feedback-auto-capture-during-discussion.md` memory), follow the same steps above with `source: discussion`. Tell the user "captured: <slug>" inline so they know it landed.

## What NOT to do

- **Don't groom.** Don't decide priority, don't suggest where it should land in TRACKER, don't ask the user to clarify scope. That's `/groom`'s job.
- **Don't paraphrase.** The user's wording is the capture. Light cleanup only.
- **Don't commit.** Captures stay uncommitted in the working tree; user (or grooming session) commits when ready.
- **Don't write to TRACKER.** Captures go to `.claude/inbox/` only. Even if you think the item belongs in § Critical or § Next — that's grooming's call.
- **Don't read other files** unless the user's input itself references something that needs disambiguating.

---
captured: 2026-04-26T08:15:00-05:00
session: chat/0425-210554
source: discussion
---

# Journal entry edit needs a full-page editor, not a bottom-sheet composer

Surfaced during Muxin's morning smoke test of the deployed app. PR #169 wired the previously-stubbed `onEdit` button on `JournalReader` to open `JournalComposer`. PR #174 fixed the visibility bug so the edit button now appears for DB-backed entries. But the EDIT EXPERIENCE itself is wrong.

## What's wrong

`JournalComposer` (`web/intently-extras.jsx`) is the inline bottom-sheet composer designed for ADDing a journal entry from the Day view's AddZone. It's a small modal that slides up over the bottom portion of the phone frame. Reusing it for EDIT means tapping "edit" opens a small editing surface that doesn't match the calm, full-bleed reading aesthetic of the entry being edited.

Muxin's framing: *"The journal entry should have been a full-page editing screen. What I see here is just a small outer journal entry, which is not good enough... When I open up a journal entry, there should be an edit button here somewhere that allows for actual editing straight on the entry."*

## What's right

Edit-in-place on the reading-mode page itself, OR a full-page editor that mirrors the reading-mode aesthetic (drop-cap, painterly banner above, wide measure body) but with the body editable. Two design directions:

**Direction A — Edit-in-place on ReadingMode.**
- Tap edit → the reading-mode body becomes a `contenteditable` div (or textarea styled to match)
- Drop-cap stays; banner stays; the title and body become editable
- Save/Cancel buttons appear in the header (replacing the close + more)
- Pros: minimal new UI; user never leaves the entry's "page"
- Cons: contenteditable styling is finicky to get right; cursor placement on the drop-cap is awkward

**Direction B — Separate full-page editor.**
- Tap edit → ReadingMode unmounts; a new `JournalEditor` component mounts with the same banner + entry title in a header strip + a generously-spaced textarea below
- Save → write back to DB, return to ReadingMode (with refreshed content)
- Cancel → discard, return to ReadingMode
- Pros: cleaner separation of concerns; easier to style the editor without breaking reading-mode aesthetics
- Cons: more new UI to design + build

**Lean: B (separate full-page editor).** Cleaner code path. The editor can match reading-mode visually but doesn't fight with reading-mode's drop-cap rendering.

## Same question for journal CREATE

The current AddZone-based composer is fine for "drop a quick journal note from the Day view." But if Muxin wants the bigger entry-creation flow (writing a full journal entry in the calm reading-mode style), tapping "Add a journal entry" should ALSO open the full-page editor, not the bottom sheet.

Two sub-questions:
1. Does AddZone-quick-note coexist with full-page-create? (probably yes — two paths for two intents)
2. When does the user get which? (lean: AddZone for ≤140 chars, full-page for longer)

## Implementation scope

Estimated:
- `web/intently-journal.jsx` — new `JournalEditor` component (~200 lines)
- `web/intently-reading.jsx` — `JournalReader.onEdit` rewires to mount `JournalEditor` instead of `JournalComposer`
- `web/index.html` — state machine for `editingEntry` switches between ReadingMode and JournalEditor
- `web/lib/entities.js` — `updateJournalEntry` already exists; `insertJournalEntry` already exists

Estimated effort: half-day for the editor component + wiring. Adds to existing `new-user-ux-and-auth` handoff scope OR ships as standalone.

## Cross-references

- PR #169 wired the (wrong) edit experience.
- PR #174 fixed edit-button visibility.
- This is the third loose end from the new-user-UX handoff's "reading-mode wiring fixes" AC.
- Connects to setup-expansion's "optional journal seed" phase if that phase uses the same editor surface.

## Out of scope for this capture

- The edit-permissions question (can users edit OLD journal entries? probably yes, but worth confirming).
- Versioning / edit history (probably no for V1).
- Markdown rendering inside the editor (lean: plain text V1; rich text later).

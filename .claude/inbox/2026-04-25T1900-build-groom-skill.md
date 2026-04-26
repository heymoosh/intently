---
captured: 2026-04-25T19:00:00-04:00
session: chat/0425-171303
source: discussion
---

# Build /groom skill

Phase 2 of capture-groom-execute system. Spec in `.claude/handoffs/capture-groom-execute.md`.

`.claude/commands/groom.md` — reads `.claude/inbox/*.md`, walks each item with the user (restate intent, ask clarifying questions, surface dependencies), decides destination per item, writes to TRACKER section / per-skill AC file / triggers `/handoff` per CLAUDE.md threshold. Deletes inbox files after processing. Refuses to run if a sibling session is active in the same checkout (would conflict on TRACKER writes).

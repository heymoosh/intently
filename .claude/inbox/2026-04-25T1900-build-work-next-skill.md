---
captured: 2026-04-25T19:00:00-04:00
session: chat/0425-171303
source: discussion
---

# Build /work-next skill

Phase 2. Spec in `.claude/handoffs/capture-groom-execute.md`.

`.claude/commands/work-next.md` — branches from `origin/main`, reads TRACKER § Next, picks top item, refuses items still in `.claude/inbox/` ("groom this first"), executes (code + PR), self-checks against per-skill AC file before claiming done, marks item complete via PR's "## Manual follow-ups" section (existing scraper handles the TRACKER update on merge).

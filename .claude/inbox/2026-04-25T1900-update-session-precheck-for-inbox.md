---
captured: 2026-04-25T19:00:00-04:00
session: chat/0425-171303
source: discussion
---

# Update session-precheck.sh to surface inbox count

Phase 2. `scripts/session-precheck.sh` — count `.claude/inbox/*.md` files, surface count + latest 3 items in `[inbox]` block of precheck output. Sibling-aware:
- No sibling running → "groom now? (y/defer/show)"
- Sibling running → "capture-only mode (groom would write TRACKER)"

Also: detect if any inbox file's mtime is older than N days, flag as stale (signals inbox is rotting; user should groom).

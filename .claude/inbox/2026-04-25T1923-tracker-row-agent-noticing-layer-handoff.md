---
captured: 2026-04-25T19:23:00-04:00
session: chat/0425-171303
source: discussion
---

# Add TRACKER § Active handoffs row for agent-noticing-layer.md

The `agent-noticing-layer` handoff was created at `.claude/handoffs/agent-noticing-layer.md` 2026-04-25T1915 but the corresponding TRACKER § Active handoffs row was NOT added (TRACKER write was deferred while sibling worktree session was active).

This is the integrity invariant gap explicitly named in the same session — every handoff doc must have a TRACKER row pointing at it.

**Add to TRACKER § Active handoffs:**

```
- **`agent-noticing-layer`** → `.claude/handoffs/agent-noticing-layer.md` — cross-cutting "agent should do the noticing" architectural arc; three workstreams (multi-modal hero capture routing, topic clustering → auto-projects, memory tiering with promotion). V1.1 post-hackathon, not active. Status: deferred.
```

Do this when sibling sessions clear (or when running first /groom).

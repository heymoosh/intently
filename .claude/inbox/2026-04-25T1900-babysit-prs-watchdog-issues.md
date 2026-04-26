---
captured: 2026-04-25T19:00:00-04:00
session: chat/0425-171303
source: discussion
---

# babysit-prs and build-watchdog loops have known issues

User flagged at session start that both background loops "have issues." This session confirmed nothing was running (CronList + TaskList both empty), but the underlying issues weren't diagnosed or addressed.

**Decide:** fix the underlying issues OR remove the loops entirely. If keeping, document the known issues in their respective spec files (`.claude/loops/babysit-prs.md` and wherever build-watchdog lives).

This is exactly the type of slip the inbox system is designed to prevent — flagged at conversation start, would have been lost without capture.

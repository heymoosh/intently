---
captured: 2026-04-25T19:00:00-04:00
session: chat/0425-171303
source: discussion
---

# Draft ADR — file isolation for capture (`.claude/inbox/` vs TRACKER § Inbox)

Phase 2. Create ADR in `docs/decisions/` documenting:

**Decision:** Captures live in `.claude/inbox/<timestamp>-<slug>.md` (one file per item), NOT in a TRACKER § Inbox section.

**Why:** TRACKER + capture in the same file means discussion sessions write TRACKER, which collides with execution sessions also writing TRACKER. File isolation eliminates the shared writer entirely. Per-item files also mean zero git conflicts on capture (each new file is its own).

**Alternatives considered:** TRACKER § Inbox section (rejected: same-file write contention), shared inbox file with append-only (rejected: still single-file write contention; per-item files are strictly better).

**Implications:** Inbox files are tracked in git but ephemeral (drained by /groom). No 100-line cap on inbox. Existing PR scraper continues to write to TRACKER § Follow-ups directly (already-groomed by PR author intent).

This ADR documents the design call so future sessions don't re-litigate it.

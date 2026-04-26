---
captured: 2026-04-25T19:23:00-04:00
session: chat/0425-171303
source: discussion
---

# Extend drift-check loop with workflow-integrity invariants

`.claude/loops/decision-drift-check.md` is currently scoped to "missed-decision drift + CLAUDE.md leanness audit" per TRACKER. Extend it to also verify workflow integrity invariants from the capture-groom-execute system. Spec at `.claude/handoffs/capture-groom-execute.md` § "Cross-skill invariants":

1. Every TRACKER § Active handoffs row points at a real `.claude/handoffs/<slug>.md` file (and vice versa: every non-archived handoff doc has a TRACKER row)
2. Every shipped item that touched a skill has at least one entry in that skill's `docs/product/acceptance-criteria/<skill>.md` file
3. Every TRACKER "Active decisions" row points at a non-superseded ADR in `docs/decisions/`
4. Every inbox file older than N days is flagged stale (default N=7; rotting captures = grooming debt)

Failure modes the loop should report (don't auto-fix):
- Orphan handoff (file exists, no TRACKER row)
- Dangling TRACKER row (row points at missing handoff file)
- Shipped item without AC entry
- Stale ADR ref (TRACKER row points at superseded ADR)
- Stale inbox files

Run cadence: same daily evening as the existing decision-drift loop; deferred until after hackathon (post 2026-04-26 8 PM EDT) per existing TRACKER follow-up.

---
captured: 2026-04-25T22:30:00-05:00
session: chat/0425-210554
source: discussion
handoff: .claude/handoffs/sam-demo-on-landing-page.md
amends: .claude/handoffs/new-user-ux-and-auth.md
---

# Sam demo embedded on the landing page (supersedes "Sam-seed-gate-behind-dev-mode")

**Handoff drafted at `.claude/handoffs/sam-demo-on-landing-page.md`.** Also amends `.claude/handoffs/new-user-ux-and-auth.md` — the Sam-seed AC bullets in that handoff need updating: Sam isn't dev-mode-only, Sam is the **public landing-page demo persona**. `/groom` should:

1. Add a TRACKER § Active handoffs row pointing at the new sam-demo-on-landing-page handoff
2. Update the Sam-seed AC bullets in `new-user-ux-and-auth` to reflect that Sam stays public (embedded on landing page) rather than gated behind dev-mode/`?dev=1`
3. Register AC inside the new handoff (cross-cutting product → AC inside handoff)
4. Update this `resolved:` field, then delete

## One-line intent

The deployed URL becomes a marketing-style landing page with the interactive prototype embedded inline (clickable, real interactions, populated with Sam's data). A "try it for yourself" CTA leads into the real anon-auth onboarding flow.

## Why this is in the inbox + amends another handoff

Earlier this session, the `new-user-ux-and-auth` handoff scoped Sam-seed as a dev-mode-only affordance ("`seedSamIfEmpty` does NOT fire on production"). Muxin reframed in this turn: Sam is the *public demo persona*, not a dev artifact. He should live on the landing page like an embedded interactive prototype that visitors can play with before deciding to sign up.

This is a meaningful scope change — it adds a whole landing-page surface, raises the bar for Sam's seed data (must cover every interactive surface comprehensively, not just enough for the demo video), and inverts the framing of where Sam lives.

## Three architecture options (handoff covers in detail)

A. Component embed — same React bundle, demo as child component with `mode='demo'` prop. *Lean here.*
B. Iframe embed — separate route iframed into the marketing page. Hard state isolation.
C. Same-page conditional render — prototype renders inline on `/` with marketing chrome stacked around it.

## Substance

The launch-plan (now updated to reflect this) lists this as the 4th handoff to execute, after wiring-audit + cognition-verification-harness + new-user-ux-and-auth. Sam-data-completeness depends on the wiring-audit's inventory (the AC bullet for "every interactive surface has corresponding Sam data" is empty without the inventory).

See handoff for full AC, data-completeness checklist, demo-mode write/agent gating, and architectural questions.

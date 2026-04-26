# Sam demo embedded on the landing page

**Created:** 2026-04-25 evening (post-hackathon-submission discussion).
**Status:** Drafted, not groomed. Awaiting `/groom` to register in TRACKER.
**Source:** Conversation with Muxin on 2026-04-25 evening, two-step framing:
1. *"Sam Tanaka has been a helpful seed demo data. I think it'd be cool to keep his demo data for future purposes, because a lot of landing pages have clickable prototypes that can show you what an app experience looks like with fake data."*
2. Clarification: *"the SAM data is something that lives on the actual website, not on a separate website. You know how some websites have their own interactive prototype right there on the landing page? That's what I want. I guess like an iframe inside a website?"*

## Why

The current deployed URL (`intently-eta.vercel.app`) IS the cognition-complete prototype — visitors land directly inside Sam's seeded life with no context for what Intently is, no marketing copy, no onboarding into a real account. The premise is *"this is the app, click around"* but everything they touch is Sam's data, and there's no path from "I'm exploring" → "I want this for me."

The right pattern (used by many product landing pages) is: a marketing-style landing page on `/` with the working app **embedded inline as an interactive demo** — clickable, scrollable, every button works, every screen reflects real product behavior. Sam's database is the demo's state. A "try it for yourself" CTA on the same page leads visitors into the real anon-auth → setup → use flow.

This delivers two things at once:
1. **Marketing surface.** Visitors get told what Intently is before being dropped into it.
2. **Demo surface.** Visitors play with the actual app, not a video, not a screenshot — the real prototype with real Sam data, exploring every interaction.

And it solves the "Sam survives, but as the demo persona, not the auto-seeded confusion" problem from the new-user-ux-and-auth handoff.

## What — the target experience

**The landing page on `/`:**
- Top: hero copy ("Intently — your day, agent-shepherded" or whatever positioning Muxin lands on), 1–2 lines explaining what it is, a primary "try it for yourself" CTA.
- Middle: the **embedded interactive demo** — the prototype rendering inside the iPhone frame, running with Sam's database state, clickable. Visitors can swipe between Past / Present / Future, tap into goals, projects, journal entries, see the daily brief, watch the agent voice-in / voice-out (or read-only equivalents). All interactivity works against Sam's data; writes either no-op silently OR scope to a per-session ephemeral state that resets on reload.
- Below the demo: "what it does for you" sections — short marketing copy beats explaining the daily brief, the cognition layer ("the agent remembers yesterday"), the calm aesthetic, the agent-as-collaborator framing. A few screenshots, optional explainer animation.
- Bottom CTA: "set up your own" → leads into the real onboarding flow at `/app` (or wherever the real-user app lives).

**The real app (where authenticated/anon users live):**
- A separate route in the same Vercel deploy, e.g., `/app`, where the anon-auth Supabase flow runs and real users see their own data.
- This is the front door for someone who clicked "try it for yourself" on the landing page.

**Same bundle, different routes.** Not a separate Vercel project. The current `web/` codebase grows a small marketing layer + a route split. The prototype JSX is reused inside the demo embed.

## Architecture — decided 2026-04-25

**Locked: Option A — Component embed (in-bundle).** The landing page is React; the prototype is rendered as a child component with a `mode='demo'` prop that scopes its Supabase reads to a fixed Sam user_id and no-ops writes (or uses ephemeral session storage).

Rationale (Muxin, 2026-04-25 evening): the prototype is already a React tree that takes props; adding a `mode` prop and a `demoUserId` is cheap, single bundle keeps deploys + design tokens consistent, no iframe glue.

Considered and rejected:
- **B. Iframe embed.** Hard state isolation, but two pages to ship, iframe sizing/sandbox quirks, design-token sync requires care. Revisit only if state-isolation in option A becomes painful.
- **C. Same-page conditional render.** Simplest, but loses the "look at this contained product" feel — the prototype dominates the layout instead of being framed as a contained demo artifact.

This decision is durable enough to land as an ADR during execution (`docs/decisions/000X-landing-page-with-component-embedded-demo.md`) — see "Files this work touches" below.

## Acceptance criteria

Drafted here per § AC location matrix (cross-cutting product → handoff).

**Landing page exists:**
- [ ] `/` route serves a marketing-style landing page (not the prototype directly). Hero, value-prop copy, embedded demo, marketing sections, CTA.
- [ ] Embedded demo is interactive and visually distinct from a static screenshot — visitors can swipe, tap, expand cards, open reading mode, etc.
- [ ] "Try it for yourself" CTA leads to the real anon-auth onboarding flow (route TBD: `/app`, `/start`, or similar).

**Sam data populates every interactive surface:**
- [ ] Goals: ≥3 long-term goals with realistic monthly_slice copy and varied glyphs.
- [ ] Projects: ≥4 projects (mix of admin + real), each with body_markdown, ≥3 todos with mixed done states, FK'd to goals.
- [ ] Journal entries: ≥7 days of entries (mood + glyph + body), spanning the past week with 1–2 per day.
- [ ] Plan items: today's plan populated across morning / midday / evening bands with ≥6 items at varied tiers.
- [ ] Reminders: ≥4 admin reminders (mix of pending and dated future).
- [ ] Calendar events: today + tomorrow populated with ≥4 realistic events.
- [ ] Email flags: ≥5 flagged emails, mix of urgent / awaiting reply.
- [ ] Yesterday's review: structured json_tail with friction + tomorrow + journal_text, glyph + mood.
- [ ] At least one prior daily-brief and one prior weekly-review entry so reading mode renders meaningfully.
- [ ] Verification: every row in the wiring-audit interaction inventory has corresponding Sam data such that visiting the demo and clicking that interaction produces a non-empty visual result.

**Demo-mode behavior:**
- [ ] In demo mode, all writes either no-op or scope to ephemeral per-session state that resets on reload. No real DB writes happen on Sam's user_id from the embedded demo.
- [ ] Agent calls (`callMaProxy`) in demo mode are either disabled OR rate-limited heavily (cost discipline) — visitors should see something happen on tap, but firing a real Opus 4.7 brief on every page load doesn't scale.
- [ ] Decision needed during execution: do we pre-record agent outputs for the demo (cheap, deterministic, fast) OR run live (expensive, varied, slow)? *Lean: pre-record canned outputs for demo mode; live agent only on the real-user side.*

**Real-app entry:**
- [ ] CTA leads to a route where Sam's seed does NOT load. Visitor lands on empty-state → setup (per `new-user-ux-and-auth` handoff).
- [ ] After setup, returning visitors come back to their own data, not Sam's.

**Production URL no longer auto-loads Sam:**
- [ ] `seedSamIfEmpty` no longer fires on real-user routes. Only the embedded demo reads from Sam's user_id.
- [ ] The Sam user_id is stable, documented, and the demo always reads from it.

**Verification:**
- [ ] Demo mode in incognito → visitor sees marketing page with embedded interactive Sam demo. Tapping anywhere works. Closing tab + reopening → same demo state (Sam's data is read-only).
- [ ] CTA → onboarding → after setup, visitor sees their own data. Closing tab + reopening with same browser → still their own data (anon uid persisted).
- [ ] Different browser / incognito on the real-app route → empty state, no Sam.

## Open questions for grooming

1. **Domain of the real app.** Same Vercel project under `/app`, or a sub-domain? *Lean: `/app` route in the same project.*
2. **Pre-recorded vs. live agent in demo mode.** Cost + variability tradeoff above.
3. **Marketing copy authorship.** Out of scope for this handoff (a copy task, not a wiring task), but a placeholder needs to land. *Lean: ship with placeholder copy, iterate.*
4. **Visual treatment of the embed.** iPhone frame as-is, or a smaller "preview window" frame on the landing page that expands on click? *Lean: iPhone frame embedded in a styled container, no expand-to-fullscreen for V1.*
5. **What happens to the current home of `intently-eta.vercel.app`?** It IS the prototype today. Migrating to the new layout is a route-rewrite. *Decide: migrate the existing route in place, or stand up a new route and switch DNS.*

## Dependencies / sequencing

- **Hard dependency on `wiring-audit`.** The Sam-data-completeness AC bullets above (≥3 goals, ≥4 projects, etc.) are placeholders; the real list comes from the wiring-audit's interaction inventory. We need to know every interactive surface before we can populate Sam to cover it.
- **Soft dependency on `new-user-ux-and-auth`.** The "try it for yourself" CTA only works once anon-first onboarding lands. Can develop in parallel; demo handoff merge-ready after onboarding handoff lands.
- **Independent of `oauth-calendar-email`** for the demo (Sam's calendar/email rows are seeded fixtures); strong synergy on the real-app side.
- **Independent of `scheduled-agent-dispatch`** (demo mode doesn't fire schedules; real users do).

## Files this work touches (rough)

- New: `web/landing.html` or new route in `web/` for the marketing page (decide structure during execution)
- `web/index.html` — split into landing + demo-embed + real-app routes
- `web/lib/seed-sam.js` — stop firing on real-app routes; demo mode reads from a stable Sam user_id
- `web/lib/seed-sam-data.js` — expand to cover every interactive surface per the inventory
- New: marketing-page-only components (hero, value-prop sections, CTA) — small surface, build with tokens
- New ADR: `docs/decisions/000X-landing-page-with-embedded-demo.md` — the architecture decision (option A/B/C above)
- Cross-references: `new-user-ux-and-auth` AC for the onboarding side; `wiring-audit` for the data-completeness side

## Estimate

Multi-day. The landing page + embed routing: ~1 day. Sam data expansion: ~0.5 day if the wiring-audit inventory is in hand. Demo-mode behavior (write no-op + agent gating): ~0.5 day. Total: ~2 days, but order it after `wiring-audit` ships so the data-completeness pass is comprehensive.

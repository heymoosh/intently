# Launch Plan — Intently (post-hackathon)

**Status:** post-submission. Hackathon shipped 2026-04-26 with the "1 flow done well" demo bar. This doc is now re-targeted at the **real working app** bar, not the demo-video bar.

**What this doc is:** the **durable sanity check** for "what does shipped mean." Slow-changing. Reviewed when scope feels off. `TRACKER.md` is the hot queue (what to do next); this is the slow doc (what done looks like). When this doc and TRACKER drift, fix this first, then re-order TRACKER.

**Doc hierarchy:** `launch-plan.md` (strategy, slow) → `TRACKER.md` (queue, hot) → `.claude/inbox/` (un-groomed captures) → `.claude/handoffs/<slug>.md` (project depth, persistent) → `docs/product/acceptance-criteria/` (done-definition).

---

## The current bar — "real working app," not "1 flow"

**Done means:** every interactive element in the deployed prototype design is logically wired through to data, every visible state implies a model + a binding + a reuse story, and a stranger can open the app, set themselves up, and use it day-over-day without finding stub handlers, hardcoded literals, or dead-end interactions.

This supersedes the hackathon demo bar (*"one flow done well beats three half-working"*). That framing was correct for a 3-day sprint. It is now actively misleading and should not be cited as scope cover for shipping incomplete surfaces post-hackathon.

### What that means in practice

1. **Every interaction in the prototype is wired or explicitly deferred with a TRACKER row.** No `onClick={() => {}}` shipped silently; no "Continue this conversation" buttons with no handler; no edit affordances that don't edit. The wiring-audit handoff (`/groom`-pending) catalogs and decides per-element. Any new interactive element added to the codebase ships with its wiring or a documented stub-with-TODO referencing TRACKER.
2. **Every visible state has a single source of truth.** No three-implementations-of-an-avatar with three different hardcoded letters. Identity components read from a shared user context. Goal cards, project cards, journal entries reuse the same presentation primitive across surfaces. Tokens already work this way; presentation components and identity bindings catch up.
3. **A real user can become a real user.** Anon-first onboarding (Supabase anon auth → setup → use the app), with optional account upgrade via `linkIdentity()`. Setup intakes enough state for day-1 brief to be useful, not just 3 goal titles.
4. **Sam lives embedded on the landing page itself.** The deployed URL becomes a marketing-style landing page (hero copy, "what this is," "what it does for you") with the prototype **embedded directly into the page** — a clickable interactive Sam-driven demo running inline, the way some product sites embed a working prototype right on `/`. The "try it for yourself" CTA on that page leads into the real anon-auth → setup → use flow. One URL, two surfaces (marketing + real app), shared bundle, with the demo as a scoped component or iframe inside the marketing page.
5. **The agent loop is genuinely agentic.** Scheduled fires (daily-brief at the user's time, daily-review, weekly, monthly) actually invoke the agent, not just log to `cron_log`. Auto-collect (real Google OAuth for calendar + email) and auto-sort (the noticing layer) make ambient capture work.
6. **Cognition is verified, not just hand-tested.** A spawn-fresh-anon-user + time-travel-clock harness asserts day-N brief references day-(N-1) review and runs in CI. The cognition layer's value compounds; its guarantees should compound too.

### What "real working app" does NOT mean (still scope-cut)

- **Multi-user team features** — single-user dogfood per ADR 0002 still holds. Account upgrade gives a user durable identity; it does not introduce sharing, teams, or cross-account features.
- **Mobile-native app** — web-only per ADR 0004 (supersedes 0003). PWA / home-screen-add is fine; native shells deferred.
- **Web push notifications** — explicitly deferred per Muxin 2026-04-25 evening. Scheduled agents fire and write to DB; user sees on next open.
- **All originally-deferred skills** (daily-triage, project-continue, session-digest, vault-drift-check, notes-action-sync) — locked-cut per the hackathon ADRs unless re-promoted via grooming. monthly-review is in scope (un-deferred 2026-04-25).

---

## The handoff map — what done looks like in pieces

The current bar above is realized through the following multi-session handoffs. Each one is in `.claude/handoffs/<slug>.md` and registered (or pending registration) in TRACKER § Active handoffs. **Recommended execution order:**

1. **`wiring-audit`** — first. Enumerates every interactive element in the prototype, decides per-element (wire / defer / reject), folds rows into the other handoffs. Without this, the rest ships piecemeal.
2. **`cognition-verification-harness`** — second, in parallel with audit if capacity allows. Spawn-fresh-anon-user + time-travel + assert. Once this exists, every other change is verified end-to-end.
3. **`new-user-ux-and-auth`** — third. Anon-first onboarding, real setup expansion (re-scope from 3-goals-only to full intake), `linkIdentity()` upgrade, shared `<Avatar>` component, `display_name` parameterization. The "make it usable for a stranger" thread.
4. **`sam-demo-on-landing-page`** — fourth (or in parallel with #3, since Sam's data layer is the same Supabase tables). Build a marketing-style landing page that **embeds Sam's interactive prototype inline on the page itself** (not a separate URL). Populate Sam's database to cover every interactive surface comprehensively. Wire a "try it for yourself" CTA that leads into the real anon-auth experience. The "the front door is a landing page that lets visitors play with Intently before signing up" thread.
5. **`oauth-calendar-email`** — fifth. Real Google OAuth replacing the `setTimeout` mock; pulls into `calendar_events` + `email_flags`. Makes brief content concrete instead of abstract.
6. **`scheduled-agent-dispatch`** — sixth. Apply `0002_schedules.sql` and extend `tick_skills()` to actually invoke the agent. Makes the agentic value prop real.
7. **`agent-noticing-layer`** — seventh (V1.1). Pulls signal from chat/voice as the user uses the app; auto-routes to the right table. Promoted from V1.1-deferred this session.

Other parked-or-archived handoffs at `.claude/handoffs/` — `entries-architecture` (deferred), `critical-flow-check` (gated on cognition-verification-harness), `overnight-build-loops` (active infrastructure), `capture-groom-execute` (workflow infra, shipped), `real-app-cognition` (10/11 shipped + #24 declined; pattern preserved), `steward-redesign` / `ma-agents-complete` / `decision-drift-check` (shipped, kept for pattern).

---

## Locked decisions — don't re-litigate

These remain locked from the hackathon ADRs:

- **Stack:** plain React 18 + Babel-standalone + Supabase + Managed Agents · Bitwarden Secrets Manager when scale demands it. Web-only. (ADR 0004, supersedes 0003.)
- **Managed Agents = runtime, not state.** State of truth = Supabase rows post-cognition. (ADR 0001.)
- **Single-user V1.** Anonymous Supabase auth with optional account upgrade (anon-first per the new-user-ux-and-auth handoff). Multi-user team features deferred. (ADR 0002.)
- **Secrets:** Supabase env / Vault. BWS deferred until multi-user / scale. (ADR 0005.)
- **Autonomy default — act, don't ask.** (CLAUDE.md, PR #71.)
- **Three-screen swipe shell semantics.** Past = completed reviews. Present = today's brief + plan. Future = goals + monthly slice.
- **Cognition input cap ~3.4K tokens at our scale; below Opus 4.7's 4K cache minimum.** Prompt caching declined per ADR rationale (real-app-cognition handoff #24).

New decisions made post-hackathon (will be ADR'd as they execute):

- **Sam-as-embedded-demo on the landing page.** The deployed URL is a marketing-style landing page; Sam's interactive prototype runs **embedded inline** on that page. Visitors play with Sam's fully-populated state directly on `/`; a CTA on the same page leads them into the real anon-auth → setup → use flow.
- **Anon-first auth with `linkIdentity()` upgrade.** Real users start anonymous; account upgrade preserves uid + data without migration.
- **Wiring inventory is the source of truth.** Every interactive element catalogued; stub handlers caught by lint.

---

## What shipped in the hackathon (historical)

For reference. The hackathon submission cleared the original demo bar:

- **2026-04-26:** 13 PRs (#136–#152) closed the cognition backlog (10 of 11 shipped; #24 declined with documented math) + the real-app shell. `intently-eta.vercel.app` live with voice→chat, brief/review wired to live agent reading goals/projects/journal/calendar/email/reminders/yesterday's-review, weekly+monthly review UI, setup flow, AddZones persisting, hydration on mount, input traces, Undo on writes. Cross-day continuity verified.
- **2026-04-25 evening:** 5 PRs (#111–#115) wired voice + brief/review against the inherited prototype.
- **2026-04-25:** All 6 MA agents provisioned. Anthropic key consolidated/rotated.
- **2026-04-24:** Web pivot + first live Opus 4.7 brief.
- **2026-04-23:** Parallel-tracks workflow + agent-runner base + evals + design tokens + seed data.
- **2026-04-22:** Supabase schema + Expo scaffold + ADRs 0001/0002/0003.

The 3 mandatory hackathon deliverables (3-min demo video, public GitHub repo, written summary) were submitted by the deadline. Repo can be made private after Apr 28 per hackathon rules; current decision is to keep it public.

---

## Asset policy — durable

All assets must be OSS or owned-by-us:

- **Icons:** Lucide (ISC).
- **Fonts:** Fraunces, Source Serif 4, Inter, JetBrains Mono — all Google Fonts (OFL).
- **Images/illustrations:** owned, generated, or OSS-licensed only. No proprietary design assets in committed paths.
- **Sound/voice:** owned/generated audio only.

---

## How TRACKER rolls up here

TRACKER is the hot queue (what's in flight today, what just merged, what's blocked). This file is the slow sanity check (is the queue aimed at the right horizon). If TRACKER's "Next" order stops matching the handoff execution order above, fix this doc first, then re-order TRACKER.

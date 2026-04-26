# New-user UX + auth — anon-first, account-upgrade, real setup

**Created:** 2026-04-25 (post-hackathon-submission discussion).
**Status:** Drafted, not groomed. Awaiting `/groom` to register in TRACKER.
**Source:** Conversation between Muxin and Claude on 2026-04-25 evening, after Muxin observed the deployed app still feels like a prototype because Sam's seed runs unconditionally on first load and a real new visitor has no path to "this is mine."

## Why

The deployed app at `intently-eta.vercel.app` is the cognition-complete prototype: the agent loop works, cross-day continuity is wired, real Opus 4.7 fires on tap. **But for anyone who is not Muxin, the front door is broken in three ways at once:**

1. **Sam's seed runs unconditionally.** Every fresh anonymous visitor hydrates into Sam Tanaka's life — Sam's goals, Sam's projects, Sam's calendar, Sam's reminders — before they see the app. There is no "your day, blank canvas" entry. Sam is *test data for the backend*, not a persona for strangers.
2. **Setup is hidden and thin.** The setup flow exists (`SetupFlow` in `web/intently-flows.jsx:2059`) but is buried behind a "Set up Intently as me" button on the Profile sheet. It only intakes 3 goal titles → enriches each with a `monthly_slice` + glyph + creates one empty "Admin" project. No project intake, no journal seed, no calendar/email, no preferences. Six of the seven inputs the daily-brief assembler reads are empty after setup, so the first daily brief lands flat.
3. **No account = device-local persistence.** Anonymous Supabase auth + localStorage means data survives tab close (a misconception Muxin held was that closing the tab loses data — it doesn't, the anon uid is persisted), but switching browsers, switching devices, or clearing site data orphans everything with no recovery path. There is no "save your account" affordance.

The fix is a single coherent thread: **anon-first, with optional account upgrade, with a real setup that produces enough state for the brief to be useful on day 1.**

## What — the target experience

**First visit (anonymous).**
1. Visitor lands on the app. **Sam's seed does NOT auto-load.** (Either gated behind dev-mode/`?dev=1` only, or replaced with a true empty state.)
2. Empty state immediately routes to setup (forced first-run gate, not an opt-in button). The screen explains in one line: "Tell us about your work — we'll learn from there."
3. Real setup conversation captures, at minimum:
   - 2–5 long-term **goal areas** (current behavior — keep)
   - 1–N **active projects**, each with a 1-line "what is this" + optional first todo
   - **This week's outcome-direction** (what success looks like by Sunday)
   - **Optional journal seed** ("anything on your mind right now")
   - **Preferences** (daily-brief time, daily-review time, weekly-review day, timezone) — defaults pre-filled, user only edits if they care
4. Setup agent (re-scoped from the V1-cut 6-phase original) produces the enriched payload and inserts into Supabase — goals, projects, plan_items for today, journal entries, life_ops_config row.
5. User lands on the Present screen with their day actually populated. Daily-brief CTA is now *useful* — assembler has goals + projects + journal + plan + preferences as context.

**Day-over-day (anonymous).**
- Same anon uid, same data, every visit (already working post-cognition).
- They use the app, capture journals, accept briefs/reviews, etc. Everything persists in Supabase.

**Account upgrade (when they want durability).**
- A persistent "save your account" CTA appears in Profile (and maybe surfaces in-app after N entries or N days). Wording emphasizes data-preservation, not signup friction: *"Sign up to keep your data across devices and recover if you clear your browser."*
- Click → email/password (or Google) flow → Supabase `auth.linkIdentity()` attaches credentials to the existing anon user. Same uid, same data, no migration. They now have a real recoverable account.
- Subsequent visits: real sign-in works; data and uid preserved.

**Sam seed — NOTE (amended 2026-04-25 by inbox 2230):**
The dev-mode-only framing below is **superseded** by the `sam-demo-on-landing-page` handoff. Sam is no longer dev-only; he's the *public landing-page demo persona* embedded inline on `/`. The seed-gate AC bullets in this handoff still apply for the *real-app route* (Sam doesn't auto-load there), but the affordance lives on the landing-page demo, not behind `?dev=1`. See `.claude/handoffs/sam-demo-on-landing-page.md` for the embed architecture (option A: component embed) and Sam-data-completeness AC.

## Acceptance criteria

These are the verifiable bullets that say this work is done. Drafted here per § AC location matrix (cross-cutting / multi-session → handoff). `/groom` confirms the location.

**Sam-seed gate on the real-app route (small, do first):**
- [ ] `seedSamIfEmpty` does NOT fire on the real-app route. Verified: open the real-app route in fresh incognito → goals table is empty for the new anon uid until setup runs.
- [ ] `seedSamIfEmpty` continues to drive the embedded landing-page demo (per `sam-demo-on-landing-page` handoff, option A) using a stable Sam user_id that demo visitors read from.
- [ ] Hardcoded "Sam Tanaka" / "Good morning, Sam." strings are parameterized to the user's `display_name` from a shared context. Listed locations: `intently-profile.jsx:119,289`, `intently-flows.jsx:431,1394`, `intently-screens.jsx:197`, `intently-reading.jsx:102`, `intently-extras.jsx:223` (the hardcoded "M" on the home-screen avatar), `intently-reading.jsx:101` (the hardcoded "S" inside JournalReader byline).

**Shared identity component (folded in 2026-04-25 by inbox 2200-amend):**
- [ ] Single reusable `<Avatar user={user} size={...} />` component (likely in `web/intently-cards.jsx` or new `web/intently-identity.jsx`). Reads `display_name` (or `email` fallback) from a single auth/user-context source. Computes initial letter from the name. Color/gradient from tokens.
- [ ] All three current avatar locations replaced with `<Avatar>`:
  - Home-screen profile button: `web/intently-extras.jsx:205-225` — currently hardcoded `>M</button>`.
  - Profile sheet hero avatar: `web/intently-profile.jsx:104-113` — currently inline `<div>...>S</div>`.
  - JournalReader byline avatar: `web/intently-reading.jsx:97-101` — currently inline `<span>...>S</span>` followed by hardcoded `Sam · ${entry.dateLabel}`.
- [ ] Verified: changing `display_name` in DB updates all three surfaces consistently.

**Reading-mode wiring gaps (folded in 2026-04-25 by inbox 2200-amend):**
- [ ] `web/intently-reading.jsx:75` — `JournalReader`'s `onEdit={() => {}}` stub is wired to actually open the journal entry for editing (likely re-uses `JournalComposer` flow with the entry's body pre-filled, on save it `update`s the row instead of `insert`ing a new one).
- [ ] `ChatReader` "Continue this conversation" button at `intently-reading.jsx:326-331` — currently no `onClick` handler — gets a wiring decision (wire OR explicitly defer in a TRACKER row).
- [ ] `index.html:803-861` — `dbEntry` resolver gains a `kind='brief'` branch (and a `BriefReader` variant in `intently-reading.jsx`). Or, if briefs aren't meant to be tappable in the journal list, gate the "READ >" affordance to only render for tappable kinds.

**First-run gate:**
- [ ] On a fresh anon user (no goals in Supabase), the first navigation lands on the setup flow, not on Past/Present/Future. No way to swipe past until setup completes.
- [ ] Setup is dismissable but the dismissal returns to a meaningful empty state (e.g., a "tell me about your goals" hero affordance), not a Sam-shaped blank.

**Setup expansion (the big one):**
- [ ] Setup MA agent prompt (`agents/setup/ma-agent-config.json`) is re-scoped from "3 goals → monthly_slice + glyph" to the multi-phase intake described above. Re-provisioned via `scripts/provision-ma-agents.ts --skill setup --update-existing`.
- [ ] UI captures: goals, active projects (title + 1-liner + optional first todo), this-week's-outcome, optional journal seed, preferences (4 time/day fields with sensible defaults).
- [ ] On accept, the agent's enriched payload is inserted into the right tables: `goals`, `projects` (with `todos` JSONB), `plan_items` for today, `entries` (kind=`journal`) for the journal seed, `life_ops_config.config` JSONB for preferences.
- [ ] First daily-brief after setup is non-trivial: includes references to >=1 of {projects, plan, journal} the user just provided. Verified via inspection of agent output and assembler input traces.

**Account upgrade:**
- [ ] "Save your account" CTA exists in Profile and appears prominently after the user has >= N entries (decide N during execution; suggested 5).
- [ ] Email/password upgrade path uses `auth.linkIdentity()` — verified the same `auth.uid()` survives before and after upgrade. Goals query before/after returns the same rows.
- [ ] Google OAuth-linked sign-in option (the OAuth here is for *auth*, separate from the calendar/email OAuth in the sister handoff).
- [ ] Sign-in screen exists for returning users on a new device. They sign in with their credentials → see their data.
- [ ] Documentation/help text in Profile explains the data-recovery semantics (anon = device-local; signed-in = recoverable).

## Open questions for grooming

1. **Force-setup or default-empty-with-CTA?** Hard gate (can't dismiss) is more directive but feels heavy. Soft gate (an empty Past/Present/Future with a prominent "set up your day" hero) is gentler but lets users swipe past the only useful affordance. *Lean: soft gate with prominent CTA, since it matches the calm aesthetic.*
2. **How many phases does the new setup take?** The original spec had 6 (`agents/setup/SKILL.md`). V1 cut to 1 (goals only). Suggested re-target: 4 (goals, projects, this-week, preferences — defer health, defer vault-discover). *Lean: 4 phases, journal seed as optional standalone instead of a phase.*
3. **Account upgrade prompt timing.** Showing it too early = signup friction; showing it too late = users lose data and bounce. *Suggest: surface after N=5 user-generated rows OR after 24 hours of return-visit, whichever comes first.*
4. **Display name.** The setup should ask for one. "Good morning, Sam." → "Good morning, {display_name}."

## Dependencies / sequencing

- Independent of the **OAuth calendar+email** handoff — that handoff fills the calendar/email gap; this handoff fills the goals/projects/journal/plan/preferences gap. Can ship in either order. Together they make a real day-1 brief possible.
- Independent of **scheduled-agent-dispatch** — that handoff makes agents fire on schedule; this handoff makes there be enough state for any agent run (manual or scheduled) to be useful.
- Light dependency on **cognition-verification-harness** — the harness can pre-flight verify setup → daily-brief → daily-review → next-day-daily-brief without manual clicking. Worth landing harness first if execution capacity allows.

## Files this work touches (rough)

- `web/lib/seed-sam.js` — gate seed behind dev-mode
- `web/intently-manual-add.jsx:286-296` — drop the unconditional seed call
- `web/intently-flows.jsx:2043+` — expand SetupFlow UI
- `web/intently-flows.jsx` (Sam-string locations listed above) — parameterize display_name
- `agents/setup/SKILL.md` + `agents/setup/ma-agent-config.json` — re-scoped prompt
- `scripts/provision-ma-agents.ts` — re-provision setup agent
- `web/lib/supabase.js` — add account-upgrade helpers (`linkIdentity`, sign-in, sign-out)
- New: profile-sheet "Save your account" UI
- New: returning-user sign-in screen
- `docs/product/acceptance-criteria/setup.md` — extend AC for new setup scope
- `docs/decisions/000X-anon-first-with-account-upgrade.md` — new ADR documenting the auth model

## Estimate

Multi-day, multi-session. Three logical phases that can ship as separate PRs:
1. Sam-seed gate + display-name parameterization (~half-day)
2. Setup expansion (UI + agent re-prompt + DB writes) (~1–2 days)
3. Account upgrade flow (~1 day)

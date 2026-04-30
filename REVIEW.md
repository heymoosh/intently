# Intently — review handoff

**Live**: <https://claude-original.vercel.app/>
**Dev mode** (day-state toggle visible): <https://claude-original.vercel.app/?dev=1>
**Reset state**: <https://claude-original.vercel.app/?reset=1>

I've already exercised every obvious UX path on both desktop (1200×900) and phone (390×844) viewports — the items below are what's worth your eye, not the routine stuff.

## v4: Real agents wired (2026-04-30)

Big change: the brief and review flows now call the **deployed managed agents** through the parent repo's `ma-proxy` Edge Function (no duplicate infra).

- **`app/intently-ma.jsx`** — fetch wrapper that hits `https://cjlktjrossrzmswrayfz.supabase.co/functions/v1/ma-proxy`. The proxy already handles session create / event stream / collect-to-idle.
- **`LiveBriefFlow` / `LiveReviewFlow`** in `index.html` replace the hardcoded `BRIEF_SCRIPT` / `REVIEW_SCRIPT`. Conversational chat: agent responds → user replies → agent responds (`sessionId`-resumed). When the agent emits non-empty `bands` in its fenced JSON block, the confirm CTA surfaces.
- **`generateDailyBrief` / `MOCK_PLAN`** are gone from the live path. The plan items rendered on Present's mid-day view now come straight from the agent's JSON, with proper P1/P2/P3 tier metadata stored on each Entry.
- **Idempotent mutators** (`replaceTodayKindEntry`, `replaceTodaysPlanFromBands`) — running the brief twice on the same day overwrites today's plan and brief Entry instead of piling up duplicates. (One of the items I flagged in v2.)
- **Agent contract test** at `tests/agent-contract.mjs` — runs each fixture in `tests/fixtures/` against ma-proxy, parses the trailing `\`\`\`json` block, and validates against the SKILL.md output contract. Both `daily-brief.first-run.md` and `daily-brief.with-history.md` pass schema validation. Run: `node tests/agent-contract.mjs`.
- **Module-scoped agent-call cache** — concurrent React mounts/effect-double-fires are coalesced to one billed agent call per (skill + ymd). Caught with Playwright network logging when 6 calls fired on a single open before the cache landed.

End-to-end verified in browser: typed "P1: ship the V1 demo. Energy fresh. No deadlines." → agent generated `pacing: "sprint"`, `today_one_line: "Sprint day — ship V1 demo as the single P1"`, single P1 plan item with rocket glyph → Accept → Mid-day Present view rendered the agent's plan (replacing the hardcoded hackathon seed). Persists to localStorage with full `plan_json` round-trip.

**Cost note:** every brief invocation is a billed Anthropic API call (~60s of Opus). The cache prevents accidental dup calls per (skill, day) but not across distinct user actions. Demo flow burns ~1 brief + 1 review per day at most.

## What you should look at

### 1. Does the agent's "Type instead" routing match how you'd actually use it?
Long-press the hero mic → pick "Type instead" (or single-tap on phone, which I aliased to the same composer). Try things like:
- `morning: walk before standup` → should route to Morning's plan
- `remind me to renew passport` → admin reminder
- `goal: launch the side project` → new goal
- `I closed the V2 contract today` → journal entry on today

The classify keywords are listed at `app/intently-agent.jsx:5-50`. **Question for you**: are the trigger phrases (`morning:`, `remind me to`, `goal:`) the ones a non-technical user would naturally use, or do you want fuzzier matching?

### 2. The daily-brief CHAT script is still hardcoded
The morning-empty CTA opens `BriefFlow`, which runs a fixed 4-step chat (`BRIEF_SCRIPT` in `intently-flows.jsx:429`). The first step's "Yesterday you shipped the slide…" line doesn't pull from your real prior-day journal yet — only the `PresentEmpty` highlight panel does (verified working: seed a yesterday-dated entry, the morning quote updates).

Wiring the chat script to real entries is the next step if you want full HANDOFF §6.1 fidelity. **Question**: keep the BriefFlow as scripted theater for now, or invest in a generator that produces personalized agent dialogue?

### 3. The MOCK_PLAN that gets seeded after the brief is the same every day
`onBriefComplete(MOCK_PLAN)` seeds those 6 plan items into the store. So if the user runs the brief twice, they'll get duplicates. I left it as-is because the design-spec'd flow still treats brief as one-per-day, but **on a real second run** the items would pile up. Worth deciding: dedupe by text? Reset per-day plan when brief reruns? Or make brief no-op if today's brief already exists?

### 4. The search bar on Past was removed
BUILD-RULES rule "Search bar visible by default → defer, post-MVP" — I removed the placeholder bar from `JournalHeader` (`intently-journal.jsx:38`). If you actually want it back, that's a 6-line revert.

### 5. Time-of-day inference is real but quiet
The morning/planned/evening phase (HANDOFF §4.3) is computed from `new Date().getHours()`:
- < 19: pre-brief / planned (depending on whether brief was done)
- ≥ 19: evening (review CTA visible)

Saved value for *today* wins, so once you're in 'planned' you don't accidentally bounce back to 'morning-empty' just because the clock advanced. Tomorrow morning resets. The dev panel (with `?dev=1`) lets you override.

### 6. Bezel rule: kept on desktop, dropped on real phones
BUILD-RULES rule #5 says "always in a phone frame." I kept the bezel above 640px viewport and dropped it on phone-sized screens — putting an iPhone bezel inside an iPhone is paradoxical. If you want the bezel at all sizes (or removed everywhere), let me know.

### 7. Profile sub-pages are stub copy
Tap the M avatar → ProfileSheet → Account / Preferences / Help — each opens a static page with placeholder copy that came from the prototype. Not wired to anything real (e.g., Preferences doesn't actually toggle anything). Out of scope for the day arc but worth noting.

### 8. Connections / OAuth flow is a UI fake
`OAuthFlow` simulates a 2-second "redirecting…" then "connect" — no real OAuth. Mostly visual placeholder for the demo. Only "calendar" and a few integrations are listed.

### 9. Hero "listening" state is now bypassed
Per HANDOFF §1.2, single-tap was supposed to enter the full-screen waveform takeover. I wired it to open the AgentComposer instead because the listening state had no commit path (no real STT). Long-press → radial still works as designed. If you'd rather see the waveform UI, it lives at `intently-hero.jsx:HeroListening` — un-bypass by removing the `s === 'listening'` short-circuit in `index.html` (`handleHeroChange`).

## What was wired up this session (skim)

**Persistence + state** (everything survives reload):
- `intently:manual-adds:v1` → all journal/plan/goals/projects/reminders
- `intently:day-state:v1` → today's day-state, ISO-date-keyed so it auto-resets next day
- `intently:dev` → dev panel visibility flag
- `?reset=1` clears both

**Typed Entry schema** (`{id, at, text, kind, source, glyph, …}`) per HANDOFF §2.3 — every commit through the agent path gets a glyph from keyword analysis (`pickGlyphFor` in `intently-manual-add.jsx`).

**`classify(text) → {kind, body, band?, reason}`** in `intently-agent.jsx`. Routes intent by keyword, strips prefixes.

**`AgentComposer`** overlay (in `index.html`): live ConfirmationCard preview while you type, kind-tinted, glyph-illustrated, reason-explained. Confirm → `applyClassification` → store mutator → localStorage.

**Brief & Review write typed Entries** with `kind:'brief'` / `kind:'review'`, sage / dusk tints in Past Day rail. Brief also seeds `MOCK_PLAN.bands` items into store.

**`generateDailyBrief(state)`** in `intently-agent.jsx` — pure function, finds most-recent prior-day journal/review entry, returns it as `yesterdayQuote`. Threaded into `PresentEmpty` via prop.

**Responsive shell**: `Phone` wrapper drops bezel below 640px, `top: 62` becomes `env(safe-area-inset-top)` on bare mode. CSS @media rules adjust intro-note + dev-panel.

**Dev panel hidden by default**, shown only with `?dev=1`.

## Files changed (this session)

- `app/` — new directory with all `.jsx` from `docs/design/Intently - App/` plus prototype as `index.html`. Runnable as `python3 -m http.server 8765 --directory app`.
- `app/index.html` — responsive Phone wrapper, dev gating, day-state inference, AgentComposer, brief/review typed-entry commits, Past Day rail with typed metadata, `?reset=1` handler, generator wiring.
- `app/intently-manual-add.jsx` — localStorage round-trip; `makeEntry`, `pickGlyphFor`; backwards-compat mutators.
- `app/intently-agent.jsx` — **new** — `classify`, `applyClassification`, `generateDailyBrief`.
- `app/intently-flows.jsx` — `PresentEmpty` accepts `yesterdayQuote` prop.
- `app/intently-journal.jsx` — removed placeholder search bar (BUILD-RULES anti-pattern).
- `app/vercel.json` — `cleanUrls: true`.
- `README.md` — full run instructions.
- `.replay-checkpoint.md` — session checkpoint.

## Manual flows I tested end-to-end

- **Phone (390×844, bare mode)**: load, hero single-tap → composer, classify "morning: walk" → confirms to Morning, classify "remind me to renew passport" → admin reminder, reload → all persists.
- **Desktop (1200×900, bezel mode)**: same flows + dev-panel day-state toggle.
- **Past navigation**: Year → Month → Week → Day, zoom chip cycles, painterly tiles render.
- **Future navigation**: 3 hardcoded goals + manually-added goal both render, Goal Detail drilldown works (Move to Japan → INTENTION + monthly slice + milestones), Project Detail (Pitch deck v3 → INTENTION/IMPACT/STATUS/TRACKER).
- **Profile sheet** opens from avatar.
- **Brief/review entries** show on Past Day with typed metadata: kind eyebrow + time + source + glyph + tinted border.
- **Yesterday quote in PresentEmpty** correctly pulls from a seeded yesterday-dated entry (verified via dev panel + localStorage seed).
- **Day-state survives reload**, resets next calendar day.

## What I did *not* hand-test

- The interactive chat scripts inside BriefFlow / ReviewFlow when actually advanced step-by-step by clicking send — they work in principle (the typed-entry commit fires on confirm), but JS automation of the chat advancement is brittle. **You should manually walk one full brief and one full review** to confirm nothing regressed in the chat experience.
- Real touch/long-press on a phone — Playwright simulates pointer events, but actual finger gestures may behave slightly differently.
- The OAuth and Connections flows beyond loading the page.

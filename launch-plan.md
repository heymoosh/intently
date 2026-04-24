# Launch Plan — Built with Opus 4.7 Hackathon

**Submission deadline:** 2026-04-26, 8:00 PM EDT.
**Days remaining as of creation:** 3 (Thu → Sun).

**What this doc is:** the **durable sanity check** for "what does shipped mean." Slow-changing. Reviewed when scope feels off. TRACKER.md is the hot queue (what to do next); this is the slow doc (what done looks like).

**Source material:**
- `docs/hackathon/` — the rules and restrictions (submission deliverables, asset policy, judging criteria)
- `docs/product/vision.md` — why we're building
- `docs/design/app-experience.md` — UX direction
- `docs/architecture/managed-agents-event-topology.md` + `managed-agents-tool-use-scheduling.md` — MA integration facts from 2026-04-23 Michael Cohen session

---

## The 3 mandatory deliverables (hackathon rule)

All due 2026-04-26, 8:00 PM EDT:

1. **3-minute demo video.** Hard cap. YouTube/Loom/similar.
2. **Public GitHub repo link.** With `README.md`, `LICENSE`, `THIRD_PARTY_LICENSES.md`.
3. **Written summary.** 100–200 words.

Submit via: https://cerebralvalley.ai/e/built-with-4-7-hackathon/hackathon/submit

Nothing beyond these three is required. Everything else is optional polish.

---

## Judging weights (for prioritization)

- **Impact 30%** — real-world potential, problem-statement fit
- **Demo 25%** — does it hold up, cool to watch
- **Opus 4.7 creative use 25%** — beyond basic integration, surprising use
- **Depth & execution 20%** — past first idea, sound engineering

Problem statement we're fitting: **"Build From What You Know."** Muxin's personal Life Ops system → mobile app for non-technical users.

Separate **Managed Agents $5K prize** — worth targeting via natural fit (scheduled daily/weekly agents). Judging angle: *"hand off meaningful, long-running tasks — not just a demo."*

---

## MVP Demo Bar (minimum for the video)

The 3-minute demo must convincingly show these four things. Anything beyond is stretch, not required.

### 1. One demo flow working end-to-end

At least ONE of daily-brief / daily-review / weekly-review running a real Managed Agent against seed data and rendering output in the mobile UI. One done well beats three half-working.

**Priority order:**
- **Daily-brief** first (most compelling "wake up and see your morning" moment)
- **Daily-review** second (back-to-back with brief shows the time arc)
- **Weekly-review** stretch

### 2. Real Managed Agents usage

Not simulated. An actual `POST /v1/sessions` → `session.status_idle` event loop. Must be visible in demo as "the agent is thinking" → "here's what it produced." (Per MA event topology doc.)

### 3. One "synthesis" moment that reads as memory

Something that feels like the model noticed context — e.g., "based on yesterday's journal mention of fatigue, the brief opens with a check-in question." Opus 4.7 doing something surprising. Not just API calls — a **beat that lands on camera**.

### 4. Mobile UI showing agent work

The three-screen swipe shell (Past / Present / Future) rendering at least ONE agent-produced card. Visible on screen during video. Polish optional; presence mandatory.

### Explicit non-requirements for MVP

These are stretch, not bar. Skip if time-pressed:
- All three demo flows end-to-end
- Voice input (text input fine)
- Perfect visual polish
- Multi-user (V1 is single-user per ADR 0002)
- Calendar / Gmail OAuth (seed data is enough for demo)
- Full Hindsight self-host on Fly

---

## Milestones (3-day critical path)

Hot work tracked in TRACKER.md. This section is the rollup. When milestones drift, re-read this doc first.

### Thursday 2026-04-23 — Managed Agents path cleared ✅

- [x] Michael Cohen MA session attended
- [x] MA architecture docs written (`docs/architecture/managed-agents-*.md`)
- [x] Agent-runner base, seed data, design tokens, judge scorer, app README, npm audit CI all merged
- [x] Parallel-tracks workflow operational (tracks now auto-merge on green CI)
- [x] Branch-first enforcement + launch plan + doc-map check landed

### Friday 2026-04-24 — Agent → UI wiring (daily-brief live) ✅

- [x] Web pivot: Expo Web target shipped; PagerView swap; Vercel deploy at https://intently-eta.vercel.app
- [x] ma-proxy deployed with correct MA API schema (3 empirical fixes)
- [x] daily-brief MA agent created in console; live Opus 4.7 synthesis confirmed on-camera
- [x] Infinite swipe rotation (21-slot repeat pattern)
- [x] All 5 MA agent configs shipped as JSON (PR #69)
- [x] First eval dataset for daily-brief authored (`evals/datasets/daily-brief/`)

### BUILD DAY — wire all remaining skills end-to-end

Scope change: no "polish Saturday." Today is pure build. Functionality first, polish only if layered on without blocking record.

- [ ] **Design-folder classification** (~20 min) — `docs/design/Intently - App/` structural vs cosmetic; bake structural in, defer cosmetic
- [ ] **daily-review** wired — MA agent created, secret set, fetch pattern matches daily-brief
- [ ] **weekly-review** wired — second synthesis beat, Sunday-reflection pattern
- [ ] **update-tracker** wired — demonstrates state-mutation loop
- [ ] **setup** wired (or verified seed-data-only path is demo-sufficient)
- [ ] Video narrative bullets captured (user is drafting script in parallel in a separate section)
- [ ] Smoke-test every wired flow end-to-end once against seed data

### RECORD DAY — demo takes + submission prep

- [ ] Test full demo flow on browser with seed data, any-device
- [ ] 2–3 practice cuts of the 3-min demo
- [ ] `THIRD_PARTY_LICENSES.md` generated + committed (`npx license-checker --production --csv > third-party.csv`)
- [ ] README rewrite with demo narrative + MA story
- [ ] Draft the 100–200 word submission summary

### Sunday 2026-04-26 — Submit

- [ ] Final demo video recording (3-min hard cap) if not finalized on record day
- [ ] Written summary finalized (100–200 words)
- [ ] Public repo verified: README, LICENSE, THIRD_PARTY_LICENSES present
- [ ] Submit via Cerebral Valley platform
- [ ] **Submit by 8:00 PM EDT (7:00 PM CDT)**

Post-hackathon: repo can be made private after judging completes (Apr 28), per hackathon rules.

---

## How TRACKER.md rolls up here

TRACKER stays the hot queue (what to do today, what's blocked, what just merged). This file is the slow sanity check (is TRACKER aimed at the right horizon). If TRACKER's "Next" order stops matching the milestone labels above, fix launch-plan first, then re-order TRACKER.

---

## Locked cuts — don't re-litigate

All of these have been decided. Don't redebate in-scope during the next 3 days.

- 6 deferred skills (daily-triage, monthly-review, project-continue, session-digest, vault-drift-check, notes-action-sync) — per ADR and `docs/backlog/deferred-features.md`
- Hindsight self-hosted on Fly — no bandwidth; skip entirely
- Multi-user isolation — single-user dogfood per ADR 0002
- Full preferences conversation in setup — defaults-only per SKILL.md V1 cut (5 items annotated)
- Kanban / Gantt / gamification / somatic exercises / game reskinning — all backlog
- MA **Outcomes** rubric (research preview, not public) — use `docs/process/definition-of-done.md` as prompt-based substitute
- MA **multi-agent coordination** (research preview) — build skills, not sub-agents, per MA session guidance

---

## Opus 4.7 creative-use angles (for demo + 25% of judging)

From hackathon notes (`docs/hackathon/Hackathon Kickoff and Rules.md`):

- **Synthesis moments** — morning briefing that ties yesterday's journal + today's calendar + project state into a coherent narrative. Not summary; insight.
- **Model-tiered architecture** — Opus for reasoning-heavy synthesis (brief, review, pattern recognition); Sonnet for extraction / tagging / routing; Haiku for tiny classifiers. Demonstrates thoughtful use of the model lineup.
- **Memory moment** — agent connects two things across time: "based on how the Zane call went last week, open with X today." That's the demo beat that lands.

---

## Asset policy (hackathon rule)

All demo assets must be OSS or owned-by-us:

- **Icons:** Lucide (ISC) — already bundled via `lucide-react-native`
- **Fonts:** Fraunces, Source Serif 4, Inter, JetBrains Mono — all Google Fonts (OFL), already wired via `@expo-google-fonts/*` in PR #26
- **Images/illustrations:** any in `docs/design/references/` are fine (stored with per-folder notes); user-generated + Claude/Midjourney generated are acceptable for demo
- **Sound/voice:** if voice input shown, use owned/generated audio — no licensed music

No Figma/Notion exports carrying proprietary design assets.

---

## Visibility plays (Anthropic office hours, not required)

Claude Code team judges. Presence = recall. Not critical path but worth showing up for:

- Attend remaining AMAs (Fri, Sun sessions listed in hackathon schedule)
- Drop into office hours 5–6 PM EDT daily
- Post thoughtful questions in `#office-hours` channel

Do these while things are building on parallel tracks — no context-switch cost.

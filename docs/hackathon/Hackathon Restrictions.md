# Hackathon Restrictions — Opus 4.7 Life Ops Build

**Type:** Reference — the rules we're operating under and the decisions that flow from them.
**Created:** 2026-04-21
**Hackathon:** Built with Opus 4.7 — Apr 21–28, 2026

---

## Core Rules at a Glance

- **Open source everything.** Backend, frontend, models, prompts, infrastructure scripts, assets — all under an OSI-approved license in one public GitHub repo.
- **New work only.** All code written during the hackathon window. Fresh repo, first commit Apr 21 or later.
- **Team size:** up to 2. Solo is allowed.
- **Submission deadline:** Sunday Apr 26, 8:00 PM EDT (7:00 PM CDT).
- **Disqualification risks:** using code/data/assets we don't have rights to; violating platform policies; reusing pre-existing project work.

---

## What "New Work" Means for This Project

**Allowed as inspiration:** the Agent Memory Stack strategy doc, the Life Ops conceptual model, existing skill ecosystem in Obsidian/Cowork (skills are prompts — not code in the hackathon sense), the mental model for daily briefing/review loops, any design sketches or architecture diagrams.

**Not allowed:** copy-pasting from any existing production codebase (N/A — none exists for life ops), cloning and modifying a prior repo, pretending a late commit is original work.

**Repo hygiene that signals legitimacy:**
- First commit Apr 21 or later
- Frequent small commits across the 5-day window
- Public from day one (don't ship a huge "initial commit" bomb on Apr 25)
- Clear commit messages that show incremental thinking
- If judges clone the repo, the git log should read like hackathon work

---

## License Choice for Our Repo

**Decision: MIT.** *(Updated 2026-04-21 after kickoff Q&A and dropping Honcho.)*

Two facts that made MIT the cleaner call:

1. **We dropped Honcho** (see decision below). Our only "heavy" dep is Hindsight (MIT). No AGPL contamination forces us into copyleft.
2. **Repo can be closed after judging.** Confirmed in kickoff Discord Q&A (Wania, Cerebral Valley): teams can make their repo private after the hackathon for commercial use. MIT means anyone who cloned it during the public window can still use/distribute it, but we retain full freedom to build a commercial product on top without license entanglement.

MIT is the most common hackathon license, satisfies the "approved open source license" rule, and keeps the commercial path maximally open. Apache-2.0 is an equally valid alternative if we want explicit patent protection — worth considering if the architecture includes anything patent-adjacent.

**If we reverse the Honcho decision later:** our repo license has to become AGPL-3.0 (or GPL-compatible) to comply. Reopening that requires re-deciding here.

---

## Dependency Decisions

### Hindsight (vectorize-io/hindsight) — IN

- **License:** MIT
- **Role:** Structured memory for projects, tasks, decisions, events. Graph over entities. Queryable by stable ID.
- **Why it fits:** Core to the architecture. MIT license means zero restrictions on how we use it commercially later. No AGPL contamination risk.
- **Attribution:** Include MIT notice in `THIRD_PARTY_LICENSES.md`.

### Honcho (plastic-labs/honcho) — OUT for v1

- **License:** AGPL-3.0
- **What it gives:** Dialectic learning system, peer profiles, continual learning of preferences across entities (users, clients, agents).
- **Why we're skipping for the hackathon:**
  1. **Scope:** v1 is daily briefing + daily review + journal + projects. Personalization needs are "remember Muxin's patterns, her people, her tone." We don't need sophisticated dialectic learning for that — a simple profile-per-entity pattern handles it.
  2. **Architecture simplicity:** One fewer service to run, one fewer API to integrate, one fewer thing to debug in a 5-day sprint.
  3. **Opus 4.7 showcase:** Building personalization ourselves means Opus 4.7 is doing the extraction/synthesis/inference work at runtime — stronger story for the "creative Opus 4.7 use" judging criterion (25% of score).
  4. **License simplicity:** Skipping Honcho removes AGPL compliance overhead. Our code can be any OSI license.
  5. **Commercial path:** If we want to integrate Honcho later for sophisticated multi-peer learning, we can. The architecture should leave the door open.

### What We Build Instead of Honcho

A lightweight "profile memory" layer that mirrors the existing Obsidian skill pattern:

- **Per-entity profile:** `profile.md` (or a Postgres row with markdown body) for Muxin herself + each tracked person/client/collaborator.
- **Update pattern:** after each interaction, a Claude sub-call extracts new facts and proposes profile updates. User accepts/edits (or auto-applies low-stakes updates).
- **Query pattern:** relevant profiles get pulled into agent context at runtime.

This is effectively what her existing skill ecosystem does with markdown preference files — we're just mirroring it in code.

---

## Architecture Implication — Keep AGPL Code Isolated (Even If We Keep Honcho)

If we reverse the Honcho decision (or add any AGPL dep later), the rule is: **AGPL code lives server-side only.** Never bundled into the iOS binary or web bundle. The mobile/web app talks to our backend over HTTPS; the backend can use AGPL deps freely because servers aren't distributed the way binaries are.

Concrete: our iOS app contains *zero* AGPL-licensed source code. It calls our REST/tRPC API. Our backend (Node/Python/whatever) can import AGPL packages. This isolation protects App Store distribution and keeps the mobile binary under our own license terms.

---

## Asset Policy

Everything in the demo must be OSS or owned-by-us. Specifically:

- **Icons:** Heroicons (MIT), Lucide (ISC), or Phosphor Icons (MIT). No proprietary icon sets.
- **Fonts:** Google Fonts, Inter (OFL), JetBrains Mono (OFL). No Apple San Francisco font outside iOS system context. No paid fonts.
- **Images/illustrations:** Unsplash (free but check per-image license), generated via Claude/Midjourney/etc. (ownership gray but acceptable for hackathon), or hand-made.
- **Sound/voice:** if we use voice input, use free/owned audio. No licensed music in the demo video.
- **No Figma/Notion/Linear exports** that carry proprietary design system assets.

---

## API Credits & Subscription

- $500 API credits provisioned per participant — this is a bonus, not a cap. Can use more if needed.
- Can use the Claude subscription (Max/Pro) in lieu of or alongside API credits — the credits are a floor, not the only allowed path.
- Practical implication: no need to micro-optimize Opus 4.7 calls during development. Build freely; the budget is effectively uncapped for this window.

---

## Opus 4.7 Usage — 25% of Judging

Judges want to see "creative use" that "surfaces capabilities that surprised even us," not just API calls.

**Strong angles for our product:**
- **Opus for synthesis moments:** morning briefing that ties yesterday's debrief + today's calendar + relevant people context into a cohesive narrative. End-of-day reflection that reads like insight, not autocomplete.
- **Model-tiered architecture:** Opus for reasoning-heavy work (briefing synthesis, journal reflection, pattern recognition across time); Haiku for quick extraction/tagging/routing. Demonstrates thoughtful use of the Claude model lineup.
- **Demo moment:** a beat where Opus connects two things across time in a way that feels like real memory — "based on how the call with Zane went last week, you might want to open with X today." That's the kind of moment that lands.

**Note Muxin's working preference:**
- Sonnet = less verbose, preferred for "write an update"
- Opus = better at pulling context across projects, wrangling priorities
- 4.7 vs 4.6: not enough runs to say whether 4.7 is significantly better yet. Default to Opus 4.7 for this build since it's the hackathon focus.

---

## Managed Agents — $5K Prize Worth Targeting

Anthropic is highlighting Managed Agents with a dedicated AMA (Thurs Apr 23 with Michael Cohen) and a dedicated prize. The rubric: "hand off meaningful, long-running tasks — not just a demo."

**Natural fits in our product:**
- End-of-day debrief agent (scheduled, runs in background)
- Morning briefing synthesis (scheduled, pulls calendar + yesterday + context)
- Weekly reflection synthesis (scheduled, reads a week of journal + projects)
- Overnight background work (e.g., "sync my scattered notes into the right trackers")

**Action:** attend the Thursday AMA. Thread Managed Agents into architecture where they fit naturally. Even if we don't win the specific prize, aligning with Anthropic's platform story is good for visibility with the Claude Code team.

---

## Third-Party License Disclosure

Add `THIRD_PARTY_LICENSES.md` at repo root. Include every dependency with its license. Generate via:

- **JS/TS:** `npx license-checker --summary` then `npx license-checker --production --csv > third-party.csv`
- **Python:** `pip install pip-licenses && pip-licenses --format=markdown > third-party.md`

Review the output for any incompatible licenses (anything proprietary, unclear, or custom). Standard OSS licenses (MIT, Apache-2.0, BSD-2/3, ISC, MPL, LGPL, AGPL, GPL) are all fine for a hackathon.

---

## Submission Deliverables

All due by **Sunday Apr 26, 8:00 PM EDT (7:00 PM CDT)**:

1. **3-minute demo video** (YouTube/Loom/similar). Hard cap. Script it. Don't improvise.
2. **GitHub repo link** — public, with clear README, LICENSE, THIRD_PARTY_LICENSES.
3. **Written summary** — 100–200 words.

Submit via: https://cerebralvalley.ai/e/built-with-4-7-hackathon/hackathon/submit

**Post-hackathon:** repo can be made private after judging completes (Apr 28). Commercial productization is allowed. Standard path: public through the hackathon window, private after Apr 28 if pursuing SaaS/commercial route.

---

## Judging Criteria (for prioritization)

1. **Impact (30%)** — real-world potential, does it matter, fits problem statements.
2. **Demo (25%)** — does it hold up, is it cool to watch.
3. **Opus 4.7 Use (25%)** — beyond basic integration, surprising creative use.
4. **Depth & Execution (20%)** — past first idea, sound engineering, real craft.

**Problem statement we're fitting:** "Build From What You Know" — PM + ADHD + years of wrangling messy cross-functional work = domain expertise nobody else has.

---

## Visibility Strategy (Not About Winning)

Claude Code team members are judging. Being visible on Discord + asking thoughtful questions in office hours + showing up to AMAs is almost as valuable as the build itself. Muxin's goal is visibility + bragging rights, not the cash prize.

- Attend all 4 AMAs (Wed, Thurs, Fri, Sun)
- Drop into office hours 5-6 PM EDT daily (calendar set)
- Post thoughtful questions in #office-hours channel
- Be memorable in text — when the Claude Code team scrolls Discord, what impression have we left?

---

## Open Questions / Decisions Still Pending

- **Stack choice:** iOS (Swift/SwiftUI? React Native? Expo?) + web (Next.js? something else?) + backend (Python FastAPI? Node?)
- **Voice input mechanism:** Whisper API? on-device? (mobile), Web Speech API (web).
- **Database:** Postgres for Hindsight + our profile memory? Something lighter?
- **Hosting:** Vercel + Supabase? Railway? Fly?
- **Managed Agents integration:** which background tasks become scheduled agents?

These get decided in scoping session + first build hours.

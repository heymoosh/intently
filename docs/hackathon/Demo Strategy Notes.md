# Demo Strategy Notes — Intently for Opus 4.7 Hackathon

Captured 2026-04-25 from chat planning session. Distinct from:
- `Demo Script.md` — the VO draft
- `Mike-Brown-Playbook.md` — general AMA learnings from the prior winner
- `Mike-Brown-Demo-Transcript.md` — partial transcript of his demo video

This doc is the **Intently-specific synthesis**: what we learned, what we want to feature, what we must not claim.

---

## What Mike Brown's video actually did

Confirmed from transcript + landing page (cc-crossbeam.vercel.app, github.com/mikeOnBreeze/cc-crossbeam):

- **Real product, staged pacing.** Landing page is real (3D house models match the video). But the actual permit-processing flow takes ~20 minutes per his AMA — he's clearly speeding up loading beats and showing fast-forwarded UI.
- **Animated architecture wireframes.** The "Claude spins off sub-agents" infographic is almost certainly Remotion / animated, not a screen capture. Architecture as a visual beat.
- **Real-person interview.** Connor Trout (mayor of Buena Park) on camera with the "3,000 homes by 2029, last year under 100" stake. The number was decoration; the *person* carried it.
- **3-act story:** problem (CA housing crisis) → solution (Crossbeam pivot to city reviewers) → outcome (cut correction cycles in half, every city would use this).

**Standard hackathon recipe:** real product + staged pacing + animated explainers + named-person stake. We have the same toolkit.

---

## Our gaps vs. Mike

1. **Investor angle missing.** No "why this matters" beat with a named person and a stake. We have the philosophical drift framing; we don't have a Connor Trout.
2. **Technical / under-the-hood angle missing.** Mike showed his sub-agents architecture. We don't show ours. Judges are technical; this is a hackathon, not an ad.
3. **Cohesive narrative not yet locked.** Current VO is ad-style; Mike's was hackathon-submission style. We probably want a hybrid.

---

## What we can TRUTHFULLY showcase (audited 2026-04-25)

- **Six agents at different temporal altitudes** (setup, daily-brief, daily-review, weekly-review, monthly-review, update-tracker). Daily/weekly/monthly cadence is genuinely uncommon and visually clean.
- **Model-per-role choices.** Sonnet 4.6 for setup + tracker (mechanical), Opus 4.7 for the reflection agents (judgment). Reads as cost/capability taste.
- **Skills as the unit of agent identity.** One `SKILL.md` per agent — pure Agents SDK pattern.
- **Persistent capture surface.** The hero button (mic + menu + chat) exists and routes voice transcripts through a Haiku classifier into the reminders table.
- **State-mediated coordination.** Agents share a Supabase world rather than dispatching commands to each other. Frame as deliberate philosophy (legitimate pattern), not as "missing orchestrator."

## What we MUST NOT claim (NOT BUILT as of 2026-04-25)

- **Memory tiering / promotion pipeline.** Schema has two layers (MA runtime + Supabase durable) but zero repetition counting and no auto-promotion. V1.1 post-hackathon.
- **Opus orchestrator.** No agent routes to another. No orchestrator skill in `web/lib/ma-client.js`. Coordination is database-mediated only.
- **Multi-destination hero button routing.** Classifier is binary (reminder / not-reminder). No "figure out which agent owns this" routing. `WIRING-POINTS.md` flags this as undecided and explicitly blocking.
- **Topic clustering / auto-project creation.** Projects exist as a table with goal linkage, but no embeddings, no similarity, no "agent noticed repeated topic → made project" logic.

---

## Narrative direction under consideration

Position the no-orchestrator, state-mediated, altitude-based design as **deliberate philosophy** rather than absence:

> Most productivity apps treat your life like a database. Intently treats it like an organism with rhythms — days, weeks, months. Each rhythm has its own agent at its own altitude, watching for the things only that altitude can see. They share a world, not commands.

Why-this-matters beat without stats — population specificity instead:

> The apps capture; they don't carry. They store; they don't notice. I built Intently because I needed agents that notice. Anyone who's installed a productivity app and given up has felt this — people with ADHD, anyone running a household, anyone whose to-do list outlived the app it was in.

This earns both angles Mike had — investor (real population in pain) + technical (real design choice with reasoning) — without faking either, and stays in the human / philosophical register Muxin wants.

---

## Production housekeeping

- **Stale "missing monthly review" warning** in `Demo Script.md` — REMOVED 2026-04-25. Monthly review agent exists at `agents/monthly-review/`.
- **Voice script** still in ad-mode register; needs revisit if we go hybrid hackathon-submission direction.
- **Visuals plan** in `Demo Video Visuals.md` and `video-assets/video-storyboard.md` — both pre-date this strategy discussion. Need a visuals pass that adds the agent-architecture beat (sub-agent diagram) and the temporal-altitude beat (daily/weekly/monthly altitude visualization).

---

## Open questions / decisions still pending

1. Hybrid hackathon-submission vs. ad register — pick one before locking VO.
2. Named-person beat — Muxin himself (ADHD founder) or stand-in persona?
3. Architecture visualization — Remotion sub-agent diagram, or something else?
4. Whether to mention memory tiering / topic clustering as "where this is going" in a closing beat, or skip vaporware entirely.

These are the demo decisions still open. The bigger product question — whether to build any of the missing pieces (multi-destination capture routing, topic clustering, memory promotion) before submission or accept them as v1.1 — is being discussed separately.

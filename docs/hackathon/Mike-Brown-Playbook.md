# Hackathon Playbook: Mike Brown's 1st Place Strategy (Opus 4.6)

Source: AMA with Mike Brown, winner of Opus 4.6 hackathon with Crossbeam (permit automation for CA housing).

**Audience:** AI agents reviewing Intently's demo video strategy and packaging approach.

---

## Core Winning Formula

Mike's 1st-place project succeeded because it paired:

1. **High-stakes real-world problem** (CA housing bottleneck: 90% first-submission rejection, 4-6 month cycles)
2. **Working technical solution** (vision-first approach with orchestrator + sub-agents)
3. **Clear value proposition** (reduce review time, catch simple errors pre-submission)
4. **Exceptional presentation** (3-minute video structured as a compelling story, not a feature dump)

**Key insight:** Judges see many good ideas. The differentiator is *making their job easy* — clear problem, clear solution, clear value, all in 180 seconds.

---

## Video Strategy (Primary Focus)

### The 3-Act Framework

**Structure:** 3 minutes = 3 acts of ~1 minute each, each act broken into 20-second segments.

**Total output:** ~9 key points across the full video.

#### Act 1: The Problem (≈1 min)
- **Why this matters:** Frame the problem as expensive, urgent, real.
- **What's broken:** Show the pain point with concrete numbers/outcomes.
- **Why now:** Why solving this matters at this moment.
- **Target:** Audience understands the problem is worth solving.

#### Act 2: The Solution (≈1 min)
- **How it works:** Show the product in action (not a feature list).
- **Why it works:** The key insight that makes this different.
- **Evidence it works:** Concrete evidence (demo, adoption, results).
- **Target:** Audience believes this actually solves the problem.

#### Act 3: The Outcome (≈1 min)
- **What changes:** How the world is different with this product.
- **Who benefits:** Both user groups / stakeholders.
- **Validation:** External signals (adoption, demand, impact).
- **Target:** Audience walks away knowing why this matters and why they should remember it.

### Video Production Workflow

#### Phase 1: Script-First (Do This First)
- **Do not skip this.** Mike emphasized: start the *story* work now, in parallel with code.
- Use Claude to interview you and extract the narrative.
- Generate ~10 different script variations (not one script).
- Each script should be a distinct take on the problem/solution/outcome.
- Focus on *which story lands*, not which feature sounds coolest.

#### Phase 2: Voiceover Synthesis
- **Use your own voice.** Not a generic AI voice — genuine emotion carries.
- Collect ~5 minutes of your own voice sample.
- Use 11 Labs (or equivalent) to synthesize multiple scripts in your voice.
- Play all versions while doing other work (you'll intuitively prefer some).
- Take notes on moments that *work*.

#### Phase 3: Script Refinement
- Pull the best 20-second moments from each voiceover.
- Combine them into a single stronger script.
- This is your "paper cut" — the VO track that will drive everything else.
- **Treat VO as locked before moving to visuals.**

#### Phase 4: Visuals Around VO (Not the Reverse)
- Build visual sequences *around* the voiceover, not the other way around.
- Remotion is good for:
  - Screen recordings of the product
  - Auto-generated visual sequences / B-roll
  - Modular clips you can cut and rearrange
- Create many rough visual segments, then select the strongest ones for the final edit.
- **Principle:** Visuals support the story; they don't drive it.

#### Phase 5: Assembly & Brutal Editing
- Use Claude to generate XML imports (Premiere / DaVinci) from:
  - Your VO track
  - Your visual clips
  - Your rough timeline structure
- This auto-assembles a rough cut without manual timeline building.
- **Set hard out-point at 2:59:29** (or frame equivalent for your framerate).
- **Cut ruthlessly:** anything non-essential gets removed, even if you love it.
- Final cut should be every second *essential* — no filler.

### Video Checklist (Timings)

- [ ] **Hours 1-2:** Extract your story (Claude interview).
- [ ] **Hours 3-6:** Generate 10 script variations; have Claude create them.
- [ ] **Hours 7-10:** Record 5 min of your voice; synthesize scripts with 11 Labs.
- [ ] **Hours 11-14:** Review voiceovers while coding continues; pick best moments.
- [ ] **Hours 15-18:** Write "paper cut" script (refined VO).
- [ ] **Hours 19+:** Build visuals in Remotion; create XML import; assemble + edit.
- [ ] **Final:** Lock at 2:59:29; cut every non-essential frame.

---

## Pacing & Timeline (Weekend)

### Friday (Tonight)
- **Code:** Push hard on feature delivery.
- **Video prep:** Spend 1-2 hours on story extraction + initial script.

### Saturday
- **Code:** Finish codebase. Target: feature-complete and stable by evening.
- **Video:** Begin VO synthesis; keep building script variations while code wraps.
- **Parallel:** Don't context-switch constantly — but keep video moving in background.

### Sunday
- **Primary:** Video assembly, editing, final cut.
- **Code:** Bugfixes and polish only; feature work is done.

**Key constraint:** Finish code by Saturday night so Sunday is *only* video / packaging. If code bleeds into Sunday, you won't have time for a real video.

---

## Story Structure Template for Intently

Apply the 3-act framework to *your* problem:

### Act 1: The Problem
- **What is "daily triage" without Intently?**
  - How much time do users spend on it now?
  - How fragmented is their workflow?
  - What does it cost (time, focus, anxiety)?

### Act 2: The Solution
- **How does Intently change the workflow?**
  - Show a user going through daily brief / daily review / weekly review.
  - Show the speed and clarity.
  - Show that agents do the work, the UI just reflects and triggers.

### Act 3: The Outcome
- **What's different now?**
  - User has clarity and automation.
  - User gets their time back.
  - User can focus on decisions, not drudgery.

---

## Submission Constraints (Non-Negotiable)

- **3-minute hard cap:** 4.5 minutes gets dinged. Judges have limited time; follow the rule exactly.
- **Voiceover clarity:** Must be understandable without captions.
- **Problem > solution > outcome:** Never lead with the tech; always lead with the problem.
- **Judges' job:** Make it trivial for them to understand what the project is and why it matters in 60 seconds.

---

## Technical Architecture (For Reference)

Mike's approach (not necessarily applicable to Intently, but showed what worked):

- **Vision-first, not OCR:** Switched from text extraction to visual understanding mid-week. This was the breakthrough.
- **Orchestrator + sub-agents:** Divided work across agents (e.g., one per PDF page type).
- **Two-sided design:** Builder side (pre-check) + City side (auto-corrections). Doubled the user base and use cases.
- **Testing via generation:** Had Claude write its own output to verify correctness.
- **User conversations:** Shaped the product by talking to builders and city officials.

---

## General Hackathon Principles (Mike's Top Advice)

### Code Readiness
- **Finish by Saturday.** Sunday is for video / packaging, not debugging.
- **Push hard, but stay functional.** Sleep 4-6 hours / night. You'll perform better mentally with rest.
- **Eat, drink water, go outside.** Physical health compounds into mental clarity.

### Presentation Readiness
- **Start video work now.** Do not defer it to the last 24 hours.
- **Story > features.** A crystal-clear 3-minute story beats a fancy demo that leaves judges confused.
- **Follow the rules exactly.** 3-minute limit, submission format, etc. Judges respect precision.
- **Make judges' job easy.** There will be many good ideas. The differentiator is clarity and packaging.

### Post-Win Mindset
- **Be skeptical of hype.** Winning brings inbound attention. Step back and evaluate what's real.
- **Don't react impulsively.** Let some time pass before making big decisions.
- **Keep iterating on the core.** Winning validates the idea; implementation is still hard.

---

## Checklist: Agent Review of Video Strategy

When reviewing Intently's demo video concept, use these questions:

- [ ] **Act 1 (Problem):** Does the opening frame the real pain of daily triage / life ops?
- [ ] **Act 1 (Time):** Is the problem quantified (time, frequency, stakes)?
- [ ] **Act 2 (Solution):** Is the product shown in action, not as a feature list?
- [ ] **Act 2 (Why):** Is the key insight (agents handle the work, UI reflects + triggers) clear?
- [ ] **Act 3 (Outcome):** Does the ending show what the user's life looks like *after* the product?
- [ ] **VO quality:** Is it your own voice? Is it clear and credible?
- [ ] **Visuals:** Do they support the VO, or distract from it?
- [ ] **Pacing:** Does the video feel tight at 3:00, or padded?
- [ ] **Judges' job:** Can someone unfamiliar with Intently understand it in 60 seconds?
- [ ] **Ruthlessness:** Is every second essential, or are there "nice to have" shots that could be cut?

---

## Red Flags

- ❌ Voiceover sounds robotic or generic.
- ❌ Video leads with technology/features instead of problem.
- ❌ Judges can't understand what the product does by the 1-minute mark.
- ❌ Video is 3:45 (too long).
- ❌ Code is still being debugged on Sunday.
- ❌ Story and visuals weren't locked until Friday night.

---

## One-Line Summary

**Build a working product, tell a 3-act story in 3 minutes with your own voice, finish code by Saturday, sleep, and don't exceed the time limit.**

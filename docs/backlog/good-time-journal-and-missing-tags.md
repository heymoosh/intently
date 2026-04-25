# Backlog: Good Time Journal + Missing Journal Tags

**Status:** Deferred — post-hackathon MVP
**Related:** `agents/daily-review/SKILL.md` § 6, `docs/product/requirements/life-ops-plugin-spec.md` § Journal

---

## Good Time Journal (GTJ) Skill

### What it is

A structured mid-day energy tracking skill. Originally developed by Muxin as a career-focused Obsidian skill. The idea: stop briefly during work to log what you're doing, how engaged you feel, and what the environment is like. Over time, this builds a dataset of *which activities actually give you energy* — not which ones you think should.

Each GTJ entry is written to the journal file under the reserved tag `#gtj` with structured fields:

```
**[Activity] — [duration]** #gtj
Engagement: [Low | Medium | High | Flow] · Energy: [Draining | Neutral | Energizing]
Context: [1-line AEIOU insight — environment, interaction style, trigger, tools]
> [User's own words, unedited]
```

The weekly review and monthly review already know how to parse these entries when present. The monthly review in particular gains the most — it can identify *specific activities* that consistently energize or drain across 4 weeks, not just infer from prose.

### Why it's a great fit for Intently

- Turns the journal into structured self-knowledge, not just narrative
- The compounding effect is enormous: after 3 months of GTJ data, you can answer "what kind of work should I be doing more of?" with evidence
- Feeds directly into career-adjacent decisions (the Job Search Agent in the broader ecosystem reads GTJ data to help match roles to energy profile)
- The `#gtj` tag infrastructure is already in the spec — the reviews are ready to consume it

### Why it's deferred

The skill requires frequent interruption during work — stopping every 30–90 minutes to log. That's a different interaction pattern than end-of-day capture. For MVP daily review (which runs once, at end of day), GTJ doesn't fit — it needs its own trigger model (time-based nudge, or user-invoked mid-session). Building that interrupt model well takes more than the hackathon window allows. Shipping it half-baked would undermine trust.

### What to build when unblocked

1. A `good-time-journal` skill that can be triggered mid-session (voice: "log what I'm doing") or via a scheduled nudge (configurable — e.g. every 90 min during work hours)
2. A `gtj-review` sub-step in monthly review that queries `#gtj` entries and surfaces engagement/energy patterns by activity type
3. A setup step that asks: "Do you want to track your energy throughout the day?" — opt-in, not default

---

## Missing Tags: #bet, #bet2, #ask

These three tags from Muxin's Obsidian system were not included in the V1 daily-review reflection prompts because they require mid-day capture or a dedicated review workflow — not end-of-day reflection.

### #bet — Bets on outcomes

Bets you want to place on how successful something will be. The intent: log a prediction before you know the outcome, then revisit later to see if you were right. Builds calibration over time — are you an optimist who underestimates difficulty, or a pessimist who consistently surprises yourself?

**Example:** "Bet this PR will be approved without major revisions." Log it, revisit at weekly review.

**Why deferred:** Needs a "review open bets" workflow at weekly review — otherwise the bets just sit. Building the bet lifecycle (open → outcome logged → pattern surfaced) properly requires dedicated weekly-review step and a data structure the current spec doesn't have.

**Where it fits when built:** A `#bet` capture step in daily-review or voice capture mid-day, plus a "review open bets from last week" step in weekly-review (Step 1.5, before scoring).

### #bet2 — Updates on existing bets

An update or resolution to an open `#bet` entry. The pair (#bet + #bet2) creates a closed loop: prediction → outcome → learning.

**Why deferred:** Same as #bet — the lifecycle needs to be built together. A #bet2 without a bet lookup is just a note.

### #ask — Questions for someone at your next meeting

Things you want to ask a specific person when you see them next. Mid-day capture: "I should ask Sarah about the budget timeline." The system routes it as a prep item for the next meeting with that person.

**Example:** "Ask the team: what's blocking the handoff?"

**Why deferred:** Requires calendar integration to be useful — the system needs to know when your next meeting with that person is and surface the question in your morning brief beforehand. Without `calendar_mcp: connected`, it's just a floating note with no delivery mechanism.

**Where it fits when built:** A `#ask` capture step in daily-review, plus a morning-brief step that scans today's meetings and surfaces any `#ask` entries tagged to attendees.

---

## Summary

| Item | Deferred because | Unlock condition |
|---|---|---|
| Good Time Journal skill | Requires mid-day interrupt model, not end-of-day | Build nudge/trigger infrastructure |
| #bet / #bet2 | Needs bet lifecycle + weekly-review step | Design bet data structure + review workflow |
| #ask | Needs calendar integration to deliver the question at the right time | `calendar_mcp: connected` |

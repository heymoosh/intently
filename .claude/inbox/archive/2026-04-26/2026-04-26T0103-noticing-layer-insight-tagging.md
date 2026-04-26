---
captured: 2026-04-26T01:03:00-05:00
session: chat/0426-005256
source: discussion
related:
  - .claude/handoffs/agent-noticing-layer.md
  - .claude/inbox/2026-04-26T0100-noticing-layer-extensions-meta-briefing.md
  - .claude/inbox/2026-04-26T0102-signal-taxonomy-doc.md
references:
  - agents/daily-review/SKILL.md
  - .claude/handoffs/agent-noticing-layer.md
---

# Capture-time noticing of insight signals (4th workstream of agent-noticing-layer)

> Read `.claude/inbox/2026-04-26T0100-noticing-layer-extensions-meta-briefing.md` first if you haven't. **Depends on the signal-taxonomy doc landing first** (sister inbox item).

## One-line intent

Extend `.claude/handoffs/agent-noticing-layer.md` workstream 1 (capture routing) so that the agent also tags insight TYPE at capture time — chat messages, voice memos, journal drops. When the user says something that matches a signal type from the canonical signals doc, the agent inline-offers to tag it for tracking. Today this only happens at end-of-day in `daily-review/SKILL.md` § 6, which means a brag uttered at 10am isn't recorded as a brag until 5pm — if the user even returns to it.

## Why this is in the inbox

The "agent does the noticing" thesis from the active `agent-noticing-layer.md` handoff currently scopes to three workstreams:
1. Capture routing (one input → which destination)
2. Topic clustering (many inputs → what pattern is forming)
3. Memory promotion (many patterns → which deserve durable storage)

It does NOT include: signal-type tagging at capture time. That's currently a daily-review-only beat. But the user's framing is broader — the agent should listen for signal types continuously, not only when the daily-review flow runs.

This is the SAME architectural primitive (agent re-reads + proposes structure) applied to a 4th scope. Per the active handoff's load-bearing insight: *"build the agent re-read + propose-structure primitive once; reuse across the [now-four] scopes. Don't design [N] separate ML systems."*

## User's framing (verbatim)

> "These are also patterns that we should be looking for ourselves proactively through the users' random journal entries or through their chats with us."

> "We've set up Opus to know exactly what to look for, and so it uses its judgment to know: is it one of those things I'm supposed to look for? If so, I'm going to keep track of it. I'm going to make sure it's a pattern. I'm sure it's a thing that I use and I recall when needed."

The user explicitly says: at capture, not just at review.

## Current state — only-at-review

`agents/daily-review/SKILL.md` § 6 has the tag taxonomy and prompt logic. It only fires during the scheduled daily-review run. § 5a does multi-day pattern surfacing across the journal — but that's a SCAN of already-tagged entries, not real-time capture-time tagging. So if a brag uttered in chat at 10am isn't tagged at capture, it's invisible to the multi-day scan unless the user remembers to mention it during the 5pm review.

`agent-noticing-layer.md` workstream 1 covers binary `reminder` / `not-reminder` Haiku classification — no insight-type detection.

So: **detect-and-tag-at-capture-time is a real gap, not covered by either active surface.**

## Dependency on the signal-taxonomy doc

This work depends on the signal-taxonomy doc being canonical (sister inbox item: `signal-taxonomy-doc`). The capture-time tagger needs ONE source of truth for "what counts as a signal of type X" or it'll re-fragment the taxonomy at the classifier level. Sequence:

1. Author the signals doc first (sister item)
2. Extend the noticing layer's classifier to consume it (this item)

If sibling validation finds the taxonomy is already hoisted, this item can land first or in parallel. Otherwise — gate this on the sister item.

## Architectural decisions to make (sized small intentionally)

- **One classifier or two?** Single multi-class classifier (one model call returns one or more tags including reminder/topic/signal) vs chained (existing Haiku reminder-classifier first → if "looks like a signal" → richer multi-class). Tradeoff: latency vs cost vs accuracy. The active `agent-noticing-layer.md § Open decisions` already flags this for workstream 1 — fold this question into that decision.
- **Inline prompt vs silent tag.** Three options: (a) auto-tag silently, surface only at daily-review (cheap, low-friction, but doesn't teach the user the framework); (b) inline-prompt at capture ("That sounded like an automatic negative thought — tag #ant?") (high-friction, but reinforces the listening shape — which the user named as part of the unlock); (c) confidence-threshold split (high-confidence = silent tag, lower-confidence = inline ask). Lean: (c) — preserves both flows. Confirm with user during /groom or impl.
- **Voice in scope V1?** Voice-modal captures route through the same hero capture surface — extending the tagger to voice is a few-line change at the classifier boundary. Lean: yes. Confirm with user.
- **What does "tag" actually mean structurally?** Tags written into entries.body_markdown as inline #ant tokens (per current daily-review behavior)? Or a structured `entries.tags text[]` column? The current schema (`0004_entities.sql`) doesn't have a tags column — tags are markdown-embedded. Decide whether this work adds the column.

## What grooming + sibling-validation should verify

1. **Working-branch classifier work.** Does any unmerged branch extend the existing Haiku binary classifier? If so, fold rather than re-design.
2. **`web/WIRING-POINTS.md` (per `agent-noticing-layer.md`).** Does it exist on the working branch? If yes, the multi-destination-routing wiring point is where this work plugs in nearby.
3. **Schema for tags.** Confirm whether `entries` should grow a `tags text[]` column or stick with markdown-embedded tags. Pull the design folder's HANDOFF spec into this decision if it has guidance.
4. **Workstream-add vs separate handoff.** Lean: workstream addition to `agent-noticing-layer.md` (4th workstream alongside capture-routing/topic-clustering/memory-promotion). Confirm during /groom — same-handoff keeps the architectural insight intact (one re-read primitive, four scopes).
5. **UX confirmation.** With the user, confirm the inline-prompt vs silent-tag decision and the voice-modal scope.

## Sibling-session validation tasks

- [ ] grep `classify\|haiku\|classifier\|tag\|insight\|signal` in `supabase/functions/`, `web/`, `agents/`, `app/lib/` on the working branch
- [ ] Check whether `.claude/handoffs/agent-noticing-layer.md` has been amended on any working branch (workstream additions, AC changes, schema decisions)
- [ ] Inspect `web/WIRING-POINTS.md` (if it exists) for the multi-destination-routing wiring point
- [ ] Confirm — does `entries` have `tags` (or similar) column on any working-branch migration? `select_path` or `0007_*.sql` or beyond?
- [ ] Confirm with user during validation report — is this its own slug or a 4th workstream of the noticing-layer handoff?

## Why this matters

The brag-at-10am-not-recorded-until-5pm-if-ever scenario is the load-bearing case. The user's framing of the unlock — *"if you don't give an AI guidance on what to look for, it wouldn't know what to surface. It would just cobble together patterns"* — applies at capture time, not just review time. Without capture-time tagging, the agent's "noticing" only happens once per day on a schedule, which means most of what the user says never gets into the pattern-extraction pass at all. End-of-day-only is the V1.0 floor; capture-time is the V1.1 ceiling that the rest of the noticing layer assumes will exist.

---
captured: 2026-04-26T01:40:00-05:00
session: chat/0425-210554
source: discussion
amends: TRACKER § Next #8 (build dedicated chat MA skill agent)
supersedes_dispatch: ad0e9d223e870ecaa (stopped — brief was wrong)
---

# Chat MA skill — re-scope as top-level orchestrator (NOT conversational companion)

The orchestrator's first dispatch (now stopped) framed the chat skill as a "conversational companion that doesn't drift into to-do mode." Muxin clarified at 01:40 — that framing is **wrong**. The chat agent is the user-facing entrypoint that ROUTES to specialized handlers, not a passive conversation surface.

## Muxin's framing (verbatim points)

- "The chat needs to be able to handle anything and everything."
- "If the person decided that they want to write an entire journal entry via chat, the agent has to be able to handle that and also know exactly where to route it."
- "It can, of course, deploy a sub-agent that has specialties on routing."
- "People are going to treat the AI assistant as if it knows everything and can do everything. We have to treat it that way, unlike more specialized agents like the daily review that has a workflow."
- "It needs to be ready to apply any update to any project, any goals, any part of the system. It needs to be able to pull from any database."
- "I think it will have to be almost an Opus-level sub-agent, or maybe we can start us on it and then we can have an Opus advisor on staff if it ends up being a very hairy request."
- "A lot of times people will probably just be asking the chat agent to go, 'Hey, I want to drop a whole bunch of stuff in here to remind me of or schedule this and schedule that.'"

## Why the dedicated workflow agents (review, brief, weekly, monthly) still exist

- "These are workflows to help drive human behavior."
- "I am a little worried that people may find it to be obtrusive or not helpful."
- The benefit of structured workflows = they drive specific behavior (review your day, plan tomorrow, reflect on the week).
- The chat is unstructured/freeform — both benefit AND weakness. Users get freedom; designers lose the shaping power of the workflow.

## Architecture sketch (rough — needs design pass)

```
User utterance → Chat agent (Opus tier)
                   ↓
                   1. Decompose intent (single action vs multi-action)
                   2. Route to specialist(s):
                      • reminders Edge Function (existing Haiku binary)
                      • update-tracker MA skill (project/goal updates)
                      • journal capture (insert into entries kind=journal)
                      • brief regeneration (if user asks "redo my brief")
                      • setup re-run (if user asks "let me change my goals")
                      • freeform conversation (if it's just chat, no action)
                   3. Compose response across sub-agent outputs
                   4. Maintain calm-aesthetic tone regardless of routing complexity
```

## Open design questions (for daytime engagement)

1. **Sub-agent registry** — what skills does chat dispatch to? Existing 6 + agent-noticing-layer's capture-router + new ones? Hardcoded list or dynamic?
2. **Decomposition logic** — multi-action utterances ("I finished X AND remind me to Y"). How aggressive should the decomposer be? Single-action default with a heuristic to escalate?
3. **Token budget** — Opus chat per turn is expensive. Strategies:
   - Prompt caching for the dispatcher's system prompt (4K minimum cache; per locked decision in real-app-cognition handoff, we're below this)
   - Sliding context window (last N turns only)
   - Tier-down on simple utterances (Haiku decides "is this complex enough for Opus")
4. **Failure handling** — if a sub-agent it routed to fails, does chat retry, surface the error, or fall back to a freeform reply?
5. **State across turns** — chat is conversational. Does it remember earlier turns in the session (yes, currently)? Across sessions (currently no)? Per the cognition layer, yes long-term via entries table.
6. **Relationship with `agent-noticing-layer`** — the noticing layer's "capture-routing" workstream and the chat agent's "route this utterance" job overlap. Are they the same thing? Or chat = sync (per-utterance) routing, noticing layer = async (batch) pattern detection?

## Implementation approach (suggested phasing)

- **Phase 1: chat skeleton.** Build `agents/chat/` with a tight system prompt that handles freeform conversation tonally, AND identifies which existing skills to call for action utterances. Doesn't decompose multi-action — sequential turn-taking only ("got that, what else?"). Uses Sonnet at first; escalates to Opus when the input is ambiguous or multi-clausal (Sonnet first-pass returns "needs Opus").
- **Phase 2: routing + composition.** Wire actual `callMaProxy` invocations from the chat agent's structured outputs. Add multi-action decomposition.
- **Phase 3: noticing-layer integration.** Once the noticing layer's capture-routing workstream lands, chat reuses it for the routing decision (instead of duplicating the classifier).

## What changes in PR #157's current state

PR #157 swapped HeroChat's canned replies for live LLM via `daily-brief` skill. That's a stopgap — daily-brief is brief-shaped, not conversational. It DOES handle freeform input but pulls toward planning/sequencing.

For the chat-as-orchestrator handoff: replace the `daily-brief` fallback with a real `chat` skill that's tonally appropriate AND can dispatch.

## Suggested next steps (for grooming when Muxin engages daytime)

1. **Re-prompt the in-flight `agent/chat/` work as a re-scoped handoff** at `.claude/handoffs/chat-as-orchestrator.md`. Locks the architecture decision. Calls out the open questions above.
2. **Add to TRACKER § Active handoffs.**
3. **Defer implementation** until the open questions land. Phase 1 (skeleton + tone) might be a half-day; phases 2-3 are bigger.
4. **Stop pretending chat is daily-brief.** The current PR #157 fallback works but should be flagged as transitional in code comments.

## Out of scope for this capture

- Whether to actually use Opus per-turn vs tier-by-complexity (decision in design pass).
- Whether the noticing layer's capture-routing IS the chat router or a separate component (decision in design pass).
- Token-budget engineering strategies (decision in design pass).

These all become real questions when implementation starts.

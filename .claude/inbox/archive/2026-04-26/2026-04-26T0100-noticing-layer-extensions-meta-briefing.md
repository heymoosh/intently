---
captured: 2026-04-26T01:00:00-05:00
session: chat/0426-005256
source: discussion
type: meta-briefing
related:
  - .claude/inbox/2026-04-26T0101-life-areas-entity.md
  - .claude/inbox/2026-04-26T0102-signal-taxonomy-doc.md
  - .claude/inbox/2026-04-26T0103-noticing-layer-insight-tagging.md
  - .claude/handoffs/agent-noticing-layer.md
references:
  - docs/architecture/document-taxonomy.md
  - docs/architecture/data-model.md
  - docs/architecture/agent-memory.md
---

# Meta-briefing — Noticing-layer extensions (sibling-session validation)

> **For the sibling agent:** read this first to orient, then read the 3 atomic inbox items it points to. This document was authored in the `chat/0426-005256` worktree from main-branch state at session start; the validating session may have unmerged work that already addresses one or more of the gaps. Validation tasks at the bottom of each atomic item should be run against the actual working-branch codebase, not against the snapshot this document was authored from.

## Hand-off context

Three architectural gaps surfaced in a discussion between user (Muxin) and the assistant on 2026-04-26 about extensions to the agent-noticing-layer arc. Each gap has its own atomic inbox file. This meta-briefing is the orientation document — what the user is asking, what's already covered, what's actually new, and what the sibling agent should validate before /groom processes the items.

The user explicitly said: *"I do not know if the state of our codebase matches what you've read so far. […] I can hand it off to another agent to have it execute on so it can review what it's been working on in its codebase and identify if there are truly any gaps."* This briefing exists to support that hand-off.

## What the assistant read in this session

- `TRACKER.md` (full)
- `.claude/handoffs/agent-noticing-layer.md` (active handoff, V1.1 promoted-to-active 2026-04-25)
- `.claude/handoffs/entries-architecture.md` (parked, pending design-folder reconciliation)
- `agents/update-tracker/SKILL.md` (user explicitly asked: is this the clustering engine? answer: no)
- `agents/daily-review/SKILL.md` (encodes 5 reflection-category tags + multi-day pattern surface)
- `supabase/migrations/0001-0006_*.sql` (schema is goals → projects → entries; entries.links is jsonb soft graph; no embeddings, no pgvector, no topics table)
- `docs/architecture/document-taxonomy.md`, `data-model.md`, `agent-memory.md` (all banner-archived as ORIGINAL INTENT, but the user said "a large part of these still matters")

## User's two-bucket tagging (verbatim)

> "two separate things that I tagged in this conversation so far:
> 1. The clustering topic clustering mechanism
> 2. The insight pattern matching intentional pattern matching"

The 3 atomic items below split bucket #1 into two pieces (life-areas-entity covers the "ongoing-area" gap; the noticing-layer handoff already covers project-shaped clustering) and address bucket #2 in two pieces (signal-taxonomy-doc + capture-time tagging).

## Critical provenance — the original intent docs already had half of this

The three architecture docs are banner-flagged as "ORIGINAL INTENT — not current ground truth." But the user said: *"We did decide to use Supabase instead of markdown for some areas, but a large part of these still matters."* What still load-bears from the originals:

- **`agent-memory.md` § Stable IDs already defined `topic`** as a first-class entity:
  > "Topic: `topic.<date-started>-<slug>` (e.g., `topic.2026-04-22-hiring-thoughts`) — clusters chat turns about the same subject across sessions when it hasn't crystallized into a project yet. The agent links new mentions to an existing topic if the match is strong, and can propose promoting a topic to a full project (with Tracker + Strategy) when enough signal has accumulated."
  
  This is exactly the topic→project promotion pathway the user is asking for. **It was in original intent and was dropped during the schema migration to entries/projects/goals.** It is not currently in `supabase/migrations/`. The life-areas-entity item proposes re-introducing this primitive AND extending it to cover the "topic stays a topic forever" case (health, family, etc.) that the original spec didn't cover.

- **`data-model.md` § `<Reflection>.md` § Tags** spec'd a broader signal taxonomy than what currently lives in `agents/daily-review/SKILL.md` § 6. Original spec: `#brags, #insight, #pattern, #stuck` (plus reserved `#gtj`). Current daily-review: `#grow, #self, #brag, #ant, #ideas`. The taxonomies don't agree, the originals lived in a markdown vault file, and there's no canonical hoisted doc explaining the framework lineage. The signal-taxonomy-doc item proposes hoisting + reconciling.

- **`data-model.md` § `<Reflection>.md` § GTJ entries** has a fully-spec'd Good Time Journal data shape (Engagement/Energy/Context/AEIOU + weekly Energy Profile synthesis) that maps to `agents/good-time-journal.skill` — a Claude skill bundle that is currently a ZIP file at that path, not deployed/unpacked. The user said: *"a whole separate module we're not building out in this hackathon"* — so the GTJ skill itself stays parked, but the broader signal-taxonomy doc proposed here should still reference its schema as a canonical signal type.

- **`document-taxonomy.md` State/Reasoning/Content/History** sorting rule still load-bears as the framework guiding where new artifacts land. The signal-taxonomy doc would be Reasoning/Content (durable), not State (Tracker).

## Current state pointers — what the sibling should re-verify before grooming

| Topic | Snapshot from `chat/0426-005256` (main-state) | Sibling should verify |
|---|---|---|
| Topic clustering arc | `.claude/handoffs/agent-noticing-layer.md` — active per TRACKER 2026-04-25; covers capture-routing + topic→project assembly + memory promotion. Implementation: not started. | Has any working branch begun the noticing layer? Schema additions? An embedding/recurrence pass? |
| Schema | `0004_entities.sql` — goals/projects/entries; `entries.links jsonb` for soft graph; **no `topics`/`areas`/`life_areas` table; no pgvector/embeddings.** | Does the working branch have unmerged migrations adding any of these? |
| Signal taxonomy location | Buried in `agents/daily-review/SKILL.md` § 6 (5 tags, used at end-of-day only). Not hoisted. | Has any working branch hoisted this taxonomy elsewhere? Does the design folder describe it? |
| GTJ skill | `agents/good-time-journal.skill` is a ZIP on disk, not unpacked. Spec lives in `data-model.md` § Reflection. | Has the skill been deployed? |
| Capture routing | Hero capture exists; Haiku binary `reminder`/`not-reminder` classifier exists; multi-destination routing is the missing primitive per `agent-noticing-layer.md`. | Has multi-destination routing landed? |
| update-tracker scope | Project-progress logger only. NOT a clustering engine. Source-of-truth lookup = `life-ops-config.md` Projects section (a static map). | Confirm — has its scope been extended into clustering or proactive suggestion territory? |

## The 3 proposed gaps — one-line summaries

1. **`life-areas-entity`** — Add a third entity tier alongside goals + projects for ongoing life-areas (health, family, fitness) that are neither projects (no start/end) nor goals (no target outcome). Re-introduces `topic` from original intent and extends with the "topic stays a topic forever" case. Full brief: `.claude/inbox/2026-04-26T0101-life-areas-entity.md`.

2. **`signal-taxonomy-doc`** — Hoist the reflection tag taxonomy out of `daily-review/SKILL.md` into a canonical doc (`docs/product/signals.md` or similar) with framework provenance, the rule for adding new signal types, and reconciliation between the current 5 categories + the original-spec list + GTJ + the user's newly-named additions (energy patterns, bets/decisions). Reframes "the unlock" as: not "AI knows you," but "Intently encodes which signals matter." Full brief: `.claude/inbox/2026-04-26T0102-signal-taxonomy-doc.md`.

3. **`noticing-layer-insight-tagging`** — Extend `agent-noticing-layer.md` workstream 1 to apply signal-type tagging at capture time (chat / voice / journal drops), not just at end-of-day daily-review. Same architectural primitive (agent re-reads + proposes structure) applied to a 4th scope. Depends on the signal-taxonomy doc shipping first. Full brief: `.claude/inbox/2026-04-26T0103-noticing-layer-insight-tagging.md`.

## What this briefing is NOT proposing to change

- The active `agent-noticing-layer.md` handoff stays as-is. Items 1 and 3 EXTEND it; item 2 is a new doc that the existing handoff will reference once authored.
- TRACKER's existing § Next ordering. These are post-hackathon V1.1+ and shouldn't preempt the chat-reminder bug fixes / wiring-audit / etc. already queued.
- Any of the active handoffs (entries-architecture, new-user-ux-and-auth, oauth-calendar-email, scheduled-agent-dispatch, sam-demo-on-landing-page, cognition-verification-harness, wiring-audit). These three items live alongside, not in conflict.

## How the sibling should use this briefing

1. **Pull the latest** from this branch (`chat/0426-005256`) so you can read the 4 inbox files this branch added.
2. **Read this file first** (you are doing that now), then the 3 atomic items in order.
3. **For each gap**, run the validation tasks listed in the atomic file against your actual working-branch codebase. Specifically check for: in-flight schema migrations, unmerged classifier work, hoisted-signals docs already authored elsewhere, design-folder coverage of any of these.
4. **Report findings to the user** in this shape per gap:
   - "True gap" / "Already covered by [path/branch]" / "Partially covered, here's what's actually missing" / "Framing is off, here's the real shape"
5. Let the user direct the next move — /groom into TRACKER as-is, refine, fold into existing handoffs, or reject.

## End-of-briefing one-line summary

Three V1.1 architectural extensions to the agent-noticing-layer arc — life-area entity tier (re-introduces dropped `topic` primitive), hoisted signal-taxonomy doc (canonicalizes "what we listen for"), and capture-time insight tagging (applies the noticing primitive at a 4th scope). Sibling validates against actual codebase before grooming.

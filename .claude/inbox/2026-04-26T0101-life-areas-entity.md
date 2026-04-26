---
captured: 2026-04-26T01:01:00-05:00
session: chat/0426-005256
source: discussion
related:
  - .claude/handoffs/agent-noticing-layer.md
  - .claude/inbox/2026-04-26T0100-noticing-layer-extensions-meta-briefing.md
references:
  - docs/architecture/agent-memory.md
  - docs/architecture/data-model.md
  - supabase/migrations/0004_entities.sql
---

# Life-areas as a first-class entity (third-tier ongoing-area)

> Read `.claude/inbox/2026-04-26T0100-noticing-layer-extensions-meta-briefing.md` first if you haven't.

## One-line intent

Add a third entity tier alongside goals + projects: an "ongoing-area" / "life-area" entity for persistent topics that are neither goals (no target outcome) nor projects (no start/end) — health, family, fitness, finances. Topic clustering should auto-route to this tier when the recurring shape isn't project-shaped. Re-introduces the `topic` primitive that was in original intent (`agent-memory.md`) and extends it to cover the "topic stays a topic forever" case the original didn't.

## Why this is in the inbox

The active `agent-noticing-layer.md` handoff frames topic clustering as "topic clustering → auto-**project** assembly." That mapping breaks for "health" — no start, no end, no target. Without a third-tier home, recurring health journal entries either become a forced "Health Project" (incorrect framing) or fall into the Admin catch-all (loses the cluster context).

## User's framing (verbatim — load-bearing)

> "Your health is probably not a specific project that has a start and end. It may not necessarily have a goal either; it is just something that you're always doing. If you share entries about your health, AI will cluster it together so that it becomes its own entity. If there are follow-ups with your doctor not related to any specific goal or any project, it will still cluster it together within the health grouping."

> "[…] organize your projects to link to your goals, or we detect that there seems to be a goal that you keep talking about across your journal notes and chats. The AI assistant should pre-emptively ask if you would like to create a goal around that and to also spin off a project if it has the shape of a project."

## Provenance — half of this was in original intent and got dropped

`docs/architecture/agent-memory.md § Stable IDs` (banner-archived but goal load-bears):

> "Topic: `topic.<date-started>-<slug>` (e.g., `topic.2026-04-22-hiring-thoughts`) — clusters chat turns about the same subject across sessions when it hasn't crystallized into a project yet. The agent links new mentions to an existing topic if the match is strong, and can propose promoting a topic to a full project (with Tracker + Strategy) when enough signal has accumulated."

This is the architectural primitive. The migration to `goals/projects/entries` (migration 0004_entities.sql) did NOT carry forward a `topics` or `areas` table — the soft graph lives in `entries.links jsonb` only, with no enforced FK to a topic-level entity. So:

- **What we're re-introducing:** the `topic` entity itself, as queryable structure, not just a soft jsonb hint.
- **What we're extending beyond the original:** the original framed topics as crystallization-pending — eventually they promote to projects. The user's framing here is that some topics never crystallize, by design (health, family). They stay as life-areas indefinitely. The original primitive needs to support both.

`docs/architecture/data-model.md § Master Backlog` already specs a promotion workflow (Backlog → active project, owned by monthly-review). That workflow is reusable for topic→project promotion when a topic does crystallize, and stays-where-it-is for topics that don't.

## Current state — what does NOT exist

- No `topics` / `areas` / `life_areas` table in any migration `0001-0006`.
- `entries.links jsonb` is the only soft graph — no FK enforcement, no consumer that walks it for clustering.
- `projects.is_admin` is the catch-all bucket for un-rolled-up todos — but it's still project-shaped, not life-area-shaped.
- No agent pass detects recurring topics or proposes area creation. (The noticing layer handoff describes one — not implemented.)

## What grooming + sibling-validation should verify

1. **Working-branch schema check.** grep for `life_area`, `area`, `topic`, `cluster`, `pgvector`, `embedding` in any unmerged migrations or branches. If anything already exists, fold this proposal into that work.
2. **Naming, deferred to /groom or impl.** Candidates: `life_area`, `area`, `topic`, `domain`, `pillar`. The user is open. Don't pick yet — let the implementation context choose.
3. **Single-arc vs separate handoff.** Does this extend `agent-noticing-layer.md` (single arc, four workstreams now) or get its own slug? Lean: extend — same primitive at a different scope. Confirm during /groom.
4. **Promotion bidirectionality.** Originals only specced topic→project promotion. This proposal needs: (a) topic→life-area "stay as area" classification, (b) life-area→project spin-off when one slice gets project-shaped (e.g., "Health" cluster spawns a "Train for half-marathon" project that links back to the area), (c) entries→[area, project, goal, none] routing decision at write-time vs lazy.
5. **UI surface.** Per `BUILD-RULES.md` "no tabs, hero is the ONE interaction surface" — areas need an affordance somewhere in the prototype. Pull this question into the wiring-audit handoff if it lands during implementation.

## Open decisions (for /groom or for the implementation handoff)

- **Schema shape.** New `life_areas` table (own lifecycle, archived_at, glyph, palette, position) vs extending `projects` with `kind in ('project', 'area')`. Lean: separate table — different lifecycle (no done state), different read paths (areas pull entries continuously; projects close out), different UI affordance.
- **Goal linkage.** Areas can soft-link to goals but no hard FK requirement. A life-area can have zero, one, or many supporting goals — and a goal can have zero or one supporting areas.
- **Auto-creation threshold.** How many recurring entries before agent proposes "create Health area"? Tunable; same dial as topic-promotion threshold in `agent-noticing-layer.md § Open decisions` ("Promotion threshold: how many `times_observed` before promotion?").
- **Existing entries.kind.** Currently constrained to `('brief', 'journal', 'chat', 'review')`. No change needed — area attribution lives in `links` or a new FK column, not in `kind`.
- **`is_admin` resolution.** When areas exist, does the Admin project still need `is_admin = true`? Probably yes (an "area-less todo" is still possible) — but the catch-all role narrows.

## Sibling-session validation tasks

- [ ] grep `life_area\|topic_cluster\|areas\|domain` in `supabase/migrations/`, `web/`, `agents/`, `app/lib/` on the working branch — does anything already exist?
- [ ] Check `docs/design/Intently - App/HANDOFF.md` and `BUILD-RULES.md` for any "areas" / "life domains" / "ongoing topics" surface in the UX spec
- [ ] Check whether `entries.links` has a real consumer yet — if no, the soft-FK approach can absorb area linkage without a schema change for V1.0; the table can land in V1.1
- [ ] Read the most-recent design folder to confirm whether the prototype's UX pattern accommodates a third entity type or if this requires a UX gap-fill first
- [ ] Confirm with user — after sibling validation, name the entity and decide whether it's its own handoff or an extension of `agent-noticing-layer.md`

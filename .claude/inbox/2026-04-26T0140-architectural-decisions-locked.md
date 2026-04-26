---
captured: 2026-04-26T01:40:00-05:00
session: chat/0425-210554
source: discussion
amends_handoffs: new-user-ux-and-auth, oauth-calendar-email, agent-noticing-layer
---

# Architectural decisions locked at 2026-04-26 01:40 conversation

Five decisions Muxin landed in one conversation while reading the wake-up briefings. `/groom` should:
1. Fold each into the relevant handoff's "Locked decisions" or "Decisions made" section.
2. Update `launch-plan.md` § Locked decisions with the cross-cutting ones.
3. Optionally draft ADRs for the non-trivial ones (Decision 1 below is ADR-worthy).

## Decision 1 — Account creation IS Google OAuth (UX collapse)

**Verbatim from Muxin:** *"What might be kind of clever is if we connect the account creation with connecting their email and Google account, because isn't that basically the same OAuth? We could basically tease them and say, 'Hey, tomorrow or even today we can pull your calendar and email and tell you what you've got going on today and tomorrow. Would you like for us to set that up?' If you do that, you basically create the account and pull your Google information at the same time."*

**Locked: yes.** The new-user-ux-and-auth handoff's Phase-3 ("Account upgrade") collapses with the oauth-calendar-email handoff into ONE user-facing moment.

**The flow:**
1. Stranger opens app → setup intake (goals, projects, this-week-outcome, preferences) → home page populated with their context.
2. After setup OR at a relevant moment (browsing Future / hitting Day 2 / etc.), surface a SINGLE combined CTA: *"Want to make this stick? Sign in with Google so we can keep your data across devices AND pull your calendar + email — your daily brief gets way better."*
3. One Google OAuth dance does **three things at once**:
   - Creates a real account via `auth.linkIdentity()` (anon → Google identity, same uid, no data loss)
   - Connects calendar (`calendar.readonly`)
   - Connects gmail (`gmail.readonly`)
4. Backend immediately backfills `calendar_events` + `email_flags` so the next daily brief is dramatically richer.

**Implications:**
- **Email/password sign-up is deprioritized.** Google sign-in becomes the primary path. We can offer email as a fallback if someone explicitly prefers it, but it's not the default.
- **The "save your account" CTA timing question** (currently open in new-user-ux-and-auth handoff) is collapsed: surface after setup completion (the user has invested → has something to lose → has earned the value of the OAuth payoff).
- **The OAuth handoff's ADR 0009 still holds** (Supabase Vault for tokens). What changes is the user-facing flow that triggers OAuth.
- **A single OAuth scope grant** asks for: `openid`, `email`, `profile` (for sign-in) + `calendar.readonly` + `gmail.readonly` (for sync). Five scopes, one consent screen.

**Worth an ADR:** yes — `docs/decisions/000X-account-creation-via-google-oauth-collapse.md`. Records the UX collapse + the consequence that email/password is the fallback, not the default.

## Decision 2 — Vector store: pgvector (locked)

**Verbatim from Muxin:** *"I am tempted to go and lean towards [pgvector] because I do not have a strong opinion here, other than I think we need to understand that the architecture isn't simply a SQL database with embeddings."*

**Locked: pgvector.** Matches scope-scout's proposed default.

**Caveat captured:** Muxin called out that "the architecture isn't simply a SQL database with embeddings — graph databases make a lot more sense for the agent memory architecture that we had talked about, with clusters around people's tasks and around each user profile."

**Reconciliation:** pgvector + Postgres FK chains can model graph-like relationships. The clusters Muxin describes (around tasks / around each user profile) are achievable via:
- Embeddings on each entity row (entries, projects, goals, etc.)
- FK relationships expressing the explicit graph structure (entries.project_id → projects.id → projects.goal_id → goals.id)
- Clustering as periodic batch (per Decision 4 below) writing to a `topics` or `observations` table

If queries genuinely require multi-hop graph traversal that Postgres can't handle (deep recursive queries, PageRank-style centrality), revisit. Until then: pgvector + FKs.

**ADR-worthy:** yes — `docs/decisions/000X-vector-store-pgvector.md`. Briefer than ADR 0009; references the agent-noticing-layer briefing.

## Decision 3 — Topic clustering cadence: batch (locked)

**Verbatim from Muxin:** *"On topic clustering cadence, yeah, I do agree on topic clustering being a batch."*

**Locked: periodic batch (hourly or daily) via existing pg_cron infra (per scheduled-agent-dispatch handoff just merged in PR #168).**

**Implication:** the noticing-layer's clustering pass becomes a new pg_cron job alongside daily-brief / weekly-review / monthly-review. Reuses the dispatch-skill Edge Function pattern.

## Decision 4 — Promotion threshold: hand-tuned (locked, implicit)

Muxin asked "what is promotion threshold?" — I explained, scope-scout's proposed default was hand-tuned (3 observations across ≥2 sessions, ≥48h apart). Muxin didn't push back.

**Locked: hand-tuned.** Adjustable later if signal warrants.

## Decision 5 — Capture-routing IS the chat agent's job (architectural collapse)

This emerged from Muxin's chat-MA-skill clarification: chat is the top-level dispatcher (see sibling inbox `2026-04-26T0140-chat-as-top-level-orchestrator.md`).

**Implication:** the noticing-layer's "workstream 1: capture-routing" overlaps with the chat agent's "route this utterance" job. **They become the same component.** The existing Haiku binary classifier in `supabase/functions/reminders/index.ts` handles fast/cheap classification (reminder vs not-reminder, the hot path). The chat agent handles richer/multi-action routing when the user is in chat mode.

**Reconciliation:** the noticing-layer's separate "capture-routing" workstream (per the briefing) is REMOVED — folded into the chat agent's design. The noticing layer keeps workstreams 2 (topic clustering) and 3 (memory promotion). The capture-routing workstream's deliverables (eval dataset, prompt extraction) become inputs to the chat agent's design pass.

## Cross-cutting implications

- The `agent-noticing-layer` handoff scope shrinks from 3 workstreams to 2 (clustering + promotion).
- The `oauth-calendar-email` handoff scope partly collapses INTO the new-user-ux-and-auth Phase-3 (account upgrade).
- The new-user-ux-and-auth handoff's account-upgrade question (timing? email vs Google? sign-in screen?) becomes "OAuth-driven, post-setup, Google primary."
- The chat agent design (sibling inbox capture) becomes load-bearing for the noticing layer + reminder routing.

## What still needs Muxin (decisions still open)

Captured here so they don't get lost when grooming runs:

1. **Setup expansion: how many phases?** (3 / 4 / 6 / custom — scope-scout proposed 4)
2. **Setup expansion: optional vs required phases?** (proposal: goals required, rest skippable with defaults)
3. **First-run gate: hard vs soft?** (scope-scout proposal: soft empty-state with prominent CTA)
4. **Display name capture: in setup or separate pre-setup screen?** (proposal: separate one-question pre-setup card)

These are all in `.claude/wake-up-briefings/2026-04-26-setup-expansion.md`. When Muxin engages with that briefing, these get answered too.

## Out of scope for this capture

- The actual implementation work — that's daytime sub-agent dispatch territory.
- ADR drafting — defer to grooming + execution time.
- Re-writing existing handoffs to reflect these decisions — `/groom` does that.

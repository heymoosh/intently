---
captured: 2026-04-26T01:04:00-05:00
session: chat/0426-005256
source: discussion
references:
  - TRACKER.md (§ Current state pointers, line 21 — the propagation point)
  - docs/architecture/agent-memory.md
  - docs/architecture/data-model.md
  - docs/architecture/document-taxonomy.md
  - docs/product/vision.md
  - docs/product/requirements/life-ops-plugin-spec.md
  - docs/design/Superseded by Intently-App/app-experience.md
---

# Architecture / vision / spec docs wrongly archived in the 2026-04-25 design-folder sweep — un-archive + lock scope via ADR

> **Triage classification:** documentation correction with permanent durable component (ADR). NOT a single-session quick-fix despite small file count — must include the ADR or the same misread will recur.

## One-line intent

A doc-sweep on or around 2026-04-25 — when the new design folder + interactive prototype landed — applied a uniform "⚠ ORIGINAL INTENT — not current ground truth" banner to 5 docs that should NOT have been archived. User confirmed 2026-04-26 that the design-folder supersession was scoped to UX/screen-level docs only — backend architecture, product vision, functional spec, security, release, ethical design, and accessibility docs were NEVER in scope. This item: strip the wrong banners, reframe the architecture-doc banners to "implementation moved, intent stands," fix the TRACKER line that propagates the over-application, and author ADR 0008 locking the scope of design-folder supersession so the same misread doesn't recur.

## User's clarification (verbatim)

> "I notice that you mentioned some of these architecture docs were claimed to be superseded, and I think it's due to an over-application to something I said yesterday about anything that isn't in the Intently app shouldn't be built, or something to that effect. I said it's been superseded by the app; however, I did not mean every single thing. I did not mean the backend architecture. I meant that it should work the way that I assumed it would work, and apparently I did not do a good job at explaining it properly."

> "The only thing that I would claim to be superseded right now is superseded by Intently app inside of the design folder; that's it, and everything else should have stayed relevant to our build."

> "Now I'm worried that it skipped over a lot of foundational architecture decisions that we had already made, and I don't know what to do."

## Audit summary (from this session's read)

**Confirmed safe — no banners, no over-application:**
- `docs/security/asvs-scope.md`, `docs/security/privacy-policy-for-builders.md`, `docs/security/threat-model.md`
- `docs/release/README.md`
- `docs/design/mobile-app-accessibility-design.md`
- `docs/design/ethical-ai-design.md`
- `docs/decisions/0001-0007*.md` (ADR 0003 superseded by 0004 — standard ADR pattern, correct)
- `docs/design/Superseded by Intently-App/*` (correctly filed as the OLD UX folder)
- `docs/process/session-handoff.md`, `docs/product/interaction-inventory.md` (current convention/audit docs, correctly active)

**Wrongly archived — banner over-applied:**

| Doc | Banner currently says "do not derive…" | Reality (per user's clarification) |
|---|---|---|
| `docs/architecture/agent-memory.md` | "current architecture from it" | Stable-ID scheme, two-layer memory model, MA-as-cache pattern, OAuth+API approach for calendar/email — backend architecture, not UX. **Implementation moved (.md → Supabase rows); contracts stand.** |
| `docs/architecture/data-model.md` | "current schema from it" | Cascade contract (Goals→Monthly→Weekly→Daily), Master Backlog promotion workflow, journal/GTJ shared contract, project Tracker+Strategy split, life-ops-config role. **Schema-shaped intent; only the storage substrate moved.** |
| `docs/architecture/document-taxonomy.md` | "current doc-routing from it" | State/Reasoning/Content/History sorting rule. **TRACKER's spine is built on this.** |
| `docs/product/vision.md` | "current product behavior from it" | Product thesis (Life Ops as a mobile app, scheduled agents handle recurring ops). **Vision-level — was never an implementation doc.** |
| `docs/product/requirements/life-ops-plugin-spec.md` | "current product behavior from it" | V1 scope spec, cascade design, daily-brief weighting rule, unattended-monthly-review safety rule. **Functional contract — implementation references are illustrative, not load-bearing.** |

**Propagation point in TRACKER (line 21):**

> "Original-intent docs (archived, bannered in-file, not current truth): `docs/product/vision.md`, `docs/product/requirements/life-ops-plugin-spec.md`, `docs/design/app-experience.md`, `docs/architecture/agent-memory.md`, `docs/architecture/data-model.md`."

Of those five, only `docs/design/app-experience.md` (now correctly relocated to `docs/design/Superseded by Intently-App/app-experience.md`) belongs there.

**Likely cause:** the new design folder landing + the "Intently app supersedes" framing got over-applied to anything pre-dating 2026-04-25. The author of the sweep treated the date, not the scope, as the test. The 5 docs all came from the same era as the old design folder, so they got swept together. Without a durable scope-lock, the same misread will happen the next time docs get reorganized.

## Remediation — Option C (chosen by user 2026-04-26)

Three coordinated actions. Must ship together — partial execution leaves the system in an inconsistent state.

### Action 1 — Strip wrong banners + reframe architecture-doc banners

**Strip entirely (banner has no replacement):**
- `docs/product/vision.md` — drop the "⚠ ORIGINAL INTENT" block (the doc was never an implementation doc; nothing was superseded).
- `docs/product/requirements/life-ops-plugin-spec.md` — drop the "⚠ ORIGINAL INTENT" block.

**Replace with reframed banner:**
- `docs/architecture/agent-memory.md`
- `docs/architecture/data-model.md`
- `docs/architecture/document-taxonomy.md`

Reframed banner text (suggested — implementer can wordsmith):

> **⚠ Original intent — implementation moved, contracts did not.** The architectural shape, schema-level contracts, and behavioral intent described here remain load-bearing. The "markdown-files-as-source-of-truth" implementation has been superseded by Supabase migrations (`supabase/migrations/0001-0006_*.sql`); markdown is now a render-on-demand view. **Read this doc for WHAT each entity is and WHY it exists; read the migrations for HOW it is currently stored.** Scope of supersession is locked in `docs/decisions/0008-scope-of-design-folder-supersession.md`.

### Action 2 — Fix TRACKER line 21

Current (line 21):

> "Original-intent docs (archived, bannered in-file, not current truth): `docs/product/vision.md`, `docs/product/requirements/life-ops-plugin-spec.md`, `docs/design/app-experience.md`, `docs/architecture/agent-memory.md`, `docs/architecture/data-model.md`."

Replace with:

> "Superseded UX/design folder (archived, properly relocated): `docs/design/Superseded by Intently-App/*`. Architecture docs reflect implementation pre-Supabase-cutover (markdown-vault → SQL migrations) but contracts remain load-bearing — see ADR 0008 for scope. Vision and functional spec docs (`docs/product/vision.md`, `docs/product/requirements/life-ops-plugin-spec.md`) are active reference."

### Action 3 — Author ADR 0008

Path: `docs/decisions/0008-scope-of-design-folder-supersession.md`

Pre-drafted content (implementer can refine):

```markdown
# 0008 — Scope of the 2026-04-25 design-folder supersession

**Status:** Accepted
**Date:** 2026-04-26
**Supersedes:** none (corrects an over-applied banner sweep)

## Context

On 2026-04-25, a new design folder (`docs/design/Intently - App/`) replaced the prior UX-design folder, which was relocated to `docs/design/Superseded by Intently-App/`. ADR 0004 (web-only pivot) landed in the same wave. A subsequent doc-sweep applied "⚠ ORIGINAL INTENT — not current ground truth" banners to 5 docs (`vision.md`, `life-ops-plugin-spec.md`, `agent-memory.md`, `data-model.md`, `document-taxonomy.md`), treating "pre-2026-04-25" as the test for supersession. User clarified 2026-04-26 that the supersession was scoped to UX/screen-level docs ONLY — the design folder describes how the app looks and behaves, not the backend architecture, vision, functional contracts, security posture, release process, ethical design, or accessibility commitments.

## Decision

**The 2026-04-25 design-folder replacement supersedes UX/screen-level docs only.** Date is not the test; scope is.

**In scope of supersession** (correctly archived):
- `docs/design/Superseded by Intently-App/*` — the prior UX folder

**NOT in scope of supersession** (banners removed or reframed; remain active reference):
- `docs/architecture/*` — backend architecture; markdown-vault implementation has been superseded by Supabase migrations, but the schema-shaped intent and contracts are load-bearing. These docs carry a reframed banner explicitly distinguishing intent (still authoritative) from implementation (moved). See `0001_initial_schema.sql` through `0006_calendar_email.sql` for current implementation.
- `docs/security/*` — security posture, threat model, privacy policy for builders. Always relevant.
- `docs/release/*` — release process and gates. Always relevant.
- `docs/process/*` — session handoff, parallel tracks, acceptance criteria, definition of done. Always relevant.
- `docs/product/vision.md` — product thesis. Vision-level, not implementation-level.
- `docs/product/requirements/*` — functional contracts (V1 scope, cascade design, etc.). Implementation references in these docs are illustrative; the contracts themselves stand.
- `docs/design/ethical-ai-design.md` — ethical design principles. Always relevant.
- `docs/design/mobile-app-accessibility-design.md` — accessibility commitments. Always relevant regardless of platform pivot.

## How to apply this rule going forward

Before applying any "superseded" / "archived" / "original intent" banner to a doc:

1. **Identify the supersession source** (specific ADR or replacement folder). "Pre-X-date" is not a supersession — only an explicit decision is.
2. **Test the scope.** Does the supersession source actually cover the doc's subject matter? UX-design replacement does not supersede backend architecture. A schema migration supersedes "how state is stored," not "what entities exist or why they matter."
3. **Prefer reframed banners over blanket banners** when implementation moved but intent stands. "Implementation moved, contracts did not" is more accurate than "do not derive current X from it."
4. **Cite this ADR in the banner** when the supersession is scope-bounded (as with Supabase migrations vs. architecture intent). Forces the next maintainer to test scope before extending the banner.

## Consequences

- The 5 docs (vision, life-ops-plugin-spec, agent-memory, data-model, document-taxonomy) are restored to active-reference status with corrected banners (or no banner where none was warranted).
- The TRACKER pointer line is corrected to reflect actual supersession scope.
- Future doc reorganizations must explicitly cite a supersession source before applying banners — the CLAUDE.md "trim → update TRACKER pointer → drop ADR" discipline applies to banner-application as much as it does to active-state changes.

## Locked

This is a decision-correction ADR. It does not lock new architecture; it locks the *meaning* of the 2026-04-25 design-folder supersession so future sweeps can't re-broaden it.
```

## Sibling-session validation tasks (run before /groom executes Option C)

The sibling worktree may have unmerged work touching these docs. Validate first:

- [ ] grep `ORIGINAL INTENT\|do not derive` across the working branch's `docs/` — does the working branch have additional banner-archived docs not in this list?
- [ ] git log on each of the 5 affected docs — confirm the banner-application date and commit; check whether the working branch has any subsequent edits to these docs that would conflict with banner-stripping
- [ ] Confirm no in-flight branch is in the middle of rewriting any of the 5 docs (else coordinate the un-archive with that branch's owner)
- [ ] Confirm `docs/decisions/0008-*.md` slot is open (latest existing ADR is 0007 per `chat/0426-005256` snapshot — sibling should re-verify)
- [ ] Check whether any in-flight handoff or skill prompt explicitly cites the "do not derive" wording from one of the 5 docs (e.g., a session prompt that says "this doc is original intent, ignore"). If yes, those references need updating after un-archive.

## Acceptance criteria (for the implementing session)

- [ ] Banners on `docs/product/vision.md` and `docs/product/requirements/life-ops-plugin-spec.md` removed entirely — file leads with the title, not a banner block
- [ ] Banners on the 3 architecture docs (`agent-memory.md`, `data-model.md`, `document-taxonomy.md`) replaced with the reframed "implementation moved, contracts did not" banner that cites ADR 0008
- [ ] TRACKER.md line 21 (the "Original-intent docs" pointer line) replaced per Action 2 above
- [ ] ADR 0008 authored at `docs/decisions/0008-scope-of-design-folder-supersession.md`
- [ ] No other doc in the repo carries "⚠ ORIGINAL INTENT" banner pointing at a 2026-04-25 supersession unless ADR 0008 explicitly authorizes it
- [ ] Search for any references TO the wrong banners in skill prompts, handoffs, or README files; update or remove them
- [ ] One PR bundling all of the above; PR description references this inbox slug + ADR 0008

## Why "all in one PR"

Strip + reframe + TRACKER fix + ADR are interlocking. Stripping banners without authoring ADR 0008 leaves the system without the durable scope-lock — the next sweep re-archives. Authoring ADR 0008 without stripping leaves the docs banner-archived and contradicts the ADR. The 4 actions are one atomic correction.

## Open questions

- **Reframed banner wording.** The suggested wording is precise but slightly wordy. Implementer may shorten as long as it preserves: (a) intent vs implementation distinction, (b) pointer to migrations for current implementation, (c) citation of ADR 0008.
- **Should `life-ops-plugin-spec.md` get the reframed banner instead of no banner?** It does describe markdown-shaped storage in places. Lean: no banner — the cascade design is the load-bearing thing; markdown framing is illustrative. Implementer's call after re-reading.
- **Should this remediation be its own handoff or just executed inline?** Lean: inline (Option C is small enough — single PR, ~2hrs work). Confirm during /groom.

## Why this matters

If the 5 banners stay, future Claude sessions will encounter them, take them at face value ("don't derive current X from this"), and skip the load-bearing intent. The user has already lost time on this — the prior session in this branch read all 3 architecture docs in full and had to manually reason past the banners to extract still-relevant intent (see meta-briefing inbox item from this same session: it explicitly notes "the user said 'a large part of these still matters'" as the licensing for using them). Without the un-archive + ADR, every future session pays this cost or, worse, doesn't notice and skips foundational decisions outright. The user's concern — *"now I'm worried that it skipped over a lot of foundational architecture decisions that we had already made"* — is the load-bearing risk this item closes.

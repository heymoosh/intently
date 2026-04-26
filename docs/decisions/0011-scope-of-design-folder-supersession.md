# 0011 — Scope of the 2026-04-25 design-folder supersession

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
- `docs/architecture/*` — backend architecture; markdown-vault implementation has been superseded by Supabase migrations, but the schema-shaped intent and contracts are load-bearing. These docs carry a reframed banner explicitly distinguishing intent (still authoritative) from implementation (moved). See `supabase/migrations/` for current implementation.
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

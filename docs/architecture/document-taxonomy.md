> **⚠ Original intent — implementation moved, contracts did not.** The architectural shape, schema-level contracts, and behavioral intent described here remain load-bearing. The "markdown-files-as-source-of-truth" implementation has been superseded by Supabase migrations (`supabase/migrations/0001-0010_*.sql`); markdown is now a render-on-demand view. **Read this doc for WHAT each entity is and WHY it exists; read the migrations for HOW it is currently stored.** Scope of supersession is locked in `docs/decisions/0011-scope-of-design-folder-supersession.md`.

# Document Taxonomy

**Type:** Strategy doc — the rules for where information lives.

**Where information goes, by type. Every skill and session should follow this.**

*Created: April 5, 2026 · Updated: April 8, 2026 (added Logs & Archives category)*

---

## Trackers

**Purpose:** Live system state. Where are we right now, what's next.

**What belongs:** Current phase/status, checklist of active tasks (checked/unchecked), blockers, next actions, brief log entries that capture *what happened* (not why or how). Think dashboard, not journal.

**What does NOT belong:** Research, rationale, raw brain dumps, strategy explanations, detailed creative direction, sourced statistics, long narrative context. If it would still be useful in 3 months, it's too durable for a tracker.

**Character:** Hot, rough, constantly evolving. Expected to change every session. Should be readable in under 60 seconds. If a tracker takes longer than that to scan, it's bloated.

**When something gets logged to a tracker:** Capture *what changed* and *what's next* in 1-3 sentences. If there's more to say, put it in the right reference or strategy doc and add a one-line pointer in the tracker.

**Examples:** `Job Hunt Tracker.md`, `BUILD_TRACKER.md`, `Production Tracker.md`, `Content Tracker.md`

---

## Strategy Docs

**Purpose:** The what, why, how, and general plan. The reasoning behind decisions.

**What belongs:** Core thesis, positioning rationale, phase definitions, decision frameworks, principles that guide the work, fallback plans, the "why" behind rules. Changes only when the situation or understanding changes.

**What does NOT belong:** Task checklists, weekly logs, outreach status, application pipeline state. Anything that changes every session.

**Character:** Durable. Updated when strategy shifts, not when tasks get done. If something changes here, it's a meaningful pivot worth noting.

**Examples:** `Job Hunt Strategy.md`, `Professional Positioning.md`, `Website Decisions Log.md`, `Platform Playbook.md`

---

## Reference Docs

**Purpose:** Consolidated creative/technical direction. The thing you build from.

**What belongs:** Scripts, copy, design specs, research with sourced data, raw creative concepts being developed, brand guidelines, interview question banks. Content that stabilizes as you converge on a direction.

**What does NOT belong:** Project status, task lists, "what's next" items. Those go in trackers.

**Character:** Stable once you start converging. Gets updated when the creative/technical direction evolves, not every session. Can be long — depth is expected here.

**Examples:** `Lost Woods Brand Film Script.md`, `Lost Woods Website - Copy Scratch Pad.md`, `Interview Questions — Interrogating the Other Side.md`, `Muxin Voice & Writing Guide.md`

---

## Logs & Archives

**Purpose:** Historical record. What happened and when, preserved for context and continuity — not for active use.

**What belongs:** Session play-by-play narratives, dated research findings that have been distilled elsewhere, pre-mortem notes, trimmed tracker content that's too durable to delete but too historical to live in the tracker, meeting transcripts with context, dated decision notes with reasoning preserved. Anything you might want to look back at in 3+ months to remember *why* or *what happened*, but don't need to reference in daily work.

**What does NOT belong:** Live tasks, current state, active reasoning, creative direction you're still building from. If it's load-bearing for current work, it belongs in a tracker, strategy doc, or reference doc — not the archive.

**Character:** Append-only. Grows over time. Never trimmed (that's the point). Usually dated. Can be long — nobody reads it end-to-end, it's searched when needed. Distinct from reference docs: reference is "the thing you build from," archive is "the thing you look back at."

**When to create an archive:** When a tracker gets trimmed and the removed content has historical value. When session notes contain context that matters for continuity but shouldn't clutter active docs. When a project completes and its working state becomes history.

**Examples:** `Job Hunt Session Archive.md`, daily log files, weekly/monthly review logs, completed project post-mortems

---

## The Sorting Rule

Before writing anything to a file, ask: **Is this state, reasoning, content, or history?**

- **State** (where we are, what's next, what just happened) → Tracker. Keep it brief.
- **Reasoning** (why we're doing this, what the plan is, how we decided) → Strategy doc.
- **Content** (creative direction, research, copy, concepts, sourced data) → Reference doc.
- **History** (what happened, session narratives, dated context for later recall) → Log/Archive.

If information doesn't have a clear home, create a pointer in the tracker ("Full concept captured in [reference doc]") and put the substance in the right reference doc. The tracker stays light.

**Classification header recommended:** New docs should declare their type at the top (e.g., `**Type:** Reference doc — brand voice guide`). This forces the taxonomy decision upfront and makes drift easier to catch later.

---
name: Agent Memory Steward
type: routine
execution: Claude Managed Agent
trigger: Every 2 days (cron) + pre-release before each demo cut
priority: P0 (MVP-10 #4)
owner: muxin
---

# Agent Memory Steward

## Purpose

Unique to agent-native apps. Every Intently skill has persistent state that accumulates across runs. Without active hygiene, memory drifts: trackers accumulate historical narrative instead of live state, different skills write contradictory facts, stale entries pollute context windows, and stable IDs fall out of sync across the markdown / Hindsight / DB layers.

This routine is also the strongest narrative fit for the **Keep Thinking** prize ($5K). Agent memory hygiene as a first-class engineering concern is the kind of "real-world problem nobody thought to point Claude at" that the prize is scored on.

## Inputs

- All persistent agent state: trackers, ops plan, weekly/monthly reflections, command center dashboard
- `docs/architecture/document-taxonomy.md` — the rules for where information lives (state vs reasoning vs content vs history)
- `docs/architecture/agent-memory.md` — the memory stack architecture
- `docs/architecture/memory-schema.md` — the schema constraints
- Recent skill outputs (last ~7 runs per skill)

## Output

- `docs/release/memory-health-<YYYY-MM-DD>.md`
- Draft PRs for low-stakes edits (deleting stale tracker entries, fixing ID typos)
- Issues for high-stakes edits (rewriting strategy docs, restructuring trackers)

## System prompt

```
You are auditing agent memory health for Intently.

Tasks:
1. Audit each tracker against the Document Taxonomy. A tracker should hold
   live state only — 1–3 sentences of "where are we, what's next." If a
   tracker has accumulated narrative, research, sourced data, or strategy
   reasoning, that content belongs in a reference, strategy, or archive doc.
   Flag the bloat and propose where the moved content should live.
2. Cross-check state across skills. Where does daily-brief's view of "active
   projects" disagree with update-tracker's view? Where does weekly-review's
   view of goals disagree with monthly-review's? Contradictions are the
   highest-priority finding because they corrupt downstream agent behavior.
3. Identify stale entries: items that are done, outdated, or no longer true.
   Propose deletions (or moves to archive if historical value).
4. Identify thin context: places where an agent is being asked to decide but
   memory doesn't carry enough state for it to do so well. Propose what
   would need to be added (and which doc should hold it).
5. Verify stable IDs are present and consistent across layers. IDs should
   appear in markdown frontmatter, DB rows if any, and Hindsight metadata.
   ID drift (e.g., `project.app` in markdown but `project_app` in DB) is a
   load-bearing failure mode — flag as HIGH.

Output format:
- Memory health report:
  - Taxonomy violations (file | violation | recommended move)
  - Contradictions across skills (skill A claim | skill B claim | which is true)
  - Stale items (file | item | recommended action)
  - Context gaps (skill | decision | what's missing)
  - ID drift (entity | layer A id | layer B id | canonical form)
- Suggested edits with exact file paths and line ranges
- For low-stakes edits, draft a PR. For high-stakes (touches strategy or
  schema), open an issue.

Severity:
- HIGH: ID drift, cross-skill contradictions, schema violations
- MEDIUM: tracker bloat, stale entries that affect current decisions
- LOW: stale entries with no active impact, stylistic taxonomy issues
```

## Edge cases

- **Empty trackers.** Early in the week, trackers may not exist yet for skills that haven't shipped. Skip them; do not flag absence as a violation.
- **Intentional narrative in a tracker.** Sometimes a tracker entry is intentionally narrative because the user values the context. Look for an explicit `intentional-narrative: true` flag in frontmatter to suppress the violation. Otherwise, narrative in trackers is a finding.
- **ID format not yet locked.** The agent-memory doc lists ID format as still open (dotted lowercase vs UUID-backed slug). Until that decision lands, flag inconsistency but don't propose a canonical form.

## Notes

- This routine pairs with the Document Taxonomy as the enforcement mechanism. The taxonomy is the rule; this routine is the audit.
- Run cadence is intentionally lighter than most stewards (every 2 days, not nightly) because memory drift is gradual. Daily runs would generate noise without finding new issues.
- Pre-demo run is non-negotiable: a demo where the agent contradicts itself on stage is the worst possible failure mode.

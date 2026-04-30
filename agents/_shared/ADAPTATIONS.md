# Skill Adaptations — Source-Import Cleanup

**Status:** Initial import cleanup complete (2026-04-22). All four imported skills have been rewritten to remove source-specific references and align with the Intently schema. Remaining items are architectural follow-ups for the build phase, not mechanical cleanup.

## Completed in the initial pass

All four skills had these issues resolved:

- ✅ Hardcoded absolute file paths → path resolution via `notes_folder_path` in config.
- ✅ Emojified filenames from the source system → canonical filenames from `data-model.md`.
- ✅ Reflection filename dereferenced via `reflection_filename` in config instead of being hardcoded.
- ✅ Source-specific project names stripped → replaced with generic lookup via config's Projects section.
- ✅ Personal name references → generic user addressing.
- ✅ Transcript-reading sub-agent pattern (specific to the source platform) → replaced with reading today's chat history from the conversations store (in `daily-review` step 2). Removed from `daily-brief` entirely.
- ✅ Domain-specific frontmatter checks removed from `daily-brief`.
- ✅ Monthly Priorities location updated from `Ops Plan.md` → `Monthly Goals.md` per new schema.
- ✅ Document taxonomy references point at the canonical doc in this repo.

## Per-skill — completed

### daily-brief
- ✅ Domain-specific campaign file check removed.
- ✅ Transcript-digest step removed (daily-brief now reads Daily Log's prior entry directly for "where you left off").
- ✅ Unprocessed notes frontmatter check removed.
- ✅ Health step gated on `health_file_enabled: true` in config.
- ✅ Integration fallback rule added (graceful skip on `not_connected`).
- ✅ Weekly handoff logic added (generic — reads `weekly_review_day` from config, no hardcoded day).
- ✅ P1-must-serve-Monthly-Goal enforcement rule added with override trade-off surfacing.

### daily-review
- ✅ Transcript-digest sub-agent pattern replaced with chat-history reconciliation (step 2).
- ✅ Hardcoded tracker path map removed — generic lookup via config.
- ✅ Narrative-first presentation pattern preserved verbatim (this is the differentiator — protected).
- ✅ First-run handling added.

### update-tracker
- ✅ Hardcoded tracker location table removed.
- ✅ Hardcoded strategy doc map removed — generic lookup via config.
- ✅ Reference to external project-continue skills removed (project-continue not in V1 MVP).
- ✅ Document taxonomy pointer corrected.
- ✅ First-run handling added.

### weekly-review
- ✅ Expanded from a thin import to full behavior matching `docs/product/requirements/life-ops-plugin-spec.md`.
- ✅ Domain-specific financial-zone check removed.
- ✅ Monthly Priorities location updated.
- ✅ Full `Weekly Goals.md` rewrite step added (previously missing).
- ✅ Personal extensions rewrite pattern added (preserves `<!-- personal: -->` sections).
- ✅ First-run handling added (flips `first_run_complete: true` at the end of the first successful run).
- ✅ Weekly handoff logic added (generic — honors `weekly_review_day` from config).

## Open items — flag for build phase

These are not mechanical cleanup; they're architectural decisions that land during backend scaffolding.

- **Chat history store schema.** `daily-review` step 2 reads "today's chat history from the conversations store." Not yet defined in Supabase. Shape needed: `user_id`, `created_at`, `role`, `content`, optional `skill_invocation_id`.
- **`read_calendar` and `read_emails` tool implementations.** Called by `daily-brief` step 3. Need actual tool functions backed by Google Calendar API and Gmail API.
- **Override tracking in Daily Log.** `daily-brief` step 5 writes Overrides when the user chooses a non-Monthly-Goal P1. `weekly-review` step 1 should read these when surfacing incomplete goals — currently it just compares Outcome-Directions to Done.
- **Personal-extensions preservation pattern in weekly-review step 8.** Implementation needs careful regex or Markdown parsing so the HTML comment markers aren't broken by Markdown renderers or editors.
- **First-run flag flip location.** Currently `weekly-review` flips `first_run_complete: true` at the end of its first run. Verify no other skill writes to this flag.
- **Document taxonomy check in `update-tracker` step 3.** References `docs/architecture/document-taxonomy.md`. Confirm that doc is readable from the agent's context at runtime; otherwise inline the one-paragraph sort rule.

## What this doc becomes after V1 ships

Once V1 is demonstrated and the skills have run against real user flows, this file gets archived. Future adaptation work moves to ADRs (for architectural changes) or commit messages (for tactical tweaks).

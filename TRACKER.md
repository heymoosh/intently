# Intently Hackathon Tracker

**Purpose:** First doc a new session reads to resume. Follows the project's own Tracker.md schema (see `docs/architecture/data-model.md`). Keep it slim — if it grows past ~100 lines, trim it.

## Status

**Phase:** Build.
**Status:** 🟡 On track.
**Last:** Expo app scaffolded in `app/` (TypeScript, Past/Present/Future `PagerView` shell, `react-native-markdown-display` rendering, stub voice button). Typecheck green.
**Next:** Managed Agents TS SDK wiring (skill loader: concat `agents/_shared/life-ops-conventions.md` + `agents/<skill>/SKILL.md` → agent definition).
**Last updated:** 2026-04-22

## Critical items awaiting review

*Populated by `release-readiness-steward` at 03:00 daily when overnight routines surface items that need human decision (not auto-fixable). Empty = nothing blocking. Per CLAUDE.md, Claude walks through these with Muxin at session start before substantive work.*

_(none)_

## Follow-ups (pending flight test / manual steps)

- **Promote overnight build loop to recurring** — first flight tonight (2026-04-22 → 23). Brief: `.claude/loops/overnight-build-loop.md`. If ≥3 clean PRs ship, add a `build-loop` case to `~/.intently/bin/intently-routine.sh` + a launchd plist firing at 23:30 daily. Each schedule re-picks model/effort against `/Users/Muxin/Documents/Personal Obsidian/Projects/Opus 4-7 Hackathon/Claude Code Practices/When to use opus 4.6, 4.7, and sonnet 4.6.md` per that night's scope.
- **Release-readiness plist move 07:00 → 03:00** — ✅ DONE 2026-04-22 evening. Live plist Hour=3 confirmed via `plutil`. First scheduled fire: 2026-04-23 03:00 local (see verification item below).
- **Verify release-readiness 03:00 first fire** — 2026-04-23 ~03:05+. Check `~/.intently/logs/release-readiness.log` for a START/END pair; confirm `.claude/routine-output/release-readiness-2026-04-23.md` exists and contains the per-demo-flow go/no-go synthesis. If the wrapper's post-run integrity check logs a WARN ("expected output missing"), the agent wrote somewhere wrong — prompt tuning needed.
- **Verify auto-merge-safe.yml classifies correctly** — runs after any `auto/*` PR triggers `security.yml`. Fastest test path: `launchctl kickstart gui/$(id -u)/com.intently.privacy` to force a real draft PR from the privacy steward, then watch GitHub Actions tab. Mechanical paths should auto-merge; docs should flip ready + get `needs-muxin-review` label; code should stay draft. `--admin` flag bypasses branch protection (there is none yet).
- **Delete stale remote branch** — `git push origin --delete feat/slim-claude-md` (old branch name before this session's rescope; current session committed on `feat/mvp10-scaffold-and-infra`). Safe — no unique commits on the old remote.
- **Thursday 2026-04-23 post-stack-decision** — wire `ci.yml` (lint, typecheck, unit tests, build) per stack. Then update `auto-merge-safe.yml` to move code PRs from "stays draft" to "auto-merge on ci.yml + security.yml both green." That completes the "auto-fix anything that can be fixed without me" intent.

## Next (in order — start here)

1. **Managed Agents TS SDK.** Install, wrap skill loading (concat `agents/_shared/life-ops-conventions.md` + `agents/<skill>/SKILL.md` → agent definition).
2. **Google OAuth app registration.** Calendar + Gmail scopes.
3. **Tool implementations.** `read_calendar`, `read_emails`, `read_file`, `write_file` — Edge Functions calling Supabase or Google APIs.
4. **`pg_cron` schedules** tied to config times (`daily_brief_time`, `daily_review_time`, `weekly_review_day`/`weekly_review_time`).
5. **Demo seed data.** Realistic Goals, Monthly Goals, Weekly Goals, 2–3 projects, a week of Daily Log and journal entries.
6. **Record three demo flows end-to-end.** Hindsight self-host on Fly — only if time allows.
7. **Submission.** README, demo video, "how we used managed agents" narrative.

## Open questions (resolve as we hit them)

- **Managed Agents waitlist approval timing.** Blocks Memory feature usage. Agents still run without it (re-read Layer 1 each invocation).
- **`vault_ids` vs Bitwarden reconciliation.** Anthropic's session-credential pattern may conflict with our Bitwarden-only secrets rule. Resolve during backend scaffold.
- **Demo target surface:** physical phone, simulator screencap, or web browser. Changes polish budget.
- **Thursday 2026-04-23 Michael Cohen session.** Managed Agents specifics. Bring: scheduling pattern confirmation, `vault_ids` question, any surprise constraints on tool-use.

## Locked decisions (do not re-litigate — see ADRs for reasoning)

- **MVP scope:** 5 skills — `setup`, `daily-brief`, `update-tracker`, `daily-review`, `weekly-review`.
- **Demo flows:** daily brief, daily review, weekly review.
- **Stack (ADR 0003):** Expo + TypeScript · Supabase (Postgres + Storage + Auth + `pg_cron` + Edge Functions) · Managed Agents TS SDK · Expo Speech STT · Hindsight self-hosted on Fly (~$5/mo) · Bitwarden Secrets Manager.
- **Managed Agents is runtime, not state (ADR 0001).** State of truth = Markdown in Supabase. Memory feature, if approved, is a cache.
- **Per-user data store = Supabase (ADR 0002).** No external note-app integration in V1.
- **Calendar/email via direct OAuth → Google APIs.** MCP deferred to V2.
- **Deferred to backlog:** Honcho, OpenClaw, Hermes, Cyrano, Discord routing, game reskinning, gamification, somatic exercises, kanban/Gantt, monthly-review, daily-triage, project-continue, session-digest, vault-drift-check, notes-action-sync.

## Timeline

- Hackathon: 2026-04-21 → 2026-04-26 (submission deadline 2026-04-26)
- Today: 2026-04-22
- Days remaining: 4

## Done

- Docs: `vision.md`, `life-ops-plugin-spec.md`, `app-experience.md`, `data-model.md`, `document-taxonomy.md`.
- ADRs: 0001 (runtime), 0002 (data store), 0003 (tech stack).
- Backlog folder: deferred content moved out of active doc tree.
- `agents/`: 5 `SKILL.md` files written, all personal references scrubbed.
- `agents/_shared/life-ops-conventions.md`: slim shared prefix.
- `agents/_shared/ADAPTATIONS.md`: cleanup tracker with open build-phase items.
- Waitlist submitted to Claude Managed Agents for Memory + Orchestration + Outcomes.

## How to resume in a new session

Point a new Claude session at this file:

> Read `TRACKER.md` first. Then `CLAUDE.md` for repo rules. Then jump to the `Next` section.

Update the **Status** block and prepend a dated **Log** entry below at the end of every non-trivial session.

## Log

### 2026-04-22 (continued)
- Wrote `supabase/migrations/0001_initial_schema.sql`: 6 tables (`profiles`, `life_ops_config`, `markdown_files`, `conversations`, `projects`, `events`), RLS owner-only on every user-scoped table, signup trigger auto-populates `profiles`. JSONB on `life_ops_config.config`, `conversations.turns`, `projects.metadata`, `events.metadata` so Thursday's managed-agents session learnings land as ALTERs not rewrites.
- Resolved ambiguity: `events` scoped as the Ops Plan "Time-Sensitive" mirror for V1 (not the backlog agent-run-log reading).
- Wrote `supabase/README.md`: apply instructions, known post-Thursday touch-points (`agent_run_id` on conversations, `vault_ids`/Bitwarden reconciliation, `pg_cron` schedule rows).
- Installed Supabase CLI (`brew install supabase/tap/supabase`), `supabase login`, `supabase init`, `supabase link --project-ref cjlktjrossrzmswrayfz`, `supabase db push` — migration applied to remote cleanly (pgcrypto pre-installed, handled by `if not exists`).
- Scaffolded Expo app at `app/` (blank-typescript template, Expo SDK 54). Installed `react-native-markdown-display`, `expo-speech`, `react-native-pager-view` via `npx expo install`.
- Built `app/App.tsx`: Past/Present/Future `PagerView` shell, `initialPage={1}` (Center default), each screen scrolls placeholder markdown rendered by `react-native-markdown-display`, overlay voice button (stub — alerts "voice coming soon" pending STT wiring; note that Expo Speech is TTS, true STT will need `expo-speech-recognition` or similar). `tsc --noEmit` clean.

### 2026-04-22
- Docs cleanup: trimmed `agent-memory.md` to V1 scope; moved cross-agent vision, game reskinning, and full memory schema to `docs/backlog/`.
- ADRs 0001 (managed-agents-as-runtime), 0002 (Supabase), 0003 (V1 stack with revisit triggers) written.
- Managed Agents MCP + tool-use patterns confirmed via Anthropic docs; scheduling will be owned by our backend (`pg_cron`).
- Hindsight confirmed MIT; self-host on Fly — can defer for demo if time-pressed.
- Setup skill drafted from scratch at trimmed scope (goals + projects + week seed + optional OAuth).
- Four source-imported skills adapted: hardcoded paths, personal references, and source-platform-specific patterns all removed.
- `life-ops-conventions.md` slimmed to ~50 lines — global rules only; per-skill concerns moved into each `SKILL.md`.
- Waitlist submission for Managed Agents Memory/Orchestration/Outcomes.

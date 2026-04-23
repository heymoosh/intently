# Product Brief

**Type:** Reference doc — what we're building for the Opus 4.7 hackathon and why.
**Created:** 2026-04-21

---

## The Build

**Intently** — Life Ops as a mobile app. Ready to use out of the box, no Claude Code / Cowork / skills setup required. A thin mobile UI over scheduled agents that handle the recurring operations of a life (morning brief, end-of-day review, weekly review).

## Problem statement fit

**Primary: "Build From What You Know."** Muxin already runs Life Ops daily via Claude Code skills on top of Markdown files. The system works for one technical user. The hackathon build turns that personal system into something a non-technical person can install and use.

**Secondary: "Build For What's Next."** Agent-native mobile app — agents do the work on a schedule; the UI reflects state. Not a CRUD app with AI features bolted on.

## Scope

The product spec for the Life Ops rhythm itself (skill behaviors, tracker formats, cascade logic) lives in `docs/product/requirements/life-ops-plugin-spec.md`. The hackathon-scoped skill set is decided in coordination with that spec — most skills in the spec are cut for the 4-day build and deferred.

The three demo flows that MUST work end-to-end for submission:
1. **Daily brief** — user opens the app; the agent has already produced today's orientation.
2. **Daily review** — end of day wrap; the agent captures done, trims yesterday, prompts reflection.
3. **Weekly review** — the compounding engine; rewrites Weekly Goals for the next week.

## Architecture

**Execution runtime: Anthropic Managed Agents.** Every scheduled Life Ops job runs as a Claude Managed Agent. The mobile app is a UI that reads agent output, triggers runs on demand, and renders state. We do not self-host the agent loop.

**State store: Markdown files in Intently's per-user cloud store.** Not Obsidian, not the user's local filesystem. The app ships its own lightweight Markdown renderer and editor, so non-technical users never see raw symbols but can power-edit when they want. File shapes (`Weekly Goals.md`, `Daily Log.md`, `Projects/[Name]/Tracker.md`, etc.) follow `docs/architecture/data-model.md`.

**Structured task memory: Hindsight.** For tracker/task/decision state that benefits from query-by-ID beyond what a flat Markdown read provides. Integration path TBD during Session 2 (Thursday Apr 23).

**Portability:** Managed Agents is the runtime, not the state store. Prompts, tool schemas (JSON Schema), and the orchestration graph definition all live in this repo. If we ever swap providers or self-host the loop, the swap touches SDK imports — not the app. See `docs/decisions/0001-managed-agents-as-runtime.md`.

## UX direction

See `docs/design/app-experience.md` for the three-screen swipe model, voice-first input, dynamic chat cards, and the Undo safety net.

## Hackathon constraints

- Built entirely during the hackathon (Apr 21–26, 2026). No prior work reused.
- All code open source, MIT licensed.
- Solo build.

## Tracked elsewhere

- Submission checklist & build status → `[[Submission Tracker]]` (Obsidian, outside repo)
- Demo script → `[[Demo Script]]` (Obsidian, outside repo)
- Deferred cross-agent architecture (Hermes / OpenClaw / Cyrano / Honcho) → `docs/backlog/`

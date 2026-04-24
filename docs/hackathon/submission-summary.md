# Intently — Submission Summary

Intently is Life Ops as a mobile app: a thin UI over Claude Managed Agents that handle the recurring operations of a life. Three flows ship end-to-end — **daily brief**, **daily review**, **weekly review**. The agents do the work on a schedule; the phone catches up to it.

The build answers "Build From What You Know." For years Muxin ran Life Ops via Claude Code on top of Markdown. It worked for one technical user. Intently turns that personal system into something a non-technical person can install.

Opus 4.7 earns its seat in the synthesis moments — the daily brief that reads yesterday's journal, cross-references today's calendar, notices Tuesday's flagged fatigue, and opens with a check-in instead of a task list. Memory is multi-tier: MA's native memory tool for run-to-run context, Supabase-backed Markdown for state of truth.

Managed Agents is the runtime, not the state store. Scheduled `POST /v1/sessions`, `session.status_idle` events refreshing the UI — meaningful long-running work handed off, not simulated.

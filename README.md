# Intently

**Life Ops as a mobile app — your recurring operations, done by scheduled Claude agents.**

Live demo: **https://intently-eta.vercel.app** · Demo video: _[recording Sunday; link lands in final submission]_

## The demo in 30 seconds

Open the app in the morning. Your **daily brief** is already written — not because you wrote it, but because a Claude Managed Agent woke up at 6am, read yesterday's journal, cross-referenced today's calendar, noticed you flagged fatigue Tuesday night, and drafted the morning's orientation in your voice. You swipe. The brief is on the **Present** screen; what just happened is on **Past**; tomorrow's shape is on **Future**.

End of day, the **daily review** agent captures what moved, trims what didn't, and prompts a one-line reflection. Sunday, the **weekly review** agent rewrites next week's goals in light of the week that actually happened.

The app is a thin UI over agents. Agents do the work. The phone shows it.

## Why Managed Agents (the architectural bet)

Most "AI apps" wrap a chat box around a prompt. Intently is the opposite: **the work happens on a schedule without the user asking**, and the UI catches up to it.

**One-shot transformations** — "extract these three dates from a paragraph" — are plain API calls. **Scheduled, stateful, long-running work** — "run the daily brief every morning, remember Tuesday's fatigue, survive a retry, emit events the mobile app subscribes to" — is a Managed Agent. This split is codified in [ADR 0001](./docs/decisions/0001-managed-agents-as-runtime.md): Managed Agents is the **runtime**, not the state store.

State of truth stays in Intently's own store (Markdown in Supabase). Tool schemas are portable JSON Schema. The orchestration graph lives in this repo. Managed Agents is the loop we don't have to rebuild — scheduled `POST /v1/sessions`, event stream (`session.status_idle` → UI refresh), credential isolation via `vault_ids`, context compaction handled upstream. If we swap providers later, it's SDK imports, not a rewrite.

This is what earns the Managed Agents prize: **handing off meaningful, long-running work** instead of simulating it in a loop.

## The product

People already run "life ops" — a morning brief, an end-of-day wrap, a weekly re-plan. The pieces exist in journals, calendars, task apps, and habit trackers. What doesn't exist is the **compounding layer**: the system that reads yesterday to shape today, reads the week to rewrite next week.

Intently is that layer, built for someone who doesn't want to configure it.

- **Daily brief** — morning orientation that ties yesterday's journal + today's calendar + open projects into a coherent narrative.
- **Daily review** — evening wrap that captures what moved, trims what didn't, and shapes tomorrow.
- **Weekly review** — Sunday re-plan that rewrites next week's goals in light of what actually happened.

Full vision: [`docs/product/vision.md`](./docs/product/vision.md). Full behavior spec: [`docs/product/requirements/life-ops-plugin-spec.md`](./docs/product/requirements/life-ops-plugin-spec.md).

## Screenshots

<!-- TODO(web-pivot PR): embed a screenshot or short clip of the Present-screen AgentOutputCard rendering the daily-brief seed output. -->

*Screenshots land with the web-deploy PR. Until then, see the demo video linked above.*

## Built with

| Layer | Choice |
|---|---|
| Mobile | Expo / React Native (`app/`) |
| Backend | Supabase (Postgres, Edge Functions, `pg_cron`) |
| Agent runtime | Anthropic **Managed Agents** — scheduled session-based execution with native event stream ([architecture notes](./docs/architecture/managed-agents-event-topology.md)) |
| Models | Tiered: **Claude Opus 4.7** for synthesis (daily/weekly briefs, pattern recognition), **Sonnet 4.6** for extraction / routing / judging, Haiku for classifiers |
| Secrets | Bitwarden Secrets Manager — no `.env` commits, no hardcoded keys |

The Opus 4.7 tier is deliberate: the memory-moment beats in the demo (noticing yesterday's journal in today's brief, connecting last week's call to this week's opening) are the outputs that need reasoning, not extraction.

## Run locally

```bash
cd app
npm install
npm run web     # opens Expo Web
```

For iOS Simulator or Android Emulator: `npm run start`, then press `i` / `a` from the dev server menu. Full setup (environment variables, Supabase, Bitwarden): [`app/README.md`](./app/README.md).

## Repo structure

| Path | What's there |
|---|---|
| `agents/` | One folder per skill — `SKILL.md` + prompts. `agents/_shared/life-ops-conventions.md` is prepended to every skill. |
| `app/` | Expo / React Native mobile app. Three-screen swipe (Past / Present / Future). |
| `docs/` | Product spec, architecture, ADRs, design, process. Start at [`docs/product/vision.md`](./docs/product/vision.md). |
| `evals/` | Case datasets, scoring rubrics, baselines. Runner shared with `app/` test suite. |
| `supabase/` | Schema migrations, Edge Functions, `pg_cron` scheduling. |

## Hackathon

Built for **Built-with-Opus-4.7** (2026-04-21 to 2026-04-26). Problem statement: *"Build From What You Know."* Muxin's personal Life Ops system, turned into a mobile app non-technical users can install.

Full rollup and judging-weight alignment: [`launch-plan.md`](./launch-plan.md).

## License & attribution

Code: [MIT](./LICENSE).

Third-party dependencies: [`THIRD_PARTY_LICENSES.md`](./THIRD_PARTY_LICENSES.md) — 610 production packages across 17 license types, all reviewed for MIT compatibility.

# Intently (mobile app)

The one thing you should never have to do again: use the finicky UI of a productivity app to keep track of something.

## What this is

Intently is a mobile-first system that turns recurring life operations — daily brief, daily review, weekly review — into an agent-native experience. This directory contains the Expo/React Native frontend. Supabase handles the backend (Postgres, Edge Functions, `pg_cron`); Claude Managed Agents run the scheduled skills and write their output back as Markdown. The app reflects that state and lets you trigger runs on demand.

- Product rationale: [`docs/product/vision.md`](../docs/product/vision.md)
- Stack decision: [`docs/decisions/0003-v1-technology-stack.md`](../docs/decisions/0003-v1-technology-stack.md)

## Requirements

- Node 20+
- npm (the repo uses npm; lockfile is `package-lock.json`)
- One of:
  - **Expo Go** app on a physical iOS or Android device (scan the QR code)
  - **iOS Simulator** via Xcode
  - **Android Emulator** via Android Studio
- Supabase project — already provisioned; credentials come from Bitwarden Secrets Manager per the [secrets policy](../docs/security/privacy-policy-for-builders.md)

## Running locally

```bash
cd app
npm install
npm run start      # launches Expo dev server
```

From the dev server menu: press `i` for iOS simulator, `a` for Android emulator, `w` for web, or scan the QR code with Expo Go on a physical device.

## Scripts

| Script | What it does |
|---|---|
| `npm run start` | Expo dev server (universal; choose target from the menu) |
| `npm run ios` | Expo dev server, iOS target pre-selected |
| `npm run android` | Expo dev server, Android target pre-selected |
| `npm run web` | Expo dev server, web target pre-selected |
| `npm run typecheck` | `tsc --noEmit` — type-check without emitting JS |
| `npm run test:unit` | node:test runner via tsx; runs `app/lib/**/*.test.ts` and `../evals/runner/**/*.test.ts` |
| `npm run eval:run` | Evaluation harness CLI — see [`evals/runner/`](../evals/runner/) |

## Architecture at a glance

- **Skills** live at `agents/<name>/SKILL.md` and run as Managed Agents on a `pg_cron` schedule. The shared prompt prefix is at [`agents/_shared/life-ops-conventions.md`](../agents/_shared/life-ops-conventions.md).
- **State of truth** is Markdown stored in Supabase's `markdown_files` table (ADR 0002). Agents write; the app reads.
- **Schedules** fire via `pg_cron` calling `public.tick_skills()`, which invokes the agent runners. See [`supabase/migrations/0002_schedules.sql`](../supabase/migrations/0002_schedules.sql).
- **UI** is a three-screen swipe shell — Past / Present / Future — powered by `react-native-pager-view`. See [`docs/design/app-experience.md`](../docs/design/app-experience.md) for the full UX rationale.

For a deeper dive: [`docs/architecture/data-model.md`](../docs/architecture/data-model.md) and [`docs/architecture/agent-memory.md`](../docs/architecture/agent-memory.md).

## Environment variables

Copy `.env.example` to `.env.local` and fill in the missing value before running.

| Variable | Purpose | Source |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase dashboard; safe to commit as an example |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-safe, RLS-gated) | Supabase dashboard; anon key only — never service role |
| `ANTHROPIC_API_KEY` | Direct Claude API calls (agent runner fallback, eval scorer) | Bitwarden Secrets Manager — copy to `.env.local`, never commit |

`EXPO_PUBLIC_` variables are bundled into the JS at build time. Never put the Supabase service-role key or `ANTHROPIC_API_KEY` in an `EXPO_PUBLIC_` variable.

No `.env` file is committed. Full secrets rule: [`docs/security/privacy-policy-for-builders.md`](../docs/security/privacy-policy-for-builders.md).

## Tests

Unit tests live alongside each module in `app/lib/` (e.g., `agent-runner.test.ts`, `skill-loader.test.ts`, `tools.test.ts`). The eval harness tests live in `../evals/runner/`. Both sets run via:

```bash
npm run test:unit
```

All tests use `node:test` + `tsx` — no Jest, no real network calls in unit tests.

## Demo flows

The three skills shipping in V1:

| Flow | Skill definition | Acceptance criteria |
|---|---|---|
| Daily Brief — morning orientation | [`agents/daily-brief/SKILL.md`](../agents/daily-brief/SKILL.md) | [`docs/product/acceptance-criteria/daily-brief.md`](../docs/product/acceptance-criteria/daily-brief.md) |
| Daily Review — evening wrap | [`agents/daily-review/SKILL.md`](../agents/daily-review/SKILL.md) | [`docs/product/acceptance-criteria/daily-review.md`](../docs/product/acceptance-criteria/daily-review.md) |
| Weekly Review — Sunday re-plan | [`agents/weekly-review/SKILL.md`](../agents/weekly-review/SKILL.md) | [`docs/product/acceptance-criteria/weekly-review.md`](../docs/product/acceptance-criteria/weekly-review.md) |

Full product spec: [`docs/product/requirements/life-ops-plugin-spec.md`](../docs/product/requirements/life-ops-plugin-spec.md).

## Directory map

```
app/
├── App.tsx              # root component; three-screen PagerView shell
├── index.ts             # Expo entry point
├── app.json             # Expo project config
├── lib/
│   ├── agent-runner.ts  # invokes Claude Managed Agents; writes output to Supabase
│   ├── skill-loader.ts  # loads SKILL.md content for a given skill name
│   ├── supabase.ts      # Supabase client init
│   ├── tokens.ts        # design tokens (colours, typography, spacing)
│   └── tools.ts         # Claude tool definitions (read/write markdown_files, etc.)
├── assets/              # app icon, splash, favicon
├── package.json
└── tsconfig.json

Sibling directories (outside app/):
  agents/                # SKILL.md per skill + shared conventions
  supabase/              # migrations, Edge Functions
  evals/runner/          # evaluation harness (shared with app/ test:unit)
  docs/                  # architecture, design, process, product docs
```

## Deeper docs

- [`docs/product/vision.md`](../docs/product/vision.md) — why this product exists
- [`docs/design/app-experience.md`](../docs/design/app-experience.md) — UX direction, three-screen model, design principles
- [`docs/architecture/data-model.md`](../docs/architecture/data-model.md) — Supabase schema, `markdown_files` table, row-level security
- [`docs/architecture/agent-memory.md`](../docs/architecture/agent-memory.md) — how agents read and write state, memory lifetime
- [`docs/decisions/0001-managed-agents-as-runtime.md`](../docs/decisions/0001-managed-agents-as-runtime.md) — why Managed Agents (not plain API calls) run the skills
- [`docs/decisions/0002-per-user-data-store.md`](../docs/decisions/0002-per-user-data-store.md) — why Supabase Postgres is the state-of-truth, not agent memory
- [`docs/decisions/0003-v1-technology-stack.md`](../docs/decisions/0003-v1-technology-stack.md) — full stack decision (Expo, Supabase, pg_cron, Hindsight, Bitwarden)
- [`docs/security/privacy-policy-for-builders.md`](../docs/security/privacy-policy-for-builders.md) — secrets rule, privacy constraints for contributors
- [`supabase/README.md`](../supabase/README.md) — local Supabase setup, migration workflow

## Contributing

See [`CONTRIBUTING.md`](../CONTRIBUTING.md) and [`docs/process/`](../docs/process/) for branch conventions, PR standards, acceptance-criteria authoring rules, and the parallel-tracks workflow.

## License

See [`LICENSE`](../LICENSE) at the repo root.

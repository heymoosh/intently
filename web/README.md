# `web/` — Intently web app (deployable)

Per ADR 0004 (web-only, prototype-inherited), this directory is the deployable for `intently-eta.vercel.app`. It started as a copy of the design prototype (`docs/design/Intently - App/`) committed via PR #95.

## Structure

- `index.html` — entry point. Self-contained HTML loading React 18 + Babel-standalone from unpkg, plus the `intently-*.jsx` files via `<script type="text/babel" src="..."`>` tags.
- `design-system.html` — the design system canvas. Review surface, not part of the production app.
- `intently-*.jsx`, `ios-frame.jsx`, `design-canvas.jsx` — components. Loaded by `index.html`. **No build step.**
- `PORTING.md`, `WIRING-POINTS.md` (forthcoming) — Saturday's wiring-port reference; describes how `app/lib/**` slots into the prototype's hooks.

## Stack

- **React 18 + Babel-standalone** (no build step). Browser parses JSX at runtime.
- Vendored from unpkg in `index.html`: `react@18.3.1`, `react-dom@18.3.1`, `@babel/standalone@7.29.0`.
- Babel scripts don't share scope. Components export to `window` at end of file via `Object.assign(window, {...})` — see existing JSX for pattern.

## Relationship to `docs/design/Intently - App/`

The design folder is the **immutable spec** (committed via PR #95). `web/` is the **mutable deployable**. They started identical. As wiring lands here, `web/` diverges; design folder stays as the visual ground-truth.

If a `web/` change should propagate back to the design folder (e.g., a tweak the designer should adopt), file an issue or PR explicitly — don't auto-sync.

## Relationship to `app/`

`app/` (Expo + React Native Web) is **being phased out** per ADR 0004. Its functional surfaces (`app/lib/ma-client.ts`, `app/lib/voice.ts`, reminders fetch calls, Supabase client) port to `web/` Saturday in a focused live session.

Until that port lands, the live deploy at `intently-eta.vercel.app` continues serving the Expo build from `app/`. Cut-over flips Vercel's project root from `app/` to `web/`.

## Deploy

Active. Repo-root `vercel.json` configures the existing `intently-eta.vercel.app` project to serve this directory as static — no build step, no install, framework: none.

```jsonc
// /vercel.json
{
  "buildCommand": null,
  "installCommand": null,
  "framework": null,
  "outputDirectory": "web",
  "cleanUrls": true
}
```

Vercel auto-deploys on push to `main`. If the deploy stays stuck on the old Expo build, check the project settings dashboard — **Root Directory must be empty (repo root)**, not `app/`. Once Root Directory is correct, the repo `vercel.json` takes effect on the next push.

## House rules (inherited from design folder's CLAUDE.md)

- **Mobile-first, always in a phone frame.** Design at 393×852. Wrap in `<Phone>`.
- **The hero affordance is the ONE interaction surface.** Voice, chat, commits, review, brief generation all funnel through it. Do not add parallel buttons.
- **Phase and zoom are data, not UI.** No top-level chrome (tabs, segmented controls, phase toggles) beyond the three-tense system.
- Tokens live in `intently-tokens.jsx`. Never hardcode colors, radii, shadows, fonts — add a token first.

For details, see `docs/design/Intently - App/CLAUDE.md`, `BUILD-RULES.md`, `HANDOFF.md`.

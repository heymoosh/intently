# 0004 — Web-only, inherit the design prototype directly

**Status:** Accepted
**Date:** 2026-04-25
**Decider:** muxin
**Supersedes:** [ADR 0003](0003-v1-technology-stack.md)

## Context

ADR 0003 (2026-04-22) locked Expo + React Native Web on the premise "must run on iOS and Android; web is a V2-but-nice-to-have." Two things changed by 2026-04-25:

1. **Hackathon submission requires a shareable URL.** The demo isn't a TestFlight build or APK — it's a link reviewers click. iOS/Android distribution stops mattering for the submission window.
2. **The design folder (replaced 2026-04-24) ships an interactive prototype as plain React 18 + Babel-standalone.** `docs/design/Intently - App/Intently Prototype.html` is a self-contained 41KB HTML file that loads JSX components via `<script type="text/babel" src="...">`. It already implements the screen patterns, swipe gestures, hero affordance, journal renderer, painterly visuals — the entire visual surface.

Maintaining Expo + RN-Web as the deploy stack while the design source-of-truth is plain React DOM means perpetually translating prototype patterns to RN-Web (`<div>` → `<View>`, Tailwind-like classes → StyleSheet, CSS animations → react-native-reanimated, etc.). That's labor that produces no functional value — only visual fidelity to the prototype the team already wrote.

The "running on iOS/Android natively" benefit of RN-Web doesn't come due during the hackathon (Sunday 2026-04-26 submission). It would only land in a hypothetical V2.

## Decision

| Layer | Choice | Notes |
|---|---|---|
| **Frontend** | **Plain React 18 + Babel-standalone**, no build step. Inherits `docs/design/Intently - App/Intently Prototype.html` and its `intently-*.jsx` components by copy-then-extend into `web/`. | Same stack as the design folder. Eliminates the translation layer entirely. |
| **Deployable directory** | `web/` | Replaces `app/` as the primary deploy target. `app/` enters phase-out — its lib code (MA client, voice, reminders, Supabase client) ports to `web/`, then `app/` gets archived or deleted. |
| **Functional wiring** | Ported from `app/lib/**` into inline `<script>` blocks in `web/index.html` (or sibling `.js` files loaded by it). | `app/lib/ma-client.ts`, `app/lib/voice.ts`, reminders fetch calls, Supabase client are framework-agnostic JS — port mechanically. |
| **Hosting** | Vercel (unchanged). Static deploy of `web/` instead of Expo Web build. | Existing project at `intently-eta.vercel.app`. New `vercel.json` directs the build at `web/` (or new project pointing at `web/` for preview-then-swap workflow). |
| **All other layers** | **Unchanged from ADR 0003.** Supabase Postgres + Edge Functions, Managed Agents, Bitwarden Secrets, pg_cron scheduler. | Backend is framework-independent. |
| **Mobile (iOS/Android)** | **Deferred.** Not in V1 scope. May revisit post-hackathon as a V2 if Intently earns a real user base. | If/when revisited, Expo + RN-Web may be reconsidered, OR Capacitor/Tauri to wrap the existing web app, OR native-rewrite. Not deciding now. |

## Migration plan (executed across this PR + Saturday's session)

1. **Tonight (this PR, 2026-04-25):**
   - Add `web/` directory with prototype HTML + JSX components copied from `docs/design/Intently - App/`. Treat the design folder as immutable spec; `web/` is the editable deployable.
   - Update root `CLAUDE.md` (web app, not mobile app), `TRACKER.md` Locked decisions, and ADR 0003 status.
   - Document the pivot in this ADR.
   - **Do not touch wiring tonight** — Saturday is the focused live session for that.
2. **Saturday (2026-04-25, BUILD DAY):**
   - Port `app/lib/ma-client.ts` → inline `<script>` (or `web/ma-client.js`) and call it from the prototype's hero affordance handler.
   - Port `app/lib/voice.ts` → same pattern. Web Speech API works identically; this is mostly a relocation.
   - Port reminders fetch calls + Supabase client.
   - Validate end-to-end: voice → reminder → daily-brief renders with seed → live MA call updates the brief.
   - Cut Vercel deploy over to `web/` (vercel.json or project setting). Smoke-test `intently-eta.vercel.app`.
3. **Sunday (2026-04-26, submission):**
   - Polish, record demo, submit by 8:00 PM EDT.
   - `app/` remains in repo as historical reference; deletion can wait until post-hackathon.

## Alternatives considered

- **Stay on Expo + RN-Web, do RN translation pass.** Rejected — translation work produces no functional value, only fidelity-to-prototype, and the prototype's visual surface is so already-built that re-creating it in RN-Web is throwaway labor. ~half-day to translate the demo screens; same time spent inheriting yields better fidelity.
- **Iframe the prototype HTML inside the existing Expo app.** Rejected — bridging the prototype's React DOM events to Expo's RN runtime is a worse-of-both-worlds problem. Demo fragility.
- **Stay on Expo, ship visually-imperfect for hackathon, plan Capacitor/Tauri swap V2.** Rejected — the design folder represents Muxin's current intent; shipping something that visibly diverges from it for the demo undersells the work. Better to land it.
- **Rewrite the prototype in Next.js for build-step + SSR.** Rejected — adds tooling complexity without functional benefit during hackathon. Plain React + Babel-standalone deploys as static files, served by any CDN, no build pipeline needed.

## Consequences

**Positive:**
- Demo fidelity = 100% to design folder by construction.
- ~half-day saved vs. RN-Web translation work.
- Stack matches the design folder's stack — no perpetual sync tax.
- Static deploy is simpler to reason about and faster cold-start.

**Negative / accepted:**
- iOS/Android distribution loses its "deploy-with-one-build" path. (Acceptable: not a hackathon goal.)
- `app/` directory is dead weight until phased out. (Acceptable: deletion can wait; harmless.)
- Functional wiring (~5 modules in `app/lib/**`) needs porting. (Acceptable: mechanical, ~half-day.)
- Loss of TypeScript on the frontend (prototype is plain JSX). Backend (Supabase Edge Functions) and ports/tests still TypeScript. (Acceptable for hackathon. Could add type checking later via JSDoc or a build step.)

## When to revisit this decision

Triggers — any one of these means reopen the ADR:
- Post-hackathon, if iOS/Android distribution becomes a goal.
- If Intently earns >1k DAU and SEO/SSR/SPA-routing matter for growth.
- If type errors land in production wiring frequently enough to want TypeScript back on the frontend.
- If Babel-standalone hits a performance ceiling at viewport (it shouldn't for a personal app, but watch for it).

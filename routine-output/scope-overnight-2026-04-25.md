# Overnight Scope Proposal — 2026-04-25 (Web-Only Pivot, Saturday Prep)

**Generated:** 2026-04-25 ~late-evening (manual override; replaces earlier fidelity-translation scope which is now obsolete per ADR 0004).
**Source:** Hand-authored after the architectural pivot decision.
**Tonight's iteration cap:** 3.
**Replaces:** the earlier "fidelity scaffolding" version of this same file (drift analysis + RN-Web translation + Playwright baseline). All three of those iterations are throwaway given the inherit-the-prototype pivot.

> ✅ **Pre-loop blockers cleared.** PR #95 committed the design folder reference; the pivot PR (this branch's PR) commits the `web/` skeleton + ADR 0004 + updated CLAUDE.md/TRACKER. Loop branches off main once the pivot PR merges.
>
> ⚠️ **Do not start the loop until the pivot PR is merged.** Iter 1 reads `web/` and `app/lib/**`. If `web/` doesn't exist on main yet, iter 1 fails immediately.

## Conceptual approach

The architectural decision is locked: `web/` (plain React 18 + Babel-standalone, inherited from prototype) replaces `app/` (Expo + RN-Web) as the deployable. Per ADR 0004, the wiring port (Supabase calls, MA client, voice, reminders) happens **Saturday in a focused live session**, not autonomously overnight — the wiring is judgment-heavy (which prototype hook to attach each surface to, how to reconcile state shape, how to handle errors), and an autonomous loop touching that mid-night risks corrupting the demo path.

So tonight's loop is **analysis only** — produce three reference documents Saturday's session uses as its checklist. The loop reads `app/lib/**`, the prototype JSX in `web/`, and produces structured docs. **No code changes, no wiring, no deploy.**

## State summary

- PRs merged tonight: #87, #90, #91, #86, #93 (rebased bundle of #88 + #92), #95 (design folder commit), and **the web-only pivot PR** (this branch — needs to merge before loop starts).
- Open PR awaiting your attention: #94 (`feat/track-ma-provisioning` — TRACKER admin/cleanup, no app/web collision).
- Stack pivot per ADR 0004: `app/` (Expo + RN-Web) → `web/` (plain React + Babel-standalone, inherited from prototype). Wiring port deferred to Saturday.
- `web/` skeleton on main (after pivot PR merge): prototype HTML + JSX components, README documenting the structure.

## Iteration chain (sequential, all docs-only)

### Iteration 1 — `app/lib/` functional inventory

- **Scope:** Read every file under `app/lib/` (and `app/utils/`, `app/hooks/` if they exist). For each function/module, document:
  - Function/module name + file location
  - Public API (signature, parameters, return)
  - What it does in plain English (1 sentence)
  - External dependencies it relies on (Supabase client, fetch, browser APIs, RN-specific surfaces, third-party packages)
  - **Web-portability rating:** `mechanical` (pure JS, ports as-is), `light-touch` (drop a few RN imports, otherwise straight), `judgment` (needs rewrite, behavior may change)
  - Whether it's currently called from `app/App.tsx` or another caller — note the caller path
- **Output:** `web/PORTING.md` with one section per `app/lib/` file, table-format inventory inside each.
- **Why this matters Saturday:** the wiring port executes against this inventory. Each row becomes one port task. Without it, the port session opens with "what do we need to bring over?" — wasted hour.
- **Allowed writes:** ONLY `web/PORTING.md` (new file).
- **Model + effort:** Opus 4.7 high — moderate reading, structured analysis.
- **LOC estimate:** Markdown ~200-400 lines depending on app/lib/ size.

### Iteration 2 — RN-specific surfaces + their plain-React equivalents

- **Scope:** Audit `app/components/**`, `app/screens/**` (if exists), and `app/App.tsx` for React Native-specific surfaces that DO NOT port to plain React DOM. Catalog each with:
  - The RN-only construct (e.g., `<View>`, `StyleSheet.create`, `<TouchableOpacity>`, `react-native-reanimated`, `<FlatList>`, `Animated.Value`, `Dimensions.get('window')`)
  - Where it appears (file + line range)
  - The plain-React-DOM equivalent the prototype's JSX uses (e.g., `<div>` + `style` object, CSS keyframe animations, `<button>` with onClick, plain `array.map`, CSS Grid/Flex)
  - **Whether the prototype already covers it.** If the prototype's JSX already implements the same UX with the equivalent construct, the RN code is THROWAWAY — note it. If not, flag as a Saturday port task.
- **Output:** `web/RN-PORTING-OBSTACLES.md` — section per RN-only construct, with throwaway-vs-port-task verdict.
- **Why this matters Saturday:** the prototype already implements most screens visually. The wiring port needs to identify what FUNCTIONAL behavior in app/ is not yet represented in web/, vs what's redundant. This document is that delta.
- **Allowed writes:** ONLY `web/RN-PORTING-OBSTACLES.md` (new file).
- **Model + effort:** Opus 4.7 high — heavy reading across two codebases, judgment on equivalence.
- **LOC estimate:** Markdown ~150-300 lines.
- **Depends on:** iter 1.

### Iteration 3 — prototype JSX wiring-point map

- **Scope:** Read every JSX file in `web/` (`intently-shell.jsx`, `intently-screens.jsx`, `intently-screens-prototype.jsx`, `intently-cards.jsx`, `intently-hero.jsx`, `intently-journal.jsx`, `intently-projects.jsx`, etc.). For each component that owns user-interactive behavior, identify:
  - Which onClick / onChange / form submit / voice-affordance event needs functional wiring
  - The current implementation (likely a placeholder log, mock data, or no-op)
  - The corresponding `app/lib/` function (per iter 1's inventory) that should be invoked
  - The proposed wiring shape (inline `<script>` block in `index.html`, or sibling `.js` file loaded by it)
  - **Special focus on the hero affordance** — per BUILD-RULES.md it's THE single interaction surface; voice, chat, brief, review all funnel through it. The wiring map for hero is the highest-priority section.
- **Output:** `web/WIRING-POINTS.md` — section per JSX file, table or list of (event, current placeholder, target lib function, port shape).
- **Why this matters Saturday:** turns the abstract "port the wiring" task into a concrete checklist. Saturday's session opens, walks the document top to bottom, ports each row. Estimate: 5-10 wiring points total.
- **Allowed writes:** ONLY `web/WIRING-POINTS.md` (new file).
- **Model + effort:** Opus 4.7 high — heavy reading of prototype JSX + cross-reference against iter 1's inventory.
- **LOC estimate:** Markdown ~200-400 lines.
- **Depends on:** iter 1 + iter 2.

## Hard-stops (loop must enforce)

Standard overnight-build-loop hard-stops apply, plus:

- **NO writes outside `web/PORTING.md`, `web/RN-PORTING-OBSTACLES.md`, `web/WIRING-POINTS.md`.** No code edits anywhere — including no edits to existing `web/*.jsx`, `web/index.html`, `app/**`, `agents/**`, `supabase/**`, `scripts/**`.
- **NO edits to `TRACKER.md`, `CLAUDE.md`, `.claude/handoffs/**`, ADRs.**
- **NO commits to main.** All PRs `--draft`. Standard `auto/build-loop/2026-04-25-NN-<slug>` branch naming.
- **NO npm install, no playwright install, no Supabase calls, no Vercel calls.** Pure read-and-write of Markdown.
- **NO TypeScript / build / test / lint commands.** This loop produces docs; no code is touched, so no build verification needed. Skip the standard `npx tsc --noEmit` step from the build-loop brief — irrelevant.

## Notes for Muxin

- **Why analysis-only tonight:** wiring port is judgment-heavy. Per ADR 0004 it's Saturday's focused-session work. Tonight's loop produces the reference docs that make Saturday's port a 2-hour deterministic walk instead of a 4-hour exploration.
- **What you wake up to:** three Markdown docs in `web/` + three draft PRs (one per iter). Read them with coffee Saturday morning, walk the wiring port from there.
- **If a docs iteration finds something surprising** (e.g., `app/lib/` has 20 files instead of the 5 I estimated, or there's a wiring concern that needs your judgment): the iteration writes a `## OPEN QUESTIONS` section at the end of the doc and continues. Saturday's session resolves those questions before walking the port.
- **What's NOT here that you might expect:** any `app/` code changes (deferred per ADR 0004), any wiring port (Saturday), any vercel.json (Saturday — depends on cut-over strategy decision). Tonight is reference-doc generation, that's it.
- **EV vs. previous scope versions:** the original steward scope (scripts/.githooks/docs sweep) is low-EV polish; the earlier "fidelity scaffolding" version of this file was throwaway given pivot. This version produces the artifacts Saturday's port session actually needs.

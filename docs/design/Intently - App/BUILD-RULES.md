# Intently — Build Rules

*Read this before writing any UI code. If you're about to add something that feels obvious, check here first — the obvious thing is often what this product explicitly isn't.*

---

## The single most important rule

**The Design System canvas (`Intently Design System.html`) is a review surface, not a spec for production UX.** It shows multiple states of one screen side-by-side so humans can compare them. It does **not** mean the app should have tabs, toggles, or a top bar that lets users flip between those states.

If you see three artboards labeled *Morning · Planned · Evening*, that means **one screen with three time-of-day phases**. Not three tabs. Not a segmented control. One screen; phase is computed from the clock.

---

## Non-negotiables

1. **The hero affordance is the ONE interaction surface.** Voice note, type, chat, quick action, commit an entry, generate a brief, run a review — all one button. If you're about to add a second floating button, a "Generate X" button, or any chrome that duplicates what the hero already does, **stop**. The hero does it.

2. **Phase is data, not UI.** Present's `morning | planned | evening` is driven by time-of-day (or, for a mock, by a dev switch hidden off-screen). There is **no** user-facing phase switcher. Ever.

3. **Zoom is data, not tabs.** Past's `year | month | week | day` is driven by taps (drop-a-level) and the single zoom chip in the top-right. There are no tabs for "Year / Month / Week / Day".

4. **Three tenses, no labels.** Nav is `← · · · →` at the bottom. No text ("Past / Present / Future"). No pills. The dots show position; arrows step.

5. **Mobile-first. Always in a phone frame.** If you're rendering at 980px full-width without a bezel, you're looking at a canvas artboard for review — not the actual app. The app is one `iPhone 16 Pro`-sized surface. Design at 393×852. Use `<Phone>` from `intently-shell.jsx`.

6. **The agent drafts; the user confirms.** Every user utterance becomes a **typed Entry** only after passing through a `ConfirmationCard`. There are no free-floating chat messages that aren't either (a) a question in the hero chat thread, or (b) a committed Entry.

7. **One persona across the whole app.** If Past references one life and Present references another, something has drifted. Same name. Same projects. Same goals. All three tenses look at the same data.

---

## Anti-patterns — smells that mean you're off

If you catch yourself doing any of these, you've drifted.

| Smell | What it usually means | Do this instead |
|---|---|---|
| Segmented control at the top of a screen | Treating canvas artboards as tabs | Remove. The state is computed. |
| A "Generate brief" / "Start review" / "New entry" button that isn't the hero | Reinventing the hero | Route the action through the hero affordance. |
| A "Past / Present / Future" nav bar | Labeling the three tenses | Use `TenseNav` — arrows and dots only. |
| A tab bar at the bottom of the phone | iOS default thinking | Remove. Bottom is `← · · · →`. |
| A "settings" gear in the corner | Adding utility chrome | The avatar in the bottom-left **is** settings. Tap → `ProfileSheet` → sub-pages. No gear, ever. |
| A search bar visible by default | Adding utility chrome | Defer. Search is post-MVP. |
| A floating "+" / FAB to add a thing | iOS default thinking | Use `<InlineAdd>` — a single-line text field at the bottom of the relevant section. Enter commits, Esc/blur-empty cancels. Same component everywhere (project todos, plan items, day entries, goal/project naming). |
| Adding a "Generate brief" / "Start review" button on the Present screen | Reinventing flow entry | Morning Empty's CTA opens `BriefFlow`; evening's CTA opens `ReviewFlow`. Those are the only entry points. |
| Three big cards for Morning/Planned/Evening all on one screen | Interpreting the canvas literally | Render **one** phase. Hide the other two. |
| Emojis in copy ("✨", "🌅") | Brand drift | Use the glyph library. Never emoji. |
| Inter / system-ui for titles | Forgot the type system | Fraunces italic for display; Source Serif for reading; Geist/Inter for UI. |
| Solid accent-color CTA buttons | Generic webapp pattern | CTAs are painterly: sunrise gradient (morning) / midnight gradient (evening). |
| Photo uploads, image pickers | Out of scope for MVP | Remove. All imagery is `PainterlyBlock` + glyphs. |
| Streaks / XP / achievement toasts | Out of scope for MVP | Remove. Gamification is explicitly deferred. |
| A kanban or a gantt chart | Out of scope for MVP | `ProjectDetail` is a markdown doc + todo list. Nothing else. |
| Every card has its own unique background color | Decoration-for-decoration's-sake | Painterly tints are semantic — Sage = agent voice, Lilac = reflection, Butter = plan, Peach = warmth, Clay = warning. See §7.2 of HANDOFF. |

---

## How to read the design canvas

The canvas is organized in sections. Each section has a purpose.

- **Hero moment** — the one money shot for marketing/App Store. **Not a template for every screen.**
- **Three-tense system** — the production app, in its default state. *This is what the built app looks like.* One phone, one tense at a time, with the bottom nav.
- **Screen states** — variants of the same screen for review. *These are alternates, not simultaneous states.* E.g. Present has three artboards (morning/planned/evening); the real app shows one at a time.
- **Components** — the atoms (cards, glyphs, imagery blocks). Use these directly.
- **Flows** — sequences of screens that show a specific interaction unfolding across time. Read left-to-right; these are storyboards.
- **Tokens / Palette / Type** — the design system itself. **Reference; never duplicate.**

When in doubt: **section 2 (Three-tense system) is what the running app should look like.** Everything else is supporting material.

---

## What "done" looks like for each screen

### Past
- Single phone frame.
- Top-right zoom chip shows current zoom (Year / Month / Week / Day).
- Content area renders whichever zoom is active; others hidden.
- Tapping a day tile at any zoom → drops one level.
- Bottom `TenseNav` visible.
- Hero affordance in bottom-right.
- No tabs. No top bar beyond the title + zoom chip.

### Present
- Single phone frame.
- `ScreenHeader` with eyebrow *"TODAY"* and title *"Friday, April 24"* (or today's date).
- Body renders ONE phase based on time of day:
  - Pre-6am / no brief yet → `morning` phase (pre-brief CTA).
  - Brief accepted through ~7pm → `planned` phase (flags + plan).
  - 7pm+ → `evening` phase (planned view + review CTA at bottom).
- Bottom `TenseNav` visible.
- Hero affordance in bottom-right.
- **No phase toggle. No "Generate brief" button.** The morning CTA and evening CTA are the only surfaces that start those flows.

### Future
- Single phone frame.
- `ScreenHeader` *"What this month is for."*
- Three goal cards, painterly backgrounds, April slice copy.
- "Name a new goal" ghost row.
- Projects band below — compact cards; tap → `ProjectDetail`.
- Bottom `TenseNav` visible.
- Hero affordance in bottom-right.
- No goal-creation FAB — the ghost row IS the affordance.

---

## Component usage cheatsheet

- **Need a card with a painted background?** `<FeatureCard palette=... seed=... tone=dark|light>` — handles the painterly block + grain + content slot.
- **Need the agent to confirm something?** `<ConfirmationCard title body action_primary action_secondary>` — sage surface, two pill actions.
- **Need a journal body?** `<ReflectionCard>` — lilac, Fraunces italic open quote, Source Serif body.
- **Need a todo row?** `<TodoRow text done onToggle>` — one pattern, used in plan + projects alike.
- **Need a small icon?** `<Glyph name=... size=16 color={T.color.PrimaryText}>`. Always monotone.
- **Need a painted atmosphere behind something?** `<PainterlyBlock palette=... seed=... style={{...}} />` with children on top.

**Never** hand-roll the above. If a variant is missing, add a prop to the existing component; don't fork.

---

## When in doubt

- **Check `HANDOFF.md`** — data model, state machines, file map, flows.
- **Check the canvas's Three-tense system section** — what the built app should actually look like.
- **Ask the design owner** before adding a new chrome element, a new entity type, a new navigation pattern, or any new top-level affordance. These are product decisions, not engineering decisions.

The product is opinionated. Its power is in what it doesn't do. Every piece of chrome you don't add is a feature.

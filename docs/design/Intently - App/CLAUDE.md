# Intently — start here

You are building **Intently**, a three-tense journaling app with an agentic voice affordance. Before you write any code, read these two files in this order:

1. **`HANDOFF.md`** — the full spec. Product model, data model, screen map, state machines, file map, flows, design system, scope.
2. **`BUILD-RULES.md`** — anti-patterns and non-negotiables. Read this *especially* carefully if you are about to add a tab bar, a segmented control, a phase toggle, a "generate X" button, or any top-level chrome you don't see in the canvas's Three-tense system section.

## The five things that matter most

1. **The Design System canvas is a review surface, not a spec for production UX.** Three artboards side-by-side means *three variants of one screen for comparison* — never a tabbed interface.
2. **The hero affordance is the ONE interaction surface.** Voice, chat, commits, review, brief generation — all funnel through it. Do not add parallel buttons.
3. **Phase and zoom are data, not UI.** Present's morning/planned/evening is time-of-day. Past's year/month/week/day is tap-to-drill + one zoom chip. No tabs.
4. **Mobile-first, always in a phone frame.** Design at 393×852. Wrap in `<Phone>`.
5. **The agent drafts; the user confirms.** Every utterance becomes a typed Entry via a `ConfirmationCard`.

## File conventions

- React 18 + Babel-standalone, no build step. Load `.jsx` files with `<script type="text/babel" src="...">`.
- Babel scripts don't share scope. Export to `window` at end of file via `Object.assign(window, {...})`.
- Style objects must be uniquely named per file (`heroStyles`, not `styles`).
- Tokens live in `intently-tokens.jsx`. Never hardcode colors, radii, shadows, or fonts — add a token first.

## If you're unsure

Re-read the relevant section of `HANDOFF.md`. If it's not in there, ask before inventing.

# Design System Port Strategy

**Type:** Strategy doc — why this exists and how we're approaching it

## Why This Project Exists

The demo can't look like a prototype. Porting Claude's design token set to the Expo app gets brand consistency without building a design system from scratch. It also means the app could be re-skinned later without touching product code — a token layer is an abstraction worth having early.

This project has a bounded scope: get the tokens in and applied before the demo. It's not its own product.

## Current Approach

- Map Claude design tokens to React Native StyleSheet values
- Use a theme context for light/dark switching
- Apply tokens screen-by-screen, starting with demo-critical screens (brief, review)
- Tokens without clean RN equivalents (shadows, blur) get native RN approximations; document as you go

## Key Decisions

- 2026-04-14: Adopt Claude tokens, not custom variables — reduces decisions, keeps the app aligned with the broader Claude visual language
- 2026-04-14: Mobile-first, web later — Expo is the V1 target; web token derivation can come after demo

## Learnings

- 2026-04-17: Some tokens need translation (CSS shadow values vs RN elevation); worth documenting the mapping as you apply, not after

## Open Questions

- How to handle tokens that have no clean RN equivalent without making the approximations look bad?
- If the app moves toward a custom brand identity later, how much of this survives?

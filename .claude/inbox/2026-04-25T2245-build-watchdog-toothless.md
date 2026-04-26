---
captured: 2026-04-25T22:45:00-05:00
session: chat/0425-210554
source: discussion
extends: .claude/inbox/2026-04-25T1900-babysit-prs-watchdog-issues.md
---

# Build-watchdog runs but is toothless — has zero coverage of the prototype

The earlier 1900 inbox flagged that "babysit-prs and build-watchdog have issues" but didn't diagnose them. **This session diagnosed build-watchdog specifically.** Findings below; `/groom` should treat this as a more specific, actionable extension of the 1900 capture (1900 can be retired or merged into this one once both are reviewed).

## TL;DR

Build-watchdog IS scheduled and firing (`launchctl list | grep build-watchdog` shows `com.intently.build-watchdog` loaded; logs show clean 30-min ticks all day). Every entry says "OK build-watchdog shell green." **But "green" is a lie.** All three commands the loop runs use flags that silently pass when there's nothing to check. The watchdog hasn't been catching real issues because there's nothing pointed at the prototype that COULD catch them.

This explains why `onEdit={() => {}}`, `onClick`-less buttons in JournalReader/ChatReader, the missing `kind='brief'` branch in the reading-mode resolver, and the three avatar copies all shipped without anyone noticing.

## What the watchdog actually runs

Per `.claude/loops/build-watchdog.md` and `~/.intently/logs/build-watchdog.shell.log`:

```
npm run lint --if-present
npx tsc --noEmit
npm test --if-present -- --passWithNoTests
```

All three use flags that pass silently when nothing applicable exists:
- `--if-present` on lint + test → skips if the script isn't defined in `package.json`
- `--passWithNoTests` on test → passes if no test files exist
- `tsc --noEmit` runs against `tsconfig.json`'s include pattern, which (on inspection) doesn't cover `web/*.jsx` because they're JSX served via Babel-standalone CDN, not TypeScript

## Why the prototype gets zero coverage

The deployed app is `web/*.jsx` files loaded by `web/index.html` via `<script type="text/babel">` and the Babel-standalone CDN. There is:
- No ESLint config covering `web/*.jsx`
- No TypeScript compile step on `web/`
- No test suite under `web/`
- `tests/` is README-only

The watchdog only runs against `app/` (Expo + RN-Web, kept as historical reference per ADR 0004) and isolated TypeScript files like `scripts/provision-ma-agents.ts`. None of these are what visitors interact with.

## Suggested fix — make the watchdog earn its keep

**ESLint config covering `web/*.jsx`** with rules that would have caught the actual gaps:

- [ ] `no-empty-function` (or a custom rule on JSX handler props) — catches `onEdit={() => {}}` and `onClick={() => {}}` stubs. Either the handler does something OR the prop is decorated with `// eslint-disable-next-line ... -- TODO: TRACKER row #XXX` so the deferral is explicit and traceable.
- [ ] `react/jsx-no-undef` — catches references to undefined components.
- [ ] `no-unused-vars` — catches dead state/imports that signal half-wired code.
- [ ] `react/jsx-handler-names` — enforces `onClick={handleX}` patterns so handlers are findable by name.
- [ ] Optional: a custom rule that flags JSX elements with `onClick` / `onChange` / `onSubmit` / `onPointerUp` / `onTap` / etc. props bound to *literal* empty arrows or no-op functions.

**`package.json` script that the watchdog actually invokes:**
- [ ] Add a `lint:web` (or `lint`) script in the project root `package.json` that runs `eslint web/*.jsx` (and any other coverage targets). The watchdog's `npm run lint --if-present` will then actually run something.
- [ ] Add a `typecheck:web` script if useful (e.g. with JSDoc `@param`/`@returns` types and `tsc --allowJs --checkJs --noEmit`).

**Spec update at `.claude/loops/build-watchdog.md`:**
- [ ] Update the "Stack-dependent behavior" section — it says *"Until the stack is chosen (post-Thursday Apr 23), this loop has no commands to run."* The stack IS chosen (ADR 0004) but the lint config still doesn't exist. Either fix the config or update the spec to reflect what the loop is actually verifying today (which is: nothing useful for the deployed app).
- [ ] Add a self-check: the watchdog's first action on startup is to verify that at least one of `npm run lint`, `tsc --noEmit`, or `npm test` does non-trivial work (e.g. lints ≥1 file, types ≥1 file, runs ≥1 test). If all three silently pass with zero coverage, log a loud "ZERO-COVERAGE" warning instead of "green."

**A complementary integration check (post-watchdog-fix):**
- [ ] Add a CI job that runs the same commands on every PR. Watchdog catches things during a session; CI catches things at merge. Both should fail loudly on a stub handler, not silently pass.

## Why this matters

Every gap surfaced this session — `onEdit={() => {}}`, `kind='brief'` resolver missing, three avatar implementations — is the kind of thing a half-decent ESLint rule would have caught at edit time. We had the loop infrastructure; we just never pointed it at the actual code. Fixing this is a one-time investment that pays off every subsequent session by making the build watchdog a real enforcement mechanism.

## Cross-references

- This work folds naturally into the **wiring-audit handoff's** "Tooling — make it not happen again" AC bullet. Could either:
  - (a) Stay as its own focused inbox-to-execution task (cheaper, faster, narrow scope)
  - (b) Be folded into wiring-audit as a sub-task
  - *Lean: (a) — independent, low-cost, can ship before the audit runs and immediately starts catching new gaps.*
- The **babysit-prs** half of the original 1900 inbox is a separate concern (PR-watching loop, different infrastructure) and not addressed here. 1900 should remain in the inbox until babysit-prs is also diagnosed.

## Suggested AC (inline, if grooming routes this to § Next)

- [ ] `web/*.jsx` is covered by an ESLint config with rules for empty-handler detection.
- [ ] `package.json` has a `lint` script that the watchdog can actually run.
- [ ] The next session that introduces a stub handler sees the watchdog flag it.
- [ ] Updated spec at `.claude/loops/build-watchdog.md` reflects current reality.
- [ ] Optional: CI runs the same commands on PR.

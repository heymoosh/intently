# Acceptance Criteria — Build-watchdog teeth (ESLint coverage of `web/*.jsx`)

**Topic:** Make the build-watchdog actually catch problems. Right now it runs every 30 min during 07:30–22:30 local but reports "OK shell green" because nothing meaningful runs.
**Source capture:** `git show 0df181f:.claude/inbox/2026-04-25T2245-build-watchdog-toothless.md`.

## Goal

`npm run lint` covers `web/*.jsx` with rules that catch stub handlers (`onClick={() => {}}`, `onEdit={() => {}}`) and other shipping-by-accident patterns. Build-watchdog's 30-min lint run becomes a real enforcement loop, and CI runs the same lint on every PR.

## Background

Existing state: `.claude/loops/build-watchdog.md` runs `npm run lint --if-present`, `npx tsc --noEmit`, `npm test --if-present -- --passWithNoTests`. All three pass silently when nothing applicable exists. There is no ESLint config covering the `web/*.jsx` files (the deployed prototype). That's why `onEdit={() => {}}`, `onClick`-less buttons in `intently-reading.jsx`, the missing `kind='brief'` resolver branch, and three avatar implementations all shipped without anyone noticing.

This work makes the watchdog earn its keep.

## Acceptance criteria

### ESLint config

- [ ] **CR-01** Project root has an ESLint config (`.eslintrc.json` or `eslint.config.mjs`) that includes `web/*.jsx` in its `files` / `overrides` scope.
- [ ] **CR-02** Config enables (at minimum):
  - `no-empty-function` (or equivalent custom rule) — flags `() => {}` and `function() {}` patterns
  - `react/jsx-no-undef` — flags references to undefined JSX components
  - `no-unused-vars` — flags dead state/imports
- [ ] **CR-03** A custom rule, inline-config plugin, or similar mechanism specifically flags JSX *handler props* (`onClick`, `onChange`, `onSubmit`, `onPointerUp`, `onPointerDown`, `onEdit`, `onTap`, `onDone`, etc.) bound to *literal empty arrows or no-op functions*. Either:
  - The rule is `react/no-empty-handler` or similar from an existing plugin
  - OR a custom ESLint rule in `eslint-rules/no-empty-jsx-handler.js` is added and loaded
  - OR a generous interpretation of `no-empty-function` paired with arrow-function detection covers the case
  - The chosen approach is documented in a one-line comment in the config

### `package.json` script

- [ ] **CR-04** Project root `package.json` has a `lint` script that runs `eslint web/**/*.jsx` (and any other coverage targets) with `--max-warnings=0` so the build fails on warnings.
- [ ] **CR-05** `npm run lint` from a clean checkout runs against the `web/` files (not `--if-present`-skipped, not zero-files matched).

### Existing stubs catalogued

- [ ] **CR-06** All currently-flagged stubs are catalogued. For each, a decision: **fix-now** (handler is wired in this PR) OR **defer** (an `// eslint-disable-next-line ... -- TODO: TRACKER row #X / handoff: <slug>` comment is added with a real cross-reference, NOT just a bare disable).
- [ ] **CR-07** Known stubs that MUST appear in the catalogue:
  - `web/intently-reading.jsx:75` `onEdit={() => {}}` — defer (covered by `new-user-ux-and-auth` handoff AC)
  - `web/intently-reading.jsx:326-331` ChatReader "Continue this conversation" — defer (covered by `new-user-ux-and-auth` handoff AC)
  - Any others discovered during the audit run

### Watchdog spec

- [ ] **CR-08** `.claude/loops/build-watchdog.md` updated. The "Stack-dependent behavior" section's stale text (*"Until the stack is chosen (post-Thursday Apr 23), this loop has no commands to run"*) is replaced with current reality.
- [ ] **CR-09** Optional but encouraged: a self-check at the start of each loop iteration that asserts `npm run lint` actually lints ≥1 file. If zero files are linted, log a loud `ZERO-COVERAGE WARNING` line instead of `OK shell green`. Implementation hint: ESLint's `--print-config <file>` or the count of files reported.

### CI integration

- [ ] **CR-10** A new GitHub Actions workflow (or extension to an existing one) at `.github/workflows/lint.yml` runs `npm run lint` on `pull_request` events. Failures block merge.

## Verification methods

| CR | How to verify |
|---|---|
| CR-01 | `cat` the ESLint config; confirm `web/*.jsx` (or equivalent glob) is in scope. |
| CR-02 | Read config; confirm rule list includes the three named rules. |
| CR-03 | Manually introduce `onClick={() => {}}` in a scratch file; run `npm run lint`; expect the rule fires. |
| CR-04 | Read `package.json`; confirm `scripts.lint` runs eslint on the JSX files with `--max-warnings=0`. |
| CR-05 | `npm run lint` from a clean checkout: must complete in non-trivial time (i.e., it actually scanned files, not zero-skipped). |
| CR-06 | Run `npm run lint` and inspect the report. For each surfaced stub, the decision (fix vs defer) is reflected in the diff: either the handler now does work, or there's a disable comment with a real cross-reference. |
| CR-07 | The two named stubs (intently-reading.jsx) appear in CR-06's report or the diff (whichever path was taken). |
| CR-08 | `cat .claude/loops/build-watchdog.md`; the "Stack-dependent behavior" section reflects current reality. |
| CR-09 | If implemented: introduce a config that lints zero files; run the loop; expect "ZERO-COVERAGE WARNING" instead of "OK shell green". |
| CR-10 | Create a test PR with an empty handler; expect the new workflow run fails on lint. |

## Out of scope (do NOT do these in this PR)

- Wiring all the existing stub handlers (that's the work each item's own handoff/AC covers — this PR just makes the lint catch them).
- TypeScript typechecking of `web/*.jsx` — separate effort, not covered here.
- Adding a test suite — separate effort.
- Refactoring any prototype code beyond the minimal ESLint disables.

## Sub-agent contract

When dispatched, your final response MUST include the AC checklist above with ✅/❌ + one-line evidence per criterion. If any criterion is ❌, surface the blocker — do NOT declare done. The orchestrator will verify your evidence against the actual diff before merging. **Special:** for CR-06 and CR-07, your evidence MUST list (a) every stub the lint flagged, (b) the disposition (fix vs defer + cross-reference) per stub.

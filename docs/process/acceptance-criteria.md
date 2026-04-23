# Acceptance criteria authoring rule

Authoritative process for `docs/product/acceptance-criteria/`. Referenced from `CLAUDE.md` (§ "Acceptance criteria authoring rule"). Backed by the pre-commit hook at `.githooks/pre-commit` (Layer A), the Thursday CI gate (Layer C, see `.claude/session-handoff.md`), and Spec Conformance Steward task 7 (Layer B, `.claude/routines/spec-conformance-steward.md`).

This is the **anti-gaming rule**. Acceptance criteria are the contract between the product spec and the implementation. If implementation is allowed to rewrite criteria to match what was built, the contract is meaningless.

## Source of truth

Criteria are derived from `docs/product/requirements/life-ops-plugin-spec.md` at authoring time. The spec is the source of truth; criteria are the machine-checkable projection of it. Each criterion's `Behavior` field copies spec language verbatim.

## Creation (before build)

Before writing any implementation code for a skill or feature that lacks a criterion file:

1. **Stop.** Do not start implementation.
2. Author `docs/product/acceptance-criteria/<skill>.md` with criteria derived from the spec. Each criterion uses:
   - `Behavior:` — spec language verbatim.
   - `Verification: TBD`
   - `Status: unknown`
   - `Last checked: never`
3. Use `/derive-criteria <skill>` (`.claude/skills/derive-criteria.md`) to generate the scaffold. Manual authoring is allowed but slower and drift-prone.
4. Commit the criterion file in its own PR.
5. That PR merges **before** any implementation PR for the same skill.

## Edits during build (forbidden except Status / Last-checked)

During build sessions, only these fields on an existing criterion may update:

- `Status` — one of `pass`, `partial`, `fail`, `unknown`.
- `Last checked` — timestamp of the run that produced the Status.

Everything else — including `Behavior`, `Verification`, and the set of criteria — is frozen during build.

If implementation cannot satisfy a criterion, mark it `fail` or `partial`. **Do not rewrite the criterion to match what was built.** That is the gaming move this rule exists to prevent.

If the criterion itself is wrong (the spec was misread at authoring time, or the spec changed):

1. Update `docs/product/requirements/life-ops-plugin-spec.md` in a separate PR. That PR merges first.
2. Re-derive the criterion in a second PR. That PR merges next.
3. Only then may implementation PRs proceed.

**No same-PR spec-and-criterion edits.** No same-PR criterion-and-implementation edits.

## Enforcement layers

| Layer | Where | What it catches |
|---|---|---|
| A — local pre-commit | `.githooks/pre-commit` | Blocks commits that stage `agents/<skill>/` implementation code when no non-empty criterion file with `### CR-` entries exists for that skill. Install once per clone: `git config core.hooksPath .githooks`. |
| B — nightly audit | `.claude/routines/spec-conformance-steward.md` task 7 | Diff criteria `Behavior` fields against spec; flags any drift. |
| C — CI gate | Thursday CI wiring (`ci.yml`, see `.claude/session-handoff.md` step 3) | Blocks PRs that edit a criterion in the same commit range as the skill's implementation code. |

Layer A is deterministic and local. Layer B catches authoring-time misreads. Layer C catches bypasses (`--no-verify`, pushes that skip the hook).

## See also

- `CLAUDE.md` — product/build context anchor.
- `.claude/skills/derive-criteria.md` — the creation skill.
- `docs/product/requirements/life-ops-plugin-spec.md` — spec (source of truth).

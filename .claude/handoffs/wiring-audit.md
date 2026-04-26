# Wiring audit — every interactive element in the prototype, cataloged

**Created:** 2026-04-25 evening (post-hackathon-submission discussion).
**Status:** Drafted, not groomed. Awaiting `/groom` to register in TRACKER.
**Source:** Conversation with Muxin on 2026-04-25 evening, retrospective question: *"if I click Open the Goal Card and it shows me a detailed project goal overview with the milestones and related projects... that must mean that there is a database that figures out how to link those projects to those goals... that every goal card has the same presentation layer. That sort of thing. Is that something that we have not figured out? Is that something that we didn't do properly because we weren't grooming, or what?"*

## Why

The cognition push (#136–#152) wired the demo-critical path beautifully: voice → brief → review → next-day brief → weekly review. State persists, agents fire, cross-day continuity holds. **But the wiring sprint never enumerated every interactive element in the prototype** — only the ~12 along the demo critical path (per `web/WIRING-POINTS.md`). Everything else was either stubbed, half-wired, or not even enumerated.

Concrete gaps already discovered ad-hoc in this session's review:
- Profile-button avatar shows "M" (hardcoded) while profile-sheet shows "S" + "Sam Tanaka" (different hardcoded). Three avatar implementations, no shared component, none read from `display_name`. (`intently-extras.jsx:223`, `intently-profile.jsx:113`, `intently-reading.jsx:101`.)
- JournalReader edit button is `onEdit={() => {}}` — a literal no-op. (`intently-reading.jsx:75`)
- ChatReader "Continue this conversation" button has no `onClick` handler at all. (`intently-reading.jsx:326-331`)
- Brief entries can't open in reading mode — the resolver has no `kind='brief'` branch. (`index.html:823-855`)
- Project todo / admin reminder checkboxes have no DB persistence (TRACKER post-launch backlog: *"Toggle persistence for done flags · ~half-day"*).
- update-tracker MA agent is provisioned but has zero UI callers.
- OAuth modal is `setTimeout`-mocked end-to-end.

These are six concrete examples. **The premise of this handoff is that there are dozens more, and they will keep being discovered ad-hoc until someone enumerates them all systematically.**

The artifact this handoff produces is the comprehensive interaction inventory that should have existed during the cognition push — applied retrospectively now, with explicit decisions per item: ship, defer-with-TRACKER-row, or reject as out-of-scope.

## What — the target artifact

**A single doc — `docs/product/interaction-inventory.md`** (or `wiring-inventory.md`, name TBD) that lists, for every interactive element in the deployed app:

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| Past → Day journal entry list | Entry tap | Open in reading mode | `entries` row by id | Partial — works for journal/review/chat, missing for brief | wire-brief-branch |
| Reading mode (journal) | Edit button | Edit + persist | UPDATE `entries` row | Stub (`onEdit={() => {}}`) | wire |
| Reading mode (chat) | "Continue this conversation" | Open chat thread, persist new messages | `entries` (kind=chat) + chat-thread state | Missing handler | wire OR defer |
| Profile button (home) | Tap | Open profile sheet | UI state | Wired | ✓ |
| Profile button (home) | Avatar letter | Display user's initial | `profiles.display_name` | Hardcoded "M" | wire to `<Avatar>` |
| Profile sheet | Hero avatar + name + email | Display user identity | `profiles` row | Hardcoded "S" / "Sam Tanaka" / "sam@intently.app" | wire to `<Avatar>` + display_name + email |
| Profile sheet | "Set up Intently as me" button | Open setup flow | UI state | Wired (but setup is thin — tracked elsewhere) | ✓ for trigger; setup-expansion separate handoff |
| Profile sheet | Connections row | Open connections page | UI state | Wired (UI); OAuth itself mocked | wire OAuth (separate handoff) |
| Goal card | Tap to open | Show goal detail | `goals` row + linked `projects` (via `goal_id` FK) | ??? — verify | audit |
| Goal card | Edit affordance | Edit goal | UPDATE `goals` row | ??? — verify | audit |
| Project sheet | Open project | Show project detail | `projects` row | Wired | ✓ |
| Project sheet | Todo checkbox | Toggle done | UPDATE `projects.todos[i].done` | NO PERSISTENCE | wire (in TRACKER post-launch) |
| Project sheet | Add todo | Insert todo | UPDATE `projects.todos` | Wired (optimistic + persist) | ✓ verify |
| Project sheet | Edit project body | Update body | UPDATE `projects.body_markdown` | ??? — verify | audit |
| AddZone (journal/plan/admin) | Submit | Insert entry | INSERT `entries` / `plan_items` / `reminders` | Wired | ✓ |
| Hero (idle) | Short tap | Open chat | UI state | Wired | ✓ |
| Hero (idle) | Long press | Open quick-action menu | UI state | Wired | ✓ — but interaction model itself is being redesigned (separate inbox item: hero-press-pattern) |
| Hero (chat) | Send message | Append to thread, hit MA proxy | INSERT chat-thread state + agent call | Mock thread, no real wiring | wire (Q1 in WIRING-POINTS.md) |
| Hero (listening) | Stop and send | Route transcript | classifyTranscript → reminder/journal/update-tracker route | Decided partially (classifyTranscript exists); fork incomplete | wire (Q1 in WIRING-POINTS.md) |
| Brief flow | Accept | Persist brief | INSERT `entries` (kind=brief) | Wired | ✓ |
| Brief flow | Undo | Delete entry | DELETE `entries` row | Wired | ✓ |
| Review flow | Accept | Persist review | INSERT `entries` (kind=review) | Wired | ✓ |
| Weekly review | Accept | Persist weekly | INSERT `entries` (kind=review, kind=weekly?) | Wired | ✓ verify |
| Monthly refresh | Accept | UPDATE goals.monthly_slice | Wired | ✓ verify |
| Setup flow | Accept | Wipe + insert goals/projects | DELETE seed + INSERT goals + INSERT admin project | Wired (but thin — separate handoff) | ✓ for what's there; expansion separate |
| OAuth flow | Connect | Real OAuth + token storage | POST to edge function | Mocked (setTimeout) | wire (separate handoff) |
| (more — to be enumerated) | | | | | |

The table above is a **starting sample**, not the finished artifact. The deliverable is exhaustive enumeration.

## Acceptance criteria

Drafted here per § AC location matrix (cross-cutting / system-level → handoff).

**Inventory authorship:**
- [ ] `docs/product/interaction-inventory.md` exists and enumerates every interactive element in the deployed app at `intently-eta.vercel.app`. Authoritative way to enumerate: walk the prototype JSX files (`web/intently-*.jsx`) for every `onClick`, `onChange`, `onPointerDown`, `onSubmit`, `onTap`, etc. handler — including stubs.
- [ ] Each row has: surface, element name, implied state, implied data binding, current status, decision.
- [ ] Decision is one of: `✓ wired (verified)`, `wire (priority)`, `defer (TRACKER row)`, `reject (out of scope)`. No `???` rows allowed in the final version.
- [ ] At least one verification per `✓ wired` claim — open the deployed app, exercise the affordance, confirm the DB row changes / agent call fires. Don't trust the code; verify the behavior.

**Per-row execution:**
- [ ] Every `wire` row has either a TRACKER § Next entry OR is folded into an existing handoff (e.g. avatar wiring → `new-user-ux-and-auth`, OAuth → `oauth-calendar-email`, scheduled fires → `scheduled-agent-dispatch`).
- [ ] Every `defer` row has a corresponding TRACKER row (post-launch backlog or follow-up) so it's tracked.
- [ ] Every `reject` row has a one-line justification (e.g. "Hindsight self-host: cut per ADR / launch-plan locked decisions").

**Stub-handler audit:**
- [ ] All `() => {}` and similarly-empty handlers are catalogued. Each has a decision per the matrix.
- [ ] All elements with NO handler attached but visually-affording-interaction are catalogued. (E.g., `intently-reading.jsx:326-331` — "Continue this conversation" button with no `onClick` prop.)

**Tooling — make it not happen again:**
- [ ] Lint rule (or CI check) flags `onClick={() => {}}` (and similar empty handlers) as a warning. Either justify with a comment or wire it.
- [ ] PR-template checkbox: "for any new interactive element added, the wiring story is documented OR explicitly stubbed with a TODO referencing a TRACKER row."

**Identity-component fallout (folds into `new-user-ux-and-auth` handoff):**
- [ ] Single `<Avatar>` component reading from a shared user-context source. Replaces all three current implementations.
- [ ] All hardcoded "Sam" / "M" / "S" literals catalogued and parameterized OR gated to dev-mode. Locations: `intently-extras.jsx:223`, `intently-profile.jsx:113,119,289`, `intently-flows.jsx:431,1394`, `intently-screens.jsx:197`, `intently-reading.jsx:101-102`.

## Open questions for grooming

1. **Where does the inventory live?** `docs/product/interaction-inventory.md` (suggested) vs. extending `web/WIRING-POINTS.md` (current half-form artifact). *Lean: new doc — WIRING-POINTS.md was scoped to the live-wiring sprint and is dated; the inventory is a different lifecycle (audit, not sprint plan).*
2. **Granularity.** Every `<button>` is a row, OR every *interaction concept* is a row (e.g. "todo checkbox" is one row even though there are N rendered checkboxes per project). *Lean: per-interaction-concept, with a "rendered locations" column.*
3. **Verification depth.** "Verified" = the dev opened the app and clicked, OR "verified" = an automated test asserts the behavior. *Lean: dev-verified for the audit pass; automated tests follow on critical paths via the cognition-verification-harness handoff.*
4. **Should the inventory live in version control or in a TRACKER section?** The inventory is large and updates often. Doc-in-`docs/product/` keeps it grep-able and review-able; TRACKER section would balloon TRACKER. *Lean: doc.*

## Dependencies / sequencing

- **High value as the FIRST handoff to execute,** because it discovers and orders the work in every other handoff. Audits the deployed app comprehensively, decides per-item, then folds items into the relevant handoffs (`new-user-ux-and-auth`, `oauth-calendar-email`, `scheduled-agent-dispatch`, `cognition-verification-harness`) or post-launch backlog.
- Output of this handoff feeds the others. Without this, other handoffs ship piecemeal and we keep finding gaps ad-hoc — exactly the pattern this handoff exists to break.
- Doesn't *block* other handoffs (they can run in parallel with the audit), but the audit should run first to confirm scope.

## Files this work touches (rough)

- New: `docs/product/interaction-inventory.md` (the artifact)
- Possibly: `.eslintrc` or new lint plugin for stub-handler detection
- Possibly: `.github/PULL_REQUEST_TEMPLATE.md` checkbox
- Cross-references into existing handoffs (`new-user-ux-and-auth.md`, `oauth-calendar-email.md`, etc.) to fold rows in
- New ADR optional: `docs/decisions/000X-interaction-inventory-as-source-of-truth.md` if this becomes a durable artifact rather than a one-time audit

## Estimate

The audit pass itself: 1 day (walk the JSX, enumerate every handler, exercise the deployed app, mark status). The fold-into-handoffs pass: 0.5 day. The lint rule: 0.25 day. Total: ~2 days of focused work, but the *value* compounds because every subsequent handoff ships against a known-complete map instead of discovering scope mid-sprint.

## Why this didn't happen the first time (durable note)

Three reasons, in descending order of impact:

1. **Launch-plan defined "done" as the demo bar** — `launch-plan.md` § "Explicit non-requirements for MVP" deliberately scoped out polish, secondary interactions, multi-user, OAuth. *"One flow done well beats three half-working."* That was right for the hackathon ship; the cost is what we're now seeing.
2. **The capture/groom/execute system didn't exist during the wiring sprint.** PR #149 (capture) shipped 2026-04-25 evening, parallel with the cognition push that ended 2026-04-26. So during the wiring sprint there was no `/groom` step that forced exhaustive interaction enumeration. `WIRING-POINTS.md` is the artifact of an *overnight build loop* analysis pass — useful, but scoped to the live-wiring critical path, not exhaustive.
3. **No tooling enforced "every onClick has a non-stub handler."** A lint rule would have flagged `onEdit={() => {}}` and similar. We didn't add one. Stubs shipped silently.

The fix for #1 is no longer needed (hackathon shipped). The fix for #2 is the inbox+groom system itself, which now exists. The fix for #3 is one of this handoff's AC bullets.

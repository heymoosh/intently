# Interaction inventory — wiring-audit pass 1

**Created:** 2026-04-25 (post-#159).
**Source:** Code reading of every `web/*.jsx` + `web/index.html` mounted in the deployed React tree at `intently-eta.vercel.app`.
**Status:** Pass 1 — code-inspection only. Live verification (Playwright exercising affordances against a real DB) deferred to a future pass.
**Contract:** `.claude/handoffs/wiring-audit.md` § Inventory authorship.

This is the exhaustive, per-affordance audit the cognition push never produced. Each row pairs a visible affordance with: what state it implies, what data it touches, whether the handler exists today, and a tentative decision for grooming.

## How to read the table

| Column | Meaning |
|---|---|
| Surface | Screen / component the element lives on |
| Element | The visible affordance (button, input, gesture) |
| Implied state | What the user expects to happen / be displayed |
| Implied data binding | Tables/columns/state involved (or "UI state only") |
| Current status | `wired` (verified by code reading) · `partial` (works for some cases) · `stub` (handler is empty `() => {}`) · `missing` (no handler attached) |
| Decision | `wired` (already done) · `wire` (priority) · `defer` (post-launch, TRACKER row) · `reject` (out of scope) |

`wire` and `defer` rows reference the handoff or AC file that owns the work. The orchestrator folds these references into the relevant ACs in a follow-up pass.

## Table of contents

- [Past screen](#past-screen)
  - [PastJournalProto shell](#pastjournalproto-shell)
  - [JournalHeader (zoom + search)](#journalheader-zoom--search)
  - [Year / Month / Week / Day views](#year--month--week--day-views)
- [Present screen](#present-screen)
  - [PresentEmpty (morning, pre-brief)](#presentempty-morning-pre-brief)
  - [PresentPlanProtoAnimated (planned + evening)](#presentplanprotoanimated-planned--evening)
  - [PresentClosed (post-review)](#presentclosed-post-review)
- [Future screen](#future-screen)
  - [Goals](#goals)
  - [Projects](#projects)
  - [Admin reminders](#admin-reminders)
- [Goal detail screen](#goal-detail-screen)
- [Project detail screen (V2)](#project-detail-screen-v2)
- [Hero affordance (mic / chat / listening)](#hero-affordance-mic--chat--listening)
  - [HeroAffordance (idle + expanded menu)](#heroaffordance-idle--expanded-menu)
  - [HeroListening (full-screen voice)](#herolistening-full-screen-voice)
  - [HeroChat (full-screen chat)](#herochat-full-screen-chat)
- [Reading mode overlays](#reading-mode-overlays)
  - [JournalReader](#journalreader)
  - [ChatReader](#chatreader)
  - [ReviewReader](#reviewreader)
- [Brief flow](#brief-flow)
- [Review flow](#review-flow)
- [Weekly review flow](#weekly-review-flow)
- [Monthly refresh flow](#monthly-refresh-flow)
- [Setup flow (first-run)](#setup-flow-first-run)
- [Profile sheet](#profile-sheet)
  - [Account / Preferences / Help sub-pages](#account--preferences--help-sub-pages)
- [Connections page](#connections-page)
- [OAuth flow](#oauth-flow)
- [Journal composer](#journal-composer)
- [Cross-cutting](#cross-cutting)
  - [Identity surfaces (3 hardcoded avatars)](#identity-surfaces-3-hardcoded-avatars)
  - [Swipe shell + dot indicator](#swipe-shell--dot-indicator)
  - [Undo toast](#undo-toast)
  - [Tense nav](#tense-nav)
- [Dead code (not in deployed tree)](#dead-code-not-in-deployed-tree)
- [Cross-cutting observations](#cross-cutting-observations)

---

## Past screen

The Past tense renders `PastJournalProto` (defined inline in `web/index.html:195`) — *not* `PastScreen` from `web/intently-screens.jsx`. The proto wraps the journal stack from `web/intently-journal.jsx` (Year/Month/Week/Day views) plus a manual `AddZone`.

### PastJournalProto shell

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| PastJournalProto | Manual `AddZone` ("Add a journal entry") at bottom of Day | Open inline input → INSERT entry | `entries` (kind=journal) via `useManualAdds.addJournal` | wired (commits to DB + optimistic UI; verified `web/lib/entities.js:166` `insertJournalEntry`) | wired |
| PastJournalProto | Just-added journal card (after manual add, optimistic) | Display added entry inline | local `adds.journal.today` | wired | wired |
| PastJournalProto | Just-added journal entry tap (via PresentPlanProto's "added journal" list) | Open in reading mode | `entries` row by id | wired (`onPickEntry={setOpenEntry}` in `index.html:973`; reading-mode resolver at `index.html:910-965`) | wired |

### JournalHeader (zoom + search)

`web/intently-journal.jsx:39-72`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| JournalHeader | Zoom segmented control (Year / Month / Week / Day) | Switch zoom level | UI state (`zoom`) | wired | wired |
| JournalHeader | "Search entries…" affordance | Open search input + filter entries | `entries` query | **missing** — rendered as a `<span>`, not an `<input>` (`intently-journal.jsx:46-48`); visually affords typing, doesn't accept it | defer → post-launch backlog (TRACKER follow-ups; not in any current handoff) |

### Year / Month / Week / Day views

`web/intently-journal.jsx:75-497`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| YearView | Mini-month tap | Zoom into Month for that month | UI state | partial — wired to `onPickMonth`, but `PastJournalProto` (`index.html:203`) only does `() => setZoom('Month')` — doesn't pass the picked month idx, so January-tap = April-view (or whatever's hard-coded) | defer → post-launch (`docs/product/acceptance-criteria/journal-zoom-fidelity.md` to be authored) |
| YearView | Mini-month "filled days" count | Display | `entries` count | wired (computed locally from `JOURNAL_DATA` fixture) | wire (deferred fixture replacement — `JOURNAL_DATA` is hard-coded mulberry32 PRNG output, not real entries) → `docs/product/acceptance-criteria/journal-zoom-fidelity.md` |
| MonthView | Day cell tap | Open that specific day's entries | `entries` filtered by date | partial — handler is `onPickDay={() => setZoom('Day')}` (loses the date) | defer → same as above |
| WeekView | 7-day strip — day tap | Open that day | `entries` filtered by date | partial — same loss-of-date issue | defer → same |
| WeekView | "Start weekly review" button (sun/mon-only window, dev-mode bypass) | Open WeeklyReviewFlow | UI overlay state | wired (`onStartWeeklyReview` prop, fired via `setShowWeeklyReview(true)`) | wired |
| DayView | Hero entry tap (the marquee journal card) | Open in reading mode | `entries` row (hardcoded id `'journal-10-32'`) | wired *for the fixture entry only* — when the user has live DB entries, the marquee still points at the hardcoded id | partial → defer → `docs/product/acceptance-criteria/journal-zoom-fidelity.md` (also: the marquee should pick the actual day's most-resonant entry) |
| DayView | Chronological entry tap | Open in reading mode | `entries` row by id | wired for `kind=journal/chat/review`; **partial** for `kind=brief` (resolver at `index.html:910-965` lacks the brief branch — pre-loaded finding #8) | wire → `.claude/handoffs/new-user-ux-and-auth.md` (reading-mode AC) |
| DayView | "From your archive" entry button | Open in reading mode | `entries` row by id | **missing** — buttons at `intently-journal.jsx:480-491` have no `onClick` (advisor finding) | defer → post-launch (low priority; archive feature not yet scoped) |

---

## Present screen

The Present tense renders `PresentPlanProtoAnimated` (in `index.html:238`), `PresentEmpty` (`intently-flows.jsx:1502`), or `PresentClosed` (`intently-flows.jsx:1586`) depending on day-state.

### PresentEmpty (morning, pre-brief)

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| PresentEmpty | "Start your daily brief" CTA | Open BriefFlow | UI state (`dayState='brief'`) | wired (`onStartBrief={() => setDayState('brief')}`, `index.html:827`) | wired |

### PresentPlanProtoAnimated (planned + evening)

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| PresentPlanProtoAnimated | Per-band `AddZone` ("Add to morning/afternoon/evening") | INSERT plan_item | `plan_items` row, day=today, band | wired (`useManualAdds.addPlanItem` → `insertPlanItem`) | wired |
| PresentPlanProtoAnimated | "Add a journal entry" `AddZone` (bottom) | INSERT journal entry | `entries` (kind=journal) | wired | wired |
| PresentPlanProtoAnimated | Just-added journal entry tap (italic quote button) | Open in reading mode | `entries` row by id | wired (`onPickEntry`) | wired |
| PresentPlanProtoAnimated | "Start your daily review" CTA (evening only) | Open ReviewFlow | UI state | wired (`onStartReview={() => setDayState('review')}`) | wired |
| PresentPlanProtoAnimated | Plan-item glyph cell (each band entry) | Display only — no tap target | UI display | n/a (presentational) | wired |
| PresentPlanProtoAnimated | "Consciously parked today" list | Display only | `plan.parked` from agent response | wired (display only) | wired |

### PresentClosed (post-review)

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| PresentClosed | "Today, in one line" + "For tomorrow" panels | Display only | `liveReview` prop | wired (display only — note: the `onReopenReview` prop is declared in `intently-flows.jsx:1586` but never rendered as a button in the body — dead prop) | wired (with note) |

---

## Future screen

`FutureScreenProtoTappable` defined in `index.html:468`.

### Goals

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| FutureScreenProtoTappable | Goal painterly card tap | Open GoalDetail | `goals` row | wired (`onOpenGoal={setOpenGoal}`, `index.html:979`) | wired |
| FutureScreenProtoTappable | "Show all N goals" / "Show top 3" toggle | Toggle visible-goals subset | UI state | wired | wired |
| FutureScreenProtoTappable | Just-added goal card (optimistic) | Display only | `adds.goals` (filtered to optimistic ids only — real ones come from DB) | wired (display only) | wired |
| FutureScreenProtoTappable | "Add a goal" `AddZone` | INSERT goal | `goals` row | wired (`useManualAdds.addGoal` → `insertGoal`) | wired |
| FutureScreenProtoTappable | "Refresh monthly slices" button (when `onStartMonthlyRefresh` provided) | Open MonthlyRefreshFlow | UI state | wired | wired |

### Projects

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| FutureScreenProtoTappable | Project card tap | Open ProjectDetailV2 | `projects` row | wired (`onOpen={() => onOpenProject && onOpenProject(p)}`) | wired |
| FutureScreenProtoTappable | "Add a project" `AddZone` | INSERT project | `projects` row | wired | wired |
| FutureScreenProtoTappable | Just-added project card (optimistic) | Display only | `adds.projects` | wired (display only) | wired |

### Admin reminders

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| FutureScreenProtoTappable | Admin reminder checkbox tap | Toggle done state | `reminders.done` | wired post-PR #157 (`useManualAdds.toggleAdminReminder` → `markAdminReminderDone` for real UUIDs; pre-loaded finding #10) | wired |
| FutureScreenProtoTappable | "Add a reminder" `AddZone` | INSERT reminder | `reminders` row | wired (`useManualAdds.addAdminReminder` → `insertAdminReminder`) | wired |

---

## Goal detail screen

`GoalDetail` in `web/intently-flows.jsx:120`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| GoalDetail | "Future" back button (top-left painterly hero) | Close detail, return to Future | UI state | wired (`onBack={() => setOpenGoal(null)}`) | wired |
| GoalDetail | Project card tap (under "Projects" section) | Open ProjectDetail | `projects` row | wired (`onOpen={() => onOpenProject && onOpenProject(p)}` — chains `setOpenGoal(null); setOpenProject(p)` per `index.html:997`) | wired |
| GoalDetail | "Tap the mic to dictate the why" empty-Intention placeholder | (Hint text — no affordance besides the persistent mic) | UI state | wired (passive; the hero mic is always available) | wired |
| GoalDetail | Edit goal title / monthly slice / milestones | Edit goal in place | UPDATE `goals` | **missing** — no inline edit affordance, no edit button | defer → post-launch (`docs/product/acceptance-criteria/goal-edit.md` to be authored; not in any active handoff) |
| GoalDetail | Reflections list | Display only — pulled journal quotes | `entries` filtered by goal | wired (display only — but Reflections data comes from `goal.reflections` static fixture, not actual journal pulls) | partial → defer (cognition will fold this in via context-assembler when it ranks journal quotes per-goal) |

---

## Project detail screen (V2)

`ProjectDetailV2` in `web/intently-flows.jsx:314`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| ProjectDetailV2 | Back button (top-left, "Back" pill) | Close detail | UI state | wired | wired |
| ProjectDetailV2 | Close X button (top-right) | Close detail | UI state | wired | wired |
| ProjectDetailV2 | Goal-link chip ("under <goal title>") | Open GoalDetail | `goals` row by id | wired (`onOpenGoal={(g) => { setOpenProject(null); setOpenGoal(g); }}`) | wired |
| ProjectDetailV2 | Project todo checkbox tap | Toggle todo done state | UPDATE `projects.todos[i].done` (JSONB) | wired post-PR #157 (`useManualAdds.toggleProjectTodo` → `toggleProjectTodo` for real UUIDs only; pre-loaded finding #10) | wired |
| ProjectDetailV2 | "Add a todo to this project" `AddZone` | Append todo | `projects.todos` JSONB array | wired (only persists when `projectId` is a real UUID — `PROJECT_DATA` fixtures with kebab keys like `'pitch'` skip the persist call cleanly) | partial → defer (fixture-vs-DB cleanup; not blocking demo) |
| ProjectDetailV2 | Edit project body / intention / impact | Edit project markdown | UPDATE `projects.body_markdown` | **missing** — no edit affordance at all | defer → post-launch (`docs/product/acceptance-criteria/project-edit.md` to be authored) |
| ProjectDetailV2 | Tracker rows from `p.tracker` (hard-coded fixture entries, distinct from added todos) | Display only | static fixture | wired (display only) | wired (will phase out as fixtures get replaced; not interactive anyway) |

---

## Hero affordance (mic / chat / listening)

`web/intently-hero.jsx`.

### HeroAffordance (idle + expanded menu)

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| HeroAffordance | Mic disc — short tap | Enter listening state | UI state | wired | wired (interaction model itself being redesigned — see [§ Next #5 hero-press-pattern](#) below) |
| HeroAffordance | Mic disc — long press → expand | Open quick-action menu | UI state | wired (320ms hold timer) | wire → `docs/product/acceptance-criteria/hero-press-pattern.md` (press-hold-release replaced by tap-to-open + tap-to-select; pre-loaded finding #11) |
| HeroAffordance | Expanded menu — "New journal entry" item | Open JournalComposer | UI state | wired (`onPick` returns true → host opens JournalComposer; `index.html:1135-1140`) | wire (interaction model redesign per above) |
| HeroAffordance | Expanded menu — "Type instead" item | Switch to chat state | UI state | wired (`onChange('chat')`) | wire (interaction model redesign per above) |
| HeroAffordance | Mic processing arc (transient state) | Visual feedback during agent call | UI state | wired (auto-resets to idle after 1.8s, `index.html:786-791`) | wired |
| HeroAffordance | Idle breathing ring | "Alive but not demanding" affordance | UI state (CSS animation) | wired | wired |

### HeroListening (full-screen voice)

`web/intently-hero.jsx:239`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| HeroListening | Auto-start recognizer on mount | Live web-speech transcription | `useVoiceInput()` from `lib/voice.js` | wired | wired |
| HeroListening | Stop button (large green circle) | Stop recognizer + route transcript onward | UI state → chat state with seedTranscript | wired (waits for `state.kind === 'stopped'`, then forwards transcript to parent for routing via `classifyTranscript`) | wired (Q1 in `web/WIRING-POINTS.md`; chat thread now wires the LLM turn) |
| HeroListening | Close X button (top-left) | Abort + return to idle without routing | UI state | wired | wired |
| HeroListening | "Type instead" button (bottom-left, keyboard icon) | Switch to chat input | UI state | **missing** — no `onClick` prop on the button at `intently-hero.jsx:331-338` (advisor finding; this is the most critical surface) | wire → `.claude/handoffs/new-user-ux-and-auth.md` (chat-thinking-indicator.md or new sub-AC) |
| HeroListening | Live transcript text (italic placeholder → primary text) | Display real-time interim transcript | `state.interim` / `state.transcript` | wired | wired |

### HeroChat (full-screen chat)

`web/intently-hero.jsx:363`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| HeroChat | Close X button | Return to idle | UI state | wired | wired |
| HeroChat | Composer text input + Enter key | Submit message → call `daily-brief` agent in chat-mode | `callMaProxy({ skill: 'daily-brief' })` + reminder classifier first | wired (post-#149/#150 voice-classify-route) | wired |
| HeroChat | Composer mic button (right side, when draft empty) | Switch back to listening | UI state | wired (`onMic` prop) | wired |
| HeroChat | Composer send check (right side, when draft non-empty) | Submit message | same as above | wired | wired |
| HeroChat | Voice-seed transcript (entry path from HeroListening) | Auto-submit the captured utterance | thread state | wired (one-shot via `seededRef`) | wired |
| HeroChat | Inline action card "Edit" button (`m.kind === 'action'` + `m.draft`) | Edit a drafted action (e.g. an email) | UI / agent state | **missing** — no `onClick` (`intently-hero.jsx:521`); also `m.kind === 'action'` is never emitted by `sendUtterance`, so this code path is unreachable today | defer → post-launch (action-card affordance is for a future agent-action capability; flag the dead code path) |
| HeroChat | Inline action card "Send" button | Send a drafted action | agent action call | **missing** — no `onClick` (`intently-hero.jsx:526`); same reachability note | defer → post-launch |
| HeroChat | Inline action card "Undo" button (when not draft) | Undo a confirmed action | `entries` / agent state | **missing** — no `onClick` (`intently-hero.jsx:537`); same reachability note | defer → post-launch |
| HeroChat | "Thinking…" placeholder during pending | Show busy state during agent call | `pending` state | partial — placeholder appears, but no animated indicator (pre-loaded finding #12) | wire → `docs/product/acceptance-criteria/chat-thinking-indicator.md` (§ Next #4) |
| HeroChat | Reminder classification reply ("Got it. I'll surface…") | Echo classifier's parsed reminder | `reminders` row (the actual insert happens edge-side via `classifyTranscript`) | wired | wired |

---

## Reading mode overlays

`web/intently-reading.jsx`.

### JournalReader

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| JournalReader | Back/close button (top-left chevron) | Close reading mode | UI state | wired (`onClose`) | wired |
| JournalReader | Edit button (top-right pencil) | Open editable view of entry | UPDATE `entries.body_markdown` | **stub** — `onEdit={() => {}}` (`intently-reading.jsx:75-76`; pre-loaded finding #1) | wire → `.claude/handoffs/new-user-ux-and-auth.md` (reading-mode wiring AC) |
| JournalReader | More button (top-right kebab) | Open menu (delete / share / etc.) | depends on action | **stub** — `onMore={() => {}}` (pre-loaded finding #2) | defer → `.claude/handoffs/new-user-ux-and-auth.md` (reading-mode menu AC) |
| JournalReader | Avatar circle (sage, "S") | Display user identity | `profiles.display_name` | hardcoded "S" + "Sam" string (pre-loaded finding #7) | wire → `.claude/handoffs/new-user-ux-and-auth.md` Avatar component AC |
| JournalReader | Body text rendering (drop-cap, paragraphs, blockquotes) | Display only | `entry.body[]` | wired (display only) | wired |

### ChatReader

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| ChatReader | Back/close button | Close reading mode | UI state | wired | wired |
| ChatReader | More button (top-right kebab) | Open menu | depends | **stub** — `onMore={() => {}}` (`intently-reading.jsx:153`; pre-loaded finding #3) | defer → `.claude/handoffs/new-user-ux-and-auth.md` |
| ChatReader | Transcript bubbles | Display only | `entry.messages[]` | wired (display only) | wired |
| ChatReader | "Continue thread" button | Reopen as live HeroChat thread, seed messages | `entries` (kind=chat) + chat-thread state | **missing** — no `onClick` prop (`intently-reading.jsx:219-224`; pre-loaded finding #5) | defer → `.claude/handoffs/new-user-ux-and-auth.md` (post-launch — continuing closed threads is a future feature) |

### ReviewReader

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| ReviewReader | Back/close button | Close reading mode | UI state | wired | wired |
| ReviewReader | More button | Open menu | depends | **stub** — `onMore={() => {}}` (`intently-reading.jsx:255`; pre-loaded finding #4) | defer → `.claude/handoffs/new-user-ux-and-auth.md` |
| ReviewReader | Highlight / Friction / Tomorrow / Calendar panels | Display only | `entry.{highlight,friction,tomorrow,calendar}` | wired (display only) | wired |
| ReviewReader | "Continue this conversation" button | Reopen as live chat | UI state + chat thread | **missing** — no `onClick` prop (`intently-reading.jsx:329-336`; pre-loaded finding #6) | defer → `.claude/handoffs/new-user-ux-and-auth.md` |
| ReviewReader | Brief entries — open in reading mode | Show brief content | `entries` (kind=brief) | **missing** — resolver in `index.html:910-965` lacks the `kind='brief'` branch (pre-loaded finding #8). Brief rows in DayView are non-tappable as a result (`tappable = e.kind === 'chat' \|\| 'review' \|\| 'journal'` — `intently-journal.jsx:430`) | wire → `.claude/handoffs/new-user-ux-and-auth.md` (reading-mode brief-branch AC) |

---

## Brief flow

`BriefFlow` in `web/intently-flows.jsx:494`. Mounted as full-screen overlay when `dayState === 'brief'`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| BriefFlow | Close X button | Cancel brief, return to morning-empty | UI state | wired (`onClose={() => setDayState('morning-empty')}`) | wired |
| BriefFlow | Per-step text input + Enter key | Submit user answer; agent acks; advance step | thread state + `callMaProxy('daily-brief')` ack | wired | wired |
| BriefFlow | "Send" arrow button (right of input) | Same as Enter | same | wired | wired |
| BriefFlow | "tap send to use the suggested answer" hint | Display only | `s.userDefault` | wired (display only) | wired |
| BriefFlow | Live brief streaming bubble | Display agent's prose response | `liveBrief` from `callMaProxy` | wired (parses JSON tail, falls back to prose) | wired |
| BriefFlow | "Accept & populate my day" button on BriefConfirmCard | INSERT entries.kind='brief' + INSERT plan_items per band; fire UndoToast | `entries`, `plan_items` | wired (full undo support — pre-loaded finding from launch) | wired |

---

## Review flow

`ReviewFlow` in `web/intently-flows.jsx:1041`. Mounted as overlay when `dayState === 'review'`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| ReviewFlow | Close X button | Cancel review, return to evening | UI state | wired (`onClose={() => setDayState('evening')}`) | wired |
| ReviewFlow | AutoCheckList ("What I saw you do") staggered animation | Display real plan_items + today's journal entries as inferred-done | `plan_items`, `entries` | wired (`inferAutoCheckItems` reads DB; pre-loaded finding from launch) | wired |
| ReviewFlow | Per-step input + Enter | Submit answer; agent acks; advance | same as BriefFlow | wired | wired |
| ReviewFlow | "Send" arrow button | Same as Enter | same | wired | wired |
| ReviewFlow | Live review streaming bubble | Display agent prose | `liveReview` | wired | wired |
| ReviewFlow | "Accept & close the day" button on ReviewConfirmCard | INSERT entries.kind='review'; fire UndoToast | `entries` | wired (full undo support; PR #157 fixed JSON-tail-leaking issue) | wired |

---

## Weekly review flow

`WeeklyReviewFlow` in `web/intently-flows.jsx:1673`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| WeeklyReviewFlow | Close X button | Cancel | UI state | wired | wired |
| WeeklyReviewFlow | Per-step input + Enter / Send | Submit answer; agent acks; advance | thread + `callMaProxy('weekly-review')` | wired | wired |
| WeeklyReviewFlow | "Accept & close the week" button on WeeklyReviewConfirmCard | INSERT entries.kind='review' with `links={scope:'week', week_id}`; fire UndoToast | `entries` | wired | wired |

---

## Monthly refresh flow

`MonthlyRefreshFlow` in `web/intently-flows.jsx:1934`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| MonthlyRefreshFlow | Close X button | Cancel | UI state | wired | wired |
| MonthlyRefreshFlow | Per-goal accepted-checkbox toggle | Toggle whether this slice gets persisted | local draft state | wired | wired |
| MonthlyRefreshFlow | Per-goal proposed-slice textarea | Edit the agent's drafted slice | local draft state | wired | wired |
| MonthlyRefreshFlow | "Accept N updates" button | UPDATE `goals.monthly_slice` per accepted draft; fire UndoToast | `goals.monthly_slice` | wired (per-row UPDATE, batched undo per goal) | wired |

---

## Setup flow (first-run)

`SetupFlow` in `web/intently-flows.jsx:2225`. Reached via Profile sheet → "Set up Intently as me".

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| SetupFlow | Close X button | Cancel setup | UI state | wired | wired |
| SetupFlow | "Start" button (intro step) | Advance to input step | UI state | wired | wired |
| SetupFlow | 3 goal textareas (input step) | Capture three goals | local draft state | wired | wired |
| SetupFlow | "Draft monthly slices →" button | Call setup MA agent + advance to review step | `callMaProxy('setup')` | wired | wired |
| SetupFlow | Per-goal monthly_slice textarea (review step) | Edit drafted slice | local draft state | wired | wired |
| SetupFlow | "Save and start fresh" button | `clearAllUserData()`, INSERT 3 goals + Admin project | `goals`, `projects`, plus wipes prior rows | wired | wired |
| SetupFlow | (No edit-glyph affordance) | Pick a different glyph than the agent chose | UPDATE setup payload | **missing** — agent picks the glyph; no UI to override | defer → post-launch (`docs/product/acceptance-criteria/setup-glyph-picker.md` to be authored if user feedback demands it) |
| SetupFlow | (No palette picker) | Pick a different palette per goal | UPDATE setup payload | **missing** — palettes are positionally assigned (`SETUP_DEFAULT_PALETTES[i]`) | defer → post-launch |

---

## Profile sheet

`ProfileSheet` in `web/intently-profile.jsx:74`. Reached via the bottom-left avatar.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| ProfileSheet | Close X button | Close sheet | UI state | wired | wired |
| ProfileSheet | Hero avatar + name + email row | Display user identity | `profiles.display_name` + email + avatar | hardcoded "S" + "Sam Tanaka" + "sam@intently.app" (pre-loaded finding #7) | wire → `.claude/handoffs/new-user-ux-and-auth.md` Avatar + display_name + email AC |
| ProfileSheet | "Account" row | Open AccountPage sub-page | UI state | wired | wired |
| ProfileSheet | "Connections" row | Open ConnectionsPage | UI state | wired | wired |
| ProfileSheet | "Preferences" row | Open PreferencesPage | UI state | wired | wired |
| ProfileSheet | "Help & support" row | Open HelpPage | UI state | wired | wired |
| ProfileSheet | "Set up Intently as me" row | Open SetupFlow | UI state | wired | wired |
| ProfileSheet | "Sign out" row | Sign user out | `supabase.auth.signOut()` | **stub** — `onSignOut={() => setProfileView(null)}` only closes the sheet; doesn't actually call signOut (advisor finding; `index.html:1087`) | wire → `.claude/handoffs/new-user-ux-and-auth.md` (auth/sign-out AC) |

### Account / Preferences / Help sub-pages

`AccountPage`, `PreferencesPage`, `HelpPage` in `web/intently-profile.jsx`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| AccountPage | Back arrow | Return to ProfileSheet | UI state | wired | wired |
| AccountPage | "Name / Sam Tanaka" row | Edit name | UPDATE `profiles.display_name` | **missing** — `StaticRow` is non-interactive `<div>` (advisor finding) | wire → `.claude/handoffs/new-user-ux-and-auth.md` (Account edit AC) |
| AccountPage | "Email / sam@intently.app" row | Edit email | UPDATE auth email | missing — same | wire → same |
| AccountPage | "Password / Change" row | Open password-change flow | auth API | missing — same | wire → same |
| AccountPage | "Plan / Quiet · monthly" row | Display only (or open billing) | `profiles.plan` (TBD) | missing — same | defer → post-launch (billing not in scope yet) |
| AccountPage | "Export your journal / Download" row | Trigger journal export | `entries` query → file download | missing — same | defer → post-launch |
| AccountPage | "Delete account / ·" row | Trigger account deletion | auth API + cascade | missing — same | defer → post-launch (legal/safety review needed) |
| PreferencesPage | Back arrow | Return | UI state | wired | wired |
| PreferencesPage | "Always confirm before saving" toggle | Persist preference | `localStorage:intently:prefs` | **stub** — `ToggleRow` uses internal `useState` only, never persists (advisor finding; `intently-profile.jsx:301-330`) | wire → `.claude/handoffs/new-user-ux-and-auth.md` (Preferences-persist AC) |
| PreferencesPage | "Hold to talk" toggle | Persist preference | same | stub — same | wire → same |
| PreferencesPage | "Read replies aloud" toggle | Persist preference | same | stub — same | wire → same |
| PreferencesPage | "Brief time / 7:00 AM" row | Edit brief time | preference store | missing — `StaticRow` non-interactive | defer → post-launch |
| PreferencesPage | "Review window / After 8:00 PM" row | Edit review window | preference store | missing — same | defer → post-launch |
| PreferencesPage | "Week start" cycle button | Cycle through days; persist | `localStorage:intently:prefs` (`SelectRow`) | wired (`SelectRow` uses `setPref` — advisor noted distinction from `ToggleRow`) | wired |
| PreferencesPage | "Weekly review day" cycle button | Cycle through days; persist | same | wired | wired |
| PreferencesPage | "Brief reminder" toggle | Persist + schedule notification | preference + push API | stub (toggle) + missing (push API) | wire → `.claude/handoffs/scheduled-agent-dispatch.md` (notifications AC) + `.claude/handoffs/new-user-ux-and-auth.md` (Preferences-persist AC) |
| PreferencesPage | "Review nudge" toggle | Persist + schedule notification | same | stub + missing | wire → same |
| HelpPage | Back arrow | Return | UI state | wired | wired |
| HelpPage | "Contact support / hi@intently.app" row | Open mailto: or support form | external | missing — `StaticRow` non-interactive | defer → post-launch (low-priority) |
| HelpPage | "What's new / Apr 2026" row | Open changelog | external / modal | missing — same | defer → post-launch |

---

## Connections page

`ConnectionsPage` in `web/intently-extras.jsx:409`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| ConnectionsPage | Back arrow | Return to ProfileSheet | UI state | wired (`onClose={() => { setShowConnections(false); setProfileView('sheet'); }}`) | wired |
| ConnectionsPage | Per-integration "Connect" button (gcal / icloud / outlook / gmail / slack / notion / github) | Open OAuthFlow | OAuth handshake → store token | wired *to a mock* (`OAuthFlow` is `setTimeout`-mocked end-to-end — no real OAuth, no token storage) | wire → `.claude/handoffs/oauth-calendar-email.md` (OAuth wiring AC) |
| ConnectionsPage | Per-integration "Disconnect" button (when connected) | Disconnect integration | clear token row | wired *to local state only* (`useConnections.disconnect` clears `connected[id]`; doesn't revoke OAuth or delete token from DB because no token ever existed) | wire → same |
| ConnectionsPage | OnboardingConnectCard "Connect" button (declared in `intently-extras.jsx:585`, but **not currently mounted** in the React tree at `index.html`) | Open ConnectionsPage | UI state | unreachable — declared but never rendered (`OnboardingConnectCard` is exported but no parent uses it) | defer → post-launch (or wire when onboarding gets surfaced) |
| ConnectionsPage | OnboardingConnectCard "Dismiss" X button | Dismiss the onboarding card | `useConnections.dismissOnboarding()` | unreachable — same | defer → same |

---

## OAuth flow

`OAuthFlow` in `web/intently-extras.jsx:229`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| OAuthFlow | "Cancel" button (consent phase) | Dismiss flow | UI state | wired | wired |
| OAuthFlow | "Allow" button (consent phase) | Begin auth phase | UI state | wired *to mock* — `setPhase('auth')` then `setTimeout(1600ms)` advances to success without any real handshake | wire → `.claude/handoffs/oauth-calendar-email.md` |
| OAuthFlow | Auto-advance auth → success | Mock OAuth success | UI state | wired *to mock* (`setTimeout` chain in `useEffect`) | wire → same |
| OAuthFlow | "What we read" pulls list | Display only | static `integration.pulls[]` | wired (display) | wired |

---

## Journal composer

`JournalComposer` in `web/intently-extras.jsx:13`. Reached via hero menu → "New journal entry".

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| JournalComposer | Close X button | Dismiss without saving | UI state | wired | wired |
| JournalComposer | Save button (right of header) | INSERT journal entry; close composer | `entries` (kind=journal) via `useManualAdds.addJournal` | wired | wired |
| JournalComposer | Textarea (autofocus on mount, "Just write." placeholder) | Capture journal text | local state | wired | wired |
| JournalComposer | Word count footer | Display only | local computation | wired | wired |
| JournalComposer | Hardcoded "now" date (`new Date(2026, 3, 23, 14, 32)`) | Display "today" | `Date.now()` (real) | **partial** — uses fixture date `Apr 23 2026 2:32pm`, not real now (`intently-extras.jsx:16`) | wire → post-launch fixture-removal (low priority for demo; fix when calendar/today resolution is generalized) |

---

## Cross-cutting

### Identity surfaces (3 hardcoded avatars)

Three locations render an avatar with hardcoded initial + name. Pre-loaded finding #7. All three should consume a single `<Avatar>` component reading from a user-context provider that pulls from `profiles.display_name`.

| Surface | Location | Hardcoded value | Decision |
|---|---|---|---|
| ProfileButton (bottom-left, persistent) | `intently-extras.jsx:223` | `M` letter | wire → `.claude/handoffs/new-user-ux-and-auth.md` Avatar AC |
| ProfileSheet hero | `intently-profile.jsx:113` (avatar) + `:119` (Sam Tanaka) + `:123` (sam@intently.app) | `S` + `Sam Tanaka` + email | wire → same |
| JournalReader avatar + author line | `intently-reading.jsx:101-104` | `S` + `Sam` | wire → same |

Additional hardcoded "Sam" / fixture references (per the wiring-audit handoff, may want to gate to dev-mode or parameterize):

- `intently-flows.jsx:431` ("Good morning, Sam.") — **Note:** the live `BriefFlow` agent prose is dynamic; this string belongs to a different flow (`PresentMorning` — confirmed dead code, see § Dead code). Skip.
- `intently-flows.jsx:1394, 1534` (`'Good morning, Sam.'` in `PresentEmpty`) — **live**. Wire → same Avatar AC handoff (display_name substitution).
- `intently-screens.jsx:197` ("Good morning, Sam.") — dead code (see § Dead code).

### Swipe shell + dot indicator

`web/intently-shell.jsx`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| SwipeShell | Pointer down/move/up handlers | Drag horizontally between Past/Present/Future panels with rubberband + threshold snap | UI state (`index`) | wired | wired |
| SwipeDots | Dot tap (in `intently-shell.jsx:67`, separate from `TenseNav` in `intently-journal.jsx`) | Jump to tense | UI state | wired (but `SwipeDots` is exported and *not* mounted in the live tree — see § Dead code) | wired (mounted variant) / dead (unmounted variant) |

### Undo toast

`UndoToast` in `web/intently-flows.jsx:2142`. Subscribes to `window.showUndoToast(opts)`.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| UndoToast | "Undo" button (when `onUndo` provided) | Run undo callback (DELETE / UPDATE prior values) | varies per flow | wired | wired |
| UndoToast | Auto-dismiss after 6s | Toast disappears | UI state | wired | wired |

### Tense nav

`TenseNav` + `TenseNavArrows` in `web/intently-journal.jsx:518-587`. Bottom-of-phone dot indicator + desktop-only outside-frame arrows.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| TenseNav | Dot tap (Past / Present / Future) | Jump to tense | UI state | wired | wired |
| TenseNavArrows | Left/right arrow (desktop only, ≥900px) | Step tense | UI state | wired | wired |

### Dev panel (dev-mode only)

`DevPanel` in `web/index.html:1165`. Visible only when `html.dev-mode` is set (localhost auto-on, `?dev=1` query, etc.).

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| DevPanel | 6 day-state buttons (Morning / Brief / Mid-day / Evening / Review / Closed) | Force `dayState` for testing | UI state | wired | wired (kept for dev only; never visible in production) |

### Update-tracker MA agent

Provisioned per `agents/update-tracker/SKILL.md` and `docs/product/acceptance-criteria/update-tracker.md`. Pre-loaded finding #9.

| Surface | Element | Implied state | Implied data binding | Current status | Decision |
|---|---|---|---|---|---|
| (none in current UI) | Voice/chat utterance routed to `update-tracker` skill (e.g. "promote me to senior dev") | Update goals/projects/profile via agent | various tables | **missing** — `classifyTranscript` only routes to reminder/journal today; no UI ever calls `callMaProxy({ skill: 'update-tracker' })` | wire → § Next #6 in TRACKER + `docs/product/acceptance-criteria/update-tracker.md` (CR-update-tracker-supabase-wiring-01..05) |

---

## Dead code (not in deployed tree)

The original audit flagged ~1,800 lines of unmounted JSX from forks left behind during the prototype-into-`index.html` migration. **PR #166** (conservative cleanup) deleted `web/intently-screens-prototype.jsx` (~415 lines) and `web/design-system.html` (~527 lines), and the follow-up to PR #166 deleted `web/intently-screens.jsx` (~461 lines) after extracting its only kept symbol (`ScreenHeader`) into `web/intently-cards.jsx`. What remains in the dead-code surface area:

- **`web/intently-projects.jsx`** `ProjectDetail` (the v1, distinct from `ProjectDetailV2` in `intently-flows.jsx`) — unmounted; `ProjectDetailV2` replaced it.
- **`web/intently-cards.jsx`** `TrackerCard`, `PlanCard`, `JournalCard`, `ConfirmationCard`, `FeatureCard` — design-system-canvas-only cards. The `design-system.html` host they were used by has been deleted; these are orphaned and can come out next pass. (`ScreenHeader`, `RingProgress`, `InputTrace`, `ConfidenceDot`, `Avatar` in this same file ARE live.)
- **`web/intently-shell.jsx`** `SwipeDots` — declared but only `SwipeShell` is mounted by `index.html`; `SwipeDots` is not.
- **`web/intently-extras.jsx`** `OnboardingConnectCard` — declared but never rendered in the React tree.
- **`web/design-canvas.jsx`** — entirely separate `DesignCanvas` for the design system canvas. Its host was deleted in PR #166; this file is now orphaned.
- **`web/ios-frame.jsx`** — presentational chrome (`IOSDevice`, `IOSStatusBar`); zero interactive handlers; mounted but not interactive.

Notes on previously-listed entries:
- *`web/intently-hero.jsx` action-card code path* (the `m.kind === 'action'` branch with stubbed Edit/Send/Undo) was deleted in PR #167.

Recommendation: a final cleanup pass can retire `web/design-canvas.jsx` and the design-system-canvas-only cards inside `intently-cards.jsx` (since their host `design-system.html` is gone), plus `SwipeDots` and `OnboardingConnectCard`.

---

## Cross-cutting observations

Things this audit surfaced that warrant Muxin's attention but don't fit a single row:

1. **Dead code is *substantial*.** Roughly 1,800 lines across `intently-screens.jsx`, `intently-screens-prototype.jsx`, the v1 `ProjectDetail`, design-system-only cards, and the unreachable action-card code path. The prototype was forked into `index.html` mid-build, and the originals were never removed. A cleanup pass would significantly improve grep-ability and reduce the chance that a future contributor edits the wrong copy.

2. **Hardcoded fixture dates pollute "today".** `JournalComposer` uses `new Date(2026, 3, 23, 14, 32)` as "now" (`intently-extras.jsx:16`); `JOURNAL_DATA` is a deterministic mulberry32 mock spanning Jan 1 → Apr 23 2026 (`intently-journal.jsx:6-27`); `TODAY` constant `new Date(2026, 3, 23)` (`intently-journal.jsx:36`). Once the demo bar passes, these need to be replaced with real-now-derived data, or the journal mosaic will look stale on Apr 24.

3. **Form/input affordances frequently rendered as static `<div>`s with non-interactive right-side hints.** Examples: AccountPage's "Password / Change" / "Export / Download" / "Delete account / ·"; HelpPage's "Contact support / hi@intently.app". These look tappable to a user (right-aligned colored value text) but are non-interactive. This is likely the single biggest source of "looks wired but isn't" surprises.

4. **Two separate dot-indicator components.** `SwipeDots` (`intently-shell.jsx:59`) and `TenseNav` (`intently-journal.jsx:518`) both render Past/Present/Future dot indicators. Only `TenseNav` is mounted; `SwipeDots` is dead code. Worth picking one to keep and removing the other.

5. **`MonthView` / `WeekView` day taps lose the date.** Pre-tap the cell knows which day it is; post-tap, only `setZoom('Day')` is called — the day view always shows "today". This is a subtle correctness bug where the affordance succeeds at zoom but fails at navigation. Fold into a future `journal-zoom-fidelity.md` AC.

6. **Tracking mismatch: settings persistence is split.** `SelectRow` persists via `setPref` (localStorage); `ToggleRow` does not (internal `useState` only). The toggles look identical to the user, but flipping "Always confirm before saving" forgets immediately on next open. This is a classic "rule cuts in half" edge case worth fixing as part of the Preferences AC.

7. **OAuth is fully cosmetic today.** All seven integrations (Gmail, Google Calendar, Outlook, Apple Calendar, Slack, Notion, GitHub) "connect" via a `setTimeout(1600ms)` mock with no real handshake, no token storage, and no edge function. The integration page is convincing visually — Muxin should be aware that *zero* connection state is real today.

8. **Sign-out is cosmetic.** `onSignOut={() => setProfileView(null)}` (`index.html:1087`) just closes the sheet. No `supabase.auth.signOut()` call. Easy fix; high embarrassment risk if a user genuinely tries it.

9. **Search is non-interactive.** `JournalHeader`'s "Search entries…" affordance is rendered as a `<span>` (`intently-journal.jsx:46-48`). Looks like a search input; isn't.

10. **`PresentClosed` declares an unused `onReopenReview` prop.** `intently-flows.jsx:1586` accepts the prop but never wires it to a button. Either remove the prop or surface a "Reopen review" affordance.

---

## Authority

If a row in this inventory disagrees with a future TRACKER decision or handoff AC, the handoff AC wins (it's groomed; this is a draft). Update this inventory in a follow-up edit when groomed decisions land.

Live verification (Playwright pass exercising affordances against a real DB) is the wiring-audit pass 2 deliverable, not this one. This document is a code-reading-only artifact.

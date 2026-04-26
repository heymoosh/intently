# `web/WIRING-POINTS.md` — prototype JSX → `app/lib/` wiring map

**Generated:** 2026-04-25 by overnight build loop iteration 3 (analysis-only).
**Source branch:** `auto/build-loop/2026-04-25-03-wiring-points`.
**Purpose:** Saturday's live wiring port walks this document top to bottom, porting each row. Pairs with `web/PORTING.md` (lib inventory) and `web/RN-PORTING-OBSTACLES.md` (RN-only surface audit — produced in parallel by iter 2; was NOT on disk at the time iter 3 ran, so wiring decisions below may need re-checking against iter 2's conclusions).

## How to read this doc

- Each row = one wiring task. Saturday's session executes them in order.
- "Current implementation" = what the prototype JSX does today (in-memory state, mock script, no-op).
- "Target lib function" = the `app/lib/` symbol from PORTING.md to invoke. Names and signatures are quoted verbatim.
- "Port shape" = where the wiring code lives. Per PORTING.md the leading recommendation is `web/lib/<name>.js` files plus a `window.INTENTLY_CONFIG` env-var block in `index.html`.
- **Lib calls land at accept, not at start.** PresentEmpty's "Start your daily brief" CTA (intently-flows.jsx:1107) opens `BriefFlow` — the actual `callMaProxy({ skill: 'daily-brief', ... })` invocation lands at `BriefConfirmCard onAccept` (intently-flows.jsx:516, the `onComplete && onComplete(MOCK_PLAN)` line). Same pattern for review.

## Top-level findings

- **~12 wiring points** total once UI-state-only events (zoom toggles, swipe nav, profile sheet routing, reading-mode open/close) are excluded from the count. The scope brief estimate of 5–15 holds.
- **Densest cluster: `intently-flows.jsx`** — owns the brief flow, review flow, and the populate animation. Three of the four highest-priority wiring beats live here (`callMaProxy` for brief, `callMaProxy` for review, `fetchDueReminders` to seed brief input).
- **Hero affordance is the linchpin and the most ambiguous.** Voice transcript has TWO live targets in the prototype (route to chat thread, OR classify-and-store as a reminder), and PORTING.md's `MaSkill` union has no `'chat'` entry. Saturday must decide the fork before the hero can be wired live. See OPEN QUESTIONS Q1.
- **Manual entity CRUD (goals, projects, journal, plan items, admin reminders, project todos) has no `app/lib/` helper.** All six AddZone destinations flow through `useManualAdds` (intently-extras.jsx, in-memory) today. PORTING.md inventory ships zero entity-insert helpers. The wiring target is raw `supabase.from('<table>').insert(...)` per `lib/supabase.js`. This is a wiring *decision* (which tables exist? add helpers?), not a wiring *task*. See OPEN QUESTIONS Q2.
- **OAuth modal is mocked end-to-end.** `OAuthFlow` in `intently-extras.jsx` simulates consent → auth → success with `setTimeout`s. PORTING.md surfaces no OAuth lib. TRACKER Next #2 is the gating item; defer wiring entirely for the demo.
- **Render layer is unwired.** `app/lib/render/daily-brief-context.ts` has no caller anywhere; this affects what payload gets passed to `callMaProxy({ skill: 'daily-brief', input: ??? })`. Inherit PORTING.md OPEN QUESTION 2 verbatim — Saturday's call.

---

## Hero affordance (HIGHEST PRIORITY)

Per `BUILD-RULES.md` §1: *"The hero affordance is the ONE interaction surface. Voice note, type, chat, quick action, commit an entry, generate a brief, run a review — all one button."* The hero is THE wiring beat that touches every demo flow.

State machine, from `intently-hero.jsx:29`: `'idle' | 'listening' | 'processing' | 'expanded' | 'chat'`.

### Hero wiring map

| State / event | Element / location | Current implementation | Target lib function | Port shape | Saturday priority |
|---|---|---|---|---|---|
| Mic short-tap (idle → listening) | `onMicPointerUp` short-tap branch, `intently-hero.jsx:107-110` | `onChange('listening')` flips to `HeroListening` overlay | `useVoiceInput().start()` from `lib/voice.js`. Per PORTING.md line 227: hook returns `{ state, start, stop, reset, submitManual }`, wraps `window.SpeechRecognition`. | Replace local `onChange('listening')` with `voice.start()`; bind `voice.state.kind === 'listening'` to render `<HeroListening>`. Lift `useVoiceInput` call into `PrototypePhone` so the same instance is shared with the listening view. | P0 (demo path) |
| Listening → live transcript text | `HeroListening` typewriter mock, `intently-hero.jsx:229-237` | Hard-coded `full` string typed via `setInterval` | `useVoiceInput().state.transcript` (interim + final) per PORTING.md line 227 ("accumulates final + interim transcript"). | Replace `t` state with `state.transcript || state.interim`. Keep "I'm listening." as the empty-state fallback. | P0 |
| "Stop and send" button | `intently-hero.jsx:302-310` (the bottom-right square stop button) | `onDone` flips state to `'chat'` (no transcript handling) | `useVoiceInput().stop()` then route the final transcript per Saturday's decision (Q1). Two viable paths: (a) `classifyTranscript(transcript, supabaseUrl)` per PORTING.md line 229 (capture-as-reminder); (b) `callMaProxy({ skill: '<chat-skill-tbd>', input: transcript })` (conversational). | After `voice.stop()` and `voice.state.kind === 'stopped'`, branch on Q1's resolution. For the demo, `classifyTranscript` is the only function that exists; use it and have the agent decide whether the captured note is a reminder or chat. | **P0 — DECISION REQUIRED before wiring.** |
| Listening close (X button) | `intently-hero.jsx:244-250` | `onDone()` returns to idle | `useVoiceInput().reset()` per PORTING.md line 227 (aborts recognition, clears transcript). | Direct call. No proxy needed. | P0 |
| Listening "type instead" 48px disc | `intently-hero.jsx:287-294` | No handler attached today | `useVoiceInput().submitManual(text)` per PORTING.md line 227 (typed-input fallback). | Wire to open a typed-input mode within `HeroListening` (or transition to `HeroChat`). Currently a presentational button — Saturday adds the input. | P1 |
| Chat composer text input | `HeroChat` `<input>` at `intently-hero.jsx:451-458` | Local `draft` state, no submit | `callMaProxy({ skill: '<chat-skill-tbd>', input: draft, sessionId })` per PORTING.md line 121. **`MaSkill` does not currently include `'chat'`** — see Q1. | On Enter / send-button click, call `callMaProxy`, append response via `toAgentOutput(finalText, { kind: 'chat', title: '...' })` per PORTING.md line 122. Append to thread. | P0 (chat is the demo's "ongoing conversation" beat) |
| Chat composer mic button | `intently-hero.jsx:459-465` | `onMic()` flips state back to `'listening'` | Same as mic short-tap above — `voice.start()`. | Reuse the listening path; the chat-thread context is preserved. | P0 |
| Chat thread message rendering (3 hardcoded turns + 4 confirmation cards) | `intently-hero.jsx:323-331` (the seeded `thread` array) | Hardcoded mock thread | Replace with state-managed thread; each agent turn is the `finalText` from a `callMaProxy` call rendered through `kindMetaFor('chat')` from PORTING.md line 72. | New module `web/lib/chat-thread.js` (out of PORTING.md inventory — Saturday creates). | P1 (mock thread is fine for screenshots; real wiring requires Q1 resolved) |
| Inline action card "Undo" button | `intently-hero.jsx:424-433` | No handler | TBD — depends on whether agent actions land in DB rows that can be reversed. No `app/lib/` helper exists today. | Defer until agent-tools layer exists. | P2 |
| Inline action card "Send" button (draft email) | `intently-hero.jsx:413-421` | No handler | TBD — same as Undo. | Defer. | P2 |
| Quick-action menu pick: `'journal'` | `activate('journal')` → `onPick('journal')` → host opens `JournalComposer`. `intently-hero.jsx:51-58`, dispatch at `intently-screens-prototype.jsx:805-812`. | Local `setShowJournal(true)` | No lib call needed at the menu step — the journal save lives at `JournalComposer` (see manual-add table below). | Pure UI state. | n/a |
| Quick-action menu pick: `'text'` / `'chat'` | `activate('text')` → `onChange('chat')`, `intently-hero.jsx:56` | Flips to `HeroChat` | No lib call needed at the menu step — the chat send lives at the composer (above). | Pure UI state. | n/a |
| Hero `'processing'` ring | `ProcessingArc` at `intently-hero.jsx:216-223` | Currently entered via timer in `PrototypePhone` (`heroState === 'processing'` → reset to `'idle'` after 1800ms, intently-screens-prototype.jsx:559-564) | Bind to `useVoiceInput().state.kind === 'processing'` OR to a pending `callMaProxy` Promise. | Saturday picks: voice-side processing (audio finalizing), or proxy-side processing (waiting on agent), or both. | P1 |

**Hero summary for Saturday:** the single most important wiring beat is the *transcript fork*. `HeroListening`'s "stop and send" button (intently-hero.jsx:302) currently just transitions to chat with no payload. Saturday must decide whether that transcript routes to `classifyTranscript` (capture as reminder), to `callMaProxy({ skill: <new-chat-skill>, input })` (start a chat turn), or both in sequence. Until the fork is decided, the hero is voice-recognition-only — the transcript dies on `onDone`.

---

## OPEN QUESTIONS

1. **Where does the voice transcript route?** `HeroListening` ends with a "stop and send" button (intently-hero.jsx:302) and a chat-handoff transition (`onChange('chat')` at line 122). PORTING.md's `MaSkill` union is `'daily-brief' | 'daily-review' | 'weekly-review' | 'monthly-review' | 'update-tracker' | 'setup'` — **no `'chat'` skill**. Three options:
   - (a) Route every transcript to `classifyTranscript(transcript, supabaseUrl)` per PORTING.md line 229. The Edge Function decides reminder-vs-conversation.
   - (b) Add a `'chat'` skill to the `MaSkill` union AND the agents folder; route via `callMaProxy({ skill: 'chat', input: transcript })`.
   - (c) Both — capture the reminder if the classifier says so, AND start a chat turn so the user sees acknowledgment.
   - **This blocks hero wiring.** Pick before Saturday begins porting.
2. **Manual entity CRUD has no lib helper.** Six wiring rows below (goals add, projects add, plan items add, journal add, admin reminders add, project todos add) and three toggle rows (admin reminder done, project todo done, project todo edit) all need to insert/update Supabase rows. PORTING.md inventory ships ZERO entity-insert helpers — the only Supabase consumer in `app/lib/` is `supabase.ts` itself (the singleton client) and `render/daily-brief-context.ts` (read-only). Decision needed:
   - (a) Add `web/lib/entities.js` with `insertGoal`, `insertProject`, `upsertJournal`, etc. — defines the `goals`, `projects`, `journal_entries`, `plan_items`, `admin_reminders`, `project_todos` tables as part of the wiring port.
   - (b) Wire each row's `onCommit` to a raw `supabase.from('<table>').insert({...})` call inline in the JSX. Faster but no abstraction.
   - (c) Defer entity persistence entirely for the demo — keep `useManualAdds` in-memory, only persist what daily-brief / daily-review write through their own MA paths.
3. **Render layer unwired (inherited from PORTING.md OPEN Q2).** What payload does `callMaProxy({ skill: 'daily-brief', input: ??? })` receive? Three options: (i) browser calls `renderDailyBriefContext(supabase, userId, today)` first and passes the markdown string; (ii) Edge Function does the render; (iii) skip render, agent fetches via tools. Affects the `BriefConfirmCard onAccept` row (the wiring root for daily-brief).
4. **`fetchDueReminders` placement.** PORTING.md line 140 says daily-brief input gets a "Due reminders (from prior sessions)" markdown block via `formatRemindersForInput`. Should this happen at `BriefFlow` open (intently-flows.jsx:454, before any user prompt) so the agent's first turn can reference reminders, or at `BriefConfirmCard onAccept` (line 516, just before `callMaProxy`)? Recommend the former for narrative quality; either is mechanical.
5. **Env-var injection mechanism.** PORTING.md proposes `window.INTENTLY_CONFIG = { supabaseUrl, supabaseAnonKey }` set in `<script>` block at top of `index.html` before bundle load. Confirm Saturday — alternative is inlining literals at port-time. Anon key is RLS-gated; safe to inline for V1 single-user.
6. **Where does the wiring JS live?** Add `<script type="text/babel" src="lib/<name>.jsx">` lines to `index.html`? Or a separate non-Babel `<script type="module">`? Babel-standalone strips TS, but module-level imports (`import`/`export`) don't work without a build step. Recommend per-file `Object.assign(window, {...})` exports matching the existing prototype convention (see `web/README.md`).
7. **Iter 2's `web/RN-PORTING-OBSTACLES.md` was NOT on disk when iter 3 ran.** Wiring decisions in this doc may need cross-checking once iter 2 lands. In particular: Q1 (hero/chat skill) and the entire hero section may shift if iter 2 surfaces an obstacle in `useVoiceInput` that requires structural change.

---

## Per-JSX-file wiring tables

### `web/intently-flows.jsx` — brief flow, review flow, goal & project detail

This file owns the two most important wiring beats: `BriefFlow` and `ReviewFlow`. Both are full-screen overlays driven by hardcoded `BRIEF_SCRIPT` (line 429) and `REVIEW_SCRIPT` (line 677) message arrays. Each ends with a `ConfirmCard` whose accept button is the wiring root for the agent invocation.

| Event | Element / location | Current implementation | Target lib function | Port shape | Saturday priority |
|---|---|---|---|---|---|
| BriefFlow opens | `BriefFlow` mount, intently-flows.jsx:454. Triggered by `setDayState('brief')` from `PresentEmpty onStartBrief` (intently-screens-prototype.jsx:723) | Hardcoded 4-step `BRIEF_SCRIPT`; agent and user lines are mocked | `fetchDueReminders(date?: Date) => Promise<DueReminder[]>` per PORTING.md line 140, then `formatRemindersForInput(reminders)` per line 141. Append to brief input context. Per Q4, fire at flow-open. | Replace `useEffect` script driver with state that accumulates real agent turns from `callMaProxy`. Each user input becomes a `callMaProxy({ skill: 'daily-brief', input: <accumulated context>, sessionId })` turn. | P0 (the demo's headline) |
| BriefFlow user input submit (3 occurrences) | `submit(text)` at intently-flows.jsx:481-487; bound to Enter and send button at lines 531, 538 | Pushes user message into local `messages` state, advances `step` | `callMaProxy({ skill: 'daily-brief', input: <user-text-plus-context>, sessionId })` per PORTING.md line 121. Use `toAgentOutput(finalText, { kind: 'brief', title })` per line 122 to render. | Each user turn is one MA call. Persist `sessionId` across turns so the agent has continuity. | P0 |
| `BriefConfirmCard` accept button | intently-flows.jsx:516, `onComplete && onComplete(MOCK_PLAN)` → fires `onBriefComplete` at intently-screens-prototype.jsx:582-585, which sets `briefJustAccepted = true` and `dayState = 'planned'` | Hands `MOCK_PLAN` constant (intently-flows.jsx:608-635) to the planned-phase render | This is the **save** beat. Final `callMaProxy({ skill: 'daily-brief', ... })` returns the structured plan. Persist via Q2 helpers (insert plan items into `plan_items` table). | The MOCK_PLAN shape (`{pacing, flags, bands, parked}`) is the contract the agent must return. Saturday confirms agent SKILL.md emits this shape. | P0 |
| ReviewFlow opens | `ReviewFlow` mount, intently-flows.jsx:717. Triggered by `setDayState('review')` from `PresentPlanShell onStartReview` (intently-flows.jsx:366-378) | Hardcoded 5-step `REVIEW_SCRIPT` with auto-check animation | `callMaProxy({ skill: 'daily-review', input: <today's-data>, sessionId })`. PORTING.md line 117. Optionally pre-fetch `fetchDueReminders` for context. | Same shape as `BriefFlow` — replace script driver with real MA turns. The auto-check animation (`AUTO_CHECK_ITEMS` line 710) becomes "what the agent inferred you did today" returned by the first MA turn. | P0 (the demo's other headline) |
| ReviewFlow user input submit (3 occurrences) | `submit(text)` at intently-flows.jsx:763-769; bound to Enter and send button at lines 816, 823 | Pushes user message, advances script | `callMaProxy({ skill: 'daily-review', ... })` per turn. | Same pattern as BriefFlow. | P0 |
| `ReviewConfirmCard` accept button | intently-flows.jsx:1013, `onAccept` → `onComplete()` at intently-flows.jsx:802 → `onReviewComplete` (intently-screens-prototype.jsx:586-588) sets `dayState = 'closed'` | Currently no persistence | Final review save: persist tomorrow's seed via Q2 helpers, insert journal entry, persist `Carrying into tomorrow` as next-day brief seed. | The final agent response should return `{ journal, friction, tomorrow, calendar }` matching the card layout (intently-flows.jsx:945-1011). Confirm SKILL.md. | P0 |
| `GoalDetail` "open project" button | intently-flows.jsx:235, `<ProjectCard onOpen={() => onOpenProject && onOpenProject(p)} />` | Local state in `PrototypePhone` (`setOpenProject`) | No MA call — pure navigation. | None. | n/a |
| `GoalDetail` back button | intently-flows.jsx:142 | Local state | None. | n/a | n/a |
| `ProjectDetailV2` add todo | intently-flows.jsx:413, `<AddZone onCommit={(v) => onAddProjectTodo && onAddProjectTodo(p.id, v)} />` | `useManualAdds.addProjectTodo` (in-memory) | **Q2 decision.** Per (a): new `insertProjectTodo(projectId, text)` helper. Per (b): inline `supabase.from('project_todos').insert({ project_id: projectId, text })`. | One row per project todo write. | P1 (covered by Q2) |
| `ProjectDetailV2` toggle todo done | intently-flows.jsx:387, `onToggleProjectTodo` | In-memory toggle | **Q2 decision.** `updateProjectTodo(id, { done })` or inline `supabase.from('project_todos').update({ done }).eq('id', id)`. | One row. | P1 |
| `ProjectDetailV2` open linked goal | intently-flows.jsx:317, `onOpenGoal` | Local state | None — pure navigation. | n/a | n/a |

---

### `web/intently-hero.jsx` — covered above

See **Hero affordance** section. No additional rows here.

---

### `web/intently-screens-prototype.jsx` (RETIRED — see PR #166)

This file was removed in the conservative dead-code cleanup. Its `PrototypePhone` orchestrator and AddZone wiring rows were superseded by inline `PresentPlanProtoAnimated` / `FutureScreenProtoTappable` definitions in `web/index.html`. The wiring rows that lived here have been folded into the relevant per-symbol tables elsewhere in this doc, or deferred per Q2 (manual entity CRUD).

---

### `web/intently-extras.jsx` — JournalComposer, OAuthFlow, ConnectionsPage, OnboardingConnectCard

| Event | Element / location | Current implementation | Target lib function | Port shape | Saturday priority |
|---|---|---|---|---|---|
| `JournalComposer` save button | intently-extras.jsx:57, `onClick={handleSave}` → `onSave(text.trim())` at line 29 | Calls `useManualAdds.addJournal('today', text)` via the host (intently-screens-prototype.jsx:744-748) | **Q2 decision.** `insertJournal(text, date)` helper or `supabase.from('journal_entries').insert({ text, date: today })`. | One row. Same target as the in-line AddZone variants in PresentPlan and PastJournal — Saturday should consolidate these into one helper. | P1 |
| `JournalComposer` close button | intently-extras.jsx:44 | Local state | None. | n/a | n/a |
| `OAuthFlow` connect (animated) | intently-extras.jsx:229, phases `consent → auth → success` driven by `setTimeout` at lines 234, 238 | Pure mock; calls `onConnected(integration.id)` after 2.5s total | **No `app/lib/` helper exists for OAuth.** TRACKER Next #2 gates this. For the demo, leave as mock. | Defer entirely. | P2 |
| `OAuthFlow` cancel button | intently-extras.jsx:352 | Local state | None. | n/a | n/a |
| `ConnectionsPage` connect button on row | intently-extras.jsx:480, `onConnect={() => onConnect(it)}` → opens `OAuthFlow` | In-memory `useConnections.connect(id)` (line 603) | Defer with OAuth wiring. | n/a | P2 |
| `ConnectionsPage` disconnect button on row | intently-extras.jsx:481 | In-memory `useConnections.disconnect(id)` | Defer with OAuth wiring (eventually deletes the OAuth token row). | n/a | P2 |
| `OnboardingConnectCard` open / dismiss | intently-extras.jsx:564, 585 | In-memory `useConnections.dismissOnboarding` | None — pure UI. | n/a | n/a |

---

### `web/intently-manual-add.jsx` — `AddRow`, `InlineAdd`, `AddZone` (the building blocks)

This file defines no destinations — it's the input primitive consumed by every AddZone in the prototype. The `onCommit` callbacks are bound by host components (covered above). No wiring here directly.

| Event | Element / location | Current implementation | Target lib function | Port shape | Saturday priority |
|---|---|---|---|---|---|
| `InlineAdd` commit | intently-manual-add.jsx:95, `onCommit && onCommit(v)` | Bubbles up to host AddZone, then to host's `onCommit` prop | None — this file is the input primitive. Wiring happens at the consumer (rows above). | n/a | n/a |

---

### `web/intently-shell.jsx` — `SwipeShell`, `SwipeDots`

Pure UI state (horizontal swipe + dot indicator nav). No wiring.

No interactive surfaces beyond UI state — pure presentation/navigation.

---

### `web/intently-journal.jsx` — Past tense (Year/Month/Week/Day zoom + entry list)

Pure UI state (zoom toggles, day-tile drilling, entry tap → open reading mode). No persistence-side wiring; entries currently come from hardcoded fixtures inside the file (`DayView`, line 251) and from `ENTRY_DATA` in `PrototypePhone`.

Future wiring (post-demo): replace fixture entries with `supabase.from('journal_entries').select(...)` reads. **Out of scope for Saturday.**

| Event | Element / location | Current implementation | Target lib function | Port shape | Saturday priority |
|---|---|---|---|---|---|
| Zoom toggle (Year/Month/Week/Day) | intently-journal.jsx:59 | Local `setZoom` | None — pure UI. | n/a | n/a |
| Day tile tap (drilling down) | intently-journal.jsx:140, 195 | Local `setZoom('Day')` | None — pure UI. | n/a | n/a |
| Entry tap → reading mode | intently-journal.jsx:273, 338 | `onPickEntry(id)` → `setOpenEntry` in host | None — entries are fixtures today. | Defer. | P2 |

---

### `web/intently-projects.jsx` — `ProjectCard`

Pure UI state (open project, back nav). Project list comes from `PROJECT_DATA` constant; replacing with Supabase is post-demo.

| Event | Element / location | Current implementation | Target lib function | Port shape | Saturday priority |
|---|---|---|---|---|---|
| Project card open | intently-projects.jsx:95, `onClick={onOpen}` | Local state in host | None — pure navigation. | n/a | n/a |
| Project card back | intently-projects.jsx:122 | Local state | None. | n/a | n/a |

---

### `web/intently-cards.jsx` — agent confirmation card variants, expandable cards

| Event | Element / location | Current implementation | Target lib function | Port shape | Saturday priority |
|---|---|---|---|---|---|
| Card "inspect" tap | intently-cards.jsx:19 | Local prop callback | None — pure UI today. Eventually opens reading mode. | n/a | P2 |
| Expandable card toggle | intently-cards.jsx:158 | Local `setExpanded` | None — pure UI. | n/a | n/a |
| Inline confirmation card "Undo" | intently-cards.jsx:296 | Calls `onUndo` prop; no consumer today | TBD — same as the hero chat thread Undo (deferred). | Defer. | P2 |

---

### `web/intently-profile.jsx` — `SettingRow`, `ProfileSheet`, `AccountPage`, `PreferencesPage`, `HelpPage`

Pure UI state — settings rows, sub-page nav, toggle switches. No persistence yet (preferences should eventually write to user profile row, but no `app/lib/` helper exists).

| Event | Element / location | Current implementation | Target lib function | Port shape | Saturday priority |
|---|---|---|---|---|---|
| Profile sheet sub-page nav (account, connections, preferences, help, sign out) | intently-profile.jsx:134-165 | Local routing | None — pure UI for the demo. Sign-out is `supabase.auth.signOut()` once auth lands. | Defer. | P2 |
| Preferences toggle switch | intently-profile.jsx:250 | Local `setOn(o => !o)` | None — pure UI for the demo. Eventually `supabase.from('user_preferences').update(...)`. | Defer. | P2 |
| Account / Preferences / Help back button | intently-profile.jsx:197 | Local routing | None. | n/a | n/a |

---

### `web/intently-reading.jsx` — full-fidelity entry reader overlay

Pure UI state (close, edit, more menu). Edit/More callbacks have no consumers today.

| Event | Element / location | Current implementation | Target lib function | Port shape | Saturday priority |
|---|---|---|---|---|---|
| Reading-mode close | intently-reading.jsx:27 | Host clears `openEntry` | None. | n/a | n/a |
| Reading-mode edit | intently-reading.jsx:42 | No consumer | TBD — eventually opens an editor for the journal/chat/review entry. Likely uses `journal-editor.js` from PORTING.md line 104. | Defer. | P2 |
| Reading-mode more menu | intently-reading.jsx:52 | No consumer | None — pure UI. | n/a | n/a |

---

### Pure-presentation files (no wiring)

- **`web/intently-glyphs.jsx`** — icon library. No interactive surfaces.
- **`web/intently-imagery.jsx`** — `PainterlyBlock`, `MorningLight` SVGs. No interactive surfaces.
- **`web/intently-tokens.jsx`** — design token constants exported on `window.T`. No interactive surfaces. *(Note: per PORTING.md OPEN Q1, this file may render `app/lib/tokens.ts` throwaway. iter 2 confirms.)*
- **`web/ios-frame.jsx`** — `IOSDevice`, `IOSStatusBar` chrome. No interactive surfaces.
- **`web/design-canvas.jsx`** — review canvas (the design system spread). Not part of the prototype's runtime (`index.html` doesn't load it). Pure presentation.

---

## Total wiring footprint

| Section | P0 | P1 | P2 |
|---|---|---|---|
| Hero affordance | 6 | 3 | 2 |
| `intently-flows.jsx` (brief + review) | 6 | 2 | 0 |
| `intently-extras.jsx` JournalComposer / OAuth | 0 | 1 | 5 |
| Other files (manual-add, journal, projects, cards, profile, reading, shell) | 0 | 0 | 7 |
| **Total** | **12** | **6** | **14** |

Net **12 P0 wiring rows** = the demo path. The other 20 are nice-to-have or post-demo. Saturday's session should aim to land all 12 P0 plus the entity-CRUD P1 rows that Q2 unblocks (journal save being the easiest one to demo end-to-end). The retired `intently-screens-prototype.jsx` AddZone rows (PR #166) live inline in `web/index.html` now and are not separately tracked here — they remain Q2-blocked.

---

## Recommended port order for Saturday

1. **Resolve OPEN QUESTIONS Q1, Q2, Q3 in the first 15 minutes.** Q1 is hard-blocking on the hero; Q2 is hard-blocking on every AddZone; Q3 affects the brief input payload shape. Pick concrete answers and commit them.
2. **Lift PORTING.md mechanical files into `web/lib/`.** `agent-output.js`, `journal-editor.js`, `voice.js`, then `ma-client.js`, `reminders.js`, `supabase.js` (with the env-var rebinding + UMD Supabase script). Per PORTING.md "Saturday port checklist" lines 270-291.
3. **Wire the hero — voice → classify → store.** Once Q1 is decided, this is the demo's spine. Replace `HeroListening`'s mock typewriter with `useVoiceInput().state.transcript`. Wire "stop and send" to `classifyTranscript` (or chat path per Q1). Mic button starts `voice.start()`.
4. **Wire `BriefFlow` end-to-end.** Replace `BRIEF_SCRIPT` driver with `callMaProxy` per turn. Pre-fetch `fetchDueReminders` + `formatRemindersForInput` at flow open. `BriefConfirmCard onAccept` becomes the final MA call + plan persist.
5. **Wire `ReviewFlow` end-to-end.** Same shape as brief. The auto-check animation derives from the agent's first-turn response listing inferred-done items.
6. **(If Q2 lands as option (a) or (b))** Wire the 6 entity AddZones — start with journal save (single helper, three call sites), then plan items, then admin reminders, then goals/projects/project todos.
7. **Pure-UI overlays already work.** Profile sheet, swipe nav, zoom toggles, reading mode — no wiring needed. Verify they survive the lib insertions.
8. **Defer everything P2** (OAuth, reading-mode edit, preferences persistence, inline action card Undo/Send, expandable card inspect). These are post-demo cleanup.

# Intently — Engineering Handoff

*A written companion to `Intently Design System.html`. Read this first; then open the canvas to see what each piece looks like.*

---

## 0. TL;DR

**Intently is a three-tense journaling app with an agentic voice affordance as its one primary surface.** You swipe between **Past · Present · Future**. A floating voice/chat button (the **hero affordance**) lives in the bottom-right of every screen — it's how you speak, write, confirm, or navigate. The agent takes what you say, turns it into typed entries (brief / journal / chat / review), and keeps the three tenses in sync.

Three sentences:

1. **Past** is a zoomable art-journal (Year → Month → Week → Day). Each day is one painted glyph.
2. **Present** is today: morning daily brief, the day's plan, and an evening review.
3. **Future** is long-term goals (each with a monthly slice) + the projects you're running under them.

---

## 0.1 If you're Claude Code (or any engineer) — start here

**Read these files in order, then stop and ask before writing code:**

1. **`HANDOFF.md`** (this file) — full product + data model. End-to-end. Sections 0–11.
2. **`BUILD-RULES.md`** — non-negotiables and anti-patterns. Read this *carefully* before adding any chrome (tabs, segmented controls, generate buttons, etc.).
3. **`Intently Design System.html`** — open in a browser. Every component is shown in its intended context, labeled, in the canvas. When in doubt about what something looks like, this is ground truth.
4. **`Intently Prototype.html`** — the clickable hi-fi demo. Use the dev panel (left of phone) to jump between day-states. This is the spec for **the demo path** — the components that are wired into the day arc.

**Two source-of-truth surfaces, one purpose each:**

- **Design System canvas** = the **library** of approved components in their intended layouts. Static. Side-by-side artboards for visual review. *Everything here is approved design.*
- **Prototype** = the **demo path** through the day arc, with state management, dev toggles, and overlays wired together. *Not every approved component is used here — see §5.2.*

**Where to look for what:**

| Looking for… | Read… |
|---|---|
| What is this product? | §0–1 |
| Data model (Goals, Projects, Entries, Reminders) | §2 |
| Screen-by-screen breakdown | §3 |
| State machines (hero, day phase) | §4 |
| File map | §5.0 |
| Component inventory + when to use each | §5.2 |
| End-to-end flows (morning, evening, journal capture, etc.) | §6 |
| Design system tokens (colors, type, motion) | §7 |
| What's intentionally out-of-scope | §11 |

**Five things that will save you time:**

1. **Tokens are non-negotiable.** Never hardcode a color, font, radius, or shadow. Add a token first if needed (`intently-tokens.jsx`). The whole reskin pattern (§7) depends on this.
2. **The Design System canvas is for component review, not a tabbed UI spec.** Three artboards side-by-side means *three variants of one screen* — never a tab bar. Repeat: never. (See `BUILD-RULES.md`.)
3. **The hero affordance is THE input surface.** Voice, chat, commits, brief generation, review — all funnel through it. Do not add parallel "Generate X" or "Talk to agent" buttons elsewhere.
4. **Phase and zoom are data, not UI.** Present's morning/planned/evening is time-of-day. Past's year/month/week/day is tap-to-drill + the zoom segmented control inside `JournalHeader`. No top-level tabs.
5. **The agent drafts; the user confirms.** Every utterance becomes a typed Entry via a `ConfirmationCard` (or its purpose-built siblings `BriefConfirmCard` / `ReviewConfirmCard`). Don't auto-commit.

**Component reuse before invention.** If a screen needs a card-shaped thing, scan §5.2 and the canvas first. We have `FeatureCard`, `JournalCard`, `PlanCard`, `TrackerCard`, `ConfirmationCard`, `ReadingMode`, plus painterly primitives (`PainterlyBlock`, `Collage`, `LandscapePanel`, `MorningLight`, `ColorTile`). Don't roll a new card unless none of these fit.

---

## 1. The product model

### 1.1 The three tenses

| Tense | What it's for | Default view |
|---|---|---|
| **Past** | Reflecting. See what you've done, felt, shipped. | Week of *Week 17 · Apr 20–26* |
| **Present** | Acting. Today's plan + the morning brief or evening review that bookends it. | Today (Thursday, Apr 23) |
| **Future** | Committing. Your 3 long-term goals and their monthly slice. | This month (April) |

Tenses are laterally swipeable. The nav at the bottom is **← · · · →** — three dots for position, arrows to step. There are no text labels for the tenses anywhere in production chrome.

### 1.2 The hero affordance

One floating button in the bottom-right of every screen. Four states:

```
idle → (tap) → listening → processing → (commit entry or open chat) → idle
idle → (press-and-hold) → expanded quick-action menu → (release on tile) → picks tile → idle
```

- **idle** — small disc with mic glyph
- **listening** — full-screen takeover; waveform; agent transcribes live
- **processing** — arc spinner briefly; agent drafts
- **chat** — full-screen text thread; for when you'd rather type or continue a conversation
- **expanded** — radial quick-action tiles: *Today's log · Type instead · New journal entry · Jump to chat*

Everything flows through this affordance. Creating a journal entry, adding to your plan, asking the agent a question, doing the end-of-day review — all one button. *Manual-add inline fields on each surface are the quiet escape hatch; see §1.4.*

### 1.3 The agent is the glue

Wherever the user speaks or types, the agent:

1. **Transcribes** voice to text.
2. **Classifies** the intent (journal entry? plan edit? review? question?).
3. **Drafts** a structured entry in the right place in the right tense.
4. **Surfaces a confirmation card** inline so the user can tweak, accept, or toss.

The confirmation card is the atomic unit of "the agent did something." Sage surface, cream serif, two pill actions. See `intently-cards.jsx → ConfirmationCard`.

### 1.4 Manual add — the escape hatch

The hero affordance is the *primary* way to put things into Intently, but it is **not the only way**. Every surface that holds user data also offers a quiet **inline manual-add** affordance, sized down and placed last in the stack. This exists because:

- Voice isn't always appropriate (a meeting, a library, a loud train).
- Users sometimes know exactly what they want to record and don't need an agent to draft it.
- A tool that *only* works through an AI feels fragile; a tool with a direct path underneath feels trustworthy.

**Principle — Agent-first, not agent-only.** The hero is the front door. Manual add is the back door. Both lead to the same data model; neither is hidden.

Where manual add appears:

| Surface | What it adds | Lands in |
|---|---|---|
| **Present · each time band** | Plan item | `Entry{kind:'plan', phase, band}` |
| **Present · bottom of plan** | Quick journal entry | `Entry{kind:'journal'}` on today |
| **Past → Day** | Journal entry, backdated to viewed day | `Entry{kind:'journal'}` |
| **Future · Admin band** | Misc reminder (checkbox todo) | `Reminder` under system `Admin` project |
| **Future · Goals band** | New goal | `Goal` (up to 3) |
| **Future · Projects band** | New project under a goal | `Project` |
| **Project detail · tracker** | Project todo | `Reminder{project_id}` |

The hero affordance is **never** used for admin-shaped reminders ("buy kitty litter," "renew passport") — that's what the Admin band + its inline add is for. Speaking into the hero is for journal entries, plan edits, and conversation with the agent; *not* for appending to a todo list.

**`Reminder` as project-todo.** A `Reminder` is a checkbox-style todo belonging to a `Project`. Projects cluster them by free-text `topic`. There is one system project per user, `Admin`, which is where unclustered misc reminders live (no goal parent, surfaced only in Future's Admin band — never inside a goal's project list).

```
Reminder {
  id
  project_id          // always set; Admin project for misc reminders
  topic               // free-text cluster within the project, e.g. "Packing", "Paperwork"
  text                // "Renew passport"
  done                // bool
  source              // 'manual' | 'agent'
  created_at
}

Project {
  id
  goal_id             // nullable; null means this is the system Admin project
  title
  // ... (see §2.3)
  is_admin            // system project; exactly one per user
}
```

See `intently-manual-add.jsx` and `ProtoAddZone` / `ProtoAddRow` for the component implementation.

---

## 2. Data model (MVP)

Five entity types. Everything the user sees is derived from these.

### 2.1 `Goal`
A long-term vision the user picked. 3–5 year horizon.

```
Goal {
  id
  title            // "Move to Japan."
  created_at
  monthly_slice    // one sentence scoped to THIS month, refreshed on month boundary
                   // e.g. "April: finish the visa checklist and book the scouting trip for June."
  glyph            // visual motif: plane | leaf | handshake | mountain | ...
  palette          // 4-stop painterly palette, see §7.4
}
```

Exactly **three** goals live at a time in MVP. The user can swap one out but not hold 4+ — the constraint is part of the product.

### 2.2 `Project`
A medium-scale body of work. Typically rolls up to a goal, but can stand alone.

```
Project {
  id
  title           // "Job Hunt" | "Pitch deck v2"
  goal_id?        // optional parent goal
  body_markdown   // a freeform doc the user maintains; agent can append notes
  todos []        // {text, done, created_at}
  updated_at
  status          // active | parked | done
}
```

Projects render as cards in the **Projects band** underneath the goals on Future. Tap → `ProjectDetail` (see `intently-projects.jsx`).

Not kanban. Not Gantt. A markdown doc with a to-do list underneath. That's it, for MVP.

### 2.3 `Entry`
Every timestamped thing the user creates. Typed.

```
Entry {
  id
  at              // ISO timestamp
  kind            // brief | journal | chat | review
  title
  body_markdown
  glyph           // auto-assigned by agent from the ~40 glyph set (§7.5)
  mood            // dawn | morning | midday | dusk | night | rain | forest  (§7.4)
  source          // voice | text | agent
  links []        // optional: project_id, goal_id, entry_id (e.g. review → today's entries)
}
```

Entries are the **only** thing that lands in storage when the user talks. No raw transcripts. No chat messages floating orphaned — every commit becomes a typed Entry.

### 2.4 `DailyBrief`
Computed each morning. A read-only snapshot.

```
DailyBrief {
  date
  yesterday_highlight    // one painted panel — glyph, quote, palette
  this_week []           // 3 bullets lifted from the latest WeeklyReview outcomes
  flags []               // Urgent | Important | Parked — agent's picks
  plan {                 // today's structure
    morning   []
    afternoon []
    evening   []
  }
  generated_at
}
```

The **morning** phase of Present shows a pre-brief invitation (big sunrise CTA). Tapping it animates into the brief itself — the full card stack. Once accepted, Present transitions to the **planned** phase.

The "This week" bullets on the morning brief are the **first three outcomes** from the current `WeeklyReview`. If those two places disagree, the weekly review is the source of truth.

### 2.5 `WeeklyReview`
Computed Sunday evening (or on-demand via the hero). The backing data for:
- Past → Week view's *"This week's outcomes"* list
- Next morning's *This week* bullets on the brief
- Next week's planning prompts

```
WeeklyReview {
  week_id                // ISO week
  summary                // one-line: "Pitch moving. Ops role still unformed. Watch: investor-call crunch on Thursday."
  outcomes []            // {text, status: done|doing|todo}
  key_moments []         // {glyph, text}  — the week's painted highlights
  generated_at
}
```

### 2.6 `DailyReview`
The evening-of-today bookend. Generated when the user taps the *"Start your daily review"* CTA on Present.

```
DailyReview {
  date
  accomplished []        // {text, glyph}
  one_liner              // "Shipped the slide. Walked after dinner."
  mood
  committed_to_tomorrow? // optional single sentence
}
```

Stored as an Entry with `kind=review`, plus updates the paired DailyBrief.

---

## 3. Screen map

```
┌──────────── Past ──────────┐  ┌──────── Present ────────┐  ┌────── Future ─────┐
│  PastJournal               │  │  PresentScreen          │  │  FutureScreen     │
│  ┌─ Year                   │  │  phase:                 │  │  · goals (3)      │
│  ├─ Month                  │  │  ├─ morning (pre-brief) │  │  · projects band  │
│  ├─ Week   (default)       │  │  ├─ planned             │  │     ↓ tap         │
│  └─ Day                    │  │  └─ evening (review)    │  │   ProjectDetail   │
└────────────────────────────┘  └─────────────────────────┘  └───────────────────┘
                       ↑               ↑               ↑
                  TenseNav (← · · · →) at bottom — persistent
                  HeroAffordance (bottom-right) — persistent
```

### 3.1 Past — zoom levels

Tap a day in any zoom → drops you one level (Year tap → Month; Month tap → Week; Week tap → Day).

| Zoom | Title | What it shows |
|---|---|---|
| **Year** | *The year, at a glance.* | 365 tiles. Each day = one glyph (or a dot if empty). Month dividers. |
| **Month** | *This month.* | 5×7 grid of day tiles with full glyph + painted tint. |
| **Week** *(default)* | *What this week is for.* | 7-day strip + the Weekly Review summary + outcomes list + key moments. |
| **Day** | *Today, in your words.* | Chronological Entries: brief → journal → chat → review. With an archive of earlier day-entries pinned underneath. |

### 3.2 Present — phases

Same component (`PresentScreen`), three data-driven phases:

- **morning** — `PresentMorning` — yesterday's highlight panel, This week bullets (from WeeklyReview), **big sunrise CTA** in the middle of the bottom third: *Start your daily brief*.
- **planned** — `PresentPlanned` — Flags band (Urgent/Important/Parked) + morning/afternoon/evening plan sections with checkable rows.
- **evening** — Same planned view but with a **midnight CTA** pinned at bottom: *Start your daily review*.

Phase is determined by time-of-day in production. In the Design System canvas, all three are shown as static artboards side-by-side so they can be compared.

### 3.3 Future

- ScreenHeader: *"What this month is for."*
- Three **goal cards** — painterly background, Fraunces italic vision line, hairline divider, small "APRIL" eyebrow + April sentence. Each with an atmospheric corner glyph (plane / leaf / handshake).
- "Name a new goal" ghost button.
- **Projects band** — compact card grid of `Project`s. Tap → `ProjectDetail` modal/push.

Projects sit **below** the goals in the same scroll container. The design-system canvas includes two artboards: one showing Future at the top (goals visible), one pre-scrolled to show the projects at the bottom.

---

## 4. State machines

### 4.1 Hero affordance

```
                   ┌──────────────────┐
                   │      idle        │ ◀───────────┐
                   └──────┬───────────┘             │
             tap          │         press-and-hold  │
                          ▼                         │
                   ┌──────────────┐    ┌─────────────────────┐
                   │  listening   │    │  expanded (menu)    │
                   │ (full screen)│    │  radial tiles       │
                   └──────┬───────┘    └─────────┬───────────┘
                          │                      │
                          ▼           release-on-tile picks it
                   ┌──────────────┐              │
                   │ processing   │              │
                   │ (arc spin)   │              │
                   └──────┬───────┘              │
             commit entry │  or continue         │
                          │                      │
                          ▼                      ▼
                   ┌──────────────┐    ┌─────────────────────┐
                   │  (persisted  │    │  chat (full thread) │
                   │   → idle)    │    └─────────┬───────────┘
                   └──────────────┘              │
                                                 ▼
                                          (back to idle)
```

**Press-and-hold is select-on-release**, not tap-after-open. If the user releases on a tile, that tile is picked. If they release outside, the menu closes with no action. This is intentional — one gesture, one commit.

### 4.2 Past zoom

```
Year ⇄ Month ⇄ Week ⇄ Day
       ↑                  ↑
       └──── tap day ─────┘  (drops one level)
```

The zoom chip in the top-right of `PastJournal` cycles all four levels explicitly.

### 4.3 Present phase

```
morning ──── user taps "Start daily brief" ────▶ planned
planned ──── time crosses ~7pm OR user taps "Start daily review" ────▶ evening
evening ──── review committed ────▶ (next day's) morning
```

---

## 5. File map

All files live at the project root. Load order matters — later files depend on earlier globals.

| File | Exports (to `window`) | Purpose |
|---|---|---|
| `intently-tokens.jsx` | `T`, `Icon` | Design tokens (colors/type/shadow/radius/motion) + Lucide-style icon set. **Source of truth for all styling primitives.** |
| `intently-glyphs.jsx` | `Glyph`, `GLYPH_NAMES` | The ~40 hand-picked daily-mark glyphs (plane, leaf, pen, etc.) with a single `<Glyph name size color stroke>` renderer. |
| `intently-imagery.jsx` | `PainterlyBlock`, `MorningLight`, `LandscapePanel`, `intently-grain` CSS | Painterly card backgrounds. Deterministic blob SVGs driven by a 4-stop palette + seed. See §7.4. |
| `intently-cards.jsx` | `FeatureCard`, `ConfirmationCard`, `ReflectionCard`, `PlanCard`, `TodoRow`, etc. | The content cards that appear inside screens. Image-forward, block-color. |
| `intently-hero.jsx` | `HeroAffordance`, `HeroListening`, `HeroChat`, `HeroExpandedMenu` | The floating button and all its takeover surfaces. Owns the state machine in §4.1. |
| `intently-journal.jsx` | `PastJournal`, `YearView`, `MonthView`, `WeekView`, `DayView`, `JOURNAL_DATA` | The zoomable art-journal. Owns the fake data for MVP hackathon. |
| `intently-projects.jsx` | `ProjectsBand`, `ProjectCard`, `ProjectDetail`, `PROJECT_DATA` | The Projects band under Future + the detail view. |
| `intently-screens.jsx` | `PastScreen`, `PresentScreen`, `FutureScreen`, `ScreenHeader` | The three tense screens. Present has `phase` prop. Future has `scroll` prop. |
| `intently-screens-prototype.jsx` | `PresentPlanProto`, `FutureScreenProto`, `ProjectDetailProto` | **Prototype-only** forks of the screens that wire in inline-add affordances. The Design System canvas uses the originals; the prototype HTML uses these. |
| `intently-manual-add.jsx` | `InlineAdd`, `useManualAdds` | Single-line inline add control + tiny session store. The pattern for any "add a thing" affordance. |
| `intently-flows.jsx` | `BriefFlow`, `ReviewFlow`, `GoalDetail`, `ProjectDetailV2`, `PresentEmpty`, `PresentClosed`, `usePopulate`, `ChatBubble`, `AgentTyping`, `BriefConfirmCard`, `ReviewConfirmCard`, `AutoCheckList` | Day-arc flows + their building blocks. Brief & Review are full-bleed overlays driven by step indices. `usePopulate` animates plan-band fade-in after brief acceptance. |
| `intently-extras.jsx` | `JournalComposer`, `ConnectionsPage`, `OAuthFlow`, `ProfileButton`, `OnboardingConnectCard`, `INTEGRATIONS`, `useConnections` | Journal entry overlay + Connections sub-page + integration registry + the bottom-left avatar button. |
| `intently-profile.jsx` | `ProfileSheet`, `AccountPage`, `PreferencesPage`, `HelpPage` | The profile/settings hub. Tap avatar → sheet; rows open sub-pages or the existing `ConnectionsPage`. |
| `intently-reading.jsx` | `ReadingMode`, `ENTRY_DATA` | Tap-to-read overlay for journal entries from Past → Day. Three variants by entry kind: `journal` (painterly hero + long-form), `chat` (saved thread), `review` (logged review). |
| `intently-shell.jsx` | `SwipeShell`, `TenseNav`, `Phone` | Lateral swipe deck + the dot bottom nav (arrows on ≥900px) + phone frame wrapper for artboards. |
| `design-canvas.jsx` | `DesignCanvas`, `DCSection`, `DCArtboard` | Pan/zoom canvas starter — presentation chrome only, not product. |
| `ios-frame.jsx` | device bezel starter | Phone bezel used by `Phone` in `intently-shell.jsx`. |
| `Intently Design System.html` | — | The canvas itself. Imports everything above, lays out all artboards across 7 sections. |
| `Intently Prototype.html` | — | The clickable end-to-end prototype. The full day arc, all overlays wired together, dev-only day-state toggle outside the phone. |

### 5.1 Deliberate file-splitting rules

- **Tokens never reach into components.** If a component needs a color it doesn't have, add a token first — never hardcode.
- **Screens don't know about cards' internals.** They compose cards positionally.
- **Hero is a peer of screens, not a child.** It overlays every screen the same way.
- **PainterlyBlock accepts a palette — never a named mood string.** Moods are a lookup that lives in data, not in imagery.

---

## 5.2 Component inventory — wired vs on the bench

This is a single-designer hackathon codebase. Some components are wired into the prototype's day-arc; others were built earlier and parked because they belong to states or features that aren't part of the MVP demo. **None are dead code — all are intentional.** Engineering should know which is which before refactoring.

### Wired in `Intently Prototype.html` (the demo path)

These are the components a user actually touches when they walk through the prototype:

- **Shell** — `Phone`, `SwipeShell`, `TenseNav`
- **Tenses** — `PastJournalProto`, `PresentScreen` (all phases), `FutureScreenProtoTappable`
- **Past** — `JournalHeader`, `YearView`, `MonthView`, `WeekView`, `DayView`
- **Hero** — `HeroAffordance` (idle / expanded radial). The radial opens `JournalComposer` (existing journal) or composes flows.
- **Day arc** — `BriefFlow`, `ReviewFlow`, `usePopulate`, `BriefConfirmCard`, `ReviewConfirmCard`, `AutoCheckList`, `ChatBubble`, `AgentTyping`, `PresentEmpty`, `PresentClosed`
- **Detail screens** — `GoalDetail`, `ProjectDetailV2`
- **Profile/settings** — `ProfileButton`, `ProfileSheet`, `AccountPage`, `PreferencesPage`, `HelpPage`, `ConnectionsPage`, `OAuthFlow`
- **Journal capture** — `JournalComposer`
- **Reading** — `ReadingMode` (journal/chat/review variants)
- **Manual-add** — `InlineAdd`, `useManualAdds`

### On the bench (built but not in the demo)

These live in the codebase and are validated in `Intently Design System.html`. They're production-intent — when the day arc grows past the demo's happy path, these come off the bench. Listed by file with their intended use.

#### `intently-cards.jsx` — content cards

| Component | When to use |
|---|---|
| **`ConfirmationCard`** | **The trust surface.** Every agent action that mutates state should preview as a `ConfirmationCard` before committing — butter-yellow surface, big serif action line, *because* line, input-trace dots, Undo. The "Hey, I want to confirm this with you" bubble. The prototype currently uses a simpler `BriefConfirmCard`/`ReviewConfirmCard` for the brief/review flows specifically, but for **any other agent action** (rescheduling a meeting, declining a sync, pulling a task into today, etc.), use `ConfirmationCard`. There's a `confidence: 'low'` variant that flips the surface to peach + dashed border for "the agent is unsure, ask the user." |
| **`FeatureCard`** | Tomorrow-style giant full-bleed image + headline. Use for the **Daily Brief hero moment** (sunrise + "Today is for…") and for any one-card-takes-the-screen moment. Not currently in the prototype's morning flow because we went with chat-driven brief; could be added back as the *result* of a brief. |
| **`JournalCard`** | A single past journal entry as a card with painterly landscape panel + pull-quote. Use in **rails of recent entries** (e.g. on Present's evening phase) or as a Past → Week-view summary card. Currently superseded in the demo by `ReadingMode`. |
| **`PlanCard`** | Butter-yellow block with time-block chips, expandable. Use as the **Present plan summary** when we want a denser, scannable view (vs. today's narrative-list layout). |
| **`TrackerCard`** | Painterly block with ring-progress + delta. Use on a **Project** to show "you're 60% to the milestone, +12% this week." Currently in the design system canvas; not yet on the project detail. |
| **`InputTrace`** | The little row of dots showing what the agent looked at (Calendar, Journal, Email…). Always pairs with a `ConfirmationCard`. |
| **`ConfidenceDot`** | High / Medium / Low confidence indicator. Pairs with `ConfirmationCard`. |
| **`RingProgress`** | Just the ring SVG. Used inside `TrackerCard` but reusable for any % indicator. |

#### `intently-hero.jsx` — voice/chat surfaces

| Component | When to use |
|---|---|
| **`HeroListening`** | Full-screen listening takeover with live waveform + transcribing text. Currently only previewed in the design system. Wire this in when voice input becomes real (right now the brief/review flows simulate chat instead). |
| **`HeroChat`** | Full-screen mixed voice+text chat with inline `ConfirmationCard`s and Undo. Currently bypassed by the brief/review flows. Wire this in for **ad-hoc agent conversations** outside the day-arc — e.g. "tomorrow at 8am, remind me to call mom" → agent responds, drafts, confirms inline. |
| **`VoiceWaveform`**, **`ProcessingArc`** | Building blocks for the above. Reusable elsewhere if you need a wave or spinner. |

#### `intently-imagery.jsx` — painterly primitives

All exported. `PainterlyBlock` is the workhorse and is wired everywhere. The others are also production:

- **`Collage`** — Pinterest-style rotated rectangles. Use as a **decorative panel** behind a Goal title or on the marketing surface.
- **`MorningLight`** — sunrise gradient panel. Use for the **Daily Brief hero moment** (`FeatureCard` typically wraps it).
- **`LandscapePanel`** — vertical painterly landscape with mood palettes. Used by `JournalCard` and standalone in `ReadingMode` (journal kind).
- **`ColorTile`** — flat-color tile for **rail thumbnails** (recent entries, project cards in compact mode).
- **`DotGridBackdrop`** — Pinterest-style canvas backdrop. Use behind any **artboard or hero card** that needs to feel "pinned to a board" rather than flat.

#### `intently-cards.jsx` — `ReflectionCard`, `TodoRow`, etc.

If `Object.assign` lists a name not covered above (e.g. `ReflectionCard`, `TodoRow`), it's a smaller primitive intended for composition. Read the file — they're short.

### Why some things are on the bench

The MVP demo prioritizes **the agentic day arc** (brief → plan → review → close). Anything that doesn't appear in that loop got parked:

- **`HeroListening` / `HeroChat`** — real voice infra is post-MVP; the brief/review flows simulate chat for the demo.
- **`ConfirmationCard` (full version)** — the brief/review have their own purpose-built confirm cards (`BriefConfirmCard`, `ReviewConfirmCard`) tuned to those flows. The general `ConfirmationCard` is for **the second wave**: when the agent starts taking actions outside of brief/review (rescheduling meetings, declining syncs, pulling tasks).
- **`FeatureCard`, `MorningLight`, `JournalCard`, `Collage`** — alternate visual treatments validated in the canvas but not chosen for the demo's specific layouts. They're correct expressions of the design system; pick them up when their corresponding layouts come back.
- **`TrackerCard`** — Project detail currently shows a flat to-do list. Add `TrackerCard` to the detail when projects start tracking real progress numbers.

When in doubt, **check the design system canvas first** (`Intently Design System.html`). Every component is presented in its intended context with a label. If you see a layout there you want to ship, lift the component combination wholesale.

---

## 6. Key flows — how the pieces fit

### 6.1 Morning: the daily brief

1. App opens to **Present**, phase = `morning`.
2. User sees: yesterday's highlight, This week bullets, big sunrise CTA.
3. User taps *Start your daily brief*.
4. `HeroAffordance` enters `listening` — agent greets, user speaks if they want; or skip.
5. Agent generates the `DailyBrief` (fields in §2.4). Renders the brief as a sequence of cards overlaid on Present.
6. User accepts → phase flips to `planned`. `DailyBrief` is persisted. Entries of kind `brief` appear in today's Day view.

### 6.2 Ad-hoc voice from anywhere

1. User taps the idle hero on any screen.
2. `listening` takeover — full-screen waveform + live transcript.
3. User talks ("remind me to walk after dinner" / "journal: the data slide is still defensive").
4. `processing` — agent classifies.
5. Result is rendered as a **ConfirmationCard** inline on the originating screen (plan edit → today's plan; journal entry → a new Entry in Past/Today).
6. User taps *Confirm* or edits → commit.

### 6.3 End of day: the review

1. After ~7pm, Present's phase becomes `evening`. The midnight CTA surfaces.
2. User taps *Start your daily review*.
3. Hero takes over; agent lists today's accomplishments drawn from Entries since the last brief.
4. User edits / confirms.
5. `DailyReview` persisted as Entry. Tomorrow's `DailyBrief` is pre-seeded with "yesterday's highlight".

### 6.4 Weekly cascade

1. Sunday evening, agent composes `WeeklyReview` from the week's entries and today's review.
2. Monday morning's brief's "This week" pulls from `WeeklyReview.outcomes`.
3. Past → Week view surfaces the same `WeeklyReview` under the 7-day strip.

### 6.5 Monthly goal refresh

1. On month boundary, agent prompts the user (via hero chat) to refresh each `Goal.monthly_slice`.
2. User confirms one sentence per goal.
3. Future screen updates. The same monthly slice seeds the weekly review's goal prompts.

---

## 7. Design system

### 7.1 Typography

| Role | Font | Use |
|---|---|---|
| `T.font.Display` | Fraunces (italic, 500) | Screen titles, card headlines, agent-voiced quotes. |
| `T.font.Reading` | Source Serif 4 | Journal bodies, essay bodies, long-form entries. **Reading mode** widens margins and bumps line-height here. |
| `T.font.UI` | Geist / Inter (fallback) | Eyebrows, metadata, buttons, nav. |

- Screen-title sizes: 40–48px italic on Display.
- Reading-mode bodies: 17–18px, 30px line-height, side margins ~42px inside the phone frame.

### 7.2 Color

See `intently-tokens.jsx → T.color`. The semantic groups:

- **Surfaces** — `PrimarySurface` (warm linen), `SecondarySurface` (cream), `SunkenSurface`, `EdgeLine`.
- **Text** — `PrimaryText` (deep espresso 13:1), `SupportingText`, `SubtleText`, `InverseText`.
- **Painterly tints** — `TintSage`, `TintSageDeep`, `TintSageSoft`, `TintLilac`, `TintDusk`, `TintButter`, `TintPeach`, `TintPeachSoft`, `TintClay`, `TintMoss`, `TintMint`. These are CARD SURFACES, not UI chrome. Pick by mood/semantic pairing.
- **CTA** — the morning CTA is a sunrise gradient (clay → amber → butter); the evening CTA is a midnight gradient (deep indigo → dusk lilac). Do not use solid PrimaryText for CTAs — reserve that for body type.

### 7.3 Shadow, radius, grain

- `T.shadow.Raised` — soft card lift. Use on goal cards, journal entries, plan rows.
- `T.radius.Card` (18px) — universal card corner. Tiles in Year/Month view use `12px`.
- **Grain** — the `.intently-grain` class (defined in `intently-imagery.jsx` global CSS) is a dithered noise overlay at 20–30% opacity. Apply inside any painterly or tinted block to break up flat fills.

### 7.4 Painterly blocks

`PainterlyBlock` takes a 4-stop palette `[base, accent1, accent2, highlight]` and a numeric `seed`. It renders the base as a flat background and layers four SVG blobs using the other stops at fixed relative positions. Two palettes + two seeds = visually distinct blocks that still feel like one family.

Palettes are chosen for **mood**, not goal identity:

| Mood | Palette direction |
|---|---|
| `dawn` | lilac → peach → butter |
| `forest` | deep sage → moss → butter → clay |
| `dusk` | lilac → dusk blue → peach → ink |
| `rain` | soft sage → butter → peach |

When in doubt, darken the base to shift a card darker; lighten accent stops to preserve dark-text legibility.

### 7.5 Glyphs

`intently-glyphs.jsx` ships ~40 hand-picked Lucide-sourced glyphs. Categories: time/energy, work/making, movement, people, weather, consumption. Usage:

- **Day marks** — one glyph per Entry. Agent picks automatically.
- **Goal atmospheres** — oversized faded glyph in the corner of each Future goal card.
- **Entry tags** — small 16–18px in lists.

Always stroke 1.4–1.75. Always monotone (`PrimaryText` or `InverseText`). No multi-color glyphs — that breaks the visual system.

---

## 8. Scope — MVP vs post-launch

### In for MVP (hackathon cut)

- Three-tense swipe shell with arrow-dot nav.
- Hero affordance with all four states.
- Past: Year/Month/Week/Day zoom.
- Present: morning pre-brief, planned phase, evening review CTA.
- Future: three goals + projects band.
- ProjectDetail view (markdown + todos).
- Auto-generated daily marks (agent picks the glyph).
- Reading mode for long-form files.

### Out / deferred

- User-uploaded imagery or photo journaling.
- Curated image library the user picks from.
- Gamification (streaks, badges, XP).
- Collaboration / shared goals.
- Kanban or Gantt project trackers.
- The weekly-review *authoring* UI (cards reflect it, but users edit it in chat for MVP).
- Monthly-review *authoring* UI (same — agent drafts in chat).
- Deep search across entries.
- Calendar integration (brief pulls from a fake schedule for now).

---

## 9. Implementation notes

### 9.1 Runtime

- React 18 + `@babel/standalone`. No build step. Each `.jsx` loads with `<script type="text/babel" src="...">`.
- **Babel script files do not share scope.** Every public symbol is re-exported at the end of its file via `Object.assign(window, { ... })`. If you add a new component meant to be used elsewhere, you must add it to its file's window-assign.
- Style objects declared at file scope **must be uniquely named** (e.g. `heroStyles`, not `styles`) to avoid collisions when multiple files are loaded.

### 9.2 Data, for now

All MVP data is hard-coded in the JSX files:

- `intently-journal.jsx → JOURNAL_DATA` — fake entries for the year strip / month / week.
- `intently-projects.jsx → PROJECT_DATA` — two projects.
- Goals are inline in `FutureScreen`.
- The daily brief, weekly review, and plan contents are inline in `PresentMorning` / `PresentPlanned` / `PresentEvening`.

When backing this with a real API, replace each of those with a fetch + hook, and keep the component signatures the same. None of the components know they're reading from inline data.

### 9.3 The Maya persona — one source of truth

The prototype uses one persona (Maya, Series A founder) across all surfaces. If you see hackathon-demo copy creeping in anywhere (*"Hackathon submission shipped"*, *"AMA with Thariq"*), that's drift — unify it back to the Series A persona so that:

- Morning *This week* bullets = the first three outcomes on the Week view.
- Present *Flags* and *Plan* reference the same projects as the Future projects band.
- Past *key moments* reference the same goals.

One life, one voice, three tenses.

### 9.4 What to build next

If picking this up cold, build in this order:

1. **Entry store** — one flat array with the types from §2.3. Every screen reads from it. Every hero commit writes to it.
2. **Agent pipeline** — mock a `classify(text) → {kind, fields}` function. Wire Hero listening → classify → Entry.
3. **DailyBrief generator** — a pure function of *yesterday's entries + current WeeklyReview + the day's calendar*. Run it on app open if today's brief doesn't exist.
4. **DailyReview flow** — hero-driven; composes an Entry of kind `review`.
5. **WeeklyReview generator** — similar, runs Sunday evening or on-demand.
6. **Real voice** — swap the listening takeover's fake waveform for a live mic stream; hook a speech-to-text provider.

Everything visual is done. The app's identity is in the files. What's missing is the plumbing behind them.

---

*Questions, changes, or scope shifts — annotate the design canvas directly or open a note on the relevant section in `Intently Design System.html`. The canvas is the living spec; this doc is the map to it.*

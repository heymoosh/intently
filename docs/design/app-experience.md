# App Experience — Design Direction

**Type:** Design doc — how the app looks, feels, and is operated. Evolves as we build and test.
**Created:** 2026-04-22
**Audience:** anyone building UI, writing copy, or deciding what ships this week.

---

## Core positioning

> The one thing you should never have to do again: use the finicky UI of a productivity app to keep track of something.

Just tell the AI things. It organizes. It keeps track. It reorganizes when things change. You still get visuals — checklists, kanban, timelines — as anchors that help humans understand work. But they're read-outs of what the AI already knows, not data-entry forms you grind through.

The second positioning pillar: **intentional, not busy.** The app keeps you aligned with *your* goals and priorities — not every notification, not every inbox, not every possible feature. It absorbs chaos on your behalf so you get to stay at the altitude of your own life.

---

## Three-screen swipe layout

Three screens, horizontally arranged, reached by swiping left/right. Borrows from mobile-game HUD design: no tab bar, no menu, three durable surfaces you always know how to get back to. Swiping in any direction 'rotates' between the screens - e.g. from center to left (journal) and left again takes you to the projects/future section, left again back to center. Center screen is always default.

| Screen | Tense | What lives here |
|---|---|---|
| **Left — Past** | What happened | Journal entries, past daily/weekly reviews, streaks/points/progress elements *(gamification is post-launch — see out-of-scope)* |
| **Center — Present** | Right now | Morning briefing, end-of-day review, the live chat with the agent, somatic/reset exercises *(somatic is post-launch)* |
| **Right — Future** | What's coming | Goals, project trackers, to-do lists, kanban and Gantt views *(kanban/Gantt are post-launch — to-dos ship)* |

**Directionality:** Western users read left-to-right, so past-on-the-left feels natural. For RTL / East Asian users who have cultural right-to-left reading, the layout flips (future setting, not hackathon). The principle is that *time flows the way the user reads* — we don't fight their native direction.

**Why three and not five or seven:** anything beyond three swipe destinations breaks spatial memory. Users should know, after one session, where everything is — forever.

---

## Interaction model

### Voice-first input, text + UI output

Voice is the lowest-friction input for capturing a thought. Reading is the fastest way to consume a response. So:

- **Input:** big voice-capture button is the primary affordance. Text input is available but secondary.
- **Output:** clean text + interactive cards. Never a wall of narration when a structured card would carry more signal.

### Dynamic chat — cards, not just bubbles

When the agent updates a tracker, moves a calendar block, or drafts a weekly plan, the chat stream should render a **card that shows the change**, not a paragraph that describes it. Examples:

- **Tracker Card** — project name, status indicator, a progress bar that animates from 40% → 50% when the agent logs progress.
- **Plan Card** — today's morning/afternoon blocks, tappable to expand into detail.
- **Journal Card** — the reflection the user just captured, their own words, timestamp.
- **Calendar Block Card** — a draggable visual block the user can nudge to a different time.

"Shows, doesn't tell" is the rule. The user should see the system working, not just read about it.

### Undo safety net

Because the agent is doing real work automatically — rewriting Weekly Goals, moving calendar blocks, updating trackers, categorizing notes — users will trust the app only if they can reverse anything fast. Every automated action gets a highly visible **[Undo]** button inline with the card that announced it.

Scope for hackathon: undo must exist for anything the agent writes to a Markdown file during the demo flows (daily plan, tracker updates, weekly goals rewrite). If undo is too expensive to build cleanly in 4 days, fall back to **confirm-before-apply** on destructive writes — same trust outcome, simpler implementation.

---

## Accessibility principles

Accessibility is an input into the interaction model, not a retrofit. The three-screen layout, voice-first capture, and card-shaped outputs must all work for users on assistive tech from day one.

**Source:** see `docs/design/mobile-app-accessibility-design.md` for the full rule set.

- **Navigation works without swiping.** The three-screen swipe is the primary path for most users, but every screen is also reachable via keyboard, switch control, and the VoiceOver rotor. Gesture navigation is not the only path.
- **Voice-first is not voice-only.** Text input is equal-status, not a secondary affordance hidden behind an overflow menu. Non-speaking users, noisy environments, and shared spaces get the full interaction model.
- **Cards are coherent to a screen reader.** Each card type (Tracker, Plan, Journal, Confirmation) reads linearly: heading → state → body → actions. An agent-updated Tracker Card emits an accessibility announcement on state change, not just a visual animation.
- **Tap targets and thumb zones are design constraints, not preferences.** Voice capture and Undo are 44×44 pt minimum on iOS (48×48 dp on Android), placed in the lower half of the screen for one-handed use. The Undo affordance never shares a tap zone with another action.
- **Text scales.** Copy is written and laid out assuming 200% text scaling. Cards reflow rather than truncate; key content never disappears at larger font sizes.
- **Platform primitives carry semantics.** RN `Pressable`, `Text`, `View`, `FlatList` with platform accessibility traits. Custom controls declare role, state, and label.
- **Verification before release:** each demo flow can be completed end-to-end using only VoiceOver + large text on iOS and TalkBack + large text on Android. This is release-gate item #7, not a stretch goal.

---

## Markdown as the state model

The app's state lives in Markdown files. The agent reads and writes them. The user can read and edit them directly when they want to — but they see a **rendered** view (formatted headings, checkboxes, links), not raw symbols and hashes.

This replaces the Obsidian-as-truth framing from the earlier architecture docs. The *file shape* from the Life Ops plugin spec still holds (`Weekly Goals.md`, `Daily Log.md`, `Projects/[Name]/Tracker.md`, etc.). What changes is:

- Files live in the app's per-user cloud store, not an Obsidian vault.
- The app ships its own lightweight Markdown viewer/editor — not the full Obsidian experience.
- Users who want to power-edit can open the raw Markdown; casual users never need to.

This is the compromise that lets non-technical users install and use Intently without knowing what Markdown is, while preserving the file-based portability and agent-legibility that makes the Life Ops architecture work.

---

## Hackathon scope (what ships Apr 21–26)

- Three-screen swipe shell (even if each screen is sparse).
- Center screen: chat with the agent — voice-or-text in, cards + text out.
- Left screen: Journal (rendered), past daily reviews list.
- Right screen: Goals.md (rendered), active project trackers list, today's to-do checkboxes.
- Markdown rendering + lightweight in-app edit for `Weekly Goals.md`, `Daily Log.md`, `<Reflection>.md`, per-project `Tracker.md`.
- Three demo flows working end-to-end: Daily Brief (morning), Daily Review (evening), Weekly Review.
- Undo (or confirm-before-apply) on every agent-originated write.

---

## Out of hackathon scope — captured for post-launch

**Gamification layer.** Streaks, points, gardens, uncovering map areas toward a destination. Meant to reward progress without becoming a distraction. Sits on the Past screen. Not required for the demo; premature for a 4-day build.

**Somatic embodiment exercises.** Guided breath, grounding prompts, 2-minute resets — ways to get unstuck and out of your head. Sits on the Present screen. Stretch goal: a single 60-second breath exercise surfaced on the Present screen if time allows. Anything more is post-launch.

**Kanban and Gantt visualizations.** Project trackers get a detail view with visual timelines and swim-lane boards. Hackathon ships flat to-do checklists only.

**Theme reskinning (default / clean workbench / fantasy adventure).** Covered in `docs/product/Intently Game Reskinning.md`. Out of scope for the hackathon build, but the component architecture should use **semantic tokens** (e.g., `PrimarySurface`, `FocusObject`, `QuestCard`) rather than appearance-based class names, so a future reskin is cheap rather than a full rewrite. This is the only post-launch item that has a hackathon-time cost if we skip it.

---

## Design principles

**Chat is the primary surface, not the only one.** Everything the agent does can be triggered through chat. But reading yesterday's journal, scrolling trackers, or editing a Markdown file shouldn't require a chat turn — the three-screen shell exists so direct inspection is always one swipe away.

**Every automation is visible.** The agent never edits something silently. A card, a toast, or an updated view always announces what changed, with the undo affordance attached.

**The app absorbs chaos.** When the day derails, the evening review captures what actually happened. When a week falls apart, the weekly review recalibrates without guilt. The UI copy should mirror this — never scolding, never streak-shaming.

**Direct manipulation beats forms.** When the user wants to change something, prefer a drag, a tap, or speaking it out loud over opening a form field. Forms are a last resort.

**Voice in, UI out.** Input latency matters (voice wins). Output density matters (cards beat paragraphs). Don't mix them up.

---

## Ethical AI principles

The agent reads private life data and takes action. Trust is built by what the UI shows the user, not by what the privacy policy says.

**Source:** see `docs/design/ethical-ai-design.md` for the full rationale.

- **Explain before you act.** Confirmation Cards name the data the agent used, not just the change made. "Moved your 2pm to 3pm — used calendar + yesterday's journal note about fatigue" over "Moved your 2pm." The user can verify the agent's reasoning at a glance.
- **Show confidence honestly.** The UI vocabulary distinguishes "the agent is sure" from "the agent is suggesting." Soft framing, muted accents, and tentative copy for low-confidence output. Don't perform certainty.
- **Every input is inspectable and correctable.** A tap on any agent-written card reveals the data slice the agent read. The user can exclude calendar categories, email labels, or health data sources from agent consumption without support.
- **Summaries at the boundary.** The agent never quotes raw journal prose or email bodies back in cards, logs, or the chat stream. What the user sees is a derived signal. Raw sources stay in the user's files; summaries travel. This mirrors the Privacy Steward's rule: bias toward summarization at the boundary.
- **Augmentation, not automation.** The agent surfaces options; the user picks. "Focus on 2 of these 5?" reads better than "Your goals are X, Y." This shows up in copy tone, card affordance design, and which actions auto-apply versus wait for confirmation.
- **No engagement-loop UI.** Streaks, badges, point counters, daily-use notifications are permanently out of scope — not post-launch, not ever. The app is the opposite of an engagement product. Mirrors positioning pillar 2.
- **Off-ramp is first-class.** Each agent (daily brief, daily review, weekly review) can be paused without penalty from a visible settings entry. Disabling an agent never breaks another; the user can run one, two, or none of them.
- **Corrections shape the system, visibly.** When the user overrides or undoes, that signal becomes part of agent memory — but the agent tells the user what it learned ("I'll weight journal-based tiredness signals lower next time"). Learning is surfaced; no silent background adjustment.

---

## Open design questions (resolve during build)

1. **Voice capture implementation.** Native OS speech-to-text on-device, or stream to a cloud transcription API? Depends on Session 2 stack choice.
2. **In-app Markdown editor.** Build on an existing library (e.g., Milkdown, Lexical, or react-native-markdown-display) or roll a minimal viewer + "edit raw" toggle? Leaning on an off-the-shelf editor to save days.
3. **Undo mechanism.** Per-action snapshots on the file level, or a diff/patch log per agent turn? Simpler is per-action file snapshots with a 24-hour retention window.
4. **Chat card taxonomy.** Minimum set of card types needed for the demo: Tracker Card, Plan Card, Journal Card, Confirmation Card. Anything else is out.
5. **Cross-screen navigation during a flow.** If the agent finishes a Daily Brief on Present, does it auto-surface the updated Daily Log on Right, or just drop a "view in Future" link? Leaning on the link — respects the user's attention.

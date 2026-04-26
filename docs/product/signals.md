# Signals — what Intently listens for

**Type:** Reference doc — the canonical taxonomy of signals (insight types) Intently's agents detect across user input.

**Status:** Active — referenced by every agent that performs detection or tagging.

---

## The thesis (verbatim from user, 2026-04-26)

> "The unlock isn't that the AI knows a lot about you. It's that Intently encodes which signals actually matter for living well — energy patterns, automatic negative thoughts, brags/wins, decisions and bets. This comes from real frameworks: Designing Your Life (Good Time Journal), career coaching practices, behavioral design. Most people don't track these things not because they don't care, but because nobody told them they should. Intently knows to look for them."

> "I keep referring to this book, Designing Your Life, because there's this great exercise in it called Good Time Journal. […] The journals that we are building in this codebase have a specific set of things that the AI is prompted, or should be prompted, to try to ask you about. […] I have worked with career coaches, and there are at least two things that I remember being told that you should always keep track of: Your automatic negative thoughts so that you can challenge them; Your brags. […] I wouldn't have thought about making an entry on a brag moment if I didn't even know that was something I should be keeping track of."

> "Another thing that the journal tries to keep track of is bets or decisions and things like that. These are all related around the art of trying to live a well-lived life with deep inspection, self-reflection, and deeper clarity."

> "We've set up Opus to know exactly what to look for, and so it uses its judgment to know: is it one of those things I'm supposed to look for?"

> "If you don't give an AI guidance on what to look for, it wouldn't know what to surface. It would just cobble together patterns, but it might miss actual useful insights just because they weren't the most common things."

The point: most productivity tools let you capture anything. Intently is different because the list of what to listen for is principled — drawn from real frameworks used by career coaches, behavioral designers, and researchers who have studied what actually produces self-knowledge over time. The AI is the enforcer of that list. Without the list, the AI would find the most common things; with it, it finds the most *useful* things.

---

## The signal types (V1 canonical set)

Eight signal types. Each has framework provenance, a capture-time prompt (how an agent might elicit this at journal/chat capture), a review-time surface (how an agent surfaces this at daily/weekly/monthly review), and the V1 reconciliation rationale.

---

### 1. Brags / wins

**Tag:** `#brag`

**Framework:** Career coaching practice — the recommendation to maintain a "brag document" or "wins log." Name attributed to Julia Evans ("Brag Documents") and common across executive coaching. Signal of self-advocacy material: what to cite when imposter syndrome hits, what to recall during performance reviews, what to notice about growth trajectory over time.

**What to listen for:** The user describes something going well, a problem solved, a positive reaction received, an outcome they are proud of — especially when they understate or minimize it. "It went fine" after a hard thing that actually went well is a brag. "I finally got that working" is a brag. External validators ("my manager said X", "the client liked it") are brags.

**Capture-time prompt example:**
> "That sounds like it went well — is that worth remembering? What did it feel like, and what does it say about what you're capable of?"

**Review-time surface (daily):**
> Surface 1 brag when the day contained a clear win the user might have moved past. "That [X] is worth holding onto."

**Review-time surface (weekly/monthly):**
> Pull all `#brag` entries and look for patterns in *what kind* of wins energized the user. Are there wins they've already forgotten? Are wins clustering in one domain and absent in another?

**Why it survived V1 reconciliation:** Present in `daily-review/SKILL.md` as `#brag`. Original spec used `#brags` (plural). Canonicalized as `#brag` (singular) to match existing agent prompts. Direct, no ambiguity with other tags.

---

### 2. Automatic negative thoughts (ANTs)

**Tag:** `#ant`

**Framework:** Cognitive Behavioral Therapy (CBT) — the concept of Automatic Negative Thoughts (ANTs), cognitive distortions that fire reflexively and shape behavior without examination. Career coaching also uses this frame explicitly (the Aaron Beck lineage; popularized in coaching contexts by Tara Mohr and others). The intervention: surface the thought, name it, challenge it — because the unexamined ANT becomes a constraint on what the person believes is possible.

**What to listen for:** Self-critical or limiting statements ("I'm not good at X", "I always do Y wrong", "I don't deserve Z"), catastrophizing ("this is going to fail"), filtering ("it went well but I made a mistake at the end"), should statements ("I should have done X"), and fortune-telling ("they're going to say no"). The tell is reflexive self-undermining that the user didn't pause on.

**Capture-time prompt example:**
> "Did any automatic negative thoughts come up there — anything worth pausing on or pushing back against?"

**Review-time surface (daily):**
> If a limiting belief or self-critical pattern showed up in today's content, name it and invite examination: "You said [X] — is that actually true? What's the evidence on the other side?"

**Review-time surface (weekly/monthly):**
> Look for recurrence. Same ANT appearing 3+ times in a week is a pattern worth naming explicitly. "This one keeps coming up" is different from a one-off.

**Why it survived V1 reconciliation:** Present in `daily-review/SKILL.md` as `#ant`. Not in original spec's suggested_tags (`#brags, #insight, #pattern, #stuck`). Retained because the framework provenance is strong, the signal type is distinct, and it is the most intervention-oriented tag in the set — the agent can actually do something useful when it sees one.

---

### 3. Lessons to act on (advice received)

**Tag:** `#grow`

**Framework:** Career coaching practice — the deliberate capture of advice received from others worth acting on. In Muxin's words: *"Grow is things related to advice received from others."* Close to the "debrief" practice in high-performance coaching: what did someone tell you, or what did this interaction teach you, that should change how you operate? Distinct from `#self` (which is internally generated insight) because the frame is explicitly about advice, feedback, or learning received *from outside* — from a mentor, colleague, manager, coach, book, or conversation.

**What to listen for:** Moments where the user received feedback, was told something useful, read something that reframed how they operate, or had a realization prompted by another person's input. "My manager said…", "they pointed out…", "I read that…", "after that conversation I realized I should…". The tell: the catalyst was external, even if the processing is internal.

**Capture-time prompt example:**
> "That sounds like advice worth keeping — what's the thing you want to carry forward from what they said?"

**Review-time surface (daily):**
> When advice or feedback from others surfaces in today's narrative, create space: "That sounds like something worth acting on — want to capture it?"

**Review-time surface (weekly/monthly):**
> Pull `#grow` entries and name what the user keeps being told. "Third time this month someone's noted X" is a pattern that might point to a real development edge.

**Why it survived V1 reconciliation:** Present in `daily-review/SKILL.md` as `#grow`. Not in original spec's suggested_tags (closest was `#insight`). Retained as the externally-sourced learning signal. Per user clarification (2026-04-26): `#grow` = advice received from others; `#self` = personal insights from your own reflection. That distinction is load-bearing.

---

### 4. Self-insight

**Tag:** `#self`

**Framework:** Behavioral design and reflective practice — knowing what conditions produce your best work, what drains you, what you need. The Designing Your Life framework (Burnett & Evans) explicitly frames energy awareness as a prerequisite to well-designed work. Close to the "know yourself" pillar of most life-design and coaching lineages. In Muxin's words: *"Self is more like personal insights from your own reflection."*

**What to listen for:** The user naming something about themselves that came from their own reflection — what energized or drained them (not structured GTJ data, just conversational), what kind of work feels meaningful vs. hollow, what they realized from within about a preference, pattern, or need. The tell is internally generated statements about the user's *nature* rather than a specific event: "I realized I work better when…", "I don't do well in environments like…", "I need…"

**Capture-time prompt example:**
> "What did today tell you about yourself — what you need, what drains you, what lights you up?"

**Review-time surface (daily):**
> When something energized, frustrated, or surprised the user, surface the self-knowledge layer: "Sounds like [X] really works for you" or "That friction might be telling you something."

**Review-time surface (weekly/monthly):**
> Pull `#self` entries and look for themes across the window. Are there consistent drainers or energizers? What does the pattern say about how the user should design their work?

**Why it survived V1 reconciliation:** Present in `daily-review/SKILL.md` as `#self`. Original spec's `#insight` maps here — consolidated into `#self` to be more concrete. The distinction from `#grow` (per user clarification, 2026-04-26): `#self` is about *personal insights from your own reflection*; `#grow` is about *advice received from others*.

---

### 5. Ideas worth developing

**Tag:** `#ideas`

**Framework:** Generative thinking / design thinking — the principle that ideas need a designated container to survive. Most people generate ideas casually and lose them; capturing them explicitly and reviewing them periodically allows for compounding. Not the same as an action item (task) or a project (committed work) — an idea is a candidate, not a commitment.

**What to listen for:** "What if…", "I've been thinking about…", "I had an idea for…", speculative or generative observations, things the user mentions and moves past. An idea is often softer than a plan: the user is feeling something out, not declaring it. Distinguish from a decision (which belongs in `#bet`) and from a project update (which belongs in the tracker).

**Capture-time prompt example:**
> "You mentioned [X] — is that something worth developing? I can tag it so it doesn't get lost."

**Review-time surface (weekly):**
> Pull `#ideas` entries. Did any of this week's ideas gain momentum? Did any compound with something else? Prompt the user to either develop one, park one, or drop one — ideas shouldn't accumulate forever.

**Review-time surface (monthly):**
> Promote a mature idea to the Master Backlog, or close it.

**Why it survived V1 reconciliation:** Present in `daily-review/SKILL.md` as `#ideas`. Not in original spec's suggested_tags. Retained as the generative signal — distinct from action items, distinct from projects, distinct from self-knowledge.

---

### 6. Energy patterns (GTJ)

**Tag:** `#gtj` (structured entries); energy observations in freeform journal entries do not require a tag — agents read prose for energy language

**Framework:** Designing Your Life (Bill Burnett & Dave Evans, Stanford d.school) — the Good Time Journal exercise. The framework asks you to track activities across three dimensions over time to identify what genuinely energizes you vs. what drains you, and when you are in flow:

- **Engagement:** Low / Medium / High / Flow — how absorbed you were in the activity
- **Energy direction:** Draining / Neutral / Energizing — how you felt during and after
- **Context (AEIOU):** Activity type, Environment, Interactions, Objects/tools used, Users you served — what the situational conditions were

The purpose: most people think they know what energizes them, but their intuitions are wrong. The GTJ reveals mismatches — work that feels "successful" but drains the person, or work they'd dismiss as minor that actually lights them up. Over time, a weekly Energy Profile synthesis reveals the underlying pattern.

**What to listen for (structured GTJ capture):** When the user reports a recent activity, prompt for Engagement and Energy direction. The AEIOU dimensions are secondary — capture what's natural. The `#gtj` tag on structured entries marks them for Energy Profile synthesis.

**What to listen for (freeform capture):** Language about engagement, energy, flow, or drain — in conversational context, without requiring structured input. "That meeting felt like a waste" → draining. "I couldn't stop working on it" → high engagement / possible flow. These observations compound over time even without formal GTJ structure.

**Capture-time prompt example (structured):**
> "How did [activity] feel — were you absorbed in it? And did it leave you energized or drained?"

**Capture-time prompt example (freeform):**
> "Sounds like [that] really drained you — worth noting that."

**Review-time surface (weekly):**
> When `#gtj` entries exist, parse Engagement/Energy for weekly synthesis. Look for patterns: are there activities that consistently score Flow? Consistently Draining? Cross-reference against how the user *chose* to spend their time.

**Review-time surface (monthly):**
> Cross-reference current patterns against the Energy Profile entry (if it exists). Is the user spending time on things that consistently drain them? Is there drift from the profile?

**The GTJ skill is parked:** The standalone `agents/good-time-journal.skill` bundle exists but is not deployed in V1 (parked as a ZIP). The signal type — energy pattern tracking — is canonical regardless of whether the dedicated skill is running. Daily-review already references GTJ data via `#gtj`-tagged entries, and monthly-review parses them.

**Why it survived V1 reconciliation:** Hoisted from `data-model.md § GTJ entries` (ORIGINAL INTENT status). Present in `monthly-review/SKILL.md` directly. Not in `daily-review/SKILL.md`'s explicit tag table (only the GTJ capture nudge via `gtj_active` config flag). Canonical because it comes from the most evidence-grounded framework in the set (Designing Your Life is empirically studied; the GTJ exercise has been tested at scale).

---

### 7. Bets and decisions

**Tag:** `#bet`

**Framework:** Thinking in Bets (Annie Duke) and decision journaling practice — the discipline of recording not just what you decided, but why, and what would change your mind. The frame: a decision is a bet made under uncertainty. Recording it as a bet creates accountability and enables reflection on the *quality of your reasoning*, not just the outcome. Most people review decisions only when they go wrong; decision journals surface the quality of the thinking itself.

**What to listen for:** Explicit commitment ("I've decided to…", "I'm going to…"), commitments with reasoning attached ("because…", "the main reason is…", "I think this will…"), forward-looking predictions ("I expect this will lead to…"), and acknowledgment of uncertainty ("I'm not sure but…", "the risk is…"). Distinguish from a task (which is executional, not decisional) and from an idea (which is exploratory, not committed).

**The shape of a bet entry:**
- What I committed to
- The reasoning behind it at the time
- What would change my mind (the falsification condition)
- The time horizon (when will I know if this was right?)

Agents don't need to extract all four dimensions at capture time — even capturing just the commitment + reasoning creates a journalable record. The falsification condition and time horizon can be added at review time.

**Capture-time prompt example:**
> "Sounds like a decision — want to capture the reasoning while it's fresh? What's the main thing that made you go this direction?"

**Review-time surface (weekly/monthly):**
> Pull `#bet` entries. Which past bets are now resolvable? What did the outcome reveal about the quality of the reasoning? Surface without judgment — the goal is building calibration, not scoring past decisions.

**Why it survived V1 reconciliation:** Net-new signal type added by Muxin on 2026-04-26. Not in any prior taxonomy. Added because: (1) strong framework provenance (Thinking in Bets + decision journaling are empirically grounded practices); (2) the signal is genuinely distinct — prospective where `#grow` is retrospective, committed where `#ideas` is exploratory; (3) Intently's capture primitives already record reasoning-bearing content that would benefit from this classification.

---

## Reconciling the three prior taxonomies

Three taxonomy sources existed before this doc. They disagreed. Here is the reconciliation.

### The three sources

**Source A: `agents/daily-review/SKILL.md` § 6** (5 tags, end-of-day only)
| Tag | Meaning |
|---|---|
| `#grow` | Lessons to act on |
| `#self` | Self-insight |
| `#brag` | Wins worth remembering |
| `#ant` | Limiting beliefs / automatic negative thoughts |
| `#ideas` | Ideas worth developing |

**Source B: `docs/architecture/data-model.md` § Tags** (original-intent suggested_tags in life-ops-config.md)
| Tag | Meaning |
|---|---|
| `#brags` | User-driven wins vocabulary |
| `#insight` | User-driven insight vocabulary |
| `#pattern` | User-driven pattern vocabulary |
| `#stuck` | User-driven friction vocabulary |
| `#gtj` | Reserved — Good Time Journal skill only |

**Source C: `data-model.md` § GTJ entries** (structured energy tracking — no tags, structured fields)
- Engagement: Low / Medium / High / Flow
- Energy direction: Draining / Neutral / Energizing
- Context: AEIOU fields
- Weekly Energy Profile synthesis artifact

### V1 canonical mapping

| Source A | Source B | Source C | V1 canonical | Disposition |
|---|---|---|---|---|
| `#brag` | `#brags` | — | `#brag` | Merged. Singular form wins; `#brags` is an accepted alias. |
| `#self` + `#grow` | `#insight` | — | `#self`, `#grow` | Split maintained. `#insight` maps to the personal-reflection sense of `#self`; the distinction between "know yourself" (`#self`) and "advice received from others" (`#grow`) is load-bearing. |
| `#ant` | — | — | `#ant` | Retained. No equivalent in original spec — added during daily-review authoring. Framework provenance (CBT) is strong. |
| `#ideas` | — | — | `#ideas` | Retained. No equivalent in original spec. Kept as the generative capture signal. |
| — | `#pattern` | — | Starter custom | Moved to Starter custom signals. Agent synthesis detects patterns structurally; `#pattern` remains valid as a user-custom tag for explicitly noticing recurrences they want to track. |
| — | `#stuck` | — | Starter custom | Moved to Starter custom signals. `friction` field in daily-review Output contract handles structured capture; `#stuck` survives as a user-custom tag for self-annotated blocker awareness. |
| — | `#insight` | — | Starter custom | Moved to Starter custom signals. Overlaps heavily with `#self`; retained as a starter custom for users who prefer a single broad reflection tag. |
| — | `#brags` | — | Starter custom | Alias for `#brag`. Retained as a starter custom for users who prefer plural form. |
| — | — | GTJ fields | `#gtj` (structured) | Retained as a reserved tag. GTJ energy entries get the full Engagement/Energy/Context structure. Freeform energy language is also tracked but without requiring the tag. |
| — | — | — | `#bet` | New. Added 2026-04-26 per user. Bets/decisions is a genuinely distinct signal type with no prior coverage. |

### What changed

- `#brags` → `#brag` canonical (renamed to match current agent prompts); `#brags` survives as a starter custom alias
- `#pattern`, `#stuck`, `#insight` → moved to Starter custom signals (see below); not deprecated, not removed — available for user adoption
- `#self` and `#grow` — clarified per user (2026-04-26): `#self` = personal insights from your own reflection; `#grow` = advice received from others
- `#gtj` → retained as reserved tag, hoisted into the canonical set
- `#bet` → added new

The V1 canonical set is: **`#brag`, `#grow`, `#self`, `#ant`, `#ideas`, `#gtj`, `#bet`** (seven tags).

---

---

## Starter custom signals

These tags come from the original `data-model.md § Tags` spec. They are not deprecated — they are the starting point of the user-custom layer (see § User-custom signals below). They are not in the V1 canonical detection set, but the agent knows about them as common patterns. Any user can adopt them as personal custom signals.

| Tag | Description | Why it's here |
|---|---|---|
| `#pattern` | A recurring noticing worth tracking explicitly | The agent detects patterns structurally via multi-day synthesis; `#pattern` lets users self-annotate recurrences they're consciously aware of |
| `#stuck` | A blocker or friction point the user wants to flag | Structural friction lives in the `friction` JSON field; `#stuck` gives users explicit vocabulary for naming what's blocking them |
| `#insight` | A broad reflection tag — personal learning of any kind | Overlaps with `#self`; kept for users who prefer one catch-all reflection tag over the `#self`/`#grow` split |
| `#brags` | Plural alias for `#brag` | Some users naturally write `#brags`; treated as equivalent to `#brag` |

Starter custom signals ship as part of the default `user_signals` configuration. Users can remove any that don't fit and add their own.

---

## User-custom signals

Every user can define their own set of signal tags, beyond the canonical set. Custom signals are personal — they reflect the patterns, practices, and frameworks that matter to *that* user's life and work.

### What a custom signal is

A custom signal is a named tag with:

- **Name** — the `#tag` the user (and agent) will use
- **Description** — what the agent should listen for when detecting this signal type
- **Framework citation** (optional) — why this matters; what practice or source it comes from

Example:

```
Tag: #maker
Description: Moments of flow in creative or technical work — when I'm building something and time disappears.
Framework: Flow theory (Csikszentmihalyi); my own observation that this is when I'm most satisfied.
```

### How detection works

Custom signals are detected by the same agent re-read primitive that powers the noticing layer (`.claude/handoffs/agent-noticing-layer.md`). On each detection pass, the agent reads the user's custom signals alongside the canonical set. When a custom tag fires three times within 48 hours, it surfaces the same way a canonical signal would. Adding a custom signal is adding it to the detection pass — no code change required.

This leverages topic clustering: the agent already performs multi-observation recurrence detection. Custom signals extend that same primitive with user-defined vocabulary.

### Schema and storage (V1.1 — pending)

Custom signals are stored per user. The V1.1 schema will introduce a `user_signals` table (or a `signals` key in `life_ops_config`) with:

```
user_id        — foreign key to auth.users
tag            — e.g. "#maker"
description    — what the agent listens for
framework      — optional provenance note
created_at
```

**V1.1 implementation is pending** — schema design and UX surface (how users add/edit custom signals) are to be designed. The architecture is settled; the build is not.

### Starter custom signals

The tags from the original spec (`#pattern`, `#stuck`, `#insight`, `#brags`) ship as default starter customs — pre-populated in `user_signals` for new accounts so the agent detects them out of the box. Users can edit, disable, or delete them. They are not forced canonical because they vary in relevance by user; they are not deprecated because they carry genuine signal value.

---

## The rule for adding new signals

Three tests — a signal must pass all three to enter the canonical set.

**1. Framework grounding.** Does the signal trace to a recognized framework — Designing Your Life, behavioral design, CBT/evidence-based therapy, career coaching, decision science? "I think users would like this" is not a framework. "I read it in a productivity blog" is not a framework. If you can cite a book, a named practice, or a documented methodology, you have a framework.

**2. Distinct surface.** Does the signal surface things the existing taxonomy doesn't capture? `#bet` is distinct from `#grow` because it's prospective (what I'm committing to) not retrospective (what I learned). `#self` is distinct from `#grow` because the orientation is knowing, not doing. If the proposed signal is substantially covered by combination of existing tags, it's not a new type — it's a pattern within an existing type.

**3. Capture + review symmetry.** Can the signal be both captured at journal/chat time AND surfaced at daily/weekly/monthly review? Signals that only fit one direction are anomalies. A tag that is capturable but surfaces nothing at review is a vanity capture. A pattern the agent surfaces but that has no capture-time equivalent can't compound over time.

To add a signal: open this doc, add a new `###` section with the signal's name, tag, framework, what to listen for, capture-time prompt example, review-time surface, and reconciliation rationale. Cite the framework. Get user sign-off before any agent prompt starts citing the new tag.

---

## Where this doc is consumed

- `agents/daily-review/SKILL.md` § 6 — delegates taxonomy to this doc; keep daily-review logic, replace inline list with pointer
- `agents/weekly-review/SKILL.md` — § 0 journal read by tag type; replace inline tag list with pointer
- `agents/monthly-review/SKILL.md` — § 2 scan for patterns; replace inline tag list with pointer
- `agents/noticing/SKILL.md` — capture-time signal-type detection (V2 work; depends on this doc as single source of truth)
- `docs/architecture/data-model.md` — `§ Tags` and `§ GTJ` in that doc are ORIGINAL INTENT; this doc supersedes them for the canonical signal vocabulary
- (V2) `agents/good-time-journal.skill` if/when unparked

**Cross-reference rule:** when this doc updates (signal added, renamed, deprecated), search for all files citing the affected tag names and update any prompts that embed the tag inline. Tag names are the interface — they appear in agent prompts, in journal entries the user writes, and in review-time filtering logic. A rename without prompt update breaks the filtering chain.

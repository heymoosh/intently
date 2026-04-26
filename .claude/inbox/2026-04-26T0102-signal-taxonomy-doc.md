---
captured: 2026-04-26T01:02:00-05:00
session: chat/0426-005256
source: discussion
related:
  - .claude/handoffs/agent-noticing-layer.md
  - .claude/inbox/2026-04-26T0100-noticing-layer-extensions-meta-briefing.md
  - .claude/inbox/2026-04-26T0103-noticing-layer-insight-tagging.md
references:
  - docs/architecture/data-model.md
  - agents/daily-review/SKILL.md
  - agents/weekly-review/SKILL.md
  - agents/monthly-review/SKILL.md
  - agents/good-time-journal.skill
---

# Signal taxonomy — hoist out of daily-review into a canonical doc

> Read `.claude/inbox/2026-04-26T0100-noticing-layer-extensions-meta-briefing.md` first if you haven't. This item is the load-bearing one for the product narrative — the user explicitly named it as the unlock.

## One-line intent

Author a canonical signals doc (suggested path: `docs/product/signals.md` — name TBD) that hoists the reflection-tag taxonomy out of the daily-review skill, names framework provenance for each signal type, gives the rule for adding new ones, and reconciles the three taxonomies that currently disagree (current daily-review, original-intent data-model.md, GTJ schema). Reframes "the unlock" of Intently from "AI knows a lot about you" to "Intently encodes which signals matter for living well." Becomes the single source every agent reads.

## Why this is in the inbox

The 5 reflection categories (`#grow, #self, #brag, #ant, #ideas`) live INSIDE one skill file (`agents/daily-review/SKILL.md` step 6) — buried, used only at end-of-day, with no provenance and no rule for adding new ones. The user identified this as load-bearing for the product narrative: the unlock is that Intently knows what to listen for, derived from real frameworks (Designing Your Life, career coaching, behavioral design). Without a hoisted canonical doc, this load-bearing concept has no home, agents can't reference it consistently, and questions like "should we add bets/decisions tracking? energy patterns?" can't be answered from principle.

The user also flagged this as the place where the *narrative* lives — not just the implementation. The signals doc IS the product story. Without it, the story is invisible inside one skill prompt.

## User's framing (verbatim — load-bearing for the doc itself)

> "The unlock isn't that the AI knows a lot about you. It's that Intently encodes which signals actually matter for living well — energy patterns, automatic negative thoughts, brags/wins, decisions and bets. This comes from real frameworks: Designing Your Life (Good Time Journal), career coaching practices, behavioral design. Most people don't track these things not because they don't care, but because nobody told them they should. Intently knows to look for them."

> "I keep referring to this book, Designing Your Life, because there's this great exercise in it called Good Time Journal. […] The journals that we are building in this codebase have a specific set of things that the AI is prompted, or should be prompted, to try to ask you about. […] I have worked with career coaches, and there are at least two things that I remember being told that you should always keep track of: Your automatic negative thoughts so that you can challenge them; Your brags. […] I wouldn't have thought about making an entry on a brag moment if I didn't even know that was something I should be keeping track of."

> "Another thing that the journal tries to keep track of is bets or decisions and things like that. These are all related around the art of trying to live a well-lived life with deep inspection, self-reflection, and deeper clarity."

> "We've set up Opus to know exactly what to look for, and so it uses its judgment to know: is it one of those things I'm supposed to look for?"

> "If you don't give an AI guidance on what to look for, it wouldn't know what to surface. It would just cobble together patterns, but it might miss actual useful insights just because they weren't the most common things."

The doc must lead with the user's verbatim narrative as the THESIS. Lightest edits only.

## Provenance — three taxonomies that need to be reconciled

**Current daily-review (5 tags, `agents/daily-review/SKILL.md` § 6):**
- `#grow` — Lessons to act on
- `#self` — Self-insight
- `#brag` — Wins worth remembering
- `#ant` — Limiting beliefs / automatic negative thoughts
- `#ideas` — Ideas worth developing

**Original-intent spec (`docs/architecture/data-model.md` § Tags):**
> "**Tags (user-driven, not reserved):** Users define their own tag vocabulary. Setup proposes a starter set (`#brags`, `#insight`, `#pattern`, `#stuck`) stored in `life-ops-config.md` under `suggested_tags`, which the user can freely edit, rename, or delete."
> "**Reserved tag: `#gtj`** — Used exclusively by the Good Time Journal skill."
> "**Review priority:** entries containing a tag listed in `review_priority_tags` get **pulled to the top of the pattern-extraction pass** as signal amplification."

**GTJ structured taxonomy (`data-model.md` § GTJ entries — currently parked in zipped skill bundle):**
- Engagement levels (Low / Medium / High / Flow)
- Energy direction (Draining / Neutral / Energizing)
- Context (AEIOU framework — environment, interaction, tools, etc.)
- Weekly Energy Profile synthesis as a reference artifact

**The user's added asks during this session:**
- Energy patterns (extends GTJ — should be in the canonical taxonomy even when the GTJ skill itself is parked)
- Bets / decisions (NOT in any current taxonomy — net-new signal type the user explicitly named)

The doc must reconcile all four lists, name what the canonical V1 set is, and explain WHY each survived (or didn't) the reconciliation.

## What's MISSING from current state (per user's prose)

- Energy patterns — referenced by GTJ schema in `data-model.md` but not surfaced in any active skill prompt
- Bets / decisions — net-new, not in any current taxonomy
- A canonical home — currently the taxonomy is buried in one skill, not referenced from anywhere else
- Framework provenance — no doc explains where #ant came from (career coaching), where #brag came from (career coaching), where the GTJ shape came from (Designing Your Life), where energy patterns came from (GTJ + behavioral design)
- A rule for adding new signal types — without a rule, the taxonomy will drift again next time someone touches a skill

## What the doc should contain (proposed structure)

1. **Thesis** — the user's verbatim prose framing "what we listen for is the unlock." Don't paraphrase.
2. **Each canonical signal type** — for each: name, tag, framework provenance, why it matters for intentional living, what an agent does when it detects this signal at capture vs at review. One section per signal, ~6–8 signals total post-reconciliation.
3. **Reconciliation appendix** — explicit table of "current daily-review had X, original spec had Y, GTJ had Z, reconciled set is W, here's why."
4. **Rule for adding a new signal type** — must be from a recognized framework? must be observable in user-content? must have a clear "what the agent does next" plan? Pick a bar.
5. **Cross-skill reference contract** — once hoisted, daily-review / weekly-review / monthly-review / agent-noticing-layer / future capture-tagger all reference this doc, never embed the list inline. Removing/changing a signal type happens in one place.
6. **Pointer to where signals get applied** — at capture time (sister inbox item: `noticing-layer-insight-tagging`) and at review time (existing daily-review § 6 + multi-day surface in § 5a).

## What grooming + sibling-validation should verify

1. **Has the working branch already hoisted this taxonomy somewhere?** Check `docs/product/`, `docs/design/Intently - App/`, the unzipped GTJ skill if anyone unpacked it. If yes, fold rather than create.
2. **Does the design folder's HANDOFF.md or BUILD-RULES.md describe the signal taxonomy already?** The user has flagged the design folder as the UX truth — if signals live there now, that's the source.
3. **Inspect `agents/good-time-journal.skill`** (the zipped Claude skill bundle). Even if we keep the skill parked, its internal SKILL.md / spec may have a richer signal definition that should feed the canonical doc.
4. **Cross-skill audit:** confirm whether `agents/weekly-review/SKILL.md` and `agents/monthly-review/SKILL.md` reference the same 5 tags as daily-review or a different set. They're probably out of sync — this audit informs the reconciliation.
5. **Naming.** `signals.md`? `listening-shape.md`? `intentional-signals.md`? Leave open.
6. **Sequencing with `noticing-layer-insight-tagging`.** That sister item depends on this doc landing. Sibling should validate that this is the load-bearing prereq.

## Sibling-session validation tasks

- [ ] grep `#grow\|#self\|#brag\|#brags\|#ant\|#ideas\|#insight\|#stuck\|#pattern\|#gtj\|review_priority_tags\|suggested_tags` across the working branch — find every place the taxonomy currently lives. List paths in your report.
- [ ] Read `agents/weekly-review/SKILL.md` and `agents/monthly-review/SKILL.md` for tag references. Note divergences from daily-review's set.
- [ ] Check `docs/design/Intently - App/` for any signal-listening framing in the UX spec. The user flagged this folder as UX truth — if signals are there, fold.
- [ ] Inspect the contents of `agents/good-time-journal.skill` (it's a zip — `unzip -l` to peek at its structure without extracting). Do not extract without user approval.
- [ ] Confirm with user — should `good-time-journal.skill` be deployed as part of this work, or kept parked? User said in this session: *"a whole separate module we're not building out in this hackathon"* — but post-hackathon framing may shift.
- [ ] Confirm with user — does the canonical signal set need framework citations (book/coach/researcher names) or is "user knows" sufficient? Lean: cite. Citation IS the unlock — "Designing Your Life says X, that's why we listen for it" is the story.

## Why this matters beyond the implementation

This doc, more than any other piece of these three items, IS the product narrative. The user's framing — that the unlock isn't AI-knows-you-well but Intently-knows-what-to-listen-for — has nowhere to live in the current docs. It currently surfaces only in pitch conversations and gets re-derived each time. Hoisting it makes it durable, makes new contributors see it on day one, and makes the skill-prompt taxonomy a downstream consumer of the narrative rather than the home of the narrative.

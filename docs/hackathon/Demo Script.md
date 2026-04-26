# Demo Script — Opus 4.7 Hackathon

> **⚠️ Script revision in progress (2026-04-25).** The VO below is solid but was written in pure product-ad register. After reviewing Mike Brown's winning demo, we identified missing pieces: no investor/problem angle with a real person, no technical architecture beat. We're keeping the 3-act storyboard and VO intact but inserting two new sections in the middle (founder cameo + technical layer). See § Session Notes at the bottom for the full list of additions.

**Type:** Creative/strategy — pitch narrative and VO script.
**Updated:** 2026-04-25
**For:** 3-minute submission video due Apr 26, 8 PM EDT
**Format:** Narrated video. Brief on-camera founder cameo at Act 1→2 transition, then screen recordings + animation/visuals.

---

## Voiceover Script

When you don't have a system keeping things on track, things drift. Not just "I forgot to do that thing" drift. Real drift. The kind where you look up one day and realize you're not living the life you want to live.

Small things, compounding, until they've steered you somewhere you didn't choose.

And we do try to manage with the tools we've got today — but they're scattered, hard to manage and maintain. And they don't really ask the big question: how do you want to live? What goals are you aiming for, and are you on track? They don't help you plan your days, your weeks, your months — so that your years are lived well.

That's why Intently exists.

---

## Founder Cameo — Raw Riff (2026-04-25)

> **[Zoom in on app → video of Muxin opens]**

Hey, my name is Muxin. I'm the creator of Intently.

I'm a product manager by trade, and for several years I was managing dozens of cross-functional teams in a large regulated enterprise, where I was in charge of an entire portfolio of energy products and digital products. No two launches were the same; every team had different policies and processes, and every brand had a different system in different teams to work with. I had to be the glue person, coordinating this. By the way, I have ADHD, and I'm not naturally organized. All I had for my working tools were Microsoft Office Suites, standard productivity tools. Somehow, over several years of figuring stuff out, I created my own system for staying on top of things and being the person who, funnily enough, earned a reputation for being one of the most organized people any team has ever worked with, which is funny because I literally cannot trust my own memory to remember details if I don't write it down and create a system for follow ups.

So when LLMs came out, I suddenly saw this potential to create the kind of system I'd always dreamed of having. Something that self-organizes and didn't require me to spend all my time and energy keeping track of and maintaining my own system. I found out along the way I wasn't the only person who felt this way: other people with ADHD, women who were the household managers for their lives and for their families. People who are the glue people for their social network. There's always somebody who is keeping it all together and is incredibly mentally taxing. AI and agents can handle a lot of that burden for you, but not everybody wants to figure out how to build their own system. I've been building my own system using Claude coworking, and now I've turned them into a user-friendly app that anybody can just pick up and go.

I built Intently for the busy parents and professionals who just don't have the time to try and figure out a system for their busy lives and just want something that works out of the box and doesn't require their effort to maintain it. It's the kind of tool that I wish I had all these years while I was struggling through corporate America and academia to stay on top of things. It's built on top of my own real-world lived experiences and productivity best practices that work for a lot of people. I've tried to create it as frictionless as possible so that you don't have to worry so much about where things are getting stored and forgetting things. The system just handles it for you. More importantly, all those big, hairy ideas, projects, and goals that you have now have a place to live alongside your day-to-day. Your day-to-day is synchronized to your goals so that you're never off sync with the things that you care about the most. You're never just living your day in a busy blur, not wondering what the hell happened. You know exactly what your day is about and what purpose it serves, and you know how to get to where you want to be.

> **[Zoom back to app screen recordings]**

---

Every morning your brief is already there — what you're working toward, what needs your attention today. Before the noise starts.

Every evening, a review captures what actually happened. The journal goes deeper — your patterns, your blind spots, things you'd never catch from inside a single day.

Your days feed your weeks. A year of that and you're not where life took you — you're where you chose to go.

**Intently. Live your days on purpose.**

---

## Tagline

> Intently. Live your days on purpose.

---

## Production Notes

**Voice:** Use your own voice, synthesized via 11 Labs if needed. Not a generic AI voice — genuine register matters. Record 5 min of natural speech first, then synthesize from that sample.

**Visuals (build around VO, not the reverse):**
- Act 1: app icons scattered, notifications flying, fragmented tools — convey chaos and scatter
- Act 2: clean phone UI — morning brief card appearing, voice capture, evening review, weekly pattern card surfacing ("you've been skipping rest")
- Act 3: one clean screen, settled. The life coming into focus.

**Hard out-point:** 2:59:29. Cut every non-essential frame.

---

## Next Steps (Mike Brown Playbook)

- [ ] Record 5 min of natural voice (talk through the product, anything)
- [ ] Synthesize this script in 11 Labs using your voice sample
- [ ] Listen while doing something else — note what lands and what doesn't
- [ ] Lock VO before touching visuals
- [ ] Build visual sequences in Remotion around locked VO
- [ ] Brutal edit to 2:59

---

## Session Notes — 2026-04-25 (additions to incorporate)

Ideas surfaced during strategy session reviewing Mike Brown's demo. Not yet woven into the VO or storyboard — this is the raw list to build from.

### Narrative structure changes
- 3-act storyboard stays intact — don't blow it up
- **Insert founder cameo** at the zoom-in transition (Act 1 → Act 2): Muxin on camera, ~15–20 seconds. "I built this because..." framing. Leads naturally into app screen recordings. After app + tech section, zoom back out to 2D animated story for Act 3.
- Format note: "Format" header updated — not no-camera anymore; brief cameo is in

### Personal / investor beat (for the cameo and/or VO)
- PM at Fortune 500, holding context for many teams simultaneously — couldn't hold the thread for his own life
- ADHD angle — personal, but also a massive population (not niche)
- Line to consider: "The apps capture; they don't carry. They store; they don't notice."

### Technical beats to insert (Act 2, after screen recordings)
- **Temporal altitude diagram** — six agents arranged by altitude (daily at base, monthly at top). Each altitude sees what the others can't — drone vs. plane vs. satellite. Animated in Remotion. ~15–20 seconds.
- **State-mediated coordination** — agents share a world (Supabase), not commands. One sentence, visual of a shared logbook or whiteboard. Deliberately no orchestrator — durability and auditability over command hierarchy.
- **Model-per-role** — Opus 4.7 for judgment agents (daily-brief, daily-review, weekly-review, monthly-review), Sonnet for mechanical (setup, update-tracker). Sonnet = fixed inputs/outputs; Opus = synthesis and judgment.
- **Data complexity visual** — show how the context layer grows over time (more projects, more logs, more patterns). This is why Opus matters more as the app matures: synthesis gets harder; the model scales with it. The whole app exists to mine these patterns and surface them as priorities.

### Architecture story (for MA prize writeup too)
- Six agents, each with a SKILL.md defining behavior
- Scheduled cadence — not one-shot. Daily brief every morning, daily review every evening, weekly/monthly on cadence.
- "Something you'd actually ship" — it's live at intently-eta.vercel.app
- Framing: "We didn't build a manager and workers. We built six specialists who share a world — each watching at a different altitude, each leaving notes for the others."

### Music
- Single musical theme running through all three acts
- Sparse/tense in Act 1 → building in Act 2 → resolving/blooming in Act 3
- Ties animation to emotional arc; makes it feel unified, not illustrated slides

### What we must NOT claim (not built as of 2026-04-25)
- Memory tiering / promotion pipeline
- Opus orchestrator / dynamic subagents
- Multi-destination hero button routing
- Topic clustering / auto-project creation

# Demo Video — Visuals Brainstorm

**Type:** Creative — visual direction for 3-minute submission video
**Created:** 2026-04-24
**Status:** Brainstorming — nothing locked

---

## The Visual Challenge

The hardest thing to show: **drift is invisible and slow.** It doesn't look like anything in the moment. The whole point is you don't notice it until it's too late. Any visual direction has to solve this — make the imperceptible feel visceral.

---

## Directions

### ❌ B — Kinetic typography
No people. Out.

### ❌ C — Abstract particles
No people. Out.

---

### ✅ PRIMARY: A + D mixed — 2.5D character in daily life (with drifting path)

The direction emerging from feedback. A cute, abstracted character — not photorealistic, not flat 2D — in a 2.5D isometric-style world. Think: Mike Brown's hackathon video. Cute 3D boxed-in house, a little person, game-like layout. Warm, approachable, not a tech demo.

**Act 1 scene:** Character in their daily environment — surrounded by floating app icons, calendar alerts, notifications swirling. They're trying to manage all of it. Then pull back to show the path they're walking has slowly bent off course without them noticing. They haven't looked up. That's the "drift" visual.

**Act 3 scene:** Same character, same world — but the path is straight, the notifications are gone, they're moving with direction.

**Why this works:** People in it. Abstractly rendered so it's universal (not one specific person). The path metaphor from D makes drift visible. The game-like vibe is charming without being childish.

**Sound:** Notification pings building and overlapping in Act 1 → sudden quiet. Soft footsteps. Ambient warmth.

---

### ✅ SUPPORTING: F — Notebook as a single scene

Not the whole video — just one moment. When the VO hits "the journal goes deeper," cut to a notebook aesthetic: words forming on a page, a margin note appearing. Grounds the journal feature in something tactile and human.

One scene, not a visual style for the whole video.

---

### ✅ BRIDGE: Phone screen recordings (Act 2)

Actual app UI for the product demo section — the brief appearing, voice capture waveform, weekly pattern card. Real screen recordings, not mockups. Cuts cleanly from character animation if the phone is shown as a prop the character is holding first.

---

## Tooling Question

Remotion is React-based video — great for screen recordings + motion graphics, but 3D character animation is heavy. For the 2.5D character scenes, better options:

- **Spline** (spline.design) — browser-based 3D scene builder, exactly this "cute isometric character" vibe, can export as video. Many indie makers use it for exactly this.
- **Pre-made 3D asset packs** — rigged characters + environments in Blender or After Effects. Faster than building from scratch.
- **Rive** — character animation tool, good for the character's movement/reactions.

Realistic path: find a Spline template or asset pack that's close to the vibe → customize for the scenes needed → export → edit with Remotion or DaVinci for the screen recording sections.

---

## Storyboard — Scene by Scene

**Character:** One person throughout. Abstracted/illustrated, not photorealistic. Consistent across all scenes.
**World:** Starts empty/sparse. Fills in with life by Act 3.
**Tooling:** Remotion for composition + transitions. Lottie animations for character. CSS/SVG for floating icons and environment elements.

---

### ACT 1 — THE PROBLEM

**Scene 1 — Centered, calm**
Person standing in the middle of an empty, neutral space. No chaos yet — just stillness. Sets the baseline before everything shifts.
*VO: "When you don't have a system keeping things on track, things drift."*
*Lottie: character idle/standing*

**Scene 2 — Rug pull**
Something shifts beneath them. They stumble, wobble. The ground isn't stable. They didn't see it coming.
*VO: "Not just 'I forgot to do that thing' drift. Real drift."*
*Lottie: character stumble/fall reaction*

**Scene 3 — The looking up moment**
Camera zooms in to face and torso. Expression: realization. That slow dawning — something is wrong, has been wrong. Hold on the face.
*VO: "The kind where you look up one day and realize you're not living the life you want to live."*
*Lottie: character surprised/realization expression, close crop*

**Scene 4 — Road going off course**
Camera behind them. They're looking ahead at a path that visibly bends and curves away from where they want to go. They can see it but feel stuck.
*VO: "Small things, compounding, until they've steered you somewhere you didn't choose."*
*Remotion: animated path SVG curving away*

**Scene 5 — Tools start appearing**
App icons pop up around them one by one — calendar, email, notes, todos, reminders. Each one appearing like it's supposed to help.
*VO: "And we do try to manage with the tools we've got today —"*
*Remotion: CSS-animated app icons floating in*

**Scene 6 — Tornado**
Icons multiply, start spinning, become a whirling tornado around the person. They're visibly stressed, hands on head.
*VO: "but they're scattered, hard to manage and maintain."*
*Lottie: character stressed/overwhelmed. Remotion: spinning icon tornado*

**Scene 7 — Disappearing**
The tornado intensifies. Person spins with it and shrinks into a small dot, disappearing.
*VO: "And they don't really ask the big question:"*
*Lottie: character spin-out/shrink*

**Scene 8 — The question mark**
Empty space. A single large question mark appears, floating. Just that. Silence for a beat.
*VO: "how do you want to live? What goals are you aiming for, and are you on track? They don't help you plan your days, your weeks, your months — so that your years are lived well."*
*Remotion: animated question mark SVG*

---

### TRANSITION

**Scene 9 — Person reappears**
Person reappears small, looking up at the question mark. Expression: thoughtful, not panicked. They're sitting with the question.
*Lottie: character looking up, contemplative*

**Scene 10 — Intently arrives**
App icon slides in from the side and stops next to the person. Both looking at the question mark together. A pause — like the app is saying: I can help with that.
*VO: "That's why Intently exists."*
*Remotion: app icon sliding in, stopping beside character*

---

### ACT 2 — THE SOLUTION

**Scene 11 — Zoom into the app**
Camera pushes into the app icon → dissolves into the actual interface. Morning brief is already there.
*VO: "Every morning your brief is already there —"*
*Remotion: zoom/transition into screen recording*

**Scene 12 — Using the app**
Person holds the phone, reading the brief, smiling slightly. Not amazed — just relieved.
*VO: "what you're working toward, what needs your attention today. Before the noise starts."*
*Screen recording: daily brief UI*

**Scene 13 — Evening review**
Person at end of day. Review is on screen. They look at it, nod.
*VO: "Every evening, a review captures what actually happened."*
*Screen recording: daily review UI*

**Scene 14 — Journal / pattern surfacing**
Notebook-style visual — a single scene. Words forming. A pattern note appearing in the margin: "you've been skipping rest — 3 weeks running."
*VO: "The journal goes deeper — your patterns, your blind spots, things you'd never catch from inside a single day."*
*Remotion: notebook aesthetic, handwriting-style text animation*

---

### ACT 3 — THE OUTCOME

**Scene 15 — Bright path**
Pull back from the phone. Person is standing on a path — but now it's bright, clear, going straight ahead. The world is starting to change around them — a few hints of color and nature coming in at the edges.
*VO: "Your days feed your weeks."*
*Remotion: path animation, color bleeding in from edges*

**Scene 16 — World blooms**
The environment fully fills in. Birds, trees, nature, warmth. The empty space from Act 1 is now alive. Person walks forward — not rushed, not anxious. With certainty.
*VO: "A year of that and you're not where life took you — you're where you chose to go."*
*Lottie: walking character + nature/environment elements blooming in*

**Scene 17 — Final frame**
Person facing forward on their bright path, still, looking ahead. Calm. The world is full around them.
*VO: "Intently. Live your days on purpose."*
*Hold on this. Fade to app wordmark.*

---

## Lottie Asset Strategy

**The consistency problem:** Different Lottie files = different-looking characters. Need either:
1. A single character pack with multiple emotion/action states (ideal)
2. One character base and CSS-layer different expressions on top
3. Accept slight inconsistency, tie together with consistent color palette

**Search terms for LottieFiles:**
- "character idle standing" (Scene 1)
- "character stumble fall" (Scene 2)
- "character realization surprised" (Scene 3)
- "character stressed overwhelmed hands on head" (Scene 6)
- "character spin disappear" (Scene 7)
- "character contemplative looking up" (Scene 9)
- "character walking nature" (Scene 16)
- "nature bloom spring birds trees" (Scene 16 background)

**Remotion handles everything else:** path animation, app icon CSS, question mark SVG, icon tornado, zoom transitions, screen recording compositing, notebook text animation.

---

## Open Questions

- Character style: warm/rounded Headspace-adjacent, or slightly more grounded?
- Color palette: what's the Intently brand palette? Affects everything.
- Does the app have a wordmark/logo for the final frame?

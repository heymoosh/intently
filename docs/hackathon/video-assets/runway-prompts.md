# Runway Image Generation Prompts

**Character labels (set in Runway before generating):**
- `@AppHero` → upload `woman-reference.png` (primary character, every scene)
- `@AppHero2` → upload `man-reference.png` (Scene 17 only — companion in the final frame)

Each prompt below is a single self-contained copy-paste. Style descriptor and background hex are baked into every prompt — there is no appendix to append.

---

## Aspect ratio plan

Master everything at **16:9** for web / YouTube / DevPost / desktop full-screen, then re-cut to **9:16** for mobile vertical (Reels, Shorts, Stories). Cropping 16:9 → 9:16 loses side information you can spare; the reverse direction can't be done at all.

- **Default in Runway: 16:9** for every scene's first generation.
- **Re-generate at 9:16** for the scenes whose composition doesn't survive a center-crop:
  - **Scene 4** — the path's curve is a horizontal motion; on vertical crop the bend disappears. Re-gen with the bend going diagonal / into depth instead of sideways.
  - **Scene 16** — wide environment shot; re-gen with @AppHero centered and foliage above/below rather than left/right.
  - **Scene 17** — wide group composition; re-gen with @AppHero and @AppHero2 centered tighter, background figures stacked toward the middle distance instead of spread laterally.
- Every other scene (centered character, close crops, single-subject framing) center-crops cleanly from 16:9 to 9:16.
- Skip 1:1 unless you're actively planning to post to IG/X feed.

---

## Scene 1 — Neutral starting state

```
@AppHero standing centered in a sparse, empty space. Neutral posture, neutral expression — not smiling, not frowning, just present and observing. Hands at sides. Nothing else in the frame — no icons, no clutter, no props. The space feels still and undecided, neither peaceful nor unsettled. Flat 2D vector illustration style — clean geometric shapes, simplified character with expressive face, smooth rounded forms, minimal. Background: solid flat fill of #B8D9C0 (soft mint), filling the entire frame.
```

---

## Scene 2 — Rug pull / stumble

```
@AppHero off-balance, one foot lifted, surprised expression — eyes wide, mouth slightly open. The ground beneath her looks unstable or has shifted. Her arms are out trying to catch herself. The space feels slightly tilted, the cool background reinforcing unease. Flat 2D vector illustration style — clean geometric shapes, simplified character with expressive face, smooth rounded forms, minimal. Background: solid flat fill of #8E8FC6 (anxious dusk purple-blue), filling the entire frame.
```

---

## Scene 3 — The looking up moment (close crop)

```
Close crop on @AppHero's face and upper torso. Eyes wide and upward, expression of slow dawning realization — not panic, more like "oh no, when did this happen." Slightly furrowed brow. Flat 2D vector illustration style — clean geometric shapes, simplified character with expressive face, smooth rounded forms, minimal. Background: solid flat fill of #8E8FC6 (anxious dusk purple-blue), nothing else in frame.
```

---

## Scene 4 — Road bending off course

```
Camera positioned behind @AppHero, looking past her shoulder into the scene. She stands in the foreground, facing forward, only the back of her head and shoulders visible. Stretching ahead is a long path that visibly curves and bends away from straight — sloping off to one side, leading somewhere she didn't choose. She is still, looking at the curving path. Her posture reads "I can see it but I feel stuck." Flat 2D vector illustration style — clean geometric shapes, smooth rounded forms, minimal. Background: solid flat fill of #8E8FC6 (anxious dusk purple-blue), framing the path.
```

---

## Scene 5 — Tools appearing

```
@AppHero standing, looking around her with mounting overwhelm as small floating app icons pop up one by one — calendar icon, email icon, phone icon, sticky note, reminder bell, todo list. Each icon has a soft drop shadow, floating at different heights around her. She's still upright, arms slightly raised. Flat 2D vector illustration style — clean geometric shapes, simplified character with expressive face, smooth rounded forms. Background: solid flat fill of #C66B3F (overwhelm terracotta clay), pressing in around her.
```

---

## Scene 6 — Tornado / overwhelmed

```
@AppHero with both hands pressing on her head, eyes squeezed shut or wide with stress. App icons and UI symbols (calendar, email, clock, notifications, todo lists) swirling in a spiral around her, overlapping and chaotic. Her hair is slightly disheveled. Expression is peak overwhelm. Flat 2D vector illustration style — clean geometric shapes, simplified character with expressive face, smooth rounded forms. Background: solid flat fill of #C66B3F (overwhelm terracotta clay), fully saturating the scene.
```

---

## Scene 7 — Spinning into a dot

```
@AppHero spinning, body becoming a motion blur, shrinking toward the center of the frame. Swirling lines around her. She's becoming smaller — almost a dot. The surrounding chaos of icons is fading too. Flat 2D vector illustration style — clean geometric shapes, smooth rounded forms. Background: solid flat fill of #C66B3F (overwhelm terracotta clay), still dominating the frame.
```

---

## Scene 8 — The question mark

```
Wide open empty space — the heat has drained out of the scene but it isn't calm yet. A single oversized question mark floating in the center, slightly above eye level — the only thing in frame. Drawn in a soft-serif, hand-inked style: organic calligraphic weight contrast (thicker on the curve, tapering at the terminals), slightly asymmetric, like it was brushed by hand rather than typed. Warm and characterful, not geometric or sans-serif. The curved body of the question mark is a deep forest green #3A4E3A. The dot at the bottom is a sage green #5F8A72 — a small seed of color planted inside the question. Both colors flat-filled, no gradients, no drop shadows, no outlines. Background: solid flat fill of #CFC9EB (transitional soft lilac), filling the entire frame.
```

---

## Scene 9 — @AppHero reappears, thoughtful

```
@AppHero has reappeared, small in frame near the lower portion of the composition, standing below and looking up at the large floating question mark from Scene 8. Posture is contemplative — head slightly tilted, one hand near her chin. Not scared, just thinking. The question mark above her is the same as Scene 8 — drawn in a soft-serif, hand-inked style with organic calligraphic weight contrast (thicker on the curve, tapering at the terminals), slightly asymmetric. The curved body is deep forest green #3A4E3A; the dot at the bottom is sage green #5F8A72. @AppHero herself is rendered in flat 2D vector illustration style — clean geometric shapes, simplified character with expressive face, smooth rounded forms. Background: solid flat fill of #CFC9EB (transitional soft lilac), quieter than the previous scenes but not yet warm.
```

---

## Scene 10 — Intently arrives

```
@AppHero standing, with a glowing phone/app icon that has just arrived from the right, now beside her. The app icon has a soft sage-green accent glow. @AppHero's posture signals relief — shoulders dropped, head slightly turned toward the icon. The world has just adopted the app's calm, warm palette. Flat 2D vector illustration style — clean geometric shapes, simplified character with expressive face, smooth rounded forms. Background: solid flat fill of #F5EEE0 (warm linen — Intently's app surface color), the first truly calm and warm note in the sequence.
```

---

## Scenes 11–14 — Real footage (no Runway prompt)

> **[Not Runway-generated]** Scenes 11–14 are live footage:
> - **Scene 11:** Direct-to-camera founder video (Muxin, founder riff — see Demo Script.md § Founder Cameo)
> - **Scenes 12–14:** Real screen recordings of intently-eta.vercel.app — daily brief, voice capture, daily review, weekly review flows
>
> Resume Runway prompts at Scene 15.

---

## Scene 15 — Bright path appears

```
@AppHero standing on a path that stretches forward into the distance. The path is bright, straight, clear. At the very edges of the scene, the first hints of color and nature are bleeding in — a leaf, a small flower, a touch of green. She's facing forward. The background glows like sunlight — this is the bloom moment. Flat 2D vector illustration style — clean geometric shapes, simplified character with expressive face, smooth rounded forms. Background: solid flat fill of #F1DE8A (warmest butter yellow — the warmth peak of the sequence).
```

---

## Scene 16 — World blooms

```
@AppHero walking forward confidently on her path. The world around her is fully alive — trees, birds in flight, flowers, warm golden light filtering through leaves. Sage greens, peach, terracotta accents on the foliage against the warm background. The environment feels abundant and alive. She looks calm, purposeful, at home. Flat 2D vector illustration style — clean geometric shapes, simplified character with expressive face, smooth rounded forms. Background: solid flat fill of #F1DE8A (butter yellow, holding the warmth peak from Scene 15).
```

---

## Scene 17 — Final frame

```
@AppHero standing inside a lush natural environment, facing forward, calm and unhurried. Beside her: @AppHero2 stands close, relaxed, sharing the moment with her — the two of them just hanging out together, part of the same life. A few other small figures gather softly in the warm middle distance — friends, family, the people in her life — also relaxed, present, not posed. The environment is full and alive around all of them: trees, leaves, flowers, soft sunlight filtering through foliage, gentle sky tones at the top of frame. Peaceful, certain — "I know where I'm going, and I'm not alone." Flat 2D vector illustration style — clean geometric shapes, simplified characters with expressive faces, smooth rounded forms. No flat color fill: the natural environment IS the background, rendered edge-to-edge with no flat hex backdrop showing through.
```

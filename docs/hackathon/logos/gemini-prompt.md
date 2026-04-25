# Gemini Logo Prompt — Intently App Icon

## How to use this with Gemini

1. **Don't dump this whole folder.** Paste the prompt below + ONE reference image max (`cool-logo.png` — the Rescript Journal page — for *line quality and warmth only*, not layout). Multiple references confuse the model and average it back to generic.
2. Generate 4–8 variations per run.
3. Iterate by changing **one variable at a time** (color, then form, then flourish). Don't rewrite the whole prompt between runs.
4. If you want a wordmark version, generate the "i" FIRST and lock it. Then run a second prompt that places the locked "i" on the left and handwrites "ntently" beside it — don't try to do both in one shot.

---

## The prompt (copy-paste)

```
Generate a single iOS app icon for an app called Intently. One subject only — the lowercase letter "i".

The "i": hand-drawn as if inked with a brush pen, written freehand in one confident gesture. Slightly asymmetric, organic — looks like a person wrote it on warm paper, not a designer's typeface. Two parts only: a vertical stem and a small round dot (the tittle) floating above it with a clean gap of cream negative space between them.

Form details:
- The stem: one downward brushed/inked stroke, gently tapered at the top and bottom, with a slight calligraphic weight contrast — thicker through the middle, lighter at the ends. Slight organic wobble, not perfectly straight.
- The tittle: a small filled circular dot, centered horizontally above the stem, sitting in clean empty space. NOT enclosed by any outline, almond, eye-shape, or container. Just a floating dot.
- One small optional flourish — a single soft curl at the base of the stem, like a quiet underline written with the same pen — adding personality without clutter.
- Imperfect, handmade character: slight wobble, organic line. NOT vector-clean. NOT a system font glyph.

Color — use exact hex values, no substitutions:
- Stem stroke: #3A4E3A (deep forest moss)
- Tittle / dot: #5F8A72 (sage green — the brand color)
- Background: #F5EEE0 (warm linen cream), filling the entire canvas edge to edge
- No other colors. No gradients. No drop shadows. No outlines around the background. No 3D shading. No metallic effects.

Composition:
- Square canvas, 1:1 aspect ratio
- The "i" centered, occupying roughly 50–55% of the canvas height — comfortable iOS app icon padding
- Render as a flat square. Do NOT add iOS rounded corners — the OS masks them.
- NO text other than the single lowercase "i". NO additional letters, NO wordmark, NO taglines. Just the "i" on the cream background.

Tone: warm, personal, handmade, quietly bookish. The feeling of a fountain pen mark on warm paper. Reference the line quality of a journal sketch — confident but not perfect.

CRITICAL avoidances:
- NO eye, NO eyeball, NO almond/lens/leaf shape around the dot. The dot must float in open negative space — never enclosed, never surrounded, never framed by an outline.
- NO pupil-in-an-eye reading, NO iris, NO eyelashes, NO eyelid, NO sclera.
- NO horizontal almond, NO vertical almond, NO ovals or curves wrapping the dot.
- NO clip-art letters, NO font-perfect typography, NO geometric vector shapes, NO rainbow colors, NO tech-startup minimalism, NO gradient meshes, NO neon, NO glow, NO photorealism, NO drop shadows, NO 3D, NO embossing.
```

---

## Variant tweaks (swap one line at a time if v1 doesn't land)

**If the two-color combo isn't working**, go monochrome:
> Stem and tittle: both #5F8A72 (sage green). Background: #F5EEE0 warm linen.

**If moss reads too heavy / funeral-dark**, flip the colors:
> Stem stroke: #5F8A72 (sage green). Tittle: #3A4E3A (moss). Background: #F5EEE0.

**If the line is too clean / vector-y**, add:
> The line should look painted, not drawn — visible brush character, slight ink pooling at the curves, organic edge variation. As if painted in a single breath with a wide-tipped brush pen.

**If it's still drawing an eye / almond around the dot**, add (this is the most common failure mode):
> Absolutely no shape, outline, or enclosure around the tittle. The dot sits alone in empty cream space, with only the vertical stem below it. If you find yourself drawing a curve around the dot — stop. Erase it. The composition is two separate marks: a stem and a floating dot. Nothing else.

**If the "i" looks too font-perfect / typographic**, add:
> More handwritten, less typographic. Treat it as a journal mark, not a glyph from a typeface. The stem can have slight character variation along its length; the dot can be slightly imperfect — not a perfect circle.

**If it looks too playful / cartoony**, add:
> Reduce flourishes. More restrained, more bookish, more like a journal sketch than an illustration.

---

## Why these specific colors

Pulled from `web/intently-tokens.jsx`:
- `#5F8A72` is `FocusObject` / `TintSageDeep` / `PositiveAccent` — the literal app brand color, used on every primary affordance.
- `#3A4E3A` is `TintMoss` — the deepest green in the palette, used as ink on butter surfaces.
- `#F5EEE0` is `PrimarySurface` — the warm linen background of the entire app.

This combo means the icon, the app surface, and the Scene 8/9 question mark in the demo video all share the same color grammar. Brand coherence across the submission.

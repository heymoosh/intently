# Gemini Logo Prompt — Intently App Icon

## How to use this with Gemini

1. **Don't dump this whole folder.** Paste the prompt below + ONE reference image max (`cool-logo.png` — the Rescript Journal page — for *line quality and warmth only*, not layout). Multiple references confuse the model and average it back to generic.
2. Generate 4–8 variations per run.
3. Iterate by changing **one variable at a time** (color, then form, then flourish). Don't rewrite the whole prompt between runs.
4. If you want a wordmark version, generate the icon FIRST and lock it. Then run a second prompt that places the locked eye on the left and handwrites "ntently" beside it — don't try to do both in one shot.

---

## The prompt (copy-paste)

```
Generate a single iOS app icon for an app called Intently. One subject only — an eye.

The eye: hand-drawn as if inked with a brush pen in one continuous fluid line. Slightly asymmetric, organic, confident — looks like a person drew it freehand, not a designer's vector. The eye shape is elongated vertically — almond on its long axis, gently pinched at the top and bottom corners — so it can also read as a stylized capital letter "I" when placed inside the wordmark "Intently."

Form details:
- Single continuous brushed/inked stroke for the eye outline
- Slight calligraphic weight contrast: thicker through the curves, tapering at the corners
- A small filled circular pupil in the center of the eye
- One small optional flourish — a single soft curl below the eye, like a quiet underline written with the same pen — adding personality without clutter
- Imperfect, handmade character: slight wobble, organic line. NOT vector-clean. NOT geometric.

Color — use exact hex values, no substitutions:
- Eye outline stroke: #3A4E3A (deep forest moss)
- Pupil: #5F8A72 (sage green — the brand color)
- Background: #F5EEE0 (warm linen cream), filling the entire canvas edge to edge
- No other colors. No gradients. No drop shadows. No outlines around the background. No 3D shading. No metallic effects.

Composition:
- Square canvas, 1:1 aspect ratio
- Eye centered, occupying roughly 50–55% of the canvas width — comfortable iOS app icon padding
- Render as a flat square. Do NOT add iOS rounded corners — the OS masks them.
- NO text, NO letters, NO wordmark, NO taglines anywhere in the image. Just the eye on the cream background.

Tone: warm, personal, handmade, quietly bookish. The feeling of a fountain pen mark on warm paper. Reference the line quality of a journal sketch — confident but not perfect.

Avoid: clip-art eyes, emoji-style eyes, anatomical realism, eyelashes drawn as a bouquet, mascara, rainbow colors, tech-startup minimalism, gradient meshes, neon, glow, photorealism, drop shadows, 3D, embossing.
```

---

## Variant tweaks (swap one line at a time if v1 doesn't land)

**If the two-color combo isn't working**, go monochrome:
> Eye outline stroke and pupil: #5F8A72 (sage green). Background: #F5EEE0 warm linen.

**If moss reads too heavy / funeral-dark**, flip the colors:
> Eye outline stroke: #5F8A72 (sage green). Pupil: #3A4E3A (moss). Background: #F5EEE0.

**If the line is too clean / vector-y**, add:
> The line should look painted, not drawn — visible brush character, slight ink pooling at the curves, organic edge variation. As if painted in a single breath with a wide-tipped brush pen.

**If it looks like a real eye (creepy realism)**, add:
> Highly abstract — just an almond outline with a single dot pupil. No white sclera, no iris detail, no eyelashes drawn as separate lines, no eyelid crease. Pictogram-level simplicity.

**If it looks too playful / cartoony**, add:
> Reduce flourishes. More restrained, more bookish, more like a journal sketch than an illustration.

**If you want the eye-as-letter reading to be stronger**, add:
> The eye's vertical proportions should be exaggerated — taller than wide, with sharp pinched corners at the top and bottom. The shape should be unambiguously readable as both an eye and a stylized capital "I."

---

## Why these specific colors

Pulled from `web/intently-tokens.jsx`:
- `#5F8A72` is `FocusObject` / `TintSageDeep` / `PositiveAccent` — the literal app brand color, used on every primary affordance.
- `#3A4E3A` is `TintMoss` — the deepest green in the palette, used as ink on butter surfaces.
- `#F5EEE0` is `PrimarySurface` — the warm linen background of the entire app.

This combo means the icon, the app surface, and the Scene 8/9 question mark in the demo video all share the same color grammar. Brand coherence across the submission.

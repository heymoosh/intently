# Intently

A three-tense journaling app with an agentic voice affordance as its one primary surface. **Past · Present · Future** swipe deck, hero mic in the bottom-right of every screen, agent drafts → user confirms.

For the product model, data model, screen map, and design system, see `docs/design/Intently - App/HANDOFF.md` and `docs/design/Intently - App/BUILD-RULES.md`.

## Run the demo

The app is plain React 18 + Babel-standalone — no build step. Just serve `app/` over HTTP.

```bash
python3 -m http.server 8765 --directory app
```

Then open <http://127.0.0.1:8765/>.

## Walking the day arc

The demo opens to **Mid-day · planned**. Use the **Dev panel** on the left of the phone to jump between day-states without waiting for the clock:

| State | What you see |
|---|---|
| Morning · empty | Yesterday's highlight, sunrise CTA *Start your daily brief* |
| Brief · in chat | Agent chat overlay drafting today's brief |
| Mid-day · planned | Flags band + Morning/Afternoon/Evening plan rows |
| Evening · pre-review | Same plan, midnight CTA *Start your daily review* |
| Review · in chat | Agent chat overlay drafting the review |
| Closed · reflected | One-line recap, tomorrow commitment, *Saved to your journal* |

The **bottom nav** is `← · · · →` — three dots for position, arrows to step between Past, Present, Future. The **hero mic** in the bottom-right is the one input surface; long-press for the radial quick-action menu. The **avatar** in the bottom-left opens the profile sheet (settings, connections, account).

- **Past** — zoom chip in the header cycles Year → Month → Week → Day. Tap a day tile to drop one level. Tap an entry to enter Reading mode.
- **Future** — three goal cards, each with an April monthly slice. Tap *Open* to drill into a goal; the projects band sits below.

## Source layout

```
app/                                       # the runnable demo (serve this)
  index.html                               # entry; loads all .jsx via @babel/standalone
  intently-tokens.jsx                      # design tokens — colors, type, shadows, radii
  intently-glyphs.jsx                      # ~40 hand-picked daily-mark glyphs
  intently-imagery.jsx                     # painterly blocks (deterministic SVG blobs)
  intently-cards.jsx                       # FeatureCard, ConfirmationCard, PlanCard, …
  intently-hero.jsx                        # the hero affordance + state machine
  intently-journal.jsx                     # Past — Year/Month/Week/Day zoom
  intently-projects.jsx                    # Future projects band + ProjectDetail
  intently-screens.jsx                     # PastScreen, PresentScreen, FutureScreen
  intently-screens-prototype.jsx           # prototype forks with inline-add affordances
  intently-shell.jsx                       # SwipeShell, TenseNav, Phone wrapper
  intently-manual-add.jsx                  # InlineAdd + useManualAdds session store
  intently-flows.jsx                       # BriefFlow, ReviewFlow, GoalDetail, …
  intently-extras.jsx                      # JournalComposer, Connections, OAuth, ProfileButton
  intently-profile.jsx                     # ProfileSheet + sub-pages
  intently-reading.jsx                     # tap-to-read overlay for past entries
  ios-frame.jsx                            # device bezel
  design-canvas.jsx                        # pan/zoom canvas chrome (unused by prototype)

docs/
  design/Intently - App/                   # HANDOFF.md, BUILD-RULES.md, source .jsx + canvas
  product/                                 # vision.md, signals.md, life-ops-plugin-spec
  architecture/                            # data-model, agent-memory, event topology
```

The `app/` directory mirrors the source `.jsx` files from `docs/design/Intently - App/` so the prototype can be served directly. They are the same files; treat the design folder as the design surface and `app/` as the runnable copy.

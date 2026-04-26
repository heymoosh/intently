---
captured: 2026-04-25T22:00:00-05:00
session: chat/0425-210554
source: discussion
amends: .claude/handoffs/new-user-ux-and-auth.md
---

# Amend new-user-ux-and-auth handoff with identity-component + reading-mode gaps

`/groom` should treat this as an amendment to the existing handoff (not a new one): fold these AC bullets into the appropriate sections of `.claude/handoffs/new-user-ux-and-auth.md`, then delete this inbox file. The handoff already covers the framing (presentational hardcodes survived the cognition push); this just adds concrete AC bullets and a missing reading-mode bug discovered while inspecting the deployed app.

## Discovered while inspecting deployed app on 2026-04-25 evening

Muxin observed the home-screen profile button shows "M" while the profile sheet shows "Sam Tanaka" with an "S" avatar — same logical thing, three different implementations, three hardcoded literals. Investigation surfaced four concrete bugs in the same family.

## Bugs to add as AC bullets in new-user-ux-and-auth handoff

**No shared `<Avatar>` component:**
- [ ] Single reusable `<Avatar user={user} size={...} />` component created (likely in `web/intently-cards.jsx` or new `web/intently-identity.jsx`). Reads `display_name` (or `email` fallback) from a single auth/user-context source. Computes initial letter from the name. Color/gradient from tokens.
- [ ] All three current avatar locations replaced with `<Avatar>`:
  - Home-screen profile button: `web/intently-extras.jsx:205-225` — `ProfileButton` currently has hardcoded `>M</button>`.
  - Profile sheet hero avatar: `web/intently-profile.jsx:104-113` — currently inline `<div>...>S</div>`.
  - JournalReader byline avatar: `web/intently-reading.jsx:97-101` — currently inline `<span>...>S</span>` followed by hardcoded `Sam · ${entry.dateLabel}`.
- [ ] Verified: changing `display_name` in DB updates all three surfaces consistently.

**Edit button is a literal no-op:**
- [ ] `web/intently-reading.jsx:75` — `JournalReader` calls `<ReadingHeader onEdit={() => {}} />`. Wire `onEdit` to actually open the journal entry for editing. Likely target: re-uses the `JournalComposer` flow (`web/intently-flows.jsx` JournalComposer, used today only for new entries) with the entry's existing body pre-filled, and on save it `update`s the `entries` row instead of `insert`ing a new one.
- [ ] Same audit for `ChatReader` ("Continue this conversation" button at `intently-reading.jsx:326-331` — currently no `onClick` handler) and `ReviewReader` if applicable.

**Brief entries can't open in reading mode:**
- [ ] `index.html:803-861` — the `dbEntry` resolver handles `kind='journal'`, `'review'`, `'chat'` but has no branch for `'brief'`. Clicking a daily-brief entry sets `openEntry` but `dbEntry` stays null → `ReadingMode` returns null → user taps and nothing happens.
- [ ] Add a `kind='brief'` branch that constructs a brief-shaped entry, AND a `BriefReader` variant in `intently-reading.jsx` (modeled on `ReviewReader`). Or, if briefs aren't meant to be tappable in the journal list, gate the "READ >" affordance to only render for tappable kinds.

**Locations + literal strings audit (already partially in handoff):**
- The handoff lists: `intently-profile.jsx:119,289`, `intently-flows.jsx:431,1394`, `intently-screens.jsx:197`, `intently-reading.jsx:102`. Add: `intently-extras.jsx:223` (the hardcoded "M") and `intently-reading.jsx:101` (the hardcoded "S" inside JournalReader byline).

## Why this is amendment, not a new handoff

All four bugs are presentational-hardcode-survived-the-cognition-push — exactly the framing of `new-user-ux-and-auth`'s "What — the target experience" section. The only structural addition is the `<Avatar>` component itself, which is a small enough lift to live as one AC bullet in that handoff rather than its own thread.

## Bigger pattern (worth flagging in handoff "Why" section if grooming agrees)

The cognition push wired the *data* layer cleanly through to Supabase — entries, goals, projects, plan_items all hydrate and persist correctly. **What got missed is the identity/presentation layer.** Hardcoded avatar letters, display names, and bylines were left as inline literals because the prototype was authored for screenshots before identity existed as a concept. The cognition push didn't touch them because they weren't in its scope. This is the same family of issue as the unconditional Sam seed — strings authored before the data layer was real, never re-pointed at real data afterward.

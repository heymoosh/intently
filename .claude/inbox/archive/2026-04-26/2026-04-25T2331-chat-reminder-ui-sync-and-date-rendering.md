---
captured: 2026-04-25T23:31:00-05:00
session: chat/0425-210554
source: discussion
folds_into: .claude/handoffs/wiring-audit.md
---

# Chat-created reminder: UI sync gap + date not rendered in Admin band

Two related concrete gaps surfaced while testing the post-deploy reminders fix on 2026-04-25 evening. Both sit in the same chat → Admin band flow. `/groom` should fold these into the wiring-audit interaction inventory (currently being authored by sub-agent in flight) and/or route to § Next as a small standalone PR.

## Discovered while testing PR #158 deploy

After the JWT passthrough fix went live, Muxin sent "remind me to call my dentist tomorrow" via the hero chat. Agent confirmed correct date (2026-04-26 — Bug 2 fixed ✅). Reminder did NOT appear in Future page → Admin · misc reminders. Page refresh made it appear, but **without a visible date** — just the text "Call the dentist."

The DB write is working correctly (post-refresh confirmed). Both gaps are presentational/sync, not data persistence.

## Gap A — UI doesn't sync after chat-created writes

**Where:** `web/intently-manual-add.jsx:280-285`. The hydration `useEffect` runs once on mount with `hydratedRef` guard + empty deps. New rows inserted via `classifyTranscript` (chat path) don't trigger any state update on the parent. The Admin band reads stale `state.adminReminders`.

**Affects:** Same pattern likely exists for any chat-created or async-classifier-created entity. Journal entries from voice transcripts, plan items added by agent, etc. All would have the same "invisible until refresh" pattern.

**Three fix options (decide during execution):**

1. **Optimistic update** (lean: this for V1). `HeroChat.sendUtterance` (intently-hero.jsx:384) bubbles the new reminder up to `useManualAdds` via a callback prop. State appended locally. Fast UX, simple code change.
2. **Hard re-hydrate after each write.** Trigger the hydration effect again by incrementing a refresh counter in deps. Simple but full-table re-fetch every chat.
3. **Real-time subscription.** Supabase `.channel('reminders').on('INSERT', ...)`. Best UX (catches changes from other devices) but heavier and less needed pre-multi-user.

## Gap B — Admin band doesn't render the `remind_on` date

**Where:** `web/intently-screens-prototype.jsx:303`. The reminder row JSX is:
```jsx
<span style={...}>{r.text}</span>
```
Only `r.text` is rendered. `r.remind_on` is fetched (`listAdminReminders` selects all columns) but never displayed.

The seed data "Renew dental insurance — deadline Apr 30" SHOWS the date because the date is *baked into the text string itself* — a seed-data convention from before the `remind_on` column existed (or from before classify-and-store wrote there). Auto-classified reminders have a clean `text` ("Call the dentist") + a separate `remind_on` ("2026-04-26"); the UI ignores the latter.

**Suggested fix:**
- Render `r.remind_on` next to the text when present. Format as a relative phrase ("tomorrow" / "in 3 days" / "Apr 30") to match the calm aesthetic.
- If `remind_on` is null (post-Reminders-intent-reconciliation), show nothing — undated reminders just show as text.
- Consider a small visual treatment (smaller font, right-aligned, supporting text color) so the date doesn't compete with the action.

## Cross-references

- Adjacent to (but NOT the same as) **Critical items #2 — Reminders intent reconciliation.** That's a broader product decision: should reminders be required-date or support undated "track this" intent? This capture is narrower — even when we DO have a date, we should display it.
- The UI-sync gap (A) is a member of the larger **wiring-audit** category: every "agent says it did X" needs a UI-state-update story. Sub-agent currently authoring `docs/product/interaction-inventory.md` will catalog this; the FIX comes from this inbox item.
- The rendering gap (B) is a member of the **identity/presentation layer survived the cognition push** family — same DNA as the avatar inconsistency, edit-button-stub, brief-can't-open. Add to the inventory under the Future-page Admin band row.

## Suggested AC (if grooming routes to § Next standalone)

- [ ] **Gap A:** Send a chat reminder; without refreshing, the new reminder appears in Future → Admin band within 200ms of the agent reply landing.
- [ ] **Gap A:** Same pattern works for any chat-created entity that lands in a hydrated state slice (journal entries, plan items if/when wired through the chat).
- [ ] **Gap A:** No regression to existing AddZone manual-add path — those already optimistically update via `useManualAdds`.
- [ ] **Gap B:** Reminders with non-null `remind_on` show the date next to the text in the Admin band.
- [ ] **Gap B:** Date format is human-readable + matches the prototype's aesthetic (suggested: "tomorrow" / "Friday" / "Apr 30" depending on proximity).
- [ ] **Gap B:** Reminders with null `remind_on` (once Reminders intent reconciliation lands undated reminders) show only the text — graceful when date is absent.
- [ ] **Gap B:** Same date rendering pattern applied to the daily-brief input assembler so the agent sees dates on reminders too (cross-check `web/lib/reminders.js` `formatRemindersForInput`).

## Why both fit one PR

Both touch the chat → reminders → Admin band flow. They're discoverable in the same code paths and verifiable with the same manual smoke (send chat, confirm reminder appears with date).

## Out of scope

- Reminders intent reconciliation (undated reminders) — separate Critical item.
- Real-time subscription to `reminders` table — too heavy for V1.
- Restructuring the Admin band visual hierarchy — current treatment is fine; just add the date.

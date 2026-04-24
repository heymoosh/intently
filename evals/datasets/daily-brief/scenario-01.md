# scenario-01 — Thursday, mid-sprint

**Persona:** Sam, a solo builder working on an AI productivity app during a 6-day hackathon.
**Today:** Thursday, day 4 of 6. Morning, 07:30.
**Integrations:** calendar connected; email not connected.

The files below are the state the `daily-brief` skill should treat as already-read, in cascade order.

---

## `life-ops-config.md` (excerpt)

```yaml
daily_brief_time: '07:30'
daily_review_time: '21:00'
weekly_review_day: 'Sunday'
first_run_complete: true
notes_folder_path: '/seed'
reflection_filename: 'Journal.md'
integrations:
  calendar_enabled: true
  email_enabled: false
projects:
  - 'Intently'
  - 'Design System Port'
  - 'Health Routine'
health_file_enabled: false
```

## `Monthly Goals.md` (excerpt)

> **April priorities**
>
> 1. Ship Intently V1 by the hackathon close (Saturday).
> 2. Keep the strength routine — 3×/wk — through the sprint. Don't bargain it away.
> 3. Two real weekend days with family. Not "working in the background."

## `Weekly Goals.md` (excerpt)

> **Review of last week**
>
> - Pattern: lost mornings twice to email/Slack before the P1 block started. Put that back in a box.
> - Pattern: two good evenings when I quit by 21:00. The late nights didn't actually produce more shippable code.
>
> **This week (April 20–26)**
>
> - **P1 — Intently demo path:** Managed Agents wiring + three demo flows runnable end-to-end by Friday EOD.
> - **P2 — Design System Port:** tokens compile into the Expo app; not the full visual port yet.
> - **P3 — Admin / house:** inbox zero by Thursday. Walk daily.

## `Daily Log.md` (current week)

### Wednesday April 22

**AM plan:** P1 — eval runner scaffold + skill loader. P2 — token compile script. P3 — none today.

**PM done:** Shipped skill loader (PR #2, merged). Started on tool scaffolds — got `read_calendar` mocked, `read_emails` deferred. Tokens compile script is half done; the font-family translation is annoying.

**Evening reflection:** 2nd late night this week. Body is already griping. If Thursday goes late I'll pay for it Saturday. Cut it tomorrow.

### Tuesday April 21

**Done:** First ADR shipped. Repo scaffold up. Felt slow, turned out the slow day set up every fast day after it.

### Monday April 20

**Done:** Strategy doc for Intently. Worked backwards from demo day.

### Thursday April 23

**AM plan:** _(daily-brief writes this after the sequencing conversation)_

## `Journal.md` (most recent entry)

> **2026-04-22 evening**
>
> Two in a row. The evening one again got away from me — I thought "one more thing" and it was three things and then it was 23:40. The demo has teeth now though. The agent actually produced a recognizable morning briefing on the first real run. That was the moment where it stopped being an idea.
>
> Tomorrow is the wiring day. Managed Agents → tools → three flows. If I get that end-to-end even roughly, Friday is polish and Saturday is rehearsal.

## `Projects/Intently/Tracker.md` (excerpt)

> **Status:** 🟡 In Progress · **Priority:** P1
>
> **Recent log:**
>
> - Apr 22 — Skill loader shipped. Tool scaffolds half-done. Tokens compile script in progress.
> - Apr 21 — ADR 0001 (Managed Agents as runtime). Repo scaffold.
> - Apr 20 — Strategy locked. Demo path named.
>
> **Next:** Managed Agents invocation surface. Tool wiring. First live daily-brief run.

## `Projects/Design System Port/Tracker.md` (excerpt)

> **Status:** 🟡 In Progress · **Priority:** P2
>
> **Next:** Tokens compile script finishes, then ports into Expo app screens.

## `Projects/Health Routine/Tracker.md` (excerpt)

> **Status:** 🟢 Healthy · **Priority:** P3
>
> **Recent log:**
>
> - Apr 21 — strength session, felt strong.
> - Apr 19 — walk 5k.
>
> **Next:** second strength session this week. Open slot: Thursday PM or Friday morning.

## Calendar — today

```
09:00–10:00   Demo-path pairing (with Kaya)
15:30–16:00   1:1 with Anya (hackathon check-in)
```

## Email — not connected

(Integration flag is `not_connected`; the skill should note this and skip.)

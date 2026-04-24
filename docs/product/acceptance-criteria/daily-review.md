# Acceptance Criteria — Daily Review

**Flow:** Daily Review (end-of-day reflection managed agent + mobile rendering)
**Demo position:** Closes the day in the demo arc.
**Spec source:** `docs/product/requirements/life-ops-plugin-spec.md` — "Daily review" section.

---

*Scaffolded structure. Criteria fill in during build sessions; Spec Conformance Steward surfaces unknowns and gaps.*

---

### CR-daily-review-01: Review captures today's actual events, not a generic template

**Behavior:** The review reflects on what actually happened today. Reads: Today's Daily Log entry (AM section), all project trackers (status lines), config. Does not re-read Weekly Goals — daily-brief already absorbed Weekly Goals into the AM section of the Daily Log, providing sufficient context. Does not re-read calendar, email, voice memos, or in-app captures — those were consumed by daily-brief and their relevant content is already in the Daily Log. If nothing notable happened, says so honestly.

**Verification:** E2E test against a fixture day; AI eval rubric scoring faithfulness against the Daily Log entry. Verification does not check calendar, email, voice, or in-app capture access.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-daily-review-02: Review updates persistent state coherently

**Behavior:** Tracker entries get updated based on what happened (project state changed, new task added, person preference learned). Updates respect the Document Taxonomy (state in trackers, reasoning in strategy docs, content in references).

**Verification:** Agent Memory Steward audit pass after a review run; spot-check that taxonomy is respected.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-daily-review-03: Review wraps the current day

**Behavior:** Wraps the current day only: captures what was accomplished, trims yesterday's entry to Done-only, syncs the Command Center (status indicators and next actions), and prompts for reflections. Does not synthesize multi-day patterns — that is the weekly review's responsibility.

**Verification:** E2E test confirms the four-step flow (wrap today, trim yesterday, sync Command Center, reflections prompt). AI eval rubric confirms no multi-day pattern synthesis is produced.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-daily-review-04: Review tone is reflective, not performative

**Behavior:** Reads as insight from a thoughtful observer, not as a productivity-app summary. Allows for ambivalence ("today was uneven"). Doesn't congratulate the user for completing tasks.

**Verification:** AI eval rubric scoring tone.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-daily-review-05: Review closes with next-day preview and reflections prompt

**Behavior:** Closes with two elements: (1) a factual next-day preview — a brief heads-up of what's on tomorrow's calendar (if connected) and anything time-sensitive due; and (2) the reflections prompt: "Anything land for you today? A thought, a feeling, something you noticed? Even one sentence is fine. Or skip — no pressure." The preview is informational only — it does not propose how to sequence or approach tomorrow. Proposing tomorrow's sequence is daily-brief's job.

**Verification:** E2E test confirms the review includes both a next-day preview and the reflections prompt. AI eval rubric confirms the preview contains no proactive sequencing suggestions — only factual calendar/deadline content.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-daily-review-06: Daily Log is the day's operational record; Journal gets separate reflection entries

**Behavior:** The completed Daily Log entry for a day — AM plan written by daily-brief + PM wrap written by daily-review — forms the day's operational record ("what we aimed to do, what we did"). This combined entry is the structural account of the day. Reflections shared during the review prompt are captured in Journal.md as separate entries — not embedded in or appended to the Daily Log. Deeper topics, observations, and non-operational reflections belong in Journal.md, not in the Daily Log.

**Verification:** Post-review file inspection confirms Daily Log entry contains only operational content (plan + done); Journal.md contains reflection text as a separate entry, not a copy of or addition to the log entry.

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-24

---

*Add criteria as the flow takes shape.*

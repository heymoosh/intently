# Acceptance Criteria — Setup

**Flow:** Setup Skill — Onboarding Conversation Flow (6-phase seed of the Life Ops system)
**Demo position:** Non-demo skill (user's first run experience; not part of the three demo flows).
**Spec source:** `docs/product/requirements/life-ops-plugin-spec.md` — "Setup Skill — Onboarding Conversation Flow" section (line 298).

---

*Derived from spec on 2026-04-22 via /derive-criteria. Behavior fields copy spec language verbatim and do not change during build. Status/Last checked update as verification lands.*

---

### CR-setup-01: Phase 1 discovers and classifies existing structure

**Behavior:** The user selects a folder. The skill scans it and classifies what it finds: existing notes structure (Daily/, Weekly/, Journal/, Goals/, Projects/, or an .obsidian/ folder); existing goal documents (files with "goal" / "plan" / "objective" / "resolution" in the name or content); existing project tracking (files with "tracker" / "status" / "kanban" / "board" / "sprint" in the name); existing journal/daily notes (date-named files or chronological entry folder); existing health/wellness docs.

**Verification:** TBD — unit test of the scan + classifier against fixture folders covering each branch (nothing found, notes structure, goal docs, trackers, journal, health).

**Demo blocker:** no

**V1 Cut:** SKILL.md explicitly cuts Phase 1 — "Phase 1 — Discover existing vault. New users don't have one. [V1 cut]" V1 assumes new users with no existing vault. When verifying, mark `fail (V1 cut — not a defect)`.

**Status:** unknown

**Last checked:** 2026-04-23

---

### CR-setup-02: Phase 1 adapts paths when structure is found, builds fresh when nothing found

**Behavior:** If nothing is found, the skill says "Looks like a fresh start — we'll build your system from scratch" and proceeds to seed from scratch. If structure is found, the skill says "I can see you already have [describe what was found]. I'll work with your existing structure instead of creating a new one" and adapts paths in the config rather than duplicating.

**Verification:** TBD — E2E test for each branch; verifies the config file's paths reference discovered locations when present.

**Demo blocker:** no

**V1 Cut:** SKILL.md explicitly cuts Phase 1 — "Phase 1 — Discover existing vault. New users don't have one. [V1 cut]" V1 assumes new users with no existing vault. When verifying, mark `fail (V1 cut — not a defect)`.

**Status:** unknown

**Last checked:** 2026-04-23

---

### CR-setup-03: Phase 2 seeds the three mandatory foundation docs through conversation

**Behavior:** Setup populates three mandatory documents through conversation: **Ops Plan** (Command Center dashboard with Priority 1 / Priority 2 / Priority 3 project tables plus a "Monthly Priorities — [Month Year]" section), **Goals** (2–5 meaningful goals organized by area — professional, personal, health, financial, creative), and **Weekly Goals** (3–5 items for the current week, connected to a project or life goal where possible but not forced).

**Verification:** TBD — E2E test of the onboarding conversation; inspects the three files post-run for required sections and structure.

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-23

---

### CR-setup-04: Phase 3 classifies items as project, task, or goal and seeds project docs

**Behavior:** For each item from Phase 2, the skill classifies it by the signals in the spec. **Project signals** (multi-week timeline, multiple steps/phases, tracks decisions/history, has dependencies, needs collaborative goal-finding, benefits from a "why" document) get a `Tracker.md` (Status block + Log) and a `Strategy.md` (Why This Project Exists / Current Approach / Key Decisions / Learnings / Open Questions) per the spec's templates. **Task signals** (one-session, clear next step, no history to track) go into Weekly Goals. **Goal signals** (outcome-oriented, not directly actionable, longer-than-week horizon) go into Goals.md.

**Verification:** TBD — fixture-based unit test for the classifier; file-shape test for Tracker.md and Strategy.md against the spec templates.

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-23

---

### CR-setup-05: Phase 5 captures preferences and writes them to `life-ops-config.md`

**Behavior:** Preferences captured: reflection file name (default Journal; Journal discovery checks for existing dated-reflection files or `#gtj` tags before asking, and adopts one if found), morning brief time (default 7:00 AM), evening review time (default 5:00 PM), weekly review day/time (default Sunday 9:00 AM), monthly review day/time (default 1st of month, 10:00 AM), connected integrations (Google Calendar MCP / Gmail if available), day structure preference (creative mornings by default). Preferences are written to `life-ops-config.md`.

**Verification:** TBD — E2E test of the preferences dialog; file inspection of `life-ops-config.md` post-run.

**Demo blocker:** no

**V1 Cut:** SKILL.md simplifies to defaults-only — "Phase 5 — Full preferences. Use defaults. Ask only if the user volunteers a preference." The 7-item preferences conversation in the spec does not run in V1. When verifying, mark `fail (V1 cut — not a defect)`.

**Status:** unknown

**Last checked:** 2026-04-23

---

### CR-setup-06: Phase 6 seeds remaining foundation files

**Behavior:** Setup creates the remaining files with minimal content: `Daily Log.md` (empty, ready for first morning brief), `[User's chosen reflection filename].md` (empty, with year heading — Journal by default), `Master Backlog.md` (empty, with brief explanation of purpose), `Past/` folder (empty).

**Verification:** TBD — file inspection post-run; confirms each file exists with the described minimal content.

**Demo blocker:** no

**V1 Cut:** SKILL.md delegates file creation to the app platform — "Empty files are provisioned by the app on first run — this skill does not need to create them." Verification target is the app provisioning step, not the setup skill in isolation.

**Status:** unknown

**Last checked:** 2026-04-23

---

### CR-setup-07: Phase 4 optional health/wellness setup is truly optional

**Behavior:** Setup asks: "Do you have any health or wellness goals you'd like a gentle daily nudge about?" If yes, creates `Health.md` with the user's goals and a quick-reference section the morning brief can rotate through. If no, skips — the morning brief does not include health nudges. The nudge, when enabled, is conversational (1–2 sentences woven into the briefing), not a checklist.

**Verification:** TBD — E2E test for both branches; downstream morning-brief test verifies nudge presence/absence matches the config.

**Demo blocker:** no

**V1 Cut:** SKILL.md explicitly cuts Phase 4 — "Phase 4 — Health.md. Defer to post-V1. health_file_enabled: false." When verifying, mark `fail (V1 cut — not a defect)`.

**Status:** unknown

**Last checked:** 2026-04-23

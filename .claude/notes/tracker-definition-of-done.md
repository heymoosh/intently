# Tracker Note — Definition of Done

**Add this to TRACKER.md when you have the branch.**

---

## Item: Validate and enforce Definition of Done

**File:** `docs/process/definition-of-done.md`
**Status:** Draft — authored, not yet tested or enforced.
**Priority:** Medium — needed before the build loop runs autonomously at scale.

### What needs to happen

1. **Test whether it's being followed.** Run one overnight build loop iteration and check: did Claude actually run the self-check at the end, or did it skip it? Review the routine output for evidence.

2. **Wire it into the build loop explicitly.** The overnight build loop's "per-iteration definition of done" (`.claude/loops/overnight-build-loop.md` § Per-iteration definition of done) is currently mechanical (tsc, commit, push, PR). Update it to also run the self-check from `docs/process/definition-of-done.md` before marking any iteration as shipped.

3. **Add a pointer in CLAUDE.md.** One line under "What Claude updates as implementation evolves" or a new "Completion gate" line pointing to `docs/process/definition-of-done.md`. Keep CLAUDE.md under 100 lines.

4. **Decide on the user-input question.** When the self-check fails and Claude can't fix it autonomously, what happens?
   - Interactive session: surface as a blocker, ask user. (Current intent — document this explicitly.)
   - Unattended loop: roll back, write failure note, move on. (Already the pattern — confirm it reads DoD.)
   - Does either path currently retry automatically, or does it always require human input to restart? Clarify and document.

5. **Consider whether Managed Agents `outcomes` (available end of day 2026-04-23 per webinar) changes anything.** If outcomes becomes available, the rubric in `docs/process/definition-of-done.md` could be passed as an outcome definition to each managed agent session, giving it a real retry loop without human input. Evaluate once outcomes is public.

### Open question
Is the self-check prompt in `docs/process/definition-of-done.md` strong enough to actually change behavior, or does it need to be baked into the system prompt / CLAUDE.md to have teeth? Test before assuming it works.

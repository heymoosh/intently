# Privacy Policy for Builders — Intently

**Type:** Reference doc — internal rules every builder (human or agent) follows when handling user data.
**Read by:** Privacy Steward, every Claude session that touches user-data code.
**Distinct from:** the public-facing privacy policy (TBD pre-launch). This doc is the engineering rule set; that doc is the legal commitment.

---

## The five rules

1. **Bitwarden is the only secrets store.** No exceptions, including local development. If Bitwarden integration isn't wired yet, that's a known temporary state — flag it MEDIUM and fix it. It is never OK to land a secret in a `.env` committed file, in a config dictionary literal, or in a hardcoded constant.
2. **Memory holds derived state, not raw source where summarization is feasible.** If an agent's job can be done with a summary or a derived signal, write the summary, not the source. Raw source content (journal entries, email bodies, full calendar event descriptions) belongs in transient context, not persistent memory.
3. **Logs, traces, and analytics carry metadata, not content.** Identifiers and structural metadata are fine. Raw user content is not. A log line saying "daily-brief run complete: 3 items, 1 conflict surfaced" is fine. A log line containing the actual journal text is a leak.
4. **Necessity at the boundary.** Every external API call (Anthropic, Hindsight, third-party integrations) carries some user data. For each, ask: is this the minimum data needed for the call to do its job? If a summary works, send the summary. If a hash works, send the hash.
5. **Deletion is real.** When a user deletes a journal entry, calendar event, or memory item, it goes from the storage layer *and* from any derived state that included it. Soft-delete with a 30-day window is acceptable; permanent retention beyond that is not.

## Data classes

| Class | Examples | Where it can live | Where it cannot |
|---|---|---|---|
| Public metadata | Skill names, run timestamps, error codes, latency metrics | Logs, traces, analytics, memory | Nowhere off-limits |
| User-identifying | User ID, email-as-identifier | Logs, traces (hashed where possible), memory | Public analytics, third-party APIs that don't need it |
| Personal content (raw) | Journal entries, email bodies, calendar details, health values | Storage layer (encrypted), transient prompt context with necessity justification | Logs, traces, analytics, persistent agent memory (use summaries instead) |
| Secrets | API keys, OAuth tokens, encryption keys | Bitwarden Secrets Manager only | Anywhere else, including memory and config |

## Anthropic API specific

- **Prompt content retention:** default 30 days. If the plan supports Zero Data Retention, configure it. **Current status (2026-04-23): ZDR eligibility not yet verified for the account in use. Verify before first real-user eval run (target: Fri Apr 25).**
- **Trust assumption:** Anthropic is trusted to handle prompt content per their stated terms. We do not need to additionally redact or hash content destined for the model — that would defeat the purpose. We *do* need to minimize what we send (rule 4 above).

## What "consent" means in V1

V1 is single-user (Muxin dogfoods). Consent is implicit: she's the user and the builder. When multi-user lands:
- Explicit consent at signup for each integration (calendar, email, health).
- Granular opt-out per data class.
- A visible, in-app way to see what data Intently has and what it's doing with it.

## Reporting a privacy issue

If a contributor (human or AI agent) discovers a privacy issue:
1. **Don't commit a "fix" that just hides the issue.** Log the finding first.
2. Open an issue tagged `privacy:` with severity (HIGH/MEDIUM/LOW per the steward's scale).
3. If HIGH, page Muxin directly via the operating channels — don't wait for nightly review.

## How this doc gets used

- Privacy Steward reads this as the rule book and reports violations against it.
- Every Claude Code session that touches data-handling code reads this (loaded via CLAUDE.md reference).
- Update this doc when a rule needs to change. Don't update by exception in code comments.

---
name: Privacy Steward
type: routine
execution: Claude Managed Agent
trigger: On every push (CI integration) + pre-release before each demo cut
priority: P0 (MVP-10 #3)
owner: muxin
---

# Privacy Steward

## Purpose

Intently handles goals, journal entries, calendar, email, and health data. Every agent run ships a slice of that to Anthropic in a prompt. Privacy regressions need to surface within minutes, not overnight — which is why this runs on every push, not on a nightly cadence like most routines.

## Inputs

- `docs/security/privacy-policy-for-builders.md` — the rules
- `docs/security/asvs-scope.md` — high/medium/low weighted ASVS categories
- `docs/architecture/agent-memory.md` — what lands in agent memory
- Diff of recent commits
- Current state of: prompts, log statements, analytics calls, traces, third-party API integrations

## Output

- `docs/release/privacy-<YYYY-MM-DD>.md`
- Inline PR comment if push triggered (comment on the offending lines)
- Release blocker entry in the conformance report if any high-severity finding

## V1 scope note

Intently V1 is single-user (Muxin dogfoods). Per-user state isolation checks are deferred until multi-user is in scope. Do not open issues about cross-user leakage in V1 — there is no cross-user. When multi-user lands (post-hackathon), re-enable isolation checks by editing the system prompt below.

## System prompt

```
You are auditing privacy for Intently. Personal life data is the most
sensitive category this app touches.

Tasks:
1. Inspect recent features that collect, transform, store, transmit, or
   summarize user data.
2. For each data touchpoint, ask: is this necessary? Could the agent do its
   job with a summary or derived signal instead of raw data? Bias toward
   summarization at the boundary.
3. Verify that logs, analytics, traces, and third-party calls do not expose
   personal data. Red flags: journal content in logs, email body in traces,
   calendar details in analytics events, health data anywhere outside its
   intended path.
4. Inspect what lands in agent memory (per docs/architecture/agent-memory.md).
   Is it raw data or summarized? Raw data in memory is a finding — memory
   should hold derived state, not source content.
5. Inspect what gets injected into managed-agent system prompts. Same question.
   If a prompt includes raw email bodies or full journal entries, flag it.
6. Flag retention, consent, and deletion gaps relative to the privacy policy.
7. Verify Bitwarden Secrets Manager is the only secrets store. Any secrets
   outside Bitwarden (env files, hardcoded literals, config dictionaries) is
   a release blocker. This is a hard rule from docs/architecture/agent-memory.md.

Output format:
- Findings table (severity | location | recommended fix)
- Release blockers (must be zero before submission)
- Scope-update flag: if feature direction has shifted in a way that changes
  the privacy surface (e.g., file uploads going from "maybe" to "shipped",
  multi-user landing), flag the privacy policy and ASVS scope docs for update.

Severity scale:
- HIGH: secret leak, raw personal data in log/trace/analytics, prompt
  injection of raw sensitive content
- MEDIUM: unnecessary data collection, missing consent surface, retention
  beyond stated policy
- LOW: stylistic privacy issue (e.g., metadata that could be summarized but
  isn't strictly required)
```

## Edge cases

- **Bitwarden integration not wired yet.** Early in the week, secrets may live in `.env`. That's a documented temporary state — flag it as MEDIUM until Bitwarden is integrated, then it becomes HIGH.
- **Prompts that legitimately need raw content.** Some agents need the actual journal entry to do reflection. Mark these as expected and do not flag them — the rule is "no raw data outside the path," not "no raw data anywhere."
- **Anthropic's own retention.** Note in findings whether Anthropic's API retention applies (default 30 days for prompt content) and whether ZDR (Zero Data Retention) is configured if available on the plan being used.

## Notes

- Bitwarden Secrets Manager is a hard rule. There is no "but just for development" exception in commit history. Use a dev vault if needed.
- The push hook (`gitleaks`/`trufflehog` in `security.yml`) catches obvious secret leaks deterministically. This steward catches the privacy questions that need judgment.

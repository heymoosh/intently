# Threat Model — Intently

**Type:** Reference doc — STRIDE-flavored threat model for Intently's V1 architecture.
**Read by:** Privacy Steward, manual security review, future Red-Team Steward.
**Updated when:** architecture shifts (new component, new integration, new data type).

---

## Asset inventory

The things worth attacking, in rough order of value.

| Asset | Where it lives | Sensitivity |
|---|---|---|
| User journal entries | Agent memory store (per-user cloud) | Highest — irreplaceable, deeply personal |
| User calendar/email content | Agent memory + transient prompt context | High — relational, links to other people |
| User health data | Agent memory + transient prompt context | High — regulated in some jurisdictions |
| Anthropic API key | Bitwarden Secrets Manager | High — gives an attacker billing + content access |
| OAuth tokens (Google/Apple/etc.) | Bitwarden Secrets Manager | High — gives full third-party account access |
| Hindsight credentials | Bitwarden Secrets Manager | Medium — controlled blast radius |
| Markdown source files (dogfooded vault) | Local + git remote | Medium — public repo for hackathon, so vault contents stay local-only |

## Trust boundaries

```
[ User device (mobile app) ]
        │  HTTPS
        ▼
[ Intently backend ]   ◄── Bitwarden (secrets only)
        │
        ├── Anthropic Managed Agents API ──► [ Claude infra (prompt content + retention) ]
        ├── Hindsight (structured memory)   ──► [ Hindsight infra ]
        └── Per-user cloud storage          ──► [ Storage provider TBD ]
```

Boundaries that need explicit verification:
1. **Mobile ↔ backend:** all traffic HTTPS. No bearer tokens in URL params. No request bodies logged.
2. **Backend ↔ Anthropic:** prompt content carries user data; verify retention configuration (default 30d, ZDR if available on the plan).
3. **Backend ↔ Bitwarden:** only the backend reads secrets. Mobile never sees a secret.
4. **Backend ↔ storage:** encryption at rest; access scoped to runtime identity.

## STRIDE per component

### Mobile app
- **S(poofing):** an attacker installing a malicious app pretending to be Intently → out of scope for V1, addressed by App Store review later.
- **T(ampering):** local store on jailbroken device → V1 accepts this risk; sensitive data lives server-side, not in the local cache.
- **R(epudiation):** N/A for V1 (single user).
- **I(nformation disclosure):** screenshots / clipboard / share extensions exposing journal content → mitigated by not autofilling sensitive fields and by warning on share gestures (post-hackathon).
- **D(enial of service):** N/A.
- **E(levation of privilege):** N/A.

### Backend
- **S:** API endpoint without auth → V1 must require bearer token even with one user.
- **T:** unsigned writes to memory store → low risk in V1; mitigated by single-tenant runtime.
- **R:** missing audit log → log every memory mutation with timestamp + which skill made it. Useful for debugging too.
- **I:** verbose error messages leaking memory shape or stack traces → return opaque errors to client; log details server-side only.
- **D:** unbounded prompt size or agent loops → enforce per-skill timeout and token-budget caps.
- **E:** secrets accessible to the wrong runtime → enforced by Bitwarden + scoped runtime identity.

### Anthropic API
- **I:** prompt content retention → configure ZDR if plan permits; otherwise document the 30-day window as an accepted risk.
- **D:** rate limits / managed agent quotas exceeded → degrade gracefully, surface to user.

### Per-user storage
- **I:** misconfigured public bucket / over-broad ACL → storage provider must default deny; ACL test on every release.
- **T:** data corruption → versioned backups (post-hackathon).

## Top risks (ranked)

1. **Secret leak via committed code.** Mitigated by `gitleaks`/`trufflehog` push hook in `security.yml` plus Privacy Steward judgment review.
2. **Personal data in logs/traces/analytics.** Mitigated by Privacy Steward on every push.
3. **Personal data injected into prompts unnecessarily.** Mitigated by Privacy Steward and by the rule "memory holds derived state, not raw source where summarization is feasible."
4. **Cross-user leakage when multi-user lands.** Out of scope for V1 explicitly. Re-enable isolation checks in Privacy Steward when multi-user ships.
5. **Prompt injection from ingested content.** Out of scope until external content sources land (email/calendar parsing). Red-Team Steward handles this post-hackathon.

## Out of scope for V1 (revisit on commercialization)

- Multi-user authorization model.
- Mobile binary tampering / jailbreak detection.
- Sophisticated threat actor (nation-state, organized crime).
- Compliance regimes (GDPR, HIPAA, etc.) — apply when targeting jurisdictions that require them.
- Insider threat (when there are employees with backend access).

## How this doc gets used

- **Privacy Steward** reads this when deciding severity of a finding — the asset inventory tells it what's high-stakes.
- **Manual security review** before each demo cut: walk the trust boundaries, verify the top-5 risks are still mitigated.
- **When something new lands** (a new integration, a new data type, multi-user, file uploads), update the asset inventory, re-walk STRIDE per affected component, and re-rank top risks. This doc must not lag the architecture.

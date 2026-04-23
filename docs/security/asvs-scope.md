# ASVS Scope — Intently

**Type:** Reference doc — OWASP ASVS categories with Intently-specific risk weights.
**Read by:** Privacy Steward, manual security review.
**Updated when:** feature direction shifts in a way that changes the attack surface (e.g., file uploads going from "maybe" to "shipped", multi-user landing).

---

## Approach

Intently keeps the full ASVS category list in scope — none are dropped — because feature direction may shift during the build week and we don't want to rediscover security requirements mid-sprint. Categories are *weighted* by Intently's current attack surface so the Privacy Steward and any reviewer knows where to spend attention.

The weighting tells the steward where to look hard vs. skim. It does not drop any category from the checklist.

---

## High weight — spend attention here

These categories map to the most exploitable surface for Intently V1.

### Secrets management
- **Why high:** Anthropic API key, OAuth tokens (calendar/email/health integrations), Hindsight API key. All are bearer tokens that grant full account access to a sensitive user surface.
- **Hard rule:** Bitwarden Secrets Manager is the only secrets store. No `.env` files committed, no hardcoded literals, no config dictionaries with values inline. (Source: `docs/architecture/agent-memory.md`.)
- **Where the steward looks:** every diff for secret-shaped strings; environment loading code; deployment configs.

### Logging hygiene
- **Why high:** the entire app handles personal data. A debug `console.log(prompt)` ships journal content to whatever log aggregator is wired up.
- **Rule:** logs may include metadata and identifiers. Logs must not include raw user content (journal, email body, calendar details, health data).
- **Where the steward looks:** every log statement in code touching agent runs; trace/observability config; analytics events.

### Data storage
- **Why high:** agent memory holds goals, reflections, journal entries, peer profiles. The storage layer is the most concentrated source of sensitive content in the system.
- **Rules:** memory holds derived state, not raw source content where summarization is feasible. Encryption at rest. Access scoped to the runtime that needs it.
- **Where the steward looks:** what gets written into the memory layer; what gets pulled back; whether raw content or summaries cross the boundary.

---

## Medium weight — currently thin, becomes high on scope expansion

These are not load-bearing for V1 but flip to high weight the moment the corresponding feature lands.

### Authentication and authorization
- **V1 reality:** single user (Muxin). Auth surface is thin — basically protect the API endpoint with a simple bearer token.
- **Becomes high:** the moment multi-user lands. Cross-user data leakage is the failure mode that ends the company.

### Session management
- **V1 reality:** there's effectively one persistent session per user; no cookie/token rotation drama.
- **Becomes high:** with multi-user + web access. Cookie scope, token expiry, refresh rotation all matter.

### File uploads
- **V1 reality:** no file upload surface yet.
- **Becomes high:** the moment voice notes, document imports, or attachment handling ships. Path traversal, content-type spoofing, virus scanning all enter scope.

---

## Low weight — checked, not load-bearing

Still verified, but the surface is naturally small for Intently V1.

### Input validation and output encoding
- **Why low:** no user-generated HTML, no SQL surface (we're using markdown + Hindsight + a managed agent backbone, not a relational DB with user-controlled queries). Prompt injection is a separate concern handled by the AI eval batch's safety axis and the Red-Team Steward post-hackathon.
- **Steward attention:** light — verify there's no obvious dynamic SQL or HTML rendering of user input.

### Transport security
- **Why low:** mostly Anthropic's TLS layer plus standard HTTPS for any API we expose. Standard hygiene applies.
- **Steward attention:** verify all external calls are HTTPS; no plain HTTP fallbacks.

---

## Maintenance

When the Privacy Steward notices a feature direction shift that changes the surface, it flags this doc for update. Don't let the weights go stale — the steward decides where to spend attention based on what's written here.

For the full OWASP ASVS reference, see https://owasp.org/www-project-application-security-verification-standard/.

# Tests

Test suites for Intently. Scope is intentionally bounded for the hackathon — see `CLAUDE.md` "Test scope ceiling" for the cap.

```
tests/
├── unit/         # agent memory schema + deterministic business logic
├── integration/  # SKIPPED for hackathon (deferred to post-launch)
├── e2e/          # the three demo flows (daily brief, daily review, weekly review)
└── security/     # secrets exposure, transport security, basic input handling
```

## Hackathon scope ceiling (from CLAUDE.md)

- **Unit:** agent memory schema + deterministic business logic. Comprehensive here because schema bugs cascade.
- **Integration:** **skipped for MVP.** Reintroduce post-launch.
- **E2E:** the three demo flows. Each flow has at least one happy-path test plus the latency assertion from the corresponding acceptance-criteria file.
- **Security:** the deterministic checks (secrets in source, no plain HTTP, etc.). The Privacy Steward handles judgment-based privacy review.

The Test Gap Steward exists in the generic blueprint but is intentionally deferred — without the ceiling, it would want to grow coverage indefinitely and eat sprint time.

## Stack-dependent

Specific commands (`npm test`, `pytest`, etc.) are added to `CLAUDE.md` once the stack is chosen post-Thursday Apr 23. Until then, this folder structure exists but no tests are wired.

## Naming

- Unit: `<module-under-test>.test.<ext>`, e.g. `memory_schema.test.ts`.
- E2E: `<flow>.e2e.<ext>`, e.g. `daily_brief.e2e.ts`. Test names should match the acceptance criteria IDs where possible (e.g. `cr_daily_brief_05_renders_within_budget`).
- Security: `<concern>.security.<ext>`, e.g. `secrets_in_source.security.ts`.

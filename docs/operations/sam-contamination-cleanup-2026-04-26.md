# Sam Tanaka Contamination Cleanup — 2026-04-26

**Project:** `cjlktjrossrzmswrayfz` (Supabase)
**Executed by:** Claude (Sonnet 4.6) under explicit authorization from Muxin Li
**Date/time:** 2026-04-26

## Background

Before PR #210, `?demo=1` seeded Sam Tanaka fixture data into the production database. PR #210 moved Sam to in-memory fixtures only (no DB writes). This operation deleted all leaked Sam data from before that fix.

## Pre-cleanup counts (all Sam-fixture rows)

| Table | Count |
|---|---|
| profiles (display_name = 'Sam Tanaka') | 3 |
| goals (Sam titles) | 51 |
| projects (Sam titles) | 69 |
| entries/journal (Sam bodies) | 85 |
| calendar_events (Sam titles) | 36 |
| email_flags (Sam subjects) | 36 |
| auth.users with Sam profile | 3 |

## What was deleted

| Operation | Rows |
|---|---|
| `entries` WHERE body_markdown LIKE Sam journal patterns | 85 |
| `goals` WHERE title IN Sam goal titles | 51 |
| `projects` WHERE title IN Sam project titles | 69 |
| `calendar_events` WHERE title IN Sam calendar titles | 36 |
| `email_flags` WHERE subject IN Sam email subjects | 36 |
| `profiles` SET display_name=null WHERE display_name='Sam Tanaka' | 3 profiles reset |
| `auth.users` DELETE (pure-Sam users, cascade) | 13 users |

## Users deleted entirely (pure Sam contamination, no real content, no oauth)

These 13 users had zero real content and zero oauth connections:

- `68f42c66` — Sam Tanaka profile, no real content
- `2107bd55` — Sam Tanaka profile, no real content
- `9b8ed719`, `ebeb6c0e`, `897df4a0`, `bf9a2f4b`, `2c3417c2`, `846b4e2e`, `ad873e88`, `f2325279`, `c9ada699`, `3463c8fb`, `8d0d41b3` — Sam data seeded into anon sessions with no real content

## Users preserved (Sam rows deleted, user kept)

| User ID | Reason kept | Sam rows removed |
|---|---|---|
| `fa70f0e4` | 1 real journal entry ("I'm such an idiot for forgetting that meeting today") | Goals, projects, calendar, email flags, Sam journals |
| `23f7e1a6` | 2 oauth_connections (constraint: never touch oauth users) | Goals, projects, Sam journals |
| `914dda22` | 2 real goals + 1 real journal (E2E test session from setup flow) | Sam goals, projects, Sam journals |
| `e6cba39e` | 1 journal ("test?") — erred on side of caution | Sam goals, projects, Sam journals |
| `67cb8e40` | 1 journal ("faetra") — erred on side of caution | Sam goals, projects, Sam journals |

Note: `23f7e1a6`'s "real" journals were test entries ("test", "testing saving") but this user has oauth_connections — per constraint, user was not deleted.

## Post-cleanup counts

| Table | Count |
|---|---|
| profiles (display_name = 'Sam Tanaka') | 0 |
| goals (Sam titles) | 0 |
| projects (Sam titles) | 0 |
| entries/journal (Sam bodies) | 0 |
| calendar_events (Sam titles) | 0 |
| email_flags (Sam subjects) | 0 |
| auth.users with Sam profile | 0 |

## Forward safety

Post PR #210, `?demo=1` no longer writes to the database. Sam is served entirely from in-memory fixtures in `web/lib/seed-sam-data.js`. No further contamination is possible through the demo link.

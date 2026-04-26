# reminders — voice-to-reminder + due-query (Edge Function)

Supabase Edge Function that turns a voice transcript ("remind me to call the dentist Tuesday") into a structured row in `public.reminders`, and exposes a read endpoint for daily-brief input assembly.

## Why this layer exists

The hero button captures a voice transcript from the user. The transcript needs:

1. Classification — is this actually a reminder, and what's the date? (Claude Haiku 4.5).
2. A durable home — a Supabase row, not an MA memory blob, because "what surfaces this morning" needs exact date filtering.

The Anthropic API key can't live in the browser bundle, so this function holds the key. Writes go through PostgREST as the authenticated user (JWT passthrough) so the `reminders` RLS policy from migration 0003 attributes each row to the actual caller. Same Anthropic-shield pattern as `ma-proxy`; the auth model is owner-scoped (no service-role writes).

## Auth

Both endpoints require `Authorization: Bearer <user-jwt>` (the Supabase session token). Without it the function returns 401. The JWT is forwarded to PostgREST so `auth.uid()` drives RLS — there is no service-role write fallback.

## Endpoints

### `POST /functions/v1/reminders/classify-and-store`

```
Content-Type: application/json
Authorization: Bearer <supabase-session-jwt>

{ "transcript": "remind me to send Zane a thank-you note tomorrow", "today": "2026-04-25" }
```

`today` is optional — pass the user's local date as `YYYY-MM-DD` so "tomorrow" / "Tuesday" resolve in the user's timezone. Falls back to server UTC date when absent (degraded but functional for non-frontend callers).

Success (classified):

```json
{
  "classified": true,
  "reminder": {
    "id": "...",
    "user_id": "...",
    "text": "Send Zane a thank-you note",
    "remind_on": "2026-04-25",
    "status": "pending",
    "created_at": "2026-04-24T...",
    "surfaced_at": null
  }
}
```

Success (not a reminder):

```json
{ "classified": false, "reason": "no date given or implied" }
```

### `GET /functions/v1/reminders/due?date=YYYY-MM-DD`

```
Authorization: Bearer <supabase-session-jwt>
```

Returns pending reminders where `remind_on <= date` *for the authenticated user* (RLS scopes the result set automatically). Omit `date` to default to server UTC.

```json
{
  "date": "2026-04-24",
  "reminders": [
    { "id": "...", "text": "Send thank-you note to Zane", "remind_on": "2026-04-24", "status": "pending", "created_at": "..." }
  ]
}
```

## V1 tradeoffs

- **No retry on classification.** If Anthropic returns invalid JSON, we fall back to `{classified: false, reason: "..."}` instead of retrying. Keeps the demo snappy.
- **`today` optional, server-UTC fallback.** Frontend currently passes `today` from the user's local date so the prompt resolves "tomorrow" correctly. Non-frontend callers that don't pass it get UTC date — fine for a curl smoke test, off-by-one for any user west of UTC during evening hours.
- **Seed SQL still uses legacy pattern.** `supabase/seeds/reminders.sql` attributes rows to "first user in auth.users" — a vestige of the pre-JWT shortcut. Demo-only fixture data; refresh when seed data gets regenerated.

## Deploy

From the repo root:

```bash
supabase db push                         # applies migration 0003_reminders.sql
supabase functions deploy reminders      # deploys this function
```

Optional — populate demo rows (requires at least one row in `auth.users`):

```bash
supabase db reset                        # runs migrations + ./seeds/*.sql
# OR
psql "$DB_URL" -f supabase/seeds/reminders.sql
```

Shared-infra writes (Muxin-only per `CLAUDE.md` § Non-functional requirements).

## Set secrets

The function reads:

- `ANTHROPIC_API_KEY` — already set if `ma-proxy` works; reused.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — auto-injected by Supabase into every Edge Function. The anon key is used as the `apikey` header for PostgREST; the user's JWT (forwarded from the request) goes in `Authorization: Bearer ...`. **The service-role key is intentionally not used** — that path bypassed RLS and silently filed rows under the wrong owner.

If `ANTHROPIC_API_KEY` isn't set yet:

```bash
supabase secrets set ANTHROPIC_API_KEY=<value-from-bitwarden>
```

## Smoke test

```bash
# Replace with your session JWT (grab from a logged-in browser via
# `supabase.auth.getSession()` in the console, or from the network tab).
JWT="<paste-supabase-session-jwt>"

# Classify + store
curl -X POST \
  "https://<project-ref>.supabase.co/functions/v1/reminders/classify-and-store" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"transcript":"remind me to water the plants on Friday","today":"2026-04-25"}'

# Due today
curl -H "Authorization: Bearer $JWT" \
  "https://<project-ref>.supabase.co/functions/v1/reminders/due"

# Due by a specific date
curl -H "Authorization: Bearer $JWT" \
  "https://<project-ref>.supabase.co/functions/v1/reminders/due?date=2026-04-30"

# Sanity: missing JWT returns 401
curl -X POST \
  "https://<project-ref>.supabase.co/functions/v1/reminders/classify-and-store" \
  -H "Content-Type: application/json" \
  -d '{"transcript":"remind me on Friday"}'
# → HTTP/2 401 — { "error": { "message": "missing or malformed Authorization header — ..." } }
```

## CORS

`Access-Control-Allow-Origin: *` for hackathon iteration speed. Lock down to the deployed web origin post-hackathon (mirrors ma-proxy TODO).

## Related

- `supabase/migrations/0003_reminders.sql` — table + RLS.
- `supabase/seeds/reminders.sql` — demo rows.
- `supabase/functions/ma-proxy/` — style reference and shared CORS/error-shape conventions.

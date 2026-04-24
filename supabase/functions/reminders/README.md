# reminders — voice-to-reminder + due-query (Edge Function)

Supabase Edge Function that turns a voice transcript ("remind me to call the dentist Tuesday") into a structured row in `public.reminders`, and exposes a read endpoint for daily-brief input assembly.

## Why this layer exists

The hero button captures a voice transcript from the user. The transcript needs:

1. Classification — is this actually a reminder, and what's the date? (Claude Haiku 4.5).
2. A durable home — a Supabase row, not an MA memory blob, because "what surfaces this morning" needs exact date filtering.

The Anthropic API key can't live in the browser bundle, so this function holds the key and also writes the row server-side using the service role. Same shield pattern as `ma-proxy`.

## Endpoints

### `POST /functions/v1/reminders/classify-and-store`

```
Content-Type: application/json

{ "transcript": "remind me to send Zane a thank-you note tomorrow" }
```

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

Returns pending reminders where `remind_on <= date`. Omit `date` to default to today (server UTC).

```json
{
  "date": "2026-04-24",
  "reminders": [
    { "id": "...", "text": "Send thank-you note to Zane", "remind_on": "2026-04-24", "status": "pending", "created_at": "..." }
  ]
}
```

## V1 tradeoffs

- **Service-role write bypass.** Every reminder is attributed to the first user in `auth.users` (matches `supabase/seeds/reminders.sql`). This is a hackathon-only shortcut because the web client isn't passing JWTs yet. The RLS policy on `public.reminders` is already owner-scoped — when multi-user lands, swap to JWT passthrough and drop the service-role write.
- **Server-UTC "today".** Classification uses the server date, not the user's profile timezone. For a single user dogfooding in one timezone this is fine; post-hackathon we resolve against `profiles.timezone`.
- **No retry on classification.** If Anthropic returns invalid JSON, we fall back to `{classified: false, reason: "..."}` instead of retrying. Keeps the demo snappy.

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
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by Supabase into every Edge Function. No action needed.

If `ANTHROPIC_API_KEY` isn't set yet:

```bash
supabase secrets set ANTHROPIC_API_KEY=<value-from-bitwarden>
```

## Smoke test

```bash
# Classify + store
curl -X POST \
  "https://<project-ref>.supabase.co/functions/v1/reminders/classify-and-store" \
  -H "Content-Type: application/json" \
  -d '{"transcript":"remind me to water the plants on Friday"}'

# Due today
curl "https://<project-ref>.supabase.co/functions/v1/reminders/due"

# Due by a specific date
curl "https://<project-ref>.supabase.co/functions/v1/reminders/due?date=2026-04-30"
```

## CORS

`Access-Control-Allow-Origin: *` for hackathon iteration speed. Lock down to the deployed web origin post-hackathon (mirrors ma-proxy TODO).

## Related

- `supabase/migrations/0003_reminders.sql` — table + RLS.
- `supabase/seeds/reminders.sql` — demo rows.
- `supabase/functions/ma-proxy/` — style reference and shared CORS/error-shape conventions.

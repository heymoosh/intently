-- 0008_oauth_connections.sql — per-user OAuth connection records + idempotency
-- indexes for calendar_events / email_flags.
--
-- Why this exists:
--   Migration 0006 stubbed `calendar_events` and `email_flags` for the brief
--   to read. Real OAuth-backed sync now needs:
--     1. Per-user connection state — which provider is connected, when last
--        synced, where the refresh token lives. The token itself is stored
--        in Supabase Vault (encrypted at rest by Supabase); we keep only the
--        Vault secret_id reference here, so reading this table never exposes
--        the token, and the row-level policy alone decides who can resolve
--        the secret.
--     2. Idempotent upsert keys for the row tables. The handoff specifies
--        `google_event_id` / `gmail_message_id` for idempotency; the existing
--        schema discriminates with `source` + `external_id`, so the unique
--        key is `(user_id, source, external_id) where external_id is not null`.
--        This lets sync functions `upsert(..., on_conflict='user_id,source,external_id')`
--        without a column rename.
--
-- Vault notes:
--   `vault.create_secret(text, text)` returns a uuid; `vault.decrypted_secrets`
--   is the read view (privileged). Edge Functions call vault via the
--   service-role key; the browser never touches it. We store the Vault uuid
--   in `vault_secret_id` (no FK because vault.* is in a different schema and
--   not directly referenceable from public; rely on transactional discipline
--   in the Edge Function instead).
--
-- Single-user-V1 RLS pattern matches 0001/0003/0004/0005/0006.

set search_path = public;

-- 1. oauth_connections -------------------------------------------------------

create table public.oauth_connections (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  provider          text not null
                      check (provider in ('google_calendar', 'google_gmail')),
  vault_secret_id   uuid,                    -- pointer into vault.secrets; null when revoked
  scopes            text[] not null default '{}'::text[],
  connected_at      timestamptz not null default now(),
  last_synced_at    timestamptz,
  revoked_at        timestamptz,
  -- One live row per (user, provider). On disconnect we either delete or
  -- set revoked_at; either way the partial unique index keeps reconnect
  -- clean.
  unique (user_id, provider)
);

create index oauth_connections_user_idx
  on public.oauth_connections (user_id);

-- 2. Idempotency unique indexes ---------------------------------------------
-- Calendar: (user_id, source, external_id). Partial — only enforced when
-- external_id is present (seed/manual rows can leave external_id null and
-- not collide).
create unique index calendar_events_user_source_external_uniq
  on public.calendar_events (user_id, source, external_id)
  where external_id is not null;

-- Email: same pattern.
create unique index email_flags_user_source_external_uniq
  on public.email_flags (user_id, source, external_id)
  where external_id is not null;

-- Row-level security ---------------------------------------------------------

alter table public.oauth_connections enable row level security;

create policy oauth_connections_owner on public.oauth_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Vault passthrough RPC ---------------------------------------------------
-- The vault schema is privileged; PostgREST exposes it only via Accept-Profile
-- + service-role key. To keep the Edge Function code simple and platform-
-- portable, we expose two SECURITY DEFINER passthroughs in `public` so the
-- function can call them through the standard /rest/v1/rpc/ path with the
-- service-role key.
--
-- Critical: these are NOT granted to anon or authenticated; only the
-- service_role can call them. The Edge Function runs with the service-role
-- key; the browser cannot reach these.

create or replace function public.create_secret_passthrough(
  secret text,
  name   text
) returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  new_id uuid;
begin
  select vault.create_secret(secret, name) into new_id;
  return new_id;
end;
$$;

revoke all on function public.create_secret_passthrough(text, text) from public, anon, authenticated;
grant execute on function public.create_secret_passthrough(text, text) to service_role;

create or replace function public.read_secret_passthrough(
  secret_id uuid
) returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  decrypted text;
begin
  select decrypted_secret from vault.decrypted_secrets where id = secret_id into decrypted;
  return decrypted;
end;
$$;

revoke all on function public.read_secret_passthrough(uuid) from public, anon, authenticated;
grant execute on function public.read_secret_passthrough(uuid) to service_role;

create or replace function public.delete_secret_passthrough(
  secret_id uuid
) returns void
language plpgsql
security definer
set search_path = public, vault
as $$
begin
  delete from vault.secrets where id = secret_id;
end;
$$;

revoke all on function public.delete_secret_passthrough(uuid) from public, anon, authenticated;
grant execute on function public.delete_secret_passthrough(uuid) to service_role;

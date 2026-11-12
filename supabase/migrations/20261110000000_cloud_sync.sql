-- Cloud sync: an opt-in, one-way copy of a user's sessions so assistants (Claude, ChatGPT,
-- Instinct, ...) can read them through the ascend-mcp edge function. The phone stays the source
-- of truth. Each install signs in as a Supabase anonymous user; rows are keyed on auth.uid() so a
-- later upgrade to a real login keeps them.

create table if not exists public.cloud_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null check (char_length(session_id) between 1 and 64),
  type text not null check (type in ('climb', 'strength')),
  status text not null check (status in ('completed', 'abandoned', 'deleted')),
  started_at timestamptz not null,
  completed_at timestamptz,
  gym_name text check (char_length(gym_name) <= 120),
  title text check (char_length(title) <= 200),
  notes text check (char_length(notes) <= 5000),
  -- Derived on the phone (climbs / sets / totals) so the server never replays events.
  summary jsonb not null,
  -- The raw event log, kept as a backup.
  events jsonb not null default '[]'::jsonb,
  app_version text check (char_length(app_version) <= 40),
  updated_at timestamptz not null default now(),
  primary key (user_id, session_id),
  check (octet_length(summary::text) <= 512000),
  check (octet_length(events::text) <= 1048576)
);

create index if not exists cloud_sessions_user_started on public.cloud_sessions (user_id, started_at desc);

alter table public.cloud_sessions enable row level security;

create policy "own sessions: select" on public.cloud_sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own sessions: insert" on public.cloud_sessions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own sessions: update" on public.cloud_sessions
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table if not exists public.cloud_bodyweight (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  weight_kg real not null check (weight_kg > 0 and weight_kg < 500),
  logged_at timestamptz not null,
  primary key (user_id, id)
);

alter table public.cloud_bodyweight enable row level security;

create policy "own bodyweight: select" on public.cloud_bodyweight
  for select to authenticated using (user_id = (select auth.uid()));

-- Replaces the caller's whole bodyweight list in one transaction (logs can be deleted on-device).
create or replace function public.replace_my_bodyweight(p_logs jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if jsonb_typeof(p_logs) <> 'array' or jsonb_array_length(p_logs) > 5000 then
    raise exception 'bad payload';
  end if;
  delete from public.cloud_bodyweight where user_id = uid;
  insert into public.cloud_bodyweight (user_id, id, weight_kg, logged_at)
  select uid, l->>'id', (l->>'weightKg')::real, to_timestamp((l->>'loggedAt')::bigint / 1000.0)
  from jsonb_array_elements(p_logs) as l;
end;
$$;

-- Connector tokens: the secret in an assistant's connector URL. Only hashes are stored.
create schema if not exists private;

create table if not exists private.connector_tokens (
  token_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz
);

create index if not exists connector_tokens_user on private.connector_tokens (user_id);

-- Revokes the caller's live token and returns a new one. The plaintext is only ever returned here.
create or replace function public.rotate_connector_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  token text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  update private.connector_tokens set revoked_at = now() where user_id = uid and revoked_at is null;
  token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into private.connector_tokens (token_hash, user_id)
  values (encode(extensions.digest(token, 'sha256'), 'hex'), uid);
  return token;
end;
$$;

create or replace function public.revoke_connector_token()
returns void
language sql
security definer
set search_path = ''
as $$
  update private.connector_tokens set revoked_at = now()
  where user_id = auth.uid() and revoked_at is null;
$$;

-- Removes everything the caller has in the cloud: sessions, bodyweight and tokens.
create or replace function public.delete_my_cloud_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from public.cloud_sessions where user_id = uid;
  delete from public.cloud_bodyweight where user_id = uid;
  delete from private.connector_tokens where user_id = uid;
end;
$$;

-- Used by the ascend-mcp edge function (service role only): token -> user id, or null.
create or replace function public.connector_user(p_token text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  update private.connector_tokens set last_used_at = now()
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and revoked_at is null
  returning user_id;
$$;

revoke all on function public.replace_my_bodyweight(jsonb) from public, anon;
revoke all on function public.rotate_connector_token() from public, anon;
revoke all on function public.revoke_connector_token() from public, anon;
revoke all on function public.delete_my_cloud_data() from public, anon;
revoke all on function public.connector_user(text) from public, anon, authenticated;
grant execute on function public.replace_my_bodyweight(jsonb) to authenticated;
grant execute on function public.rotate_connector_token() to authenticated;
grant execute on function public.revoke_connector_token() to authenticated;
grant execute on function public.delete_my_cloud_data() to authenticated;
grant execute on function public.connector_user(text) to service_role;

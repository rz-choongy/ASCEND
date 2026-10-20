-- Bug report inbox for the triage/fix agent.
-- The app inserts with the publishable key; it can never read reports back. Everything the
-- triage side decides (status, classification, PR link) is server-owned: the insert trigger
-- resets those columns, so a client can't file a report that's pre-marked as triaged.

create schema if not exists private;

-- Installs whose reports skip the bug-vs-feature-request check. Lives in `private`, which
-- PostgREST doesn't expose, so the list is invisible to the app. Add rows from the SQL editor:
--   insert into private.owner_installs (install_id, note) values ('<id from a report>', 'Ryan phone');
create table if not exists private.owner_installs (
  install_id text primary key,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null check (source in ('user', 'crash', 'scanner')),
  install_id text not null check (char_length(install_id) <= 64),
  is_owner boolean not null default false,
  description text not null check (char_length(description) between 1 and 5000),
  app_version text check (char_length(app_version) <= 32),
  diagnostics jsonb not null default '{}'::jsonb check (pg_column_size(diagnostics) <= 8192),
  screenshot_path text check (char_length(screenshot_path) <= 128),
  -- Triage lifecycle (server-owned):
  --   new -> triaging -> needs_info | feature_request | not_a_bug | duplicate
  --                   -> reproduced -> fix_proposed (PR open, proof attached) -> fixed
  status text not null default 'new' check (status in (
    'new', 'triaging', 'needs_info', 'feature_request', 'not_a_bug', 'duplicate',
    'reproduced', 'fix_proposed', 'fixed', 'wont_fix'
  )),
  classification text check (classification in ('bug', 'feature_request', 'not_a_bug', 'duplicate')),
  triage_notes text,
  proof jsonb,            -- { repro: {test, before}, fix: {test, after, suite} }
  duplicate_of uuid references public.bug_reports (id),
  pr_url text
);

create index if not exists bug_reports_status_idx on public.bug_reports (status, created_at);

create or replace function private.bug_reports_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.is_owner := exists (select 1 from private.owner_installs o where o.install_id = new.install_id);
  new.created_at := now();
  new.updated_at := now();
  new.status := 'new';
  new.classification := null;
  new.triage_notes := null;
  new.proof := null;
  new.duplicate_of := null;
  new.pr_url := null;
  return new;
end;
$$;

drop trigger if exists bug_reports_on_insert on public.bug_reports;
create trigger bug_reports_on_insert
  before insert on public.bug_reports
  for each row execute function private.bug_reports_on_insert();

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bug_reports_touch on public.bug_reports;
create trigger bug_reports_touch
  before update on public.bug_reports
  for each row execute function private.touch_updated_at();

alter table public.bug_reports enable row level security;

-- Insert-only for the app. No select/update/delete policies: the triage agent uses the
-- service role (or the SQL editor), which bypasses RLS.
revoke all on public.bug_reports from anon, authenticated;
grant insert on public.bug_reports to anon, authenticated;

drop policy if exists "app can file reports" on public.bug_reports;
create policy "app can file reports" on public.bug_reports
  for insert to anon, authenticated
  with check (true);

-- Screenshots: private bucket, insert-only, one flat file per report id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bug-screenshots', 'bug-screenshots', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "app can upload bug screenshots" on storage.objects;
create policy "app can upload bug screenshots" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'bug-screenshots'
    and name ~ '^[0-9a-f-]{36}\.(jpg|png)$'
  );

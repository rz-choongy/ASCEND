-- Shared gym logo directory: when one climber sets a gym's logo, everyone else's app finds it
-- by the gym's name instead of searching again. Each install casts one vote per gym name
-- (name_key, the name minus words like "climbing" and with numbers as digits). The app never
-- touches the table directly: it calls submit_gym_logo and gym_logo_lookup below.

create table if not exists public.gym_logo_votes (
  name_key text not null check (char_length(name_key) between 1 and 80),
  install_id text not null check (char_length(install_id) between 8 and 64),
  gym_name text not null check (char_length(gym_name) between 1 and 80),
  -- Exactly one of: the website whose icon is the logo, or a photo in the gym-logos bucket.
  domain text check (domain ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$' and char_length(domain) <= 100),
  image_path text check (image_path ~ '^[0-9a-f-]{36}\.(jpg|png)$'),
  -- Picked by a person in the gym editor, or matched by the app on its own (counts for less).
  picked boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (name_key, install_id),
  check ((domain is null) <> (image_path is null))
);

alter table public.gym_logo_votes enable row level security;
-- No policies: anon and authenticated can't read or write the table, only call the functions.

create or replace function public.submit_gym_logo(
  p_install_id text,
  p_name_key text,
  p_gym_name text,
  p_domain text default null,
  p_image_path text default null,
  p_picked boolean default true
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A photo vote must point at a file that was really uploaded.
  if p_image_path is not null and not exists (
    select 1 from storage.objects where bucket_id = 'gym-logos' and name = p_image_path
  ) then
    raise exception 'unknown image';
  end if;

  insert into public.gym_logo_votes (name_key, install_id, gym_name, domain, image_path, picked, updated_at)
  values (lower(p_name_key), p_install_id, p_gym_name, lower(p_domain), p_image_path, p_picked, now())
  on conflict (name_key, install_id) do update
    set gym_name = excluded.gym_name,
        domain = excluded.domain,
        image_path = excluded.image_path,
        picked = excluded.picked,
        updated_at = now()
    -- An automatic match never overwrites this install's own pick.
    where public.gym_logo_votes.picked = false or excluded.picked = true;
end;
$$;

-- The winning logo per name: most votes (a pick counts 3, an automatic match 1), newest on a tie.
create or replace function public.gym_logo_lookup(p_name_keys text[])
returns table (name_key text, domain text, image_path text, votes integer)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct on (v.name_key) v.name_key, v.domain, v.image_path, v.votes
  from (
    select name_key, domain, image_path,
           sum(case when picked then 3 else 1 end)::integer as votes,
           max(updated_at) as latest
    from public.gym_logo_votes
    where name_key = any (select lower(k) from unnest(p_name_keys[1:50]) as k)
    group by name_key, domain, image_path
  ) v
  order by v.name_key, v.votes desc, v.latest desc;
$$;

revoke all on function public.submit_gym_logo(text, text, text, text, text, boolean) from public;
revoke all on function public.gym_logo_lookup(text[]) from public;
grant execute on function public.submit_gym_logo(text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.gym_logo_lookup(text[]) to anon, authenticated;

-- Logo photos: public to read (they're logos), uploadable but not overwritable by the app.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gym-logos', 'gym-logos', true, 524288, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = 524288, allowed_mime_types = array['image/jpeg', 'image/png'];

drop policy if exists "app can upload gym logos" on storage.objects;
create policy "app can upload gym logos" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'gym-logos' and name ~ '^[0-9a-f-]{36}\.(jpg|png)$');

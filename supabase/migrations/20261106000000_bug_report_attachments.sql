-- Bug reports can carry several screenshots and short screen recordings.
-- attachment_paths lists every file for a report; screenshot_path stays as the first image so
-- older triage tooling keeps working. Files are named <report id>-<n>.<ext> in the same bucket.

alter table public.bug_reports
  add column if not exists attachment_paths text[] not null default '{}'
    check (cardinality(attachment_paths) <= 6);

-- 50 MB is the project's global upload cap; videos are checked against it on the device too.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime', 'video/webm']
where id = 'bug-screenshots';

drop policy if exists "app can upload bug screenshots" on storage.objects;
create policy "app can upload bug screenshots" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'bug-screenshots'
    and name ~ '^[0-9a-f-]{36}(-[0-9])?\.(jpg|png|mp4|mov|webm)$'
  );

# Supabase (bug report inbox, gym logo directory)

Used for bug reports and the shared gym logo directory. App data stays on-device.

- `migrations/20261020000000_bug_reports.sql`: `public.bug_reports` (insert-only for the app),
  `private.owner_installs`, and the private `bug-screenshots` bucket.
- `migrations/20261106000000_bug_report_attachments.sql`: `attachment_paths` (up to 6 files per
  report, named `<id>-<n>.<ext>`), and videos (mp4/mov/webm, 50 MB) in the same bucket.
  `screenshot_path` still holds the first image for older tooling.
- `migrations/20261109000000_gym_logo_directory.sql`: `public.gym_logo_votes` (no direct
  access; the app calls `submit_gym_logo` and `gym_logo_lookup`), and the public `gym-logos`
  bucket for logo photos (insert-only, jpg/png, 512 KB). One vote per install per gym name key;
  a pick in the gym editor counts 3, an automatic match 1.
- The app needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (publishable key) in
  `.env.local` and as EAS environment variables. Without them, reports fall back to email.
- Mark an install as the owner's (skips the bug-vs-feature check) from the SQL editor, using the
  `Install` line of one of your own reports:
  `insert into private.owner_installs (install_id, note) values ('<install id>', 'Ryan');`

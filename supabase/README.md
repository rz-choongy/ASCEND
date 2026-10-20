# Supabase (bug report inbox)

Only used for bug reports in v1. App data stays on-device.

- `migrations/20261020000000_bug_reports.sql`: `public.bug_reports` (insert-only for the app),
  `private.owner_installs`, and the private `bug-screenshots` bucket.
- The app needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (publishable key) in
  `.env.local` and as EAS environment variables. Without them, reports fall back to email.
- Mark an install as the owner's (skips the bug-vs-feature check) from the SQL editor, using the
  `Install` line of one of your own reports:
  `insert into private.owner_installs (install_id, note) values ('<install id>', 'Ryan');`

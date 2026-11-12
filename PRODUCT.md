# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users
Ryan and a small group of climbing friends. Indoor boulderers who also strength train for climbing. They use the app mid-session in a loud, bright gym, often with chalk on their hands, between attempts or between sets. They already know the app; no public launch is planned.

## Product Purpose
A climbing-first training log. Quick-log a climbing session (grades sent, flashed, attempted) or a gym session (sets, reps, weight), see every session on a calendar, and read basic progress (grade trend, grade pyramid, strength volume, records, bodyweight). Success: logging a climb or a set takes seconds and a few taps, and the history is trustworthy enough to train from.

## Positioning
A personal training journal that understands how gyms actually grade: colour or number circuits mapped to V ranges per gym, alongside V-grade gyms, with climbing and strength in one log. Not a social app and not a route database.

## Operating Context
- Logged between attempts or sets, one-handed, glanced at for seconds.
- Multiple gyms, each with its own grading scale (V grades or colour/number labels mapped to V ranges).
- Gym routines: saved exercise lists with target sets × reps.
- Optional Kilter Board import.
- Live ongoing notification while a session is open; hourly "still climbing?" reminder.
- In-app bug reports go to a Supabase inbox.
- Builds ship to Google Play internal testing.

## Capabilities and Constraints
- Expo 54 / React Native 0.81, TypeScript. Local-first SQLite, event-sourced (append-only events; corrections are new events).
- Works fully offline. Planned: optional, opt-in cloud sync in Settings (Supabase, magic-link sign-in), never forced. Read access for Claude via that synced data.
- Out of scope: rest/interval timers between climbs, post-session summary/confirmation screens, gamification (streak UI, badges, confetti), weekly planners, climbing routines.
- Logging must take minimal taps; defaults reduce typing; no multi-step flows unless necessary.

## Brand Commitments
- Name: ASCEND.
- The user-selectable accent colour in Settings stays.
- Everything else about the current look (dark default, grade palette, iOS styling) is open.

## Evidence on Hand
- Real session data lives on users' phones only; none in the repo.
- Reference mockups in `Design/` (finish screen, analytics, hangboard, rest timer, strength logger, routine library).
- No testimonials, user counts, or brand guide. Do not invent them.

## Product Principles
1. Speed over completeness: every screen serves the next log.
2. The phone is the source of truth; nothing depends on a network.
3. Numbers are the content; chrome stays out of the way.
4. Honest progress, no hype: show what happened, never celebrate it.
5. Respect each gym's own grading language.

## Accessibility & Inclusion
Readable at arm's length in bright light; large tap targets for chalky fingers.

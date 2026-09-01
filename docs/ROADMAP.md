# ASCEND Feature Roadmap

Legend: ✅ Done · 🔄 In Progress · 🔜 Next · 📋 Planned · 💭 Considering · ❌ Out of Scope

---

## Mode 1 — Core Logging (COMPLETE ✅)

| Feature | Status | Notes |
|---------|--------|-------|
| SQLite event store + migrations | ✅ | Append-only, event-sourced |
| Domain types + stores | ✅ | sessionStore, gymStore, exerciseStore |
| React Navigation (tabs + stack) | ✅ | Log tab, Calendar tab |
| LogScreen — today's sessions + CTAs | ✅ | useFocusEffect, gym selector |
| ClimbSessionScreen — grade logging | ✅ | Grade grid, SEND/FLASH, undo |
| StrengthSessionScreen — set logging | ✅ | Exercise picker, set log, undo |
| GymSelectScreen + GymEditScreen | ✅ | Multi-gym, custom grades |
| SessionHistoryScreen | ✅ | Edit/delete climbs + sets, notes |
| CalendarScreen — monthly view | ✅ | Session dots, day detail |
| Design tokens (colours, typography, spacing) | ✅ | `src/ui/tokens/` |

---

## Mode 1 Polish — In Progress 🔄

| Feature | Status | Notes |
|---------|--------|-------|
| CalendarScreen month nav limits | 🔄 | Cap prev at 12 months, disable future |
| CalendarScreen reset to today on focus | 🔄 | selectedDate stale bug |
| GymSelectScreen empty state | 🔄 | "No gyms yet" message |
| SessionHistoryScreen grade chips in edit | 🔄 | Inconsistent fallback to TextInput |
| DESIGN.md design brief | ✅ | Done |
| ROADMAP.md | ✅ | This file |
| CLAUDE.md Current Focus update | 🔄 | Stale at Step 4 |

---

## Mode 2 — Cloud + UI Upgrade 🔜

### 2a — Supabase Sync (Priority)

| Feature | Status | Notes |
|---------|--------|-------|
| Supabase project setup | 🔜 | Tables mirror SQLite schema |
| Auth — email + magic link | 🔜 | Single user to start |
| RLS policies | 🔜 | `auth.uid() = user_id` on all tables |
| Sync engine — events table | 🔜 | Append-only upload, merge on pull |
| Conflict resolution | 🔜 | Last-write-wins on non-events; events never conflict (append-only) |
| Offline-first guarantee | 🔜 | Local always works, sync in background |

### 2b — UI Upgrade

| Feature | Status | Notes |
|---------|--------|-------|
| Refined grade tile grid | 📋 | Better layout on small/large screens |
| Session card redesign | 📋 | Richer data at a glance |
| Animated grade selection feedback | 📋 | Subtle press/select animation |
| Empty state illustrations | 📋 | Or keep text-only (stay minimal) |
| Haptic feedback on log actions | 📋 | SEND, FLASH, set logged |
| Pull-to-refresh on list screens | 📋 | Visual cue for sync state |
| Sync status indicator | 📋 | Subtle icon showing last sync time |

---

## Mode 3 — Progress + Analytics 📋

| Feature | Status | Notes |
|---------|--------|-------|
| Climbing progress — grade trend line | 📋 | Hardest send over time |
| Climbing volume — grade bucket chart | 📋 | Stacked bar, per session or weekly |
| Strength volume — total kg per session | 📋 | Simple trend, not complex |
| Session frequency chart | 📋 | Climbing vs strength split |
| Personal records | 📋 | Heaviest set, hardest grade |
| Grade distribution per session | 📋 | Data model already supports this |

Schema: No new tables needed — all derivable from events.

---

## Mode 4 — Planner 💭

| Feature | Status | Notes |
|---------|--------|-------|
| Week view planner | 💭 | Planned sessions by day |
| Session templates | 💭 | Snapshot of exercises + target grades |
| Template library | 💭 | Reusable workout plans |
| Planned vs actual comparison | 💭 | Did you hit your targets? |

Schema: Requires new `plans` and `plan_sessions` tables.

---

## Mode 5 — Social / Multi-user 💭

| Feature | Status | Notes |
|---------|--------|-------|
| Shareable session links | 💭 | Read-only session URLs |
| Gym leaderboard | 💭 | Optional, opt-in |
| Friend activity feed | 💭 | Requires Supabase Realtime |

Deferred to post-v2. Requires full auth + profile model.

---

## Release Milestones

| Milestone | Includes | Target |
|-----------|----------|--------|
| v1.0 TestFlight | Mode 1 complete + polish | Now |
| v1.1 | Mode 1 polish done, DESIGN.md applied | Soon |
| v2.0 | Supabase sync + Auth + UI upgrade | Mode 2 |
| v2.5 | Progress charts | Mode 3 |
| v3.0 | Planner | Mode 4 |

---

## Decisions Made

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| Local storage | SQLite (keep) | Offline-first. Supabase is sync layer only, not replacement. |
| Auth | Email + magic link | Simplest, no OAuth complexity for solo user |
| Google Calendar | ❌ No | App has its own calendar. Adds OAuth dep with low payoff. Session planning belongs in the Planner (Mode 4), not Google Calendar. |
| Timers | ❌ Out of scope | Mode 1 rule. May reconsider for Mode 4 (rest timer for strength). |
| Analytics | Mode 3 | All data is there. UI deferred until core logging is solid. |
| Social | Mode 5+ | No rush. Need solid local product first. |

---

## Out of Scope (v1 Rules — Do Not Add)

- Session timers, rest timers
- Summary/confirmation screens after finishing a session
- Analytics dashboards in Mode 1
- Planner, routine library
- Platform-specific code (`Platform.OS`)
- Backend in v1 (Supabase is Mode 2)

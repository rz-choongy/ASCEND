# Product
Climbing + gym workout tracking app

# Current Phase
Mode 1 only (quick session logging + calendar)

# Decision State
PARTIAL REBUILD — keep foundation (SQLite/event store, domain types, design tokens, UI components), delete product layer (timers, planner, analytics, summary screens).

---

# Core Principle
The app must be optimised for fast daily logging.

---

# Platform
- Target: iOS + Android (cross-platform via Expo)
- No platform-specific code unless absolutely forced
- Every `Platform.OS` check is tech debt — minimise
- Test against whichever device you own; Expo Go handles both

---

# UX Rules
- Logging must take minimal taps
- Default values should reduce typing
- No multi-step flows unless necessary
- Prioritise speed over flexibility

---

# Engineering Rules
- One feature at a time
- Keep data model minimal but extensible
- Avoid premature abstraction
- Refactor only when necessary

---

# Workflow Rules
- Always run plan mode before structural changes
- Validate UX with real usage, not assumptions
- If something feels complex, simplify immediately

---

# Current Focus
Build Mode 1 MVP:
- Log gym session
- Log climbing session
- Calendar view of all sessions

---

# Mode 1 Architecture
- Navigation: React Navigation (native-stack + bottom-tabs)
- Two tabs: Log | Calendar
- No analytics, no planner, no timers, no summary detour screens
- Backend: local SQLite only (Supabase sync deferred to v2)
- State: React hooks + synchronous domain stores over SQLite

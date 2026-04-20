# About This Project
Climbing + gym workout tracking app for indoor boulderers. Mode 1: quick-log a climbing or gym session, view all sessions on a calendar. Local-first, no backend in v1. Built with Expo (React Native + TypeScript).

# Stack
- **Framework**: Expo 54 / React Native 0.81 / React 19
- **Language**: TypeScript 5.9 (strict)
- **Database**: expo-sqlite (SQLite, local-first, event-sourced)
- **Navigation**: React Navigation (native-stack + bottom-tabs)
- **State**: React hooks + synchronous domain stores — no external state manager
- **Platform**: iOS + Android (cross-platform; no platform-specific code unless forced)
- **Backend**: None in v1. Supabase sync deferred to v2.

# Rules
- Never push to main without asking
- Always typecheck after code changes (`npx tsc --noEmit`)
- Use plan mode before executing any non-trivial task
- One task per subagent
- If something goes sideways mid-task, STOP and re-plan
- No platform-specific code (`Platform.OS`) unless absolutely forced — every check is tech debt

# Do Not
<!-- Add a line every time Codex makes a mistake -->
- Do not add timers (session timers, rest timers) — out of scope for Mode 1
- Do not add summary/confirmation screens after finishing a session — extra taps, bad UX
- Do not add analytics, planner, or routine-library screens — out of scope for Mode 1

# UX Rules
- Logging must take minimal taps
- Default values should reduce typing
- No multi-step flows unless necessary
- Prioritise speed over flexibility

# Engineering Rules
- One feature at a time
- Keep data model minimal but extensible
- Avoid premature abstraction
- Refactor only when necessary

# Current Focus
Step 4 — Build `LogScreen`: today's sessions inline + two quick-start CTAs (Log Climbing / Log Gym) + active session resume button.

# Decision State
PARTIAL REBUILD — keep foundation (SQLite/event store, domain types, design tokens, UI components), delete product layer (timers, planner, analytics, summary screens).

# Mode 1 Architecture
- Navigation: React Navigation (native-stack + bottom-tabs)
- Two tabs: Log | Calendar
- No analytics, no planner, no timers, no summary detour screens
- Backend: local SQLite only (Supabase sync deferred to v2)
- State: React hooks + synchronous domain stores over SQLite

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

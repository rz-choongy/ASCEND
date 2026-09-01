# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# About This Project
Climbing + gym workout tracking app for indoor boulderers. Mode 1: quick-log a climbing or gym session, view all sessions on a calendar. Mode 3: basic progress/analytics derived from logged sessions. Local-first, no backend in v1. Built with Expo (React Native + TypeScript).

# Stack
- **Framework**: Expo 54 / React Native 0.81 / React 19
- **Language**: TypeScript 5.9 (strict)
- **Database**: expo-sqlite (SQLite, local-first, event-sourced)
- **Navigation**: React Navigation (native-stack + bottom-tabs)
- **State**: React hooks + synchronous domain stores — no external state manager
- **Platform**: iOS + Android (cross-platform; no platform-specific code unless forced)
- **Backend**: None in v1. Supabase sync deferred to v2.

# Commands
```bash
npx expo start           # start Metro bundler (scan QR in Expo Go to connect device)
npx expo start --android # open on connected Android device/emulator
npx expo start --ios     # open on iOS simulator (macOS only)
npx tsc --noEmit         # typecheck (run after every code change)
npx jest                 # run all tests
npx jest src/domain/climbLogUtils.test.ts  # run a single test file
```

# Architecture

## Navigation (two-level)
`App.tsx` mounts `migrate()` on first render, then sets up a root native stack with a bottom-tab screen nested inside:

```
RootStack (NativeStackNavigator)
├── Tabs (BottomTabNavigator)          ← persistent shell
│   ├── Log       → LogScreen
│   └── Calendar  → CalendarScreen
├── ClimbLogger   → ClimbSessionScreen  (fullScreenModal)
├── StrengthLogger→ StrengthSessionScreen (fullScreenModal)
├── GymSelect     → GymSelectScreen    (modal)
├── GymEdit       → GymEditScreen      (modal)
└── SessionDetail → SessionHistoryScreen
```

All route/param types live in `src/navigation/types.ts` (`RootStackParamList`, `TabParamList`). Always use those types for `navigation` and `route` props.

## Event-Sourced SQLite
Sessions are stored in two tables: `sessions` (header row) and `events` (append-only log). State is derived by replaying events — never mutate past events.

- **Write path**: `sessionStore.ts` → `appendEvent()` / `appendSessionCorrectionEvent()`
- **Read path**: `getSessionEvents()` → pass to `applyClimbEvents()` (climbLogUtils) or `applyStrengthEvents()` (strengthLogUtils) to get current state
- **Event types**: defined in `SessionEventPayloadMap` in `types.ts`; active events (`CLIMB_LOGGED`, `SET_LOGGED`, …) vs correction events (`CLIMB_EDITED`, `CLIMB_DELETED`, …) use different append paths

## Domain Stores
Synchronous functions over SQLite — no async, no React state at this layer. Call them directly from screens/hooks:
- `sessionStore.ts` — session lifecycle, event append, gym assignment
- `gymStore.ts` — gym CRUD and grade options
- `exerciseStore.ts` — exercise list for strength sessions

## UI Layer (`src/ui/`)
All design tokens and components are barrel-exported from `src/ui/index.ts`. Always import from `src/ui`, never from sub-paths:
```ts
import { colors, spacing, Button, Card, Chip } from '../ui';
```
Tokens: `colors`, `spacing`, `radius`, `typography`. Components: `Button`, `Card`, `Chip`, `Divider`, `ListRow`.

## Database Migrations
`src/db/migrate.ts` runs at app start (called once in `App.tsx`). Add new schema changes as a new `Migration` entry in the `migrations` array. Current schema version: `APP_SCHEMA_VERSION = 3`.

## Tests
Domain logic tests live alongside source (`*.test.ts`). Jest preset is `jest-expo`. Run a single file with `npx jest <path>`. No screen-level tests exist.

# Rules
- Never push to main without asking
- Always typecheck after code changes (`npx tsc --noEmit`)
- Use plan mode before executing any non-trivial task
- One task per subagent
- If something goes sideways mid-task, STOP and re-plan
- No platform-specific code (`Platform.OS`) unless absolutely forced — every check is tech debt

# Do Not
<!-- Add a line every time Claude makes a mistake -->
- Do not add rest/interval timers between climbs — out of scope for Mode 1. A passive, read-only session-length display (no pause/resume) is in scope — see `ClimbSessionScreen`, gated behind the `show_session_timer` setting.
- Do not add summary/confirmation screens after finishing a session — extra taps, bad UX
- Do not add planner or routine-library screens — deferred to Mode 4
- Basic progress/analytics screens (Mode 3) are now in scope — charts and trends derived from existing event-sourced data, read-only, no new write paths

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

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Context Navigation
1. ALWAYS query the knowledge graph first
2. Only read raw files if explicitly asked
3. Use graphify-out/wiki/index.md if it exists

# Graph Report - ASCEND  (2026-10-17)

## Corpus Check
- 125 files · ~132,065 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 1097 nodes · 3629 edges · 60 communities (50 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a21e1fb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- KilterConnectScreen.tsx
- LogScreen.tsx
- react
- gymStore.ts
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- ui/index.ts
- sessionStore.ts
- run
- StrengthSessionScreen.tsx
- App.tsx
- dependencies
- dashboard.ts
- progressInsights.ts
- ClimbProgressView.tsx
- font
- package.json
- applyClimbEvents
- GymEditScreen.tsx
- SessionRow
- kilterAuth.ts
- kilterMapping.ts
- RecentSessionsList.tsx
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- dateUtils.ts
- RoutinesScreen.tsx
- SessionHistoryScreen.tsx
- PressableScale
- exerciseData.ts
- BugReportScreen
- ClimbSessionScreen.tsx
- Execution Order (Build Steps 1-5)
- Dark Mode UI Design Style
- PRD: Target Users (Indoor Boulderers)
- PRD: Home Screen (Resume + Planned + Quick Starts)
- PRD: Settings (Units, Grade System, Export, Reset)
- useTheme
- showDialog
- CalendarScreen.tsx
- ASCEND Feature Roadmap
- sessionNotification.ts
- progressInsights.test.ts
- colors.ts
- expo
- ChangelogScreen.tsx
- AGENTS.md
- sessionStore.test.ts
- spacing
- GymSelectScreen.tsx
- jest
- Release Readiness
- scripts
- devDependencies
- SettingsScreen.tsx
- tsconfig.json
- web-coi-proxy.js

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 92 edges
2. `font()` - 75 edges
3. `run()` - 66 edges
4. `StrengthSessionScreen()` - 55 edges
5. `react-native` - 48 edges
6. `getSessionEvents()` - 48 edges
7. `getFirst()` - 47 edges
8. `react` - 46 edges
9. `ThemeColors` - 46 edges
10. `PressableScale()` - 39 edges

## Surprising Connections (you probably didn't know these)
- `Strength Workout Session Screen Design` --semantically_similar_to--> `Strength Logger Session Screen (Pull Day)`  [INFERRED] [semantically similar]
  Docs for reference/Design Inspo.md → Design/strength_logger.png
- `Strength Workout Session Screen Design` --semantically_similar_to--> `Weight Trainer Session Screen (HEVY-style)`  [INFERRED] [semantically similar]
  Docs for reference/Design Inspo.md → Design/weight trainer session.png
- `Climbing Session Screen Design` --semantically_similar_to--> `Tape-Based Climbing Session Log Screen`  [INFERRED] [semantically similar]
  Docs for reference/Design Inspo.md → Design/tape based climbing session.png
- `Session Summary Screen Design` --semantically_similar_to--> `Climbing Session Finish/Review Screen`  [INFERRED] [semantically similar]
  Docs for reference/Design Inspo.md → Design/Climbing session finish screen.png
- `Current Focus` --references--> `LogScreen()`  [INFERRED]
  AGENTS.md → src/screens/LogScreen.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Climbing Grade Data Pipeline** — arch_grade_data_model, prd_gym_grade_mapping, img_tape_climbing, img_climbing_analytics [INFERRED 0.80]
- **Fast Logging UX Triad** — claudemd_fast_logging_principle, design_large_tap_targets, prd_design_principles [INFERRED 0.82]
- **Session Logging Core Loop** — arch_event_based_model, arch_local_first, prd_climbing_sessions, prd_strength_training [INFERRED 0.85]

## Communities (60 total, 10 thin omitted)

### Community 0 - "KilterConnectScreen.tsx"
Cohesion: 0.16
Nodes (16): react-native-safe-area-context, importExternalClimbSession(), setKilterLastSyncedAt(), kilterAuth, KILTER_GYM_NAME, KILTER_SOURCE, MIN_SYNC_INTERVAL_MS, extractLogList() (+8 more)

### Community 1 - "LogScreen.tsx"
Cohesion: 0.14
Nodes (26): firstOfMonth(), createSession(), getActiveSession(), getSessionsForDateRange(), getSessionStreak(), getLastRoutineId(), setLastRoutineId(), useTabBarClearance() (+18 more)

### Community 2 - "react"
Cohesion: 0.22
Nodes (12): react, ActiveSessionCard(), createStyles(), formatClock(), Props, Button(), ButtonProps, ButtonVariant (+4 more)

### Community 3 - "gymStore.ts"
Cohesion: 0.11
Nodes (22): AppSettingRow, CreateGymInput, defaultColorGrades, defaultNumericGrades, defaultVScaleGrades, doReplaceGymGradeOptions(), ensureNamedVScaleGym(), getBranchesForGym() (+14 more)

### Community 4 - "ASCEND Project Instructions"
Cohesion: 0.12
Nodes (16): Event-Based Model (Append-Only Events), Event Types (SET_LOGGED, CLIMB_LOGGED, etc.), Future Backend (Postgres + Prisma + Auth), Local-First Architecture (SQLite as Source of Truth), Rationale: Never Overwrite, Append-Only Events, ASCEND Project Instructions, Expo Cross-Platform Target (iOS + Android), Fast Daily Logging Core Principle (+8 more)

### Community 5 - "expo"
Cohesion: 0.06
Nodes (32): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled, projectId, expo (+24 more)

### Community 6 - "J5: Create Strength Workout Template (HEVY-Style)"
Cohesion: 0.18
Nodes (14): Planner Rules (Template Snapshot Model), Strength Workout Session Screen Design, Hangboard Tracker Session Screen, Rest Timer Bottom Sheet Overlay, Strength Logger Session Screen (Pull Day), Training Routine Library Screen, Weight Trainer Session Screen (HEVY-style), Curated Exercise Library (Climbing-Specific) (+6 more)

### Community 7 - "PRD: Climbing Sessions (Gym Setup + Grade Chips)"
Cohesion: 0.22
Nodes (11): Climbing Grade Data Model, Climbing Session Screen Design, Progress Dashboards Design, Session Summary Screen Design, Climbing Session Finish/Review Screen, Climbing Analytics Dashboard (V-Scale, Max Send Trend), Tape-Based Climbing Session Log Screen, J2: Climbing Session Fast Path (+3 more)

### Community 8 - "ui/index.ts"
Cohesion: 0.18
Nodes (17): createStyles(), ExercisePickerSheet(), Filter, Props, Chip(), ChipProps, createStyles(), ArrowRightIcon() (+9 more)

### Community 9 - "sessionStore.ts"
Cohesion: 0.08
Nodes (27): ExternalClimbInput, ExternalClimbSessionInput, basePayload, mockGetFirst, mockRun, Sess, isSessionEventType(), SESSION_EVENT_TYPES (+19 more)

### Community 10 - "run"
Cohesion: 0.06
Nodes (61): Climb + Gym Workout Tracker, Current Codebase Shape, Graph Index, Relationship Notes, Repo Graph, Runtime Map, expo-crypto, db (+53 more)

### Community 11 - "StrengthSessionScreen.tsx"
Cohesion: 0.05
Nodes (88): summarizeStrengthSessions(), countExercisesInCategory(), createCategory(), createExercise(), defaultExercises, deleteCategory(), ensureDefaultExercisesSeeded(), findCategoryByName() (+80 more)

### Community 12 - "App.tsx"
Cohesion: 0.07
Nodes (54): App(), Stack, Tab, TabIcon(), TabIconProps, TabNavigator(), @react-navigation/bottom-tabs, @react-navigation/native (+46 more)

### Community 13 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, expo-haptics, expo-image-picker (+18 more)

### Community 14 - "dashboard.ts"
Cohesion: 0.13
Nodes (16): buildRecentSessions(), ClimbSessionSummary, durationOf(), ExerciseTopSet, GradeCount, lastClimbSessions(), LastSessions, lastStrengthSessions() (+8 more)

### Community 15 - "progressInsights.ts"
Cohesion: 0.18
Nodes (12): AllTimeStats, buildRecentSends(), ClimbGymOption, DayCompletion, findHardestSendThisWeek(), GradeDistributionBar, gymNameFor(), HardestSendThisWeek (+4 more)

### Community 16 - "ClimbProgressView.tsx"
Cohesion: 0.15
Nodes (26): buildAllTimeStats(), buildGradeDistribution(), buildGradeDistributionAcrossGyms(), buildWeekCompletion(), findFirstReachedDate(), findFlashRate(), findLongestStreakEver(), findMostClimbsInSession() (+18 more)

### Community 17 - "font"
Cohesion: 0.13
Nodes (19): expo-haptics, createStyles(), BodyweightCard(), createStyles(), createStyles(), Props, createStyles(), MONTH_NAMES (+11 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (24): main, name, private, version, babel-preset-expo, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono (+16 more)

### Community 19 - "applyClimbEvents"
Cohesion: 0.19
Nodes (13): applyClimbEvents(), ClimbDeletePayload, ClimbEditPayload, ClimbLogPayload, ClimbRelabelPayload, EventLike, findSessionHighIndex(), isClimbPayload() (+5 more)

### Community 20 - "GymEditScreen.tsx"
Cohesion: 0.17
Nodes (22): createGym(), defaultOptionsForType(), deleteGym(), getGymById(), normalizeName(), runInTransaction(), updateGym(), createDraftRowId() (+14 more)

### Community 21 - "SessionRow"
Cohesion: 0.18
Nodes (7): CalendarInsightColors, findHardestClimb(), SessionReplay, colors, mockGetSessionEvents, ClimbLog, SessionRow

### Community 22 - "kilterAuth.ts"
Cohesion: 0.13
Nodes (19): fetchKilterLogs(), call(), createKilterAuth(), Deps, form(), KilterAuthError, KilterAuthErrorKind, SessionStore (+11 more)

### Community 23 - "kilterMapping.ts"
Cohesion: 0.20
Nodes (14): CLIMB_NAME_KEYS, dayKeyOf(), GradeOption, ImportedClimb, ImportedSession, KilterLog, mapKilterLogs(), pickGradeOption() (+6 more)

### Community 24 - "RecentSessionsList.tsx"
Cohesion: 0.29
Nodes (10): createStyles(), DAY_SHORT, Props, RecentSessionsList(), whenLabel(), createStyles(), Props, StartCard() (+2 more)

### Community 27 - "dateUtils.ts"
Cohesion: 0.52
Nodes (5): buildWeekActivity(), addDays(), formatElapsed(), formatLocalDate(), startOfWeek()

### Community 28 - "RoutinesScreen.tsx"
Cohesion: 0.07
Nodes (36): ASCEND Design System, Buttons, CalendarScreen, Cards & grouped lists, Chips, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette (+28 more)

### Community 29 - "SessionHistoryScreen.tsx"
Cohesion: 0.18
Nodes (17): setSessionNotes(), setSessionTitle(), ClimbDraft, createStyles(), EditingEntry, formatDateLine(), formatLogTime(), formatSessionType() (+9 more)

### Community 30 - "PressableScale"
Cohesion: 0.13
Nodes (18): AppContent(), createStyles(), DialogButton, DialogHost(), DialogRequest, HostProps, hosts, HostSetter (+10 more)

### Community 31 - "exerciseData.ts"
Cohesion: 0.19
Nodes (13): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+5 more)

### Community 32 - "BugReportScreen"
Cohesion: 0.40
Nodes (5): expo-image-picker, expo-mail-composer, BugReportScreen(), diagnosticsBlock(), hasNativeModule()

### Community 33 - "ClimbSessionScreen.tsx"
Cohesion: 0.18
Nodes (17): appendEvent(), canChangeSessionGym(), deleteEmptySession(), getShowSessionTimer(), useClimbSessionLogs(), ClimbSessionScreen(), ClimbSessionScreenProps, createStyles() (+9 more)

### Community 39 - "useTheme"
Cohesion: 0.24
Nodes (15): countDelta(), Delta, percentDelta(), createStyles(), DAY_SHORT, dayLabel(), gradeDelta(), LastSessionCard() (+7 more)

### Community 40 - "showDialog"
Cohesion: 0.40
Nodes (12): formatClockTime(), formatDuration(), getEarliestEndAt(), getLastLogAt(), getSessionById(), setSessionEndedAt(), setSessionStatus(), editEndTime() (+4 more)

### Community 41 - "CalendarScreen.tsx"
Cohesion: 0.11
Nodes (29): buildSessionReplayMap(), getAbandonedSessions(), getSessionsForMonth(), buildMonthGrid(), CalendarNavProp, CalendarScreen(), formatGroupLabel(), formatSessionTitle() (+21 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — In Progress 🔄, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 📋 (+4 more)

### Community 43 - "sessionNotification.ts"
Cohesion: 0.26
Nodes (12): describeWhere(), dismiss(), ensureChannel(), formatClock(), loadModule(), NotificationsModule, requestSessionNotificationPermission(), syncActiveSessionNotification() (+4 more)

### Community 45 - "colors.ts"
Cohesion: 0.10
Nodes (31): Dividers & separators, react-native, CardProps, CardTone, createStyles(), Divider(), DividerProps, HitSlop (+23 more)

### Community 46 - "expo"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, expo

### Community 47 - "ChangelogScreen.tsx"
Cohesion: 0.26
Nodes (9): APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry, ChangelogScreen(), createStyles(), formatEntryDate(), KIND_LABEL (+1 more)

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 49 - "sessionStore.test.ts"
Cohesion: 0.22
Nodes (7): countWideGradeBandClimbs(), findWideBandClimbs(), narrowWideGradeBands(), summarize(), mockGetAll, mockGetFirst, mockRun

### Community 50 - "spacing"
Cohesion: 0.17
Nodes (12): Bar, BarChart(), BarChartProps, BarSegment, createStyles(), LegendItem, createStyles(), EditableValue (+4 more)

### Community 51 - "GymSelectScreen.tsx"
Cohesion: 0.35
Nodes (11): ensureDefaultClimbGymSeeded(), ensureSelectedClimbGym(), getGyms(), getSelectedClimbGym(), setSelectedClimbGym(), setSessionGymId(), createStyles(), gradingTypeLabel() (+3 more)

### Community 54 - "Release Readiness"
Cohesion: 0.25
Nodes (7): Apple Distribution Options Before Public App Store Release, Build Commands, Current Repo State, EAS Update Rules, Recommended ASCEND Path, Release Readiness, Still Required Before First EAS Build

### Community 55 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, android, ios, start, test, test:ci, typecheck, web

### Community 58 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, babel-preset-expo, jest, jest-expo, @types/jest, @types/react, typescript

### Community 59 - "SettingsScreen.tsx"
Cohesion: 0.15
Nodes (24): AppSettingRow, clearKilterSession(), getKilterLastSyncedAt(), getKilterSession(), getKilterUsername(), getThemeMode(), setAccentColorId(), setKilterSession() (+16 more)

### Community 60 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): expo/tsconfig.base, compilerOptions, strict, exclude, extends

### Community 61 - "web-coi-proxy.js"
Cohesion: 0.40
Nodes (3): COI_HEADERS, http, server

## Knowledge Gaps
- **365 isolated node(s):** `Stack`, `Tab`, `TabIconProps`, `name`, `slug` (+360 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 409 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `font()` connect `font` to `KilterConnectScreen.tsx`, `react`, `ui/index.ts`, `StrengthSessionScreen.tsx`, `App.tsx`, `ClimbProgressView.tsx`, `GymEditScreen.tsx`, `RecentSessionsList.tsx`, `RoutinesScreen.tsx`, `SessionHistoryScreen.tsx`, `PressableScale`, `ClimbSessionScreen.tsx`, `useTheme`, `CalendarScreen.tsx`, `colors.ts`, `ChangelogScreen.tsx`, `spacing`, `GymSelectScreen.tsx`, `SettingsScreen.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `KilterConnectScreen.tsx`, `LogScreen.tsx`, `react`, `ui/index.ts`, `StrengthSessionScreen.tsx`, `App.tsx`, `ClimbProgressView.tsx`, `font`, `GymEditScreen.tsx`, `RecentSessionsList.tsx`, `RoutinesScreen.tsx`, `SessionHistoryScreen.tsx`, `PressableScale`, `BugReportScreen`, `ClimbSessionScreen.tsx`, `CalendarScreen.tsx`, `colors.ts`, `ChangelogScreen.tsx`, `spacing`, `GymSelectScreen.tsx`, `SettingsScreen.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _365 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LogScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._
- **Should `gymStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11067193675889328 - nodes in this community are weakly interconnected._
- **Should `ASCEND Project Instructions` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
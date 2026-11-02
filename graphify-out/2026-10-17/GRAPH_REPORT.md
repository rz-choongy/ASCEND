# Graph Report - ASCEND  (2026-10-17)

## Corpus Check
- 124 files · ~130,572 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 1086 nodes · 3552 edges · 63 communities (55 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `64aaa507`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- kilterSync.ts
- LogScreen.tsx
- react-native
- gymStore.ts
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- ui/index.ts
- domain/types.ts
- run
- StrengthSessionScreen.tsx
- App.tsx
- dependencies
- getFirst
- routineStore.ts
- ClimbProgressView.tsx
- font
- package.json
- applyClimbEvents
- GymEditScreen.tsx
- SessionRow
- kilterAuth.ts
- kilterMapping.ts
- db.ts
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- ProgressScreen.tsx
- ASCEND Design System
- SessionHistoryScreen.tsx
- ExercisePickerSheet.tsx
- exerciseData.ts
- CalendarScreen.tsx
- ClimbSessionScreen.tsx
- Execution Order (Build Steps 1-5)
- Dark Mode UI Design Style
- PRD: Target Users (Indoor Boulderers)
- PRD: Home Screen (Resume + Planned + Quick Starts)
- PRD: Settings (Units, Grade System, Export, Reset)
- useTheme
- RoutineEditScreen.tsx
- CalendarScreen
- ASCEND Feature Roadmap
- SettingsScreen.tsx
- applySetEvents
- colors.ts
- Dock.tsx
- changelog.ts
- AGENTS.md
- sessionStore.ts
- BarChart.tsx
- GymSelectScreen.tsx
- spacing
- LineChart.tsx
- Release Readiness
- scripts
- RoutinesScreen.tsx
- Stepper.tsx
- devDependencies
- settingsStore.ts
- tsconfig.json
- web-coi-proxy.js

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 92 edges
2. `font()` - 75 edges
3. `run()` - 65 edges
4. `StrengthSessionScreen()` - 54 edges
5. `react-native` - 48 edges
6. `getSessionEvents()` - 47 edges
7. `react` - 46 edges
8. `getFirst()` - 46 edges
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
- `Runtime Map` --references--> `migrate()`  [INFERRED]
  Climb + Gym Workout Tracker.md → src/db/migrate.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Climbing Grade Data Pipeline** — arch_grade_data_model, prd_gym_grade_mapping, img_tape_climbing, img_climbing_analytics [INFERRED 0.80]
- **Fast Logging UX Triad** — claudemd_fast_logging_principle, design_large_tap_targets, prd_design_principles [INFERRED 0.82]
- **Session Logging Core Loop** — arch_event_based_model, arch_local_first, prd_climbing_sessions, prd_strength_training [INFERRED 0.85]

## Communities (63 total, 8 thin omitted)

### Community 0 - "kilterSync.ts"
Cohesion: 0.16
Nodes (14): importExternalClimbSession(), setKilterLastSyncedAt(), fetchKilterLogs(), call(), KilterAuthError, kilterAuth, KILTER_GYM_NAME, KILTER_LOGS_URL (+6 more)

### Community 1 - "LogScreen.tsx"
Cohesion: 0.06
Nodes (60): buildRecentSessions(), buildWeekActivity(), ClimbSessionSummary, durationOf(), ExerciseTopSet, GradeCount, lastClimbSessions(), LastSessions (+52 more)

### Community 2 - "react-native"
Cohesion: 0.13
Nodes (16): react-native, ButtonProps, ButtonVariant, createStyles(), ChipProps, createStyles(), HitSlop, PressableScaleProps (+8 more)

### Community 3 - "gymStore.ts"
Cohesion: 0.15
Nodes (21): AppSettingRow, createGym(), CreateGymInput, defaultColorGrades, defaultNumericGrades, defaultVScaleGrades, deleteGym(), doReplaceGymGradeOptions() (+13 more)

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
Nodes (16): formatDuration(), createStyles(), DAY_SHORT, Props, RecentSessionsList(), whenLabel(), ArrowRightIcon(), BoltIcon() (+8 more)

### Community 9 - "domain/types.ts"
Cohesion: 0.09
Nodes (18): basePayload, mockGetFirst, mockRun, Sess, ClimbEditPayload, ClimbLogPayload, ClimbResult, ClimbUndoPayload (+10 more)

### Community 10 - "run"
Cohesion: 0.17
Nodes (26): getAll(), run(), addExerciseCategories(), addGymParentIdColumn(), backfillNumericGradeColors(), builtinExerciseCategories, createBodyweightLogsTable(), createExerciseCategoriesSchema() (+18 more)

### Community 11 - "StrengthSessionScreen.tsx"
Cohesion: 0.05
Nodes (77): Climb + Gym Workout Tracker, Current Codebase Shape, Graph Index, Relationship Notes, Repo Graph, Runtime Map, getExerciseNames(), appendEvent() (+69 more)

### Community 12 - "App.tsx"
Cohesion: 0.13
Nodes (17): App(), AppContent(), Stack, Tab, TabIcon(), TabIconProps, TabNavigator(), config (+9 more)

### Community 13 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, expo-haptics, expo-image-picker (+18 more)

### Community 14 - "getFirst"
Cohesion: 0.16
Nodes (24): getFirst(), countExercisesInCategory(), createCategory(), createExercise(), defaultExercises, deleteCategory(), ensureDefaultExercisesSeeded(), findCategoryByName() (+16 more)

### Community 15 - "routineStore.ts"
Cohesion: 0.24
Nodes (11): assertNameFree(), clampTarget(), createRoutine(), normalizeRoutineName(), Routine, mockGetAll, mockGetFirst, mockRun (+3 more)

### Community 16 - "ClimbProgressView.tsx"
Cohesion: 0.11
Nodes (35): AllTimeStats, buildAllTimeStats(), buildGradeDistribution(), buildGradeDistributionAcrossGyms(), buildRecentSends(), buildStrengthVolumeTrend(), buildWeeklyFrequency(), ClimbGymOption (+27 more)

### Community 17 - "font"
Cohesion: 0.19
Nodes (13): react-native-safe-area-context, createStyles(), createStyles(), createStyles(), GymScopeSheet(), Props, createStyles(), Props (+5 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (24): jest, preset, main, name, private, version, babel-preset-expo, @expo-google-fonts/geist (+16 more)

### Community 19 - "applyClimbEvents"
Cohesion: 0.17
Nodes (15): applyClimbEvents(), ClimbDeletePayload, ClimbEditPayload, ClimbLog, ClimbLogPayload, ClimbRelabelPayload, EventLike, findSessionHighIndex() (+7 more)

### Community 20 - "GymEditScreen.tsx"
Cohesion: 0.20
Nodes (17): defaultOptionsForType(), updateGym(), createDraftRowId(), createStyles(), EditableGradeRow, getCreatedGymId(), GRADE_COLOR_OPTIONS, GradeRowFields (+9 more)

### Community 21 - "SessionRow"
Cohesion: 0.17
Nodes (5): colors, mockGetSessionEvents, mockGetSessionEvents, PALETTE, SessionRow

### Community 22 - "kilterAuth.ts"
Cohesion: 0.17
Nodes (15): createKilterAuth(), Deps, form(), KilterAuthErrorKind, SessionStore, StoredSession, memoryStore(), setup() (+7 more)

### Community 23 - "kilterMapping.ts"
Cohesion: 0.19
Nodes (16): CLIMB_NAME_KEYS, dayKeyOf(), extractLogList(), GradeOption, ImportedClimb, ImportedSession, KilterLog, mapKilterLogs() (+8 more)

### Community 24 - "db.ts"
Cohesion: 0.21
Nodes (11): expo-crypto, db, deleteBodyweightLog(), getBodyweightLogs(), getLatestBodyweight(), logBodyweight(), mockGetAll, mockGetFirst (+3 more)

### Community 27 - "ProgressScreen.tsx"
Cohesion: 0.20
Nodes (13): firstOfMonth(), ChangelogScreen(), createStyles(), formatEntryDate(), KIND_LABEL, BodyweightCard(), createStyles(), createStyles() (+5 more)

### Community 28 - "ASCEND Design System"
Cohesion: 0.07
Nodes (27): ASCEND Design System, Buttons, CalendarScreen, Chips, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette, Components (+19 more)

### Community 29 - "SessionHistoryScreen.tsx"
Cohesion: 0.17
Nodes (18): getGradeOptionsForGym(), setSessionNotes(), setSessionTitle(), ClimbDraft, createStyles(), EditingEntry, formatDateLine(), formatLogTime() (+10 more)

### Community 30 - "ExercisePickerSheet.tsx"
Cohesion: 0.17
Nodes (14): createStyles(), ExercisePickerSheet(), Filter, Props, Chip(), createStyles(), DialogButton, DialogHost() (+6 more)

### Community 31 - "exerciseData.ts"
Cohesion: 0.19
Nodes (13): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+5 more)

### Community 32 - "CalendarScreen.tsx"
Cohesion: 0.19
Nodes (12): @react-navigation/bottom-tabs, @react-navigation/native-stack, SessionReplay, RootStackParamList, TabParamList, TabScreenProps, CalendarNavProp, CalendarView (+4 more)

### Community 33 - "ClimbSessionScreen.tsx"
Cohesion: 0.14
Nodes (26): canChangeSessionGym(), RootStackScreenProps, BugReportScreen(), diagnosticsBlock(), hasNativeModule(), ClimbSessionScreen(), ClimbSessionScreenProps, createStyles() (+18 more)

### Community 39 - "useTheme"
Cohesion: 0.33
Nodes (8): createStyles(), Props, WeekCard(), Card(), CardProps, CardTone, createStyles(), useTheme()

### Community 40 - "RoutineEditScreen.tsx"
Cohesion: 0.28
Nodes (12): getExercises(), getRoutine(), RoutineItem, getSessionById(), routineFromSets(), exerciseKeyFor(), ExerciseCategoryRow, clamp() (+4 more)

### Community 41 - "CalendarScreen"
Cohesion: 0.15
Nodes (21): getAbandonedSessions(), getSessionsForMonth(), buildMonthGrid(), CalendarScreen(), formatGroupLabel(), formatSessionTitle(), formatTime(), nextMonth() (+13 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — In Progress 🔄, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 📋 (+4 more)

### Community 43 - "SettingsScreen.tsx"
Cohesion: 0.16
Nodes (22): getGymById(), describeWhere(), dismiss(), ensureChannel(), formatClock(), loadModule(), NotificationsModule, requestSessionNotificationPermission() (+14 more)

### Community 44 - "applySetEvents"
Cohesion: 0.19
Nodes (13): buildSessionReplayMap(), CalendarInsightColors, findHardestClimb(), applySetEvents(), EventLike, isSetDeletePayload(), isSetEditPayload(), isSetPayload() (+5 more)

### Community 45 - "colors.ts"
Cohesion: 0.13
Nodes (23): react, getThemeMode(), createStyles(), Divider(), DividerProps, HitSlop, IconButtonProps, IconButtonVariant (+15 more)

### Community 46 - "Dock.tsx"
Cohesion: 0.38
Nodes (8): createStyles(), Dock(), DockProps, TAB_BAR_HEIGHT, TAB_BAR_INSET, useTabBarBottomOffset(), useTabBarClearance(), useTabBarSideMargin()

### Community 47 - "changelog.ts"
Cohesion: 0.38
Nodes (4): APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 49 - "sessionStore.ts"
Cohesion: 0.09
Nodes (24): countWideGradeBandClimbs(), deleteEmptySession(), ExternalClimbInput, ExternalClimbSessionInput, findWideBandClimbs(), getAllCompletedSessionCount(), getSessionsForDate(), inTransaction() (+16 more)

### Community 50 - "BarChart.tsx"
Cohesion: 0.29
Nodes (6): Bar, BarChart(), BarChartProps, BarSegment, createStyles(), LegendItem

### Community 51 - "GymSelectScreen.tsx"
Cohesion: 0.29
Nodes (13): ensureDefaultClimbGymSeeded(), ensureSelectedClimbGym(), getGyms(), getSelectedClimbGym(), setSelectedClimbGym(), setSetting(), setSessionGymId(), createStyles() (+5 more)

### Community 52 - "spacing"
Cohesion: 0.20
Nodes (10): createStyles(), Props, ListRowProps, sectionHeaderStyles, createStyles(), SegmentedControl(), SegmentedControlOption, SegmentedControlProps (+2 more)

### Community 53 - "LineChart.tsx"
Cohesion: 0.33
Nodes (5): react-native-svg, createStyles(), LineChart(), LineChartProps, LinePoint

### Community 54 - "Release Readiness"
Cohesion: 0.25
Nodes (7): Apple Distribution Options Before Public App Store Release, Build Commands, Current Repo State, EAS Update Rules, Recommended ASCEND Path, Release Readiness, Still Required Before First EAS Build

### Community 55 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, android, ios, start, test, test:ci, typecheck, web

### Community 56 - "RoutinesScreen.tsx"
Cohesion: 0.29
Nodes (11): Cards & grouped lists, deleteRoutine(), getRoutines(), RoutineSummary, countLabel(), createStyles(), Props, RoutinesScreen() (+3 more)

### Community 57 - "Stepper.tsx"
Cohesion: 0.38
Nodes (6): expo-haptics, createStyles(), EditableValue, Stepper(), StepperProps, withHaptic()

### Community 58 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, babel-preset-expo, jest, jest-expo, @types/jest, @types/react, typescript

### Community 59 - "settingsStore.ts"
Cohesion: 0.20
Nodes (15): AppSettingRow, clearKilterSession(), getKilterSession(), setAccentColorId(), setFavoriteGradeGymIds(), setKilterSession(), setProgressGradeGymId(), setSetting() (+7 more)

### Community 60 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): expo/tsconfig.base, compilerOptions, strict, exclude, extends

### Community 61 - "web-coi-proxy.js"
Cohesion: 0.40
Nodes (3): COI_HEADERS, http, server

## Knowledge Gaps
- **364 isolated node(s):** `Stack`, `Tab`, `TabIconProps`, `name`, `slug` (+359 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 408 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `font()` connect `font` to `LogScreen.tsx`, `react-native`, `ui/index.ts`, `StrengthSessionScreen.tsx`, `getFirst`, `ClimbProgressView.tsx`, `GymEditScreen.tsx`, `ProgressScreen.tsx`, `SessionHistoryScreen.tsx`, `ExercisePickerSheet.tsx`, `CalendarScreen.tsx`, `ClimbSessionScreen.tsx`, `useTheme`, `RoutineEditScreen.tsx`, `CalendarScreen`, `SettingsScreen.tsx`, `colors.ts`, `Dock.tsx`, `BarChart.tsx`, `GymSelectScreen.tsx`, `spacing`, `RoutinesScreen.tsx`, `Stepper.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `LogScreen.tsx`, `react-native`, `ui/index.ts`, `StrengthSessionScreen.tsx`, `App.tsx`, `getFirst`, `ClimbProgressView.tsx`, `font`, `GymEditScreen.tsx`, `ProgressScreen.tsx`, `SessionHistoryScreen.tsx`, `ExercisePickerSheet.tsx`, `CalendarScreen.tsx`, `ClimbSessionScreen.tsx`, `RoutineEditScreen.tsx`, `CalendarScreen`, `SettingsScreen.tsx`, `colors.ts`, `Dock.tsx`, `BarChart.tsx`, `GymSelectScreen.tsx`, `spacing`, `LineChart.tsx`, `RoutinesScreen.tsx`, `Stepper.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _364 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LogScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.061569416498993966 - nodes in this community are weakly interconnected._
- **Should `react-native` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `gymStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._
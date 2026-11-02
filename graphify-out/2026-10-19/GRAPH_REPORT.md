# Graph Report - ASCEND  (2026-10-19)

## Corpus Check
- 128 files · ~134,383 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 1114 nodes · 3701 edges · 58 communities (50 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fb3f9ec2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- react-native-safe-area-context
- strengthProgress.ts
- gymStore.ts
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- ui/index.ts
- sessionStore.ts
- run
- getFirst
- ExerciseProgressScreen.tsx
- dependencies
- LogScreen.tsx
- getSessionEvents
- ClimbProgressView.tsx
- useTheme
- package.json
- applyClimbEvents
- StrengthSessionScreen.tsx
- SessionRow
- kilterSync.ts
- routineStore.ts
- RecentSessionsList.tsx
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- App.tsx
- ASCEND Design System
- SessionHistoryScreen.tsx
- PressableScale
- exerciseData.ts
- getAll
- ClimbSessionScreen.tsx
- Execution Order (Build Steps 1-5)
- Dark Mode UI Design Style
- PRD: Target Users (Indoor Boulderers)
- PRD: Home Screen (Resume + Planned + Quick Starts)
- PRD: Settings (Units, Grade System, Export, Reset)
- font
- RoutineEditScreen.tsx
- CalendarScreen.tsx
- ASCEND Feature Roadmap
- applySetEvents
- progressInsights.test.ts
- colors.ts
- expo
- StrengthProgressView.tsx
- AGENTS.md
- RoutinesScreen.tsx
- BarChart.tsx
- Climb + Gym Workout Tracker
- Release Readiness
- scripts
- devDependencies
- tsconfig.json
- web-coi-proxy.js

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 94 edges
2. `font()` - 77 edges
3. `run()` - 66 edges
4. `StrengthSessionScreen()` - 55 edges
5. `react-native` - 49 edges
6. `getSessionEvents()` - 48 edges
7. `react` - 47 edges
8. `getFirst()` - 47 edges
9. `ThemeColors` - 47 edges
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

## Communities (58 total, 8 thin omitted)

### Community 0 - "react"
Cohesion: 0.13
Nodes (20): react, createStyles(), createStyles(), Props, CardProps, CardTone, ListRowProps, sectionHeaderStyles (+12 more)

### Community 1 - "react-native-safe-area-context"
Cohesion: 0.29
Nodes (10): react-native-safe-area-context, @react-navigation/bottom-tabs, createStyles(), Dock(), DockProps, TAB_BAR_HEIGHT, TAB_BAR_INSET, useTabBarBottomOffset() (+2 more)

### Community 2 - "strengthProgress.ts"
Cohesion: 0.13
Nodes (19): buildExerciseDetail(), buildLoggerReference(), collectHistories(), ExerciseHistory, exerciseKeyFor(), ExerciseSummary, heavierSet(), initialInputFor() (+11 more)

### Community 3 - "gymStore.ts"
Cohesion: 0.05
Nodes (67): APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry, AppSettingRow, createGym(), CreateGymInput, defaultColorGrades (+59 more)

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
Cohesion: 0.14
Nodes (21): react-native-svg, createStyles(), GymScopeSheet(), Props, createStyles(), ExercisePickerSheet(), Filter, Props (+13 more)

### Community 9 - "sessionStore.ts"
Cohesion: 0.06
Nodes (54): angleFromPoint(), clampToRange(), DIAL_MAX_SPAN_MS, dialRange, hourHandAngle(), minuteHandAngle(), snapToMinute(), stepMinutes() (+46 more)

### Community 10 - "run"
Cohesion: 0.17
Nodes (25): run(), addExerciseCategories(), addGymParentIdColumn(), backfillNumericGradeColors(), builtinExerciseCategories, createBodyweightLogsTable(), createExerciseCategoriesSchema(), createExternalLogsTable() (+17 more)

### Community 11 - "getFirst"
Cohesion: 0.17
Nodes (23): getFirst(), countExercisesInCategory(), createCategory(), createExercise(), defaultExercises, deleteCategory(), ensureDefaultExercisesSeeded(), findCategoryByName() (+15 more)

### Community 12 - "ExerciseProgressScreen.tsx"
Cohesion: 0.18
Nodes (16): @react-navigation/native, ExerciseDetail, ExerciseSession, formatVolume(), sliceSeriesToRange(), StrengthMetric, createStyles(), deltaSub() (+8 more)

### Community 13 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, expo-haptics, expo-image-picker (+18 more)

### Community 14 - "LogScreen.tsx"
Cohesion: 0.05
Nodes (86): buildRecentSessions(), ClimbSessionSummary, durationOf(), ExerciseTopSet, GradeCount, lastClimbSessions(), LastSessions, lastStrengthSessions() (+78 more)

### Community 15 - "getSessionEvents"
Cohesion: 0.14
Nodes (22): summarizeClimbSession(), getGymById(), AllTimeStats, buildRecentSends(), buildStrengthVolumeTrend(), buildWeeklyFrequency(), ClimbGymOption, DayCompletion (+14 more)

### Community 16 - "ClimbProgressView.tsx"
Cohesion: 0.15
Nodes (23): buildAllTimeStats(), buildWeekCompletion(), findLongestStreakEver(), getFavoriteGradeGymIds(), getProgressGradeGymId(), setFavoriteGradeGymIds(), setProgressGradeGymId(), formatMonthDay() (+15 more)

### Community 17 - "useTheme"
Cohesion: 0.15
Nodes (20): firstOfMonth(), getSessionStreak(), ChangelogScreen(), createStyles(), formatEntryDate(), KIND_LABEL, BodyweightCard(), createStyles() (+12 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (24): jest, preset, main, name, private, version, babel-preset-expo, @expo-google-fonts/geist (+16 more)

### Community 19 - "applyClimbEvents"
Cohesion: 0.18
Nodes (14): applyClimbEvents(), ClimbDeletePayload, ClimbEditPayload, ClimbLog, ClimbLogPayload, ClimbRelabelPayload, EventLike, isClimbPayload() (+6 more)

### Community 20 - "StrengthSessionScreen.tsx"
Cohesion: 0.16
Nodes (21): estimateOneRepMax(), findRecordSetIds(), isNewRecord(), parseWeightInput(), roundWeight(), ExerciseUsage, createPanelStyles(), createStyles() (+13 more)

### Community 21 - "SessionRow"
Cohesion: 0.21
Nodes (7): buildSessionReplayMap(), CalendarInsightColors, findHardestClimb(), SessionReplay, colors, mockGetSessionEvents, SessionRow

### Community 22 - "kilterSync.ts"
Cohesion: 0.06
Nodes (48): clearKilterSession(), getKilterSession(), setKilterSession(), fetchKilterLogs(), call(), createKilterAuth(), Deps, form() (+40 more)

### Community 23 - "routineStore.ts"
Cohesion: 0.16
Nodes (16): expo-crypto, assertNameFree(), clampTarget(), createRoutine(), normalizeRoutineName(), Routine, RoutineItem, RoutineSummary (+8 more)

### Community 24 - "RecentSessionsList.tsx"
Cohesion: 0.24
Nodes (12): createStyles(), DAY_SHORT, Props, RecentSessionsList(), whenLabel(), createStyles(), Props, StartCard() (+4 more)

### Community 27 - "App.tsx"
Cohesion: 0.19
Nodes (13): App(), AppContent(), Stack, Tab, TabIcon(), TabIconProps, TabNavigator(), expo-font (+5 more)

### Community 28 - "ASCEND Design System"
Cohesion: 0.08
Nodes (24): ASCEND Design System, Buttons, CalendarScreen, Chips, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette, Components (+16 more)

### Community 29 - "SessionHistoryScreen.tsx"
Cohesion: 0.16
Nodes (19): getExerciseNames(), getGradeOptionsForGym(), setSessionNotes(), setSessionTitle(), ClimbDraft, createStyles(), EditingEntry, formatDateLine() (+11 more)

### Community 30 - "PressableScale"
Cohesion: 0.13
Nodes (19): expo-haptics, createStyles(), DialogButton, DialogHost(), DialogRequest, HostProps, hosts, HostSetter (+11 more)

### Community 31 - "exerciseData.ts"
Cohesion: 0.19
Nodes (13): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+5 more)

### Community 32 - "getAll"
Cohesion: 0.24
Nodes (11): db, getAll(), deleteBodyweightLog(), getBodyweightLogs(), getLatestBodyweight(), logBodyweight(), mockGetAll, mockGetFirst (+3 more)

### Community 33 - "ClimbSessionScreen.tsx"
Cohesion: 0.16
Nodes (19): What to Avoid, findSessionHighIndex(), isGradeBand(), formatElapsed(), appendEvent(), canChangeSessionGym(), ClimbSessionScreen(), ClimbSessionScreenProps (+11 more)

### Community 39 - "font"
Cohesion: 0.19
Nodes (14): createStyles(), Props, countDelta(), Delta, percentDelta(), createStyles(), DAY_SHORT, Props (+6 more)

### Community 40 - "RoutineEditScreen.tsx"
Cohesion: 0.31
Nodes (12): getExercises(), setExerciseCategory(), setExerciseFavorite(), getRoutine(), getCompletedSessions(), routineFromSets(), buildExerciseList(), clamp() (+4 more)

### Community 41 - "CalendarScreen.tsx"
Cohesion: 0.11
Nodes (34): buildWeekActivity(), addDays(), formatDuration(), formatLocalDate(), startOfWeek(), getAbandonedSessions(), getSessionsForDateRange(), getSessionsForMonth() (+26 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — In Progress 🔄, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 📋 (+4 more)

### Community 43 - "applySetEvents"
Cohesion: 0.23
Nodes (10): applySetEvents(), EventLike, isSetDeletePayload(), isSetEditPayload(), isSetPayload(), LoggedSet, SetDeletePayload, SetEditPayload (+2 more)

### Community 44 - "progressInsights.test.ts"
Cohesion: 0.33
Nodes (3): buildGradeDistribution(), mockGetSessionEvents, PALETTE

### Community 45 - "colors.ts"
Cohesion: 0.13
Nodes (24): react-native, getThemeMode(), ButtonProps, ButtonVariant, createStyles(), Divider(), DividerProps, HitSlop (+16 more)

### Community 46 - "expo"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, expo

### Community 47 - "StrengthProgressView.tsx"
Cohesion: 0.24
Nodes (10): @react-navigation/native-stack, RootStackParamList, TabParamList, TabScreenProps, createStyles(), ExerciseRow(), ExerciseRowProps, NavProp (+2 more)

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 49 - "RoutinesScreen.tsx"
Cohesion: 0.33
Nodes (10): Cards & grouped lists, deleteRoutine(), getRoutines(), countLabel(), createStyles(), Props, RoutinesScreen(), createStyles() (+2 more)

### Community 50 - "BarChart.tsx"
Cohesion: 0.29
Nodes (6): Bar, BarChart(), BarChartProps, BarSegment, createStyles(), LegendItem

### Community 51 - "Climb + Gym Workout Tracker"
Cohesion: 0.29
Nodes (6): Climb + Gym Workout Tracker, Current Codebase Shape, Graph Index, Relationship Notes, Repo Graph, Runtime Map

### Community 54 - "Release Readiness"
Cohesion: 0.25
Nodes (7): Apple Distribution Options Before Public App Store Release, Build Commands, Current Repo State, EAS Update Rules, Recommended ASCEND Path, Release Readiness, Still Required Before First EAS Build

### Community 55 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, android, ios, start, test, test:ci, typecheck, web

### Community 58 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, babel-preset-expo, jest, jest-expo, @types/jest, @types/react, typescript

### Community 60 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): expo/tsconfig.base, compilerOptions, strict, exclude, extends

### Community 61 - "web-coi-proxy.js"
Cohesion: 0.40
Nodes (3): COI_HEADERS, http, server

## Knowledge Gaps
- **366 isolated node(s):** `Stack`, `Tab`, `TabIconProps`, `name`, `slug` (+361 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 411 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `react`, `react-native-safe-area-context`, `gymStore.ts`, `ui/index.ts`, `sessionStore.ts`, `getFirst`, `ExerciseProgressScreen.tsx`, `LogScreen.tsx`, `ClimbProgressView.tsx`, `StrengthSessionScreen.tsx`, `RecentSessionsList.tsx`, `App.tsx`, `SessionHistoryScreen.tsx`, `PressableScale`, `ClimbSessionScreen.tsx`, `font`, `RoutineEditScreen.tsx`, `CalendarScreen.tsx`, `colors.ts`, `StrengthProgressView.tsx`, `RoutinesScreen.tsx`, `BarChart.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `PressableScale()` connect `PressableScale` to `react`, `react-native-safe-area-context`, `ClimbSessionScreen.tsx`, `gymStore.ts`, `font`, `ui/index.ts`, `ExerciseProgressScreen.tsx`, `colors.ts`, `LogScreen.tsx`, `StrengthProgressView.tsx`, `ClimbProgressView.tsx`, `StrengthSessionScreen.tsx`, `RecentSessionsList.tsx`, `ASCEND Design System`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _366 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._
- **Should `strengthProgress.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12681159420289856 - nodes in this community are weakly interconnected._
- **Should `gymStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05473684210526316 - nodes in this community are weakly interconnected._
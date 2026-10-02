# Graph Report - ASCEND  (2026-10-02)

## Corpus Check
- 124 files · ~128,778 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 1071 nodes · 3487 edges · 63 communities (55 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d6f071ac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- settingsStore.ts
- LogScreen.tsx
- react-native
- gymStore.ts
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- ui/index.ts
- sessionStore.ts
- GymSelectScreen.tsx
- strengthProgress.ts
- App.tsx
- dependencies
- exerciseStore.ts
- run
- ClimbProgressView.tsx
- font
- package.json
- applyClimbEvents
- GymEditScreen.tsx
- getSessionEvents
- getAll
- routineStore.ts
- StrengthSessionScreen.tsx
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- ExerciseProgressScreen.tsx
- ASCEND Design System
- SessionHistoryScreen.tsx
- useTheme
- exerciseData.ts
- PressableScale
- ClimbSessionScreen.tsx
- Execution Order (Build Steps 1-5)
- Dark Mode UI Design Style
- PRD: Target Users (Indoor Boulderers)
- PRD: Home Screen (Resume + Planned + Quick Starts)
- PRD: Settings (Units, Grade System, Export, Reset)
- CalendarScreen.tsx
- StrengthProgressView.tsx
- CalendarScreen
- ASCEND Feature Roadmap
- RoutineEditScreen.tsx
- applySetEvents
- colors.ts
- RecentSessionsList.tsx
- ChangelogScreen.tsx
- AGENTS.md
- sessionStore.test.ts
- spacing
- Components
- sessionStore.import.test.ts
- tabBar.ts
- Release Readiness
- scripts
- RoutinesScreen.tsx
- Climb + Gym Workout Tracker
- devDependencies
- SessionRow
- tsconfig.json
- web-coi-proxy.js

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 92 edges
2. `font()` - 75 edges
3. `run()` - 64 edges
4. `StrengthSessionScreen()` - 53 edges
5. `react-native` - 48 edges
6. `getSessionEvents()` - 47 edges
7. `react` - 46 edges
8. `ThemeColors` - 46 edges
9. `getFirst()` - 45 edges
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
- **Session Logging Core Loop** — arch_event_based_model, arch_local_first, prd_climbing_sessions, prd_strength_training [INFERRED 0.85]
- **Climbing Grade Data Pipeline** — arch_grade_data_model, prd_gym_grade_mapping, img_tape_climbing, img_climbing_analytics [INFERRED 0.80]
- **Fast Logging UX Triad** — claudemd_fast_logging_principle, design_large_tap_targets, prd_design_principles [INFERRED 0.82]

## Communities (63 total, 8 thin omitted)

### Community 0 - "settingsStore.ts"
Cohesion: 0.05
Nodes (63): AppSettingRow, clearKilterSession(), getAccentColorId(), getKilterLastSyncedAt(), getKilterSession(), getKilterUsername(), getThemeMode(), setAccentColorId() (+55 more)

### Community 1 - "LogScreen.tsx"
Cohesion: 0.07
Nodes (56): buildRecentSessions(), buildWeekActivity(), ClimbSessionSummary, durationOf(), ExerciseTopSet, GradeCount, lastClimbSessions(), LastSessions (+48 more)

### Community 2 - "react-native"
Cohesion: 0.11
Nodes (28): react, react-native, createStyles(), DockProps, CardProps, CardTone, createStyles(), Divider() (+20 more)

### Community 3 - "gymStore.ts"
Cohesion: 0.12
Nodes (34): getFirst(), AppSettingRow, createGym(), CreateGymInput, defaultColorGrades, defaultNumericGrades, defaultVScaleGrades, deleteGym() (+26 more)

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
Cohesion: 0.12
Nodes (26): createStyles(), GymScopeSheet(), Props, createStyles(), ExercisePickerSheet(), Filter, Props, createStyles() (+18 more)

### Community 9 - "sessionStore.ts"
Cohesion: 0.10
Nodes (27): appendEvent(), ExternalClimbInput, ExternalClimbSessionInput, getSessionById(), importExternalClimbSession(), inTransaction(), isSessionEventType(), SESSION_EVENT_TYPES (+19 more)

### Community 10 - "GymSelectScreen.tsx"
Cohesion: 0.13
Nodes (21): expo-image-picker, expo-mail-composer, react-native-safe-area-context, RootStackScreenProps, BugReportScreen(), createStyles(), diagnosticsBlock(), hasNativeModule() (+13 more)

### Community 11 - "strengthProgress.ts"
Cohesion: 0.14
Nodes (21): buildExerciseDetail(), buildExerciseList(), buildLoggerReference(), collectHistories(), estimateOneRepMax(), ExerciseHistory, exerciseKeyFor(), ExerciseSummary (+13 more)

### Community 12 - "App.tsx"
Cohesion: 0.11
Nodes (21): App(), AppContent(), Stack, Tab, TabIcon(), TabIconProps, config, { getDefaultConfig } (+13 more)

### Community 13 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, expo-haptics, expo-image-picker (+17 more)

### Community 14 - "exerciseStore.ts"
Cohesion: 0.17
Nodes (21): countExercisesInCategory(), createCategory(), createExercise(), defaultExercises, deleteCategory(), ensureDefaultExercisesSeeded(), findCategoryByName(), getCategories() (+13 more)

### Community 15 - "run"
Cohesion: 0.18
Nodes (23): run(), addExerciseCategories(), builtinExerciseCategories, createBodyweightLogsTable(), createExerciseCategoriesSchema(), createExternalLogsTable(), createRoutinesTables(), dedupeGymGradeOptions() (+15 more)

### Community 16 - "ClimbProgressView.tsx"
Cohesion: 0.15
Nodes (23): buildWeekCompletion(), findFirstReachedDate(), findFlashRate(), findLongestStreakEver(), findMostClimbsInSession(), getAvailableClimbGyms(), getFavoriteGradeGymIds(), getProgressGradeGymId() (+15 more)

### Community 17 - "font"
Cohesion: 0.14
Nodes (17): react-native-svg, ActiveSessionCard(), createStyles(), formatClock(), Props, BodyweightRow(), createStyles(), Props (+9 more)

### Community 18 - "package.json"
Cohesion: 0.09
Nodes (21): jest, preset, main, name, private, version, babel-preset-expo, @expo-google-fonts/geist (+13 more)

### Community 19 - "applyClimbEvents"
Cohesion: 0.15
Nodes (16): buildSessionReplayMap(), CalendarInsightColors, findHardestClimb(), SessionReplay, applyClimbEvents(), ClimbDeletePayload, ClimbEditPayload, ClimbLog (+8 more)

### Community 20 - "GymEditScreen.tsx"
Cohesion: 0.17
Nodes (20): defaultOptionsForType(), getGyms(), setSessionGymId(), createDraftRowId(), createStyles(), EditableGradeRow, getCreatedGymId(), GRADE_COLOR_OPTIONS (+12 more)

### Community 21 - "getSessionEvents"
Cohesion: 0.14
Nodes (17): AllTimeStats, buildGradeDistribution(), buildGradeDistributionAcrossGyms(), buildRecentSends(), ClimbGymOption, DayCompletion, findHardestSendThisWeek(), GradeDistributionBar (+9 more)

### Community 22 - "getAll"
Cohesion: 0.15
Nodes (17): expo-crypto, db, getAll(), addGymParentIdColumn(), backfillNumericGradeColors(), deleteBodyweightLog(), getBodyweightLogs(), getLatestBodyweight() (+9 more)

### Community 23 - "routineStore.ts"
Cohesion: 0.16
Nodes (16): assertNameFree(), clampTarget(), createRoutine(), deleteRoutine(), normalizeRoutineName(), Routine, RoutineItem, RoutineSummary (+8 more)

### Community 24 - "StrengthSessionScreen.tsx"
Cohesion: 0.15
Nodes (19): LoggerReference, parseWeightInput(), roundWeight(), SetInput, ExerciseUsage, createPanelStyles(), createStyles(), DEFAULT_INPUT (+11 more)

### Community 27 - "ExerciseProgressScreen.tsx"
Cohesion: 0.19
Nodes (18): ExerciseDetail, ExerciseSession, formatMonthDay(), formatVolume(), formatWeight(), sliceSeriesToRange(), StrengthMetric, createStyles() (+10 more)

### Community 28 - "ASCEND Design System"
Cohesion: 0.11
Nodes (17): ASCEND Design System, CalendarScreen, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette, Corner Radius, Layout Principles, LogScreen (Home) (+9 more)

### Community 29 - "SessionHistoryScreen.tsx"
Cohesion: 0.18
Nodes (17): setSessionNotes(), setSessionTitle(), ClimbDraft, createStyles(), EditingEntry, formatDateLine(), formatLogTime(), formatSessionType() (+9 more)

### Community 30 - "useTheme"
Cohesion: 0.26
Nodes (15): firstOfMonth(), formatDaysAgo(), BodyweightCard(), createStyles(), createStyles(), MONTH_NAMES, ProgressMode, ProgressScreen() (+7 more)

### Community 31 - "exerciseData.ts"
Cohesion: 0.19
Nodes (13): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+5 more)

### Community 32 - "PressableScale"
Cohesion: 0.18
Nodes (14): Chip(), ChipProps, createStyles(), AnimatedPressable, HitSlop, PressableScale(), PressableScaleProps, SPRING_CONFIG (+6 more)

### Community 33 - "ClimbSessionScreen.tsx"
Cohesion: 0.20
Nodes (15): expo-haptics, findSessionHighIndex(), isGradeBand(), canChangeSessionGym(), useClimbSessionLogs(), ClimbSessionScreen(), ClimbSessionScreenProps, createStyles() (+7 more)

### Community 39 - "CalendarScreen.tsx"
Cohesion: 0.18
Nodes (13): addDays(), formatElapsed(), formatLocalDate(), buildMonthGrid(), CalendarNavProp, CalendarView, formatWeekRangeLabel(), groupSessionsByDay() (+5 more)

### Community 40 - "StrengthProgressView.tsx"
Cohesion: 0.22
Nodes (15): getExerciseNames(), buildAllTimeStats(), buildStrengthVolumeTrend(), buildWeeklyFrequency(), formatShortDate(), createStyles(), ExerciseRow(), ExerciseRowProps (+7 more)

### Community 41 - "CalendarScreen"
Cohesion: 0.22
Nodes (16): CalendarScreen(), formatGroupLabel(), formatSessionTitle(), formatTime(), nextMonth(), nextWeek(), prevMonth(), prevWeek() (+8 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — In Progress 🔄, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 📋 (+4 more)

### Community 43 - "RoutineEditScreen.tsx"
Cohesion: 0.31
Nodes (12): getExercises(), renameExercise(), setExerciseCategory(), setExerciseFavorite(), getRoutine(), getCompletedSessions(), routineFromSets(), clamp() (+4 more)

### Community 44 - "applySetEvents"
Cohesion: 0.23
Nodes (10): applySetEvents(), EventLike, isSetDeletePayload(), isSetEditPayload(), isSetPayload(), LoggedSet, SetDeletePayload, SetEditPayload (+2 more)

### Community 45 - "colors.ts"
Cohesion: 0.19
Nodes (11): ACCENT_OPTIONS, createStyles(), SettingsScreenProps, ACCENT_PALETTE, AccentColorId, AccentTint, darkColors, gradePalette (+3 more)

### Community 46 - "RecentSessionsList.tsx"
Cohesion: 0.27
Nodes (11): createStyles(), DAY_SHORT, Props, RecentSessionsList(), whenLabel(), createStyles(), Props, StartCard() (+3 more)

### Community 47 - "ChangelogScreen.tsx"
Cohesion: 0.27
Nodes (8): APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry, ChangelogScreen(), createStyles(), formatEntryDate(), KIND_LABEL

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 49 - "sessionStore.test.ts"
Cohesion: 0.22
Nodes (7): countWideGradeBandClimbs(), findWideBandClimbs(), narrowWideGradeBands(), summarize(), mockGetAll, mockGetFirst, mockRun

### Community 50 - "spacing"
Cohesion: 0.24
Nodes (7): Bar, BarChart(), BarChartProps, BarSegment, createStyles(), LegendItem, spacing

### Community 51 - "Components"
Cohesion: 0.22
Nodes (9): Buttons, Cards & grouped lists, Chips, Components, Dividers & separators, Empty states, Grade tiles, Inputs (+1 more)

### Community 52 - "sessionStore.import.test.ts"
Cohesion: 0.22
Nodes (5): basePayload, mockGetFirst, mockRun, Sess, ClimbLogPayload

### Community 53 - "tabBar.ts"
Cohesion: 0.32
Nodes (7): TabNavigator(), Dock(), TAB_BAR_HEIGHT, TAB_BAR_INSET, useTabBarBottomOffset(), useTabBarClearance(), useTabBarSideMargin()

### Community 54 - "Release Readiness"
Cohesion: 0.25
Nodes (7): Apple Distribution Options Before Public App Store Release, Build Commands, Current Repo State, EAS Update Rules, Recommended ASCEND Path, Release Readiness, Still Required Before First EAS Build

### Community 55 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, android, ios, start, test, test:ci, typecheck, web

### Community 56 - "RoutinesScreen.tsx"
Cohesion: 0.43
Nodes (7): countLabel(), createStyles(), Props, RoutinesScreen(), createStyles(), ListGroup(), ListRow()

### Community 57 - "Climb + Gym Workout Tracker"
Cohesion: 0.29
Nodes (6): Climb + Gym Workout Tracker, Current Codebase Shape, Graph Index, Relationship Notes, Repo Graph, Runtime Map

### Community 58 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, babel-preset-expo, jest, jest-expo, @types/jest, @types/react, typescript

### Community 59 - "SessionRow"
Cohesion: 0.29
Nodes (3): colors, mockGetSessionEvents, SessionRow

### Community 60 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): expo/tsconfig.base, compilerOptions, strict, exclude, extends

### Community 61 - "web-coi-proxy.js"
Cohesion: 0.40
Nodes (3): COI_HEADERS, http, server

## Knowledge Gaps
- **362 isolated node(s):** `Stack`, `Tab`, `TabIconProps`, `name`, `slug` (+357 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 405 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `font()` connect `font` to `LogScreen.tsx`, `react-native`, `ui/index.ts`, `GymSelectScreen.tsx`, `exerciseStore.ts`, `ClimbProgressView.tsx`, `GymEditScreen.tsx`, `StrengthSessionScreen.tsx`, `ExerciseProgressScreen.tsx`, `SessionHistoryScreen.tsx`, `useTheme`, `PressableScale`, `ClimbSessionScreen.tsx`, `CalendarScreen.tsx`, `StrengthProgressView.tsx`, `CalendarScreen`, `RoutineEditScreen.tsx`, `colors.ts`, `RecentSessionsList.tsx`, `ChangelogScreen.tsx`, `spacing`, `RoutinesScreen.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `LogScreen.tsx`, `react-native`, `ui/index.ts`, `GymSelectScreen.tsx`, `App.tsx`, `exerciseStore.ts`, `ClimbProgressView.tsx`, `font`, `GymEditScreen.tsx`, `StrengthSessionScreen.tsx`, `ExerciseProgressScreen.tsx`, `SessionHistoryScreen.tsx`, `PressableScale`, `ClimbSessionScreen.tsx`, `CalendarScreen.tsx`, `StrengthProgressView.tsx`, `CalendarScreen`, `RoutineEditScreen.tsx`, `colors.ts`, `RecentSessionsList.tsx`, `ChangelogScreen.tsx`, `spacing`, `tabBar.ts`, `RoutinesScreen.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _362 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `settingsStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050888286660644384 - nodes in this community are weakly interconnected._
- **Should `LogScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06586538461538462 - nodes in this community are weakly interconnected._
- **Should `react-native` be split into smaller, more focused modules?**
  _Cohesion score 0.11379800853485064 - nodes in this community are weakly interconnected._
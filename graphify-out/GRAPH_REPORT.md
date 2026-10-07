# Graph Report - osaka  (2026-10-07)

## Corpus Check
- 123 files · ~129,860 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 1085 nodes · 3544 edges · 66 communities (57 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62a96bab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- kilterSync.ts
- LogScreen.tsx
- ThemeColors
- gymStore.ts
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- ui/index.ts
- sessionStore.ts
- BugReportScreen.tsx
- strengthProgress.ts
- App.tsx
- dependencies
- run
- SettingsScreen.tsx
- ClimbProgressView.tsx
- font
- package.json
- applyClimbEvents
- GymEditScreen.tsx
- getSessionEvents
- kilterAuth.ts
- kilterMapping.ts
- StrengthSessionScreen.tsx
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- ExerciseProgressScreen.tsx
- ASCEND Design System
- SessionHistoryScreen.tsx
- ExercisePickerSheet.tsx
- exerciseData.ts
- Dialog.tsx
- ClimbSessionScreen.tsx
- Execution Order (Build Steps 1-5)
- Dark Mode UI Design Style
- PRD: Target Users (Indoor Boulderers)
- PRD: Home Screen (Resume + Planned + Quick Starts)
- PRD: Settings (Units, Grade System, Export, Reset)
- useTheme
- StrengthProgressView.tsx
- CalendarScreen.tsx
- ASCEND Feature Roadmap
- sessionNotification.ts
- applySetEvents
- colors.ts
- RecentSessionsList.tsx
- changelog.ts
- AGENTS.md
- SessionRow
- BarChart.tsx
- GymSelectScreen.tsx
- spacing
- LineChart.tsx
- Release Readiness
- scripts
- RoutinesScreen.tsx
- Climb + Gym Workout Tracker
- devDependencies
- kilterSessionStore.ts
- tsconfig.json
- web-coi-proxy.js
- react
- expo
- jest

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 92 edges
2. `font()` - 75 edges
3. `run()` - 64 edges
4. `StrengthSessionScreen()` - 53 edges
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

## Communities (66 total, 9 thin omitted)

### Community 0 - "kilterSync.ts"
Cohesion: 0.16
Nodes (11): fetchKilterLogs(), call(), KilterAuthError, kilterAuth, KILTER_GYM_NAME, KILTER_LOGS_URL, KILTER_SOURCE, MIN_SYNC_INTERVAL_MS (+3 more)

### Community 1 - "LogScreen.tsx"
Cohesion: 0.07
Nodes (50): buildRecentSessions(), buildWeekActivity(), ClimbSessionSummary, durationOf(), ExerciseTopSet, GradeCount, lastClimbSessions(), LastSessions (+42 more)

### Community 2 - "ThemeColors"
Cohesion: 0.14
Nodes (17): CardProps, CardTone, ChipProps, createStyles(), HitSlop, IconButtonProps, IconButtonVariant, ListRowProps (+9 more)

### Community 3 - "gymStore.ts"
Cohesion: 0.12
Nodes (26): AppSettingRow, createGym(), CreateGymInput, defaultColorGrades, defaultNumericGrades, defaultVScaleGrades, deleteGym(), doReplaceGymGradeOptions() (+18 more)

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
Cohesion: 0.25
Nodes (12): TabIcon(), ArrowRightIcon(), BoltIcon(), CalendarTabIcon(), IconProps, LogTabIcon(), MoonIcon(), ProgressTabIcon() (+4 more)

### Community 9 - "sessionStore.ts"
Cohesion: 0.07
Nodes (32): ExternalClimbInput, ExternalClimbSessionInput, getAllCompletedSessionCount(), getSessionsForDate(), basePayload, mockGetFirst, mockRun, Sess (+24 more)

### Community 10 - "BugReportScreen.tsx"
Cohesion: 0.26
Nodes (10): expo-image-picker, BugReportScreen(), createStyles(), diagnosticsBlock(), hasNativeModule(), CloseIcon(), createStyles(), IconButton() (+2 more)

### Community 11 - "strengthProgress.ts"
Cohesion: 0.13
Nodes (23): summarizeStrengthSessions(), buildExerciseDetail(), buildExerciseList(), buildLoggerReference(), collectHistories(), estimateOneRepMax(), ExerciseHistory, exerciseKeyFor() (+15 more)

### Community 12 - "App.tsx"
Cohesion: 0.27
Nodes (8): App(), AppContent(), Stack, Tab, TabIconProps, expo-updates, ChangelogScreen(), DialogHost()

### Community 13 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, expo-haptics, expo-image-picker (+18 more)

### Community 14 - "run"
Cohesion: 0.06
Nodes (84): expo-crypto, db, getAll(), getFirst(), run(), addExerciseCategories(), addGymParentIdColumn(), backfillNumericGradeColors() (+76 more)

### Community 15 - "SettingsScreen.tsx"
Cohesion: 0.17
Nodes (21): countWideGradeBandClimbs(), findWideBandClimbs(), narrowWideGradeBands(), summarize(), WideBandSummary, AppSettingRow, getKilterLastSyncedAt(), getKilterUsername() (+13 more)

### Community 16 - "ClimbProgressView.tsx"
Cohesion: 0.15
Nodes (23): buildAllTimeStats(), buildWeekCompletion(), findFirstReachedDate(), findFlashRate(), findLongestStreakEver(), findMostClimbsInSession(), getAvailableClimbGyms(), getFavoriteGradeGymIds() (+15 more)

### Community 17 - "font"
Cohesion: 0.19
Nodes (16): expo-haptics, react-native, BodyweightLogRow, createStyles(), KIND_LABEL, createStyles(), createStyles(), createStyles() (+8 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (23): main, name, private, version, babel-preset-expo, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono (+15 more)

### Community 19 - "applyClimbEvents"
Cohesion: 0.18
Nodes (14): applyClimbEvents(), ClimbDeletePayload, ClimbEditPayload, ClimbLogPayload, ClimbRelabelPayload, EventLike, findSessionHighIndex(), isClimbPayload() (+6 more)

### Community 20 - "GymEditScreen.tsx"
Cohesion: 0.21
Nodes (16): defaultOptionsForType(), createDraftRowId(), createStyles(), EditableGradeRow, getCreatedGymId(), GRADE_COLOR_OPTIONS, GradeRowFields, GradingType (+8 more)

### Community 21 - "getSessionEvents"
Cohesion: 0.11
Nodes (21): summarizeClimbSession(), getGymById(), AllTimeStats, buildGradeDistribution(), buildRecentSends(), ClimbGymOption, DayCompletion, findHardestSendThisWeek() (+13 more)

### Community 22 - "kilterAuth.ts"
Cohesion: 0.17
Nodes (15): createKilterAuth(), Deps, form(), KilterAuthErrorKind, SessionStore, StoredSession, memoryStore(), setup() (+7 more)

### Community 23 - "kilterMapping.ts"
Cohesion: 0.19
Nodes (17): CLIMB_NAME_KEYS, dayKeyOf(), extractLogList(), GradeOption, ImportedClimb, ImportedSession, KilterLog, mapKilterLogs() (+9 more)

### Community 24 - "StrengthSessionScreen.tsx"
Cohesion: 0.16
Nodes (20): appendEvent(), getAbandonedSessions(), parseWeightInput(), roundWeight(), createPanelStyles(), createStyles(), DEFAULT_INPUT, ExerciseInputMemory (+12 more)

### Community 27 - "ExerciseProgressScreen.tsx"
Cohesion: 0.16
Nodes (18): ExerciseDetail, ExerciseSession, formatMonthDay(), formatVolume(), formatWeight(), sliceSeriesToRange(), StrengthMetric, formatEntryDate() (+10 more)

### Community 28 - "ASCEND Design System"
Cohesion: 0.08
Nodes (25): ASCEND Design System, Buttons, CalendarScreen, Chips, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette, Components (+17 more)

### Community 29 - "SessionHistoryScreen.tsx"
Cohesion: 0.15
Nodes (22): Cards & grouped lists, setSessionNotes(), setSessionStatus(), setSessionTitle(), ClimbDraft, createStyles(), EditingEntry, formatDateLine() (+14 more)

### Community 30 - "ExercisePickerSheet.tsx"
Cohesion: 0.27
Nodes (11): formatDaysAgo(), createStyles(), ExercisePickerSheet(), ExerciseUsage, Filter, Props, Chip(), ChevronLeftIcon() (+3 more)

### Community 31 - "exerciseData.ts"
Cohesion: 0.21
Nodes (12): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+4 more)

### Community 32 - "Dialog.tsx"
Cohesion: 0.17
Nodes (10): createStyles(), DialogButton, DialogRequest, HostProps, hosts, HostSetter, HitSlop, PressableScaleProps (+2 more)

### Community 33 - "ClimbSessionScreen.tsx"
Cohesion: 0.21
Nodes (13): getGradeOptionsForGym(), useClimbSessionLogs(), RootStackScreenProps, ClimbSessionScreen(), ClimbSessionScreenProps, createStyles(), GRADE_OPTIONS, GradeOption (+5 more)

### Community 39 - "useTheme"
Cohesion: 0.26
Nodes (14): SessionRow(), KilterConnectScreen(), createStyles(), Props, StartCard(), Button(), Card(), createStyles() (+6 more)

### Community 40 - "StrengthProgressView.tsx"
Cohesion: 0.19
Nodes (16): @react-navigation/native, getExerciseNames(), buildStrengthVolumeTrend(), buildWeeklyFrequency(), formatShortDate(), ExerciseSummary, createStyles(), ExerciseRow() (+8 more)

### Community 41 - "CalendarScreen.tsx"
Cohesion: 0.06
Nodes (53): TabNavigator(), react-native-safe-area-context, @react-navigation/bottom-tabs, @react-navigation/native-stack, firstOfMonth(), formatLocalDate(), getSessionsForDateRange(), getSessionsForMonth() (+45 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — In Progress 🔄, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 📋 (+4 more)

### Community 43 - "sessionNotification.ts"
Cohesion: 0.30
Nodes (10): describeWhere(), dismiss(), ensureChannel(), formatClock(), loadModule(), NotificationsModule, requestSessionNotificationPermission(), syncActiveSessionNotification() (+2 more)

### Community 44 - "applySetEvents"
Cohesion: 0.26
Nodes (9): applySetEvents(), EventLike, isSetDeletePayload(), isSetEditPayload(), isSetPayload(), LoggedSet, SetDeletePayload, SetEditPayload (+1 more)

### Community 45 - "colors.ts"
Cohesion: 0.13
Nodes (21): getThemeMode(), setAccentColorId(), setThemeMode(), ButtonProps, ButtonVariant, createStyles(), getVariantStyles(), ThemeContext (+13 more)

### Community 46 - "RecentSessionsList.tsx"
Cohesion: 0.36
Nodes (8): formatDuration(), createStyles(), DAY_SHORT, Props, RecentSessionsList(), whenLabel(), DumbbellIcon(), MountainMarkIcon()

### Community 47 - "changelog.ts"
Cohesion: 0.38
Nodes (4): APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 49 - "SessionRow"
Cohesion: 0.12
Nodes (11): buildSessionReplayMap(), CalendarInsightColors, findHardestClimb(), SessionReplay, colors, mockGetSessionEvents, ClimbLog, mockGetAll (+3 more)

### Community 50 - "BarChart.tsx"
Cohesion: 0.29
Nodes (6): Bar, BarChart(), BarChartProps, BarSegment, createStyles(), LegendItem

### Community 51 - "GymSelectScreen.tsx"
Cohesion: 0.35
Nodes (11): ensureDefaultClimbGymSeeded(), ensureSelectedClimbGym(), getGyms(), getSelectedClimbGym(), setSelectedClimbGym(), setSessionGymId(), createStyles(), gradingTypeLabel() (+3 more)

### Community 52 - "spacing"
Cohesion: 0.21
Nodes (8): ScreenHeaderProps, createStyles(), SegmentedControlOption, SegmentedControlProps, createStyles(), EditableValue, StepperProps, spacing

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
Cohesion: 0.36
Nodes (8): deleteRoutine(), getRoutines(), RoutineSummary, countLabel(), createStyles(), Props, RoutinesScreen(), showDialog()

### Community 57 - "Climb + Gym Workout Tracker"
Cohesion: 0.29
Nodes (6): Climb + Gym Workout Tracker, Current Codebase Shape, Graph Index, Relationship Notes, Repo Graph, Runtime Map

### Community 58 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, babel-preset-expo, jest, jest-expo, @types/jest, @types/react, typescript

### Community 59 - "kilterSessionStore.ts"
Cohesion: 0.48
Nodes (5): clearKilterSession(), getKilterSession(), setKilterSession(), databaseSessionStore, mockGet

### Community 60 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): expo/tsconfig.base, compilerOptions, strict, exclude, extends

### Community 61 - "web-coi-proxy.js"
Cohesion: 0.40
Nodes (3): COI_HEADERS, http, server

### Community 63 - "react"
Cohesion: 0.50
Nodes (4): react, createStyles(), Divider(), DividerProps

### Community 64 - "expo"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, expo

## Knowledge Gaps
- **364 isolated node(s):** `Stack`, `Tab`, `TabIconProps`, `name`, `slug` (+359 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 408 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `LogScreen.tsx`, `ThemeColors`, `ui/index.ts`, `BugReportScreen.tsx`, `App.tsx`, `run`, `SettingsScreen.tsx`, `ClimbProgressView.tsx`, `font`, `GymEditScreen.tsx`, `StrengthSessionScreen.tsx`, `ExerciseProgressScreen.tsx`, `SessionHistoryScreen.tsx`, `ExercisePickerSheet.tsx`, `Dialog.tsx`, `ClimbSessionScreen.tsx`, `StrengthProgressView.tsx`, `CalendarScreen.tsx`, `colors.ts`, `RecentSessionsList.tsx`, `BarChart.tsx`, `GymSelectScreen.tsx`, `spacing`, `LineChart.tsx`, `RoutinesScreen.tsx`, `react`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `react-native` connect `font` to `LogScreen.tsx`, `ThemeColors`, `BugReportScreen.tsx`, `App.tsx`, `run`, `SettingsScreen.tsx`, `ClimbProgressView.tsx`, `package.json`, `GymEditScreen.tsx`, `StrengthSessionScreen.tsx`, `ExerciseProgressScreen.tsx`, `SessionHistoryScreen.tsx`, `ExercisePickerSheet.tsx`, `Dialog.tsx`, `ClimbSessionScreen.tsx`, `useTheme`, `StrengthProgressView.tsx`, `CalendarScreen.tsx`, `colors.ts`, `RecentSessionsList.tsx`, `BarChart.tsx`, `GymSelectScreen.tsx`, `spacing`, `LineChart.tsx`, `RoutinesScreen.tsx`, `react`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _364 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LogScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07086197778952935 - nodes in this community are weakly interconnected._
- **Should `ThemeColors` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._
- **Should `gymStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11965811965811966 - nodes in this community are weakly interconnected._
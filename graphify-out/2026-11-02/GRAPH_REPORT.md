# Graph Report - ASCEND  (2026-11-02)

## Corpus Check
- 138 files · ~140,062 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .log 1)

## Summary
- 1164 nodes · 3820 edges · 64 communities (53 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0cba1bdf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTheme
- getAll
- strengthProgress.ts
- gymStore.ts
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- ui/index.ts
- ClimbSessionScreen.tsx
- run
- getFirst
- kilterMapping.ts
- dependencies
- SettingsScreen.tsx
- sessionStore.ts
- ClimbProgressView.tsx
- react-native
- package.json
- applyClimbEvents
- StrengthSessionScreen.tsx
- bugReportApi.ts
- kilterSync.ts
- LogScreen.tsx
- routineStore.ts
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- kilterSync.test.ts
- ASCEND Design System
- Product
- PressableScale
- exerciseData.ts
- font
- SessionRow
- Execution Order (Build Steps 1-5)
- Dark Mode UI Design Style
- PRD: Target Users (Indoor Boulderers)
- PRD: Home Screen (Resume + Planned + Quick Starts)
- PRD: Settings (Units, Grade System, Export, Reset)
- spacing
- ExerciseProgressScreen.tsx
- CalendarScreen.tsx
- ASCEND Feature Roadmap
- applySetEvents
- StrengthProgressView.tsx
- colors.ts
- SessionHistoryScreen.tsx
- RecentSessionsList.tsx
- AGENTS.md
- RoutinesScreen.tsx
- changelog.ts
- sessionStore.import.test.ts
- progressInsights.test.ts
- README.md
- Release Readiness
- scripts
- Climb + Gym Workout Tracker
- expo
- devDependencies
- formatDaysAgo
- tsconfig.json
- web-coi-proxy.js
- jest

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 94 edges
2. `font()` - 77 edges
3. `run()` - 67 edges
4. `StrengthSessionScreen()` - 55 edges
5. `getFirst()` - 51 edges
6. `react-native` - 49 edges
7. `getSessionEvents()` - 49 edges
8. `react` - 47 edges
9. `ThemeColors` - 47 edges
10. `ClimbSessionScreen()` - 41 edges

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

## Communities (64 total, 11 thin omitted)

### Community 0 - "useTheme"
Cohesion: 0.15
Nodes (26): react-native-safe-area-context, getInstallId(), BugReportScreen(), collectDiagnostics(), createStyles(), formatDiagnostics(), hasNativeModule(), Props (+18 more)

### Community 1 - "getAll"
Cohesion: 0.13
Nodes (17): db, getAll(), addGymParentIdColumn(), backfillNumericGradeColors(), deleteBodyweightLog(), getBodyweightLogs(), getLatestBodyweight(), logBodyweight() (+9 more)

### Community 2 - "strengthProgress.ts"
Cohesion: 0.15
Nodes (20): buildExerciseDetail(), buildLoggerReference(), collectHistories(), estimateOneRepMax(), ExerciseHistory, exerciseKeyFor(), findRecordSetIds(), heavierSet() (+12 more)

### Community 3 - "gymStore.ts"
Cohesion: 0.08
Nodes (52): AppSettingRow, createGym(), CreateGymInput, defaultColorGrades, defaultNumericGrades, defaultOptionsForType(), defaultVScaleGrades, deleteGym() (+44 more)

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
Cohesion: 0.11
Nodes (29): App(), AppContent(), Stack, Tab, TabIcon(), TabIconProps, TabNavigator(), react-native-svg (+21 more)

### Community 9 - "ClimbSessionScreen.tsx"
Cohesion: 0.07
Nodes (60): findSessionHighIndex(), formatVGrade(), isGradeBand(), loggedClimbVGrade(), formatClockTime(), formatDuration(), formatElapsed(), angleFromPoint() (+52 more)

### Community 10 - "run"
Cohesion: 0.17
Nodes (24): run(), addExerciseCategories(), builtinExerciseCategories, createBodyweightLogsTable(), createExerciseCategoriesSchema(), createExternalLogsTable(), createRoutinesTables(), dedupeGymGradeOptions() (+16 more)

### Community 11 - "getFirst"
Cohesion: 0.19
Nodes (19): getFirst(), countExercisesInCategory(), createCategory(), createExercise(), defaultExercises, deleteCategory(), ensureDefaultExercisesSeeded(), findCategoryByName() (+11 more)

### Community 12 - "kilterMapping.ts"
Cohesion: 0.17
Nodes (18): importExternalClimbSession(), CLIMB_NAME_KEYS, dayKeyOf(), extractLogList(), GradeOption, ImportedClimb, ImportedSession, KilterLog (+10 more)

### Community 13 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, expo-haptics, expo-image-picker (+18 more)

### Community 14 - "SettingsScreen.tsx"
Cohesion: 0.14
Nodes (32): countWideGradeBandClimbs(), findWideBandClimbs(), narrowWideGradeBands(), summarize(), AppSettingRow, getKilterLastSyncedAt(), getKilterUsername(), getSessionReminder() (+24 more)

### Community 15 - "sessionStore.ts"
Cohesion: 0.11
Nodes (23): ExternalClimbInput, ExternalClimbSessionInput, isSessionEventType(), SESSION_EVENT_TYPES, SessionCreateOptions, WideBandSummary, ActiveSessionEventType, ClimbEditPayload (+15 more)

### Community 16 - "ClimbProgressView.tsx"
Cohesion: 0.10
Nodes (41): midpointGrade(), AllTimeStats, buildAllTimeStats(), buildGradeDistribution(), buildGradeDistributionAcrossGyms(), buildHardestSendTrend(), buildRecentSends(), buildWeekCompletion() (+33 more)

### Community 17 - "react-native"
Cohesion: 0.12
Nodes (23): react-native, firstOfMonth(), createStyles(), Dock(), DockProps, TAB_BAR_HEIGHT, TAB_BAR_INSET, useTabBarBottomOffset() (+15 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (25): main, name, private, version, babel-preset-expo, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono (+17 more)

### Community 19 - "applyClimbEvents"
Cohesion: 0.23
Nodes (11): applyClimbEvents(), ClimbDeletePayload, ClimbEditPayload, ClimbLog, ClimbLogPayload, ClimbRelabelPayload, EventLike, isClimbPayload() (+3 more)

### Community 20 - "StrengthSessionScreen.tsx"
Cohesion: 0.12
Nodes (34): @react-navigation/native, getCategories(), getExercises(), setExerciseCategory(), setExerciseFavorite(), getRoutine(), getCompletedSessions(), buildExerciseList() (+26 more)

### Community 21 - "bugReportApi.ts"
Cohesion: 0.20
Nodes (13): expo-crypto, authHeaders(), BugReportInput, BugReportSource, buildBugReportRow(), isBugReportApiConfigured(), SCREENSHOT_BUCKET, screenshotExtension() (+5 more)

### Community 22 - "kilterSync.ts"
Cohesion: 0.12
Nodes (23): fetchKilterLogs(), call(), createKilterAuth(), Deps, form(), KilterAuthError, KilterAuthErrorKind, SessionStore (+15 more)

### Community 23 - "LogScreen.tsx"
Cohesion: 0.09
Nodes (40): buildRecentSessions(), buildWeekActivity(), ClimbSessionSummary, durationOf(), ExerciseTopSet, GradeCount, lastClimbSessions(), LastSessions (+32 more)

### Community 24 - "routineStore.ts"
Cohesion: 0.17
Nodes (15): assertNameFree(), clampTarget(), createRoutine(), normalizeRoutineName(), Routine, RoutineItem, RoutineSummary, mockGetAll (+7 more)

### Community 27 - "kilterSync.test.ts"
Cohesion: 0.21
Nodes (8): clearKilterSession(), getKilterSession(), setKilterSession(), kilterAuth, databaseSessionStore, mockGet, mockFetch, mockImport

### Community 28 - "ASCEND Design System"
Cohesion: 0.08
Nodes (25): ASCEND Design System, Buttons, CalendarScreen, Chips, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette, Components (+17 more)

### Community 29 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 30 - "PressableScale"
Cohesion: 0.09
Nodes (27): expo-haptics, ButtonProps, ButtonVariant, createStyles(), getVariantStyles(), Chip(), ChipProps, createStyles() (+19 more)

### Community 31 - "exerciseData.ts"
Cohesion: 0.21
Nodes (12): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+4 more)

### Community 32 - "font"
Cohesion: 0.15
Nodes (21): createStyles(), createStyles(), Props, createStyles(), Props, countDelta(), Delta, percentDelta() (+13 more)

### Community 33 - "SessionRow"
Cohesion: 0.24
Nodes (6): buildSessionReplayMap(), CalendarInsightColors, findHardestClimb(), colors, mockGetSessionEvents, SessionRow

### Community 39 - "spacing"
Cohesion: 0.19
Nodes (9): Bar, BarChart(), BarChartProps, BarSegment, createStyles(), LegendItem, createStyles(), ScreenHeaderProps (+1 more)

### Community 40 - "ExerciseProgressScreen.tsx"
Cohesion: 0.20
Nodes (17): ExerciseDetail, ExerciseSession, formatMonthDay(), formatVolume(), formatWeight(), StrengthMetric, createStyles(), deltaSub() (+9 more)

### Community 41 - "CalendarScreen.tsx"
Cohesion: 0.10
Nodes (32): buildMonthGrid(), chunkWeeks(), WEEKDAYS, SessionReplay, formatLocalDate(), getAbandonedSessions(), getSessionsForMonth(), CalendarNavProp (+24 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — Mostly done, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 🔄 (+4 more)

### Community 43 - "applySetEvents"
Cohesion: 0.24
Nodes (10): applySetEvents(), EventLike, isSetDeletePayload(), isSetEditPayload(), isSetPayload(), LoggedSet, routineFromSets(), SetDeletePayload (+2 more)

### Community 44 - "StrengthProgressView.tsx"
Cohesion: 0.15
Nodes (21): @react-navigation/bottom-tabs, @react-navigation/native-stack, getExerciseNames(), buildStrengthVolumeTrend(), buildWeeklyFrequency(), formatShortDate(), ExerciseSummary, RootStackParamList (+13 more)

### Community 45 - "colors.ts"
Cohesion: 0.10
Nodes (31): react, getThemeMode(), CardProps, CardTone, createStyles(), Divider(), DividerProps, createStyles() (+23 more)

### Community 46 - "SessionHistoryScreen.tsx"
Cohesion: 0.17
Nodes (18): setSessionNotes(), setSessionTitle(), ClimbDraft, createStyles(), EditingEntry, formatDateLine(), formatLogTime(), formatSessionType() (+10 more)

### Community 47 - "RecentSessionsList.tsx"
Cohesion: 0.29
Nodes (10): createStyles(), DAY_SHORT, Props, RecentSessionsList(), whenLabel(), createStyles(), Props, StartCard() (+2 more)

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 49 - "RoutinesScreen.tsx"
Cohesion: 0.33
Nodes (10): Cards & grouped lists, deleteRoutine(), getRoutines(), countLabel(), createStyles(), Props, RoutinesScreen(), createStyles() (+2 more)

### Community 50 - "changelog.ts"
Cohesion: 0.38
Nodes (4): APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry

### Community 51 - "sessionStore.import.test.ts"
Cohesion: 0.25
Nodes (4): basePayload, mockGetFirst, mockRun, Sess

### Community 54 - "Release Readiness"
Cohesion: 0.25
Nodes (7): Apple Distribution Options Before Public App Store Release, Build Commands, Current Repo State, EAS Update Rules, Recommended ASCEND Path, Release Readiness, Still Required Before First EAS Build

### Community 55 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, android, ios, start, test, test:ci, typecheck, web

### Community 56 - "Climb + Gym Workout Tracker"
Cohesion: 0.29
Nodes (6): Climb + Gym Workout Tracker, Current Codebase Shape, Graph Index, Relationship Notes, Repo Graph, Runtime Map

### Community 57 - "expo"
Cohesion: 0.40
Nodes (3): config, { getDefaultConfig }, expo

### Community 58 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, babel-preset-expo, jest, jest-expo, @types/jest, @types/react, typescript

### Community 59 - "formatDaysAgo"
Cohesion: 0.50
Nodes (4): formatDaysAgo(), parseWeightInput(), roundWeight(), BodyweightRow()

### Community 60 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): expo/tsconfig.base, compilerOptions, strict, exclude, extends

### Community 61 - "web-coi-proxy.js"
Cohesion: 0.40
Nodes (3): COI_HEADERS, http, server

## Knowledge Gaps
- **387 isolated node(s):** `Stack`, `Tab`, `TabIconProps`, `name`, `slug` (+382 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 436 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `run()` connect `run` to `getAll`, `gymStore.ts`, `ClimbSessionScreen.tsx`, `getFirst`, `kilterMapping.ts`, `SessionHistoryScreen.tsx`, `sessionStore.ts`, `SettingsScreen.tsx`, `RoutinesScreen.tsx`, `sessionStore.import.test.ts`, `StrengthSessionScreen.tsx`, `LogScreen.tsx`, `routineStore.ts`, `kilterSync.test.ts`, `exerciseData.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `font()` connect `font` to `useTheme`, `gymStore.ts`, `spacing`, `ui/index.ts`, `ClimbSessionScreen.tsx`, `CalendarScreen.tsx`, `ExerciseProgressScreen.tsx`, `StrengthProgressView.tsx`, `colors.ts`, `SessionHistoryScreen.tsx`, `SettingsScreen.tsx`, `ClimbProgressView.tsx`, `react-native`, `RoutinesScreen.tsx`, `RecentSessionsList.tsx`, `StrengthSessionScreen.tsx`, `PressableScale`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _387 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `getAll` be split into smaller, more focused modules?**
  _Cohesion score 0.1341991341991342 - nodes in this community are weakly interconnected._
- **Should `strengthProgress.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Should `gymStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07826694619147449 - nodes in this community are weakly interconnected._
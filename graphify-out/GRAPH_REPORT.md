# Graph Report - ASCEND  (2026-10-21)

## Corpus Check
- 132 files · ~136,670 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 1138 nodes · 3768 edges · 60 communities (51 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e743fdad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- BugReportScreen.tsx
- progressInsights.ts
- strengthProgress.ts
- gymStore.ts
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- ui/index.ts
- SessionHistoryScreen.tsx
- run
- RoutineEditScreen.tsx
- useTheme
- dependencies
- SettingsScreen.tsx
- sessionStore.ts
- ClimbProgressView.tsx
- ProgressScreen.tsx
- package.json
- applyClimbEvents
- StrengthSessionScreen.tsx
- bugReportApi.ts
- kilterSync.ts
- LogScreen.tsx
- dashboard.ts
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- colors.ts
- ASCEND Design System
- font
- PressableScale
- exerciseData.ts
- LastSessionCard.tsx
- ClimbSessionScreen.tsx
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
- react-native
- Button
- RecentSessionsList.tsx
- AGENTS.md
- App.tsx
- changelog.ts
- dateUtils.ts
- progressInsights.test.ts
- README.md
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
5. `getFirst()` - 50 edges
6. `react-native` - 49 edges
7. `getSessionEvents()` - 48 edges
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
- `Current Focus` --references--> `LogScreen()`  [INFERRED]
  AGENTS.md → src/screens/LogScreen.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Climbing Grade Data Pipeline** — arch_grade_data_model, prd_gym_grade_mapping, img_tape_climbing, img_climbing_analytics [INFERRED 0.80]
- **Fast Logging UX Triad** — claudemd_fast_logging_principle, design_large_tap_targets, prd_design_principles [INFERRED 0.82]
- **Session Logging Core Loop** — arch_event_based_model, arch_local_first, prd_climbing_sessions, prd_strength_training [INFERRED 0.85]

## Communities (60 total, 9 thin omitted)

### Community 0 - "BugReportScreen.tsx"
Cohesion: 0.20
Nodes (13): expo-image-picker, expo-mail-composer, expo-updates, BugReportScreen(), collectDiagnostics(), createStyles(), formatDiagnostics(), hasNativeModule() (+5 more)

### Community 1 - "progressInsights.ts"
Cohesion: 0.16
Nodes (15): getGymById(), AllTimeStats, buildRecentSends(), buildStrengthVolumeTrend(), ClimbGymOption, DayCompletion, findHardestSendThisWeek(), formatShortDate() (+7 more)

### Community 2 - "strengthProgress.ts"
Cohesion: 0.14
Nodes (20): buildExerciseDetail(), buildLoggerReference(), collectHistories(), estimateOneRepMax(), ExerciseHistory, exerciseKeyFor(), ExerciseSummary, findRecordSetIds() (+12 more)

### Community 3 - "gymStore.ts"
Cohesion: 0.08
Nodes (54): react-native-safe-area-context, AppSettingRow, createGym(), CreateGymInput, defaultColorGrades, defaultNumericGrades, defaultOptionsForType(), defaultVScaleGrades (+46 more)

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
Cohesion: 0.16
Nodes (20): ExerciseCategoryRow, createStyles(), ExercisePickerSheet(), ExerciseUsage, Filter, Props, Chip(), ChipProps (+12 more)

### Community 9 - "SessionHistoryScreen.tsx"
Cohesion: 0.09
Nodes (44): angleFromPoint(), clampToRange(), DIAL_MAX_SPAN_MS, dialRange, hourHandAngle(), minuteHandAngle(), snapToMinute(), stepMinutes() (+36 more)

### Community 10 - "run"
Cohesion: 0.05
Nodes (61): Climb + Gym Workout Tracker, Current Codebase Shape, Graph Index, Relationship Notes, Repo Graph, Runtime Map, db, getAll() (+53 more)

### Community 11 - "RoutineEditScreen.tsx"
Cohesion: 0.15
Nodes (25): createCategory(), createExercise(), defaultExercises, ensureDefaultExercisesSeeded(), findCategoryByName(), getExercises(), normalizeCategoryName(), normalizeExerciseName() (+17 more)

### Community 12 - "useTheme"
Cohesion: 0.21
Nodes (14): react, createStyles(), Props, StartCard(), createStyles(), Props, WeekCard(), Card() (+6 more)

### Community 13 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, expo-haptics, expo-image-picker (+18 more)

### Community 14 - "SettingsScreen.tsx"
Cohesion: 0.08
Nodes (54): getFirst(), formatClockTime(), describeWhere(), dismiss(), ensureChannel(), formatClock(), loadModule(), NotificationsModule (+46 more)

### Community 15 - "sessionStore.ts"
Cohesion: 0.08
Nodes (31): buildSessionReplayMap(), CalendarInsightColors, findHardestClimb(), colors, mockGetSessionEvents, ClimbLog, ExternalClimbInput, ExternalClimbSessionInput (+23 more)

### Community 16 - "ClimbProgressView.tsx"
Cohesion: 0.16
Nodes (22): buildAllTimeStats(), buildWeekCompletion(), buildWeeklyFrequency(), findFirstReachedDate(), findFlashRate(), findLongestStreakEver(), findMostClimbsInSession(), getAvailableClimbGyms() (+14 more)

### Community 17 - "ProgressScreen.tsx"
Cohesion: 0.15
Nodes (15): react-native-svg, firstOfMonth(), BodyweightCard(), createStyles(), createStyles(), MONTH_NAMES, ProgressMode, ProgressScreen() (+7 more)

### Community 18 - "package.json"
Cohesion: 0.07
Nodes (27): config, { getDefaultConfig }, jest, preset, main, name, private, version (+19 more)

### Community 19 - "applyClimbEvents"
Cohesion: 0.18
Nodes (16): applyClimbEvents(), ClimbDeletePayload, ClimbEditPayload, ClimbLogPayload, ClimbRelabelPayload, EventLike, findSessionHighIndex(), formatVGrade() (+8 more)

### Community 20 - "StrengthSessionScreen.tsx"
Cohesion: 0.16
Nodes (19): getAbandonedSessions(), LoggerReference, parseWeightInput(), roundWeight(), SetInput, createPanelStyles(), createStyles(), DEFAULT_INPUT (+11 more)

### Community 21 - "bugReportApi.ts"
Cohesion: 0.20
Nodes (13): expo-crypto, authHeaders(), BugReportInput, BugReportSource, buildBugReportRow(), isBugReportApiConfigured(), SCREENSHOT_BUCKET, screenshotExtension() (+5 more)

### Community 22 - "kilterSync.ts"
Cohesion: 0.07
Nodes (47): getGradeOptionsForGym(), importExternalClimbSession(), inTransaction(), setKilterLastSyncedAt(), fetchKilterLogs(), call(), createKilterAuth(), Deps (+39 more)

### Community 23 - "LogScreen.tsx"
Cohesion: 0.16
Nodes (21): lastClimbSessions(), WeekActivity, createSession(), getActiveSession(), getSessionStreak(), uuid(), getLastRoutineId(), createStyles() (+13 more)

### Community 24 - "dashboard.ts"
Cohesion: 0.15
Nodes (14): buildRecentSessions(), durationOf(), ExerciseTopSet, GradeCount, LastSessions, lastStrengthSessions(), plural(), RecentSession (+6 more)

### Community 27 - "colors.ts"
Cohesion: 0.21
Nodes (13): ThemeContext, ThemeContextValue, ThemeProvider(), AccentColorId, AccentTint, applyAccent(), darkColors, gradePalette (+5 more)

### Community 28 - "ASCEND Design System"
Cohesion: 0.08
Nodes (25): ASCEND Design System, Buttons, CalendarScreen, Chips, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette, Components (+17 more)

### Community 29 - "font"
Cohesion: 0.27
Nodes (10): ChangelogScreen(), createStyles(), formatEntryDate(), KIND_LABEL, createStyles(), KilterConnectScreen(), createStyles(), Props (+2 more)

### Community 30 - "PressableScale"
Cohesion: 0.12
Nodes (20): AppContent(), expo-haptics, createStyles(), DialogButton, DialogHost(), DialogRequest, HostProps, hosts (+12 more)

### Community 31 - "exerciseData.ts"
Cohesion: 0.19
Nodes (11): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+3 more)

### Community 32 - "LastSessionCard.tsx"
Cohesion: 0.29
Nodes (10): ClimbSessionSummary, countDelta(), Delta, percentDelta(), createStyles(), DAY_SHORT, dayLabel(), gradeDelta() (+2 more)

### Community 33 - "ClimbSessionScreen.tsx"
Cohesion: 0.19
Nodes (17): appendEvent(), canChangeSessionGym(), deleteEmptySession(), getSessionEvents(), isSessionEventType(), useClimbSessionLogs(), ClimbSessionScreen(), ClimbSessionScreenProps (+9 more)

### Community 39 - "spacing"
Cohesion: 0.21
Nodes (8): Bar, BarChart(), BarChartProps, BarSegment, createStyles(), LegendItem, ScreenHeaderProps, spacing

### Community 40 - "ExerciseProgressScreen.tsx"
Cohesion: 0.19
Nodes (18): ExerciseDetail, ExerciseSession, formatMonthDay(), formatVolume(), formatWeight(), sliceSeriesToRange(), StrengthMetric, createStyles() (+10 more)

### Community 41 - "CalendarScreen.tsx"
Cohesion: 0.11
Nodes (30): SessionReplay, formatLocalDate(), getSessionsForDateRange(), getSessionsForMonth(), buildMonthGrid(), CalendarNavProp, CalendarScreen(), formatGroupLabel() (+22 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — In Progress 🔄, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 📋 (+4 more)

### Community 43 - "applySetEvents"
Cohesion: 0.23
Nodes (10): applySetEvents(), EventLike, isSetDeletePayload(), isSetEditPayload(), isSetPayload(), LoggedSet, SetDeletePayload, SetEditPayload (+2 more)

### Community 44 - "StrengthProgressView.tsx"
Cohesion: 0.24
Nodes (10): formatDaysAgo(), createStyles(), ExerciseRow(), ExerciseRowProps, NavProp, Props, Sparkline(), BodyweightRow() (+2 more)

### Community 45 - "react-native"
Cohesion: 0.14
Nodes (20): react-native, CardProps, CardTone, HitSlop, IconButtonProps, IconButtonVariant, ListRowProps, sectionHeaderStyles (+12 more)

### Community 46 - "Button"
Cohesion: 0.26
Nodes (10): ActiveSessionCard(), createStyles(), formatClock(), Props, Button(), ButtonProps, ButtonVariant, createStyles() (+2 more)

### Community 47 - "RecentSessionsList.tsx"
Cohesion: 0.36
Nodes (8): formatDuration(), createStyles(), DAY_SHORT, Props, RecentSessionsList(), whenLabel(), DumbbellIcon(), MountainMarkIcon()

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 49 - "App.tsx"
Cohesion: 0.08
Nodes (42): App(), Stack, Tab, TabIcon(), TabIconProps, TabNavigator(), Cards & grouped lists, @react-navigation/bottom-tabs (+34 more)

### Community 50 - "changelog.ts"
Cohesion: 0.38
Nodes (4): APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry

### Community 51 - "dateUtils.ts"
Cohesion: 0.60
Nodes (4): buildWeekActivity(), addDays(), formatElapsed(), startOfWeek()

### Community 52 - "progressInsights.test.ts"
Cohesion: 0.33
Nodes (3): buildGradeDistribution(), mockGetSessionEvents, PALETTE

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
- **372 isolated node(s):** `Stack`, `Tab`, `TabIconProps`, `name`, `slug` (+367 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 418 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `BugReportScreen.tsx`, `gymStore.ts`, `ui/index.ts`, `SessionHistoryScreen.tsx`, `RoutineEditScreen.tsx`, `SettingsScreen.tsx`, `ClimbProgressView.tsx`, `ProgressScreen.tsx`, `StrengthSessionScreen.tsx`, `LogScreen.tsx`, `colors.ts`, `font`, `PressableScale`, `LastSessionCard.tsx`, `ClimbSessionScreen.tsx`, `spacing`, `ExerciseProgressScreen.tsx`, `CalendarScreen.tsx`, `StrengthProgressView.tsx`, `react-native`, `Button`, `RecentSessionsList.tsx`, `App.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `run()` connect `run` to `ClimbSessionScreen.tsx`, `gymStore.ts`, `SessionHistoryScreen.tsx`, `RoutineEditScreen.tsx`, `SettingsScreen.tsx`, `sessionStore.ts`, `App.tsx`, `kilterSync.ts`, `LogScreen.tsx`, `exerciseData.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _372 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `strengthProgress.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._
- **Should `gymStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07581453634085213 - nodes in this community are weakly interconnected._
- **Should `ASCEND Project Instructions` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
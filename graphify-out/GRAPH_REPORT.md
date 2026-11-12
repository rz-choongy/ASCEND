# Graph Report - ASCEND  (2026-11-09)

## Corpus Check
- 157 files · ~580,260 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .log 1)

## Summary
- 1326 nodes · 4327 edges · 68 communities (57 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `99709396`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ThemeColors
- db.ts
- StrengthSessionScreen.tsx
- gymStore.ts
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- StrengthProgressView.tsx
- SettingsScreen.tsx
- run
- exerciseStore.ts
- GymEditScreen.tsx
- dependencies
- CalendarScreen.tsx
- sessionStore.ts
- progressInsights.ts
- colors.ts
- package.json
- applyClimbEvents
- SessionHistoryScreen.tsx
- BugReportScreen.tsx
- kilterSync.ts
- LogScreen.tsx
- GymSelectScreen.tsx
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- Dock.tsx
- ASCEND Design System
- Product
- PressableScale
- ClimbSessionScreen.tsx
- LastSessionCard.tsx
- RoutineEditScreen.tsx
- Execution Order (Build Steps 1-5)
- Dark Mode UI Design Style
- PRD: Target Users (Indoor Boulderers)
- PRD: Home Screen (Resume + Planned + Quick Starts)
- PRD: Settings (Units, Grade System, Export, Reset)
- BarChart.tsx
- getSessionEvents
- CalendarScreen
- ASCEND Feature Roadmap
- applySetEvents
- App.tsx
- ui/index.ts
- build-compact.py
- react
- AGENTS.md
- ExerciseProgressScreen.tsx
- ClimbProgressView.tsx
- ExercisePickerSheet.tsx
- RoutinesScreen.tsx
- README.md
- Release Readiness
- scripts
- Climb + Gym Workout Tracker
- expo
- devDependencies
- useTheme
- tsconfig.json
- web-coi-proxy.js
- calendarInsights.ts
- seedDemo.ts
- announce-apk.sh
- SessionStrip.tsx
- jest

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 105 edges
2. `font()` - 90 edges
3. `run()` - 73 edges
4. `react-native` - 58 edges
5. `getSessionEvents()` - 55 edges
6. `getFirst()` - 54 edges
7. `StrengthSessionScreen()` - 54 edges
8. `react` - 52 edges
9. `ThemeColors` - 51 edges
10. `ClimbSessionScreen()` - 47 edges

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

## Communities (68 total, 11 thin omitted)

### Community 0 - "ThemeColors"
Cohesion: 0.13
Nodes (19): ChangelogScreen(), createStyles(), formatEntryDate(), KIND_LABEL, createStyles(), Props, createStyles(), GymScopeSheet() (+11 more)

### Community 1 - "db.ts"
Cohesion: 0.23
Nodes (10): expo-crypto, db, deleteBodyweightLog(), getBodyweightLogs(), getLatestBodyweight(), logBodyweight(), mockGetAll, mockGetFirst (+2 more)

### Community 2 - "StrengthSessionScreen.tsx"
Cohesion: 0.10
Nodes (40): buildExerciseDetail(), buildExerciseList(), buildLoggerReference(), collectHistories(), estimateOneRepMax(), ExerciseHistory, exerciseKeyFor(), ExerciseNames (+32 more)

### Community 3 - "gymStore.ts"
Cohesion: 0.10
Nodes (22): AppSettingRow, CreateGymInput, defaultColorGrades, defaultNumericGrades, defaultVScaleGrades, doReplaceGymGradeOptions(), ensureNamedVScaleGym(), getRootGyms() (+14 more)

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

### Community 8 - "StrengthProgressView.tsx"
Cohesion: 0.13
Nodes (21): react-native-svg, @react-navigation/native, filterSessionsToPeriod(), createStyles(), ExerciseRow(), ExerciseRowProps, NavProp, Props (+13 more)

### Community 9 - "SettingsScreen.tsx"
Cohesion: 0.07
Nodes (71): expo-updates, getFirst(), ensureDefaultClimbGymSeeded(), ensureSelectedClimbGym(), getSelectedClimbGym(), gymDisplayName(), gymDisplayNameById(), describeWhere() (+63 more)

### Community 10 - "run"
Cohesion: 0.15
Nodes (30): App(), getAll(), run(), addExerciseCategories(), addGymLogoDomainColumn(), addGymLogoImageColumn(), addGymParentIdColumn(), backfillNumericGradeColors() (+22 more)

### Community 11 - "exerciseStore.ts"
Cohesion: 0.15
Nodes (23): countExercisesInCategory(), createCategory(), createExercise(), defaultExercises, deleteCategory(), ensureDefaultExercisesSeeded(), findCategoryByName(), getCategories() (+15 more)

### Community 12 - "GymEditScreen.tsx"
Cohesion: 0.15
Nodes (26): createGym(), deleteGym(), getGymById(), normalizeName(), runInTransaction(), setGymLogoDomain(), setGymLogoImage(), setSelectedClimbGym() (+18 more)

### Community 13 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, @expo-google-fonts/google-sans-code, @expo-google-fonts/google-sans-flex (+20 more)

### Community 14 - "CalendarScreen.tsx"
Cohesion: 0.14
Nodes (14): buildMonthGrid(), chunkWeeks(), WEEKDAYS, formatLocalDate(), getSessionsForMonth(), CalendarNavProp, CalendarView, formatWeekRangeLabel() (+6 more)

### Community 15 - "sessionStore.ts"
Cohesion: 0.05
Nodes (48): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+40 more)

### Community 16 - "progressInsights.ts"
Cohesion: 0.09
Nodes (25): AllTimeStats, buildRecentSends(), buildStrengthVolumeTrend(), buildWeeklyFrequency(), ClimbGymOption, DayCompletion, findFlashRate(), findHardestSendThisWeek() (+17 more)

### Community 17 - "colors.ts"
Cohesion: 0.09
Nodes (31): ButtonProps, ButtonVariant, getVariantStyles(), createStyles(), Divider(), DividerProps, GradeChipProps, luminanceOf() (+23 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (23): main, name, private, version, babel-preset-expo, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono (+15 more)

### Community 19 - "applyClimbEvents"
Cohesion: 0.18
Nodes (14): applyClimbEvents(), ClimbDeletePayload, ClimbEditPayload, ClimbLog, ClimbLogPayload, ClimbRelabelPayload, EventLike, isClimbPayload() (+6 more)

### Community 20 - "SessionHistoryScreen.tsx"
Cohesion: 0.08
Nodes (47): formatClockTime(), formatDuration(), angleFromPoint(), clampToRange(), DIAL_MAX_SPAN_MS, dialRange, hourHandAngle(), minuteHandAngle() (+39 more)

### Community 21 - "BugReportScreen.tsx"
Cohesion: 0.09
Nodes (29): expo-image-picker, expo-mail-composer, APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry, authHeaders(), BugAttachment (+21 more)

### Community 22 - "kilterSync.ts"
Cohesion: 0.07
Nodes (44): setKilterLastSyncedAt(), fetchKilterLogs(), call(), createKilterAuth(), Deps, form(), KilterAuthError, KilterAuthErrorKind (+36 more)

### Community 23 - "LogScreen.tsx"
Cohesion: 0.09
Nodes (42): buildRecentSessions(), buildWeekActivity(), ClimbSessionSummary, DAY_SHORT, durationOf(), ExerciseTopSet, GradeCount, lastClimbSessions() (+34 more)

### Community 24 - "GymSelectScreen.tsx"
Cohesion: 0.12
Nodes (32): autoMatchGymLogos(), checkWebLogo(), fetchJson(), FILLER_WORDS, gymLogoUrl(), hasWebLogo(), hostOf(), isSubset() (+24 more)

### Community 27 - "Dock.tsx"
Cohesion: 0.38
Nodes (8): createStyles(), Dock(), DockProps, TAB_BAR_HEIGHT, TAB_BAR_INSET, useTabBarBottomOffset(), useTabBarClearance(), useTabBarSideMargin()

### Community 28 - "ASCEND Design System"
Cohesion: 0.08
Nodes (25): ASCEND Design System, Buttons, CalendarScreen, Chips, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette, Components (+17 more)

### Community 29 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 30 - "PressableScale"
Cohesion: 0.16
Nodes (15): expo-haptics, Chip(), ChipProps, createStyles(), AnimatedPressable, HitSlop, PressableScale(), PressableScaleProps (+7 more)

### Community 31 - "ClimbSessionScreen.tsx"
Cohesion: 0.12
Nodes (30): findSessionHighIndex(), formatVGrade(), isGradeBand(), isNewThirtyDayHigh(), loggedClimbVGrade(), matchGradeOption(), pickStartingGrade(), formatElapsed() (+22 more)

### Community 32 - "LastSessionCard.tsx"
Cohesion: 0.33
Nodes (9): countDelta(), Delta, percentDelta(), createStyles(), DAY_SHORT, dayLabel(), gradeDelta(), LastSessionCard() (+1 more)

### Community 33 - "RoutineEditScreen.tsx"
Cohesion: 0.15
Nodes (22): getExercises(), assertNameFree(), clampTarget(), createRoutine(), getRoutine(), normalizeRoutineName(), Routine, RoutineItem (+14 more)

### Community 39 - "BarChart.tsx"
Cohesion: 0.29
Nodes (6): Bar, BarChart(), BarChartProps, BarSegment, createStyles(), LegendItem

### Community 40 - "getSessionEvents"
Cohesion: 0.17
Nodes (17): midpointGrade(), buildGradeDistribution(), buildGradeDistributionAcrossGyms(), buildHardestSendTrend(), buildTopSendsTrend(), countSendsAtGrade(), findFirstSendsOfTopGrades(), findRecentMilestone() (+9 more)

### Community 41 - "CalendarScreen"
Cohesion: 0.20
Nodes (17): getAbandonedSessions(), CalendarScreen(), formatGroupLabel(), formatSessionTitle(), formatTime(), nextMonth(), nextWeek(), prevMonth() (+9 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — Mostly done, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 🔄 (+4 more)

### Community 43 - "applySetEvents"
Cohesion: 0.22
Nodes (11): applySetEvents(), EventLike, isSetDeletePayload(), isSetEditPayload(), isSetPayload(), LoggedSet, routineFromSets(), SetDeletePayload (+3 more)

### Community 44 - "App.tsx"
Cohesion: 0.15
Nodes (17): Stack, Tab, TabIcon(), TabIconProps, TabNavigator(), @react-navigation/bottom-tabs, @react-navigation/native-stack, RootStackParamList (+9 more)

### Community 45 - "ui/index.ts"
Cohesion: 0.10
Nodes (33): react-native, CardProps, CardTone, DialogButton, DialogRequest, HostProps, hosts, HostSetter (+25 more)

### Community 46 - "build-compact.py"
Cohesion: 0.17
Nodes (15): col(), log_c(), ph(), progress_c(), section(), stat(), barcode(), chip() (+7 more)

### Community 47 - "react"
Cohesion: 0.23
Nodes (11): react, createStyles(), DAY_SHORT, Props, RecentSessionsList(), whenLabel(), GymLogo(), GymLogoProps (+3 more)

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 49 - "ExerciseProgressScreen.tsx"
Cohesion: 0.17
Nodes (19): ExerciseDetail, ExerciseSession, formatMonthDay(), formatVolume(), sliceSeriesToRange(), StrengthMetric, RootStackScreenProps, createStyles() (+11 more)

### Community 50 - "ClimbProgressView.tsx"
Cohesion: 0.18
Nodes (18): buildAllTimeStats(), findFirstReachedDate(), formatDayMonth(), getAvailableClimbGyms(), GradeDistributionBar, ProgressPeriod, TOP_SENDS_AVERAGED, trendWeeksForPeriod() (+10 more)

### Community 51 - "ExercisePickerSheet.tsx"
Cohesion: 0.22
Nodes (14): formatDaysAgo(), formatWeight(), BodyweightLogRow, BodyweightCard(), createStyles(), createStyles(), ExercisePickerSheet(), Filter (+6 more)

### Community 52 - "RoutinesScreen.tsx"
Cohesion: 0.26
Nodes (12): Cards & grouped lists, react-native-safe-area-context, deleteRoutine(), getRoutines(), RoutineSummary, countLabel(), createStyles(), Props (+4 more)

### Community 54 - "Release Readiness"
Cohesion: 0.22
Nodes (8): Apple Distribution Options Before Public App Store Release, Build Commands, Current Repo State, EAS Update Rules, Recommended ASCEND Path, Release Readiness, Shipping a Native Change to Installed Phones, Still Required Before First EAS Build

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

### Community 59 - "useTheme"
Cohesion: 0.17
Nodes (22): AppContent(), react-native-reanimated, createStyles(), SessionSummarySheetProps, createStyles(), KilterConnectScreen(), ActiveSessionCard(), createStyles() (+14 more)

### Community 60 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): expo/tsconfig.base, compilerOptions, strict, exclude, extends

### Community 61 - "web-coi-proxy.js"
Cohesion: 0.40
Nodes (3): COI_HEADERS, http, server

### Community 63 - "calendarInsights.ts"
Cohesion: 0.19
Nodes (8): buildSessionReplayMap(), CalendarInsightColors, DayDotKind, dayDotKinds(), findHardestClimb(), SessionReplay, colors, mockGetSessionEvents

### Community 64 - "seedDemo.ts"
Cohesion: 0.52
Nodes (6): applyDevUrlOptions(), seedDemo(), uuid(), getGradeOptionsForGym(), setAccentColorId(), setThemeMode()

### Community 65 - "announce-apk.sh"
Cohesion: 0.83
Nodes (3): set_latest(), announce-apk.sh script, version_at()

## Knowledge Gaps
- **425 isolated node(s):** `Stack`, `Tab`, `TabIconProps`, `name`, `slug` (+420 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 483 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `font()` connect `useTheme` to `ThemeColors`, `StrengthSessionScreen.tsx`, `StrengthProgressView.tsx`, `SettingsScreen.tsx`, `exerciseStore.ts`, `GymEditScreen.tsx`, `CalendarScreen.tsx`, `colors.ts`, `SessionHistoryScreen.tsx`, `BugReportScreen.tsx`, `LogScreen.tsx`, `GymSelectScreen.tsx`, `Dock.tsx`, `PressableScale`, `ClimbSessionScreen.tsx`, `LastSessionCard.tsx`, `RoutineEditScreen.tsx`, `BarChart.tsx`, `CalendarScreen`, `ui/index.ts`, `react`, `ExerciseProgressScreen.tsx`, `ClimbProgressView.tsx`, `ExercisePickerSheet.tsx`, `RoutinesScreen.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `react-native` connect `ui/index.ts` to `ThemeColors`, `StrengthSessionScreen.tsx`, `StrengthProgressView.tsx`, `SettingsScreen.tsx`, `exerciseStore.ts`, `GymEditScreen.tsx`, `CalendarScreen.tsx`, `colors.ts`, `package.json`, `SessionHistoryScreen.tsx`, `BugReportScreen.tsx`, `LogScreen.tsx`, `GymSelectScreen.tsx`, `Dock.tsx`, `PressableScale`, `ClimbSessionScreen.tsx`, `LastSessionCard.tsx`, `RoutineEditScreen.tsx`, `BarChart.tsx`, `App.tsx`, `react`, `ExerciseProgressScreen.tsx`, `ClimbProgressView.tsx`, `ExercisePickerSheet.tsx`, `RoutinesScreen.tsx`, `useTheme`, `seedDemo.ts`, `SessionStrip.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `run()` connect `run` to `seedDemo.ts`, `db.ts`, `RoutineEditScreen.tsx`, `gymStore.ts`, `SettingsScreen.tsx`, `exerciseStore.ts`, `GymEditScreen.tsx`, `sessionStore.ts`, `RoutinesScreen.tsx`, `SessionHistoryScreen.tsx`, `GymSelectScreen.tsx`, `ClimbSessionScreen.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _425 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ThemeColors` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `StrengthSessionScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected._
- **Should `gymStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10333333333333333 - nodes in this community are weakly interconnected._
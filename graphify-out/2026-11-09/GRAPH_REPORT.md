# Graph Report - ASCEND  (2026-11-02)

## Corpus Check
- 138 files · ~222,569 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .log 1)

## Summary
- 1166 nodes · 3836 edges · 59 communities (50 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `00c67463`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- BugReportScreen.tsx
- getAll
- StrengthSessionScreen.tsx
- gymStore.ts
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- Icon.tsx
- ClimbSessionScreen.tsx
- run
- RoutineEditScreen.tsx
- GymEditScreen.tsx
- dependencies
- LogScreen.tsx
- sessionStore.ts
- ClimbProgressView.tsx
- useTheme
- package.json
- applyClimbEvents
- EndTimeSheet.tsx
- bugReportApi.ts
- kilterSync.ts
- dashboard.ts
- GymSelectScreen.tsx
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- react-native
- ASCEND Design System
- Product
- ui/index.ts
- exerciseData.ts
- LastSessionCard.tsx
- gymStore.test.ts
- Execution Order (Build Steps 1-5)
- Dark Mode UI Design Style
- PRD: Target Users (Indoor Boulderers)
- PRD: Home Screen (Resume + Planned + Quick Starts)
- PRD: Settings (Units, Grade System, Export, Reset)
- spacing
- CalendarScreen.tsx
- ASCEND Feature Roadmap
- applySetEvents
- App.tsx
- colors.ts
- SessionHistoryScreen.tsx
- RecentSessionsList.tsx
- AGENTS.md
- ChangelogScreen.tsx
- README.md
- Release Readiness
- scripts
- Climb + Gym Workout Tracker
- App
- devDependencies
- font
- tsconfig.json
- web-coi-proxy.js

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
10. `ClimbSessionScreen()` - 42 edges

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

## Communities (59 total, 9 thin omitted)

### Community 0 - "BugReportScreen.tsx"
Cohesion: 0.19
Nodes (14): BugReportScreen(), collectDiagnostics(), createStyles(), formatDiagnostics(), hasNativeModule(), CloseIcon(), createStyles(), HitSlop (+6 more)

### Community 1 - "getAll"
Cohesion: 0.20
Nodes (13): expo-sqlite, db, getAll(), addGymParentIdColumn(), backfillNumericGradeColors(), deleteBodyweightLog(), getBodyweightLogs(), getLatestBodyweight() (+5 more)

### Community 2 - "StrengthSessionScreen.tsx"
Cohesion: 0.06
Nodes (77): getExerciseNames(), buildExerciseDetail(), buildExerciseList(), buildLoggerReference(), collectHistories(), estimateOneRepMax(), ExerciseDetail, ExerciseHistory (+69 more)

### Community 3 - "gymStore.ts"
Cohesion: 0.15
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

### Community 8 - "Icon.tsx"
Cohesion: 0.24
Nodes (9): TabIcon(), react-native-svg, ArrowRightIcon(), CalendarTabIcon(), IconProps, LogTabIcon(), MoonIcon(), ProgressTabIcon() (+1 more)

### Community 9 - "ClimbSessionScreen.tsx"
Cohesion: 0.06
Nodes (88): getFirst(), findSessionHighIndex(), formatVGrade(), isGradeBand(), loggedClimbVGrade(), formatClockTime(), ensureSelectedClimbGym(), getSelectedClimbGym() (+80 more)

### Community 10 - "run"
Cohesion: 0.18
Nodes (23): run(), addExerciseCategories(), builtinExerciseCategories, createBodyweightLogsTable(), createExerciseCategoriesSchema(), createExternalLogsTable(), createRoutinesTables(), dedupeGymGradeOptions() (+15 more)

### Community 11 - "RoutineEditScreen.tsx"
Cohesion: 0.07
Nodes (57): Cards & grouped lists, countExercisesInCategory(), createCategory(), createExercise(), defaultExercises, deleteCategory(), ensureDefaultExercisesSeeded(), findCategoryByName() (+49 more)

### Community 12 - "GymEditScreen.tsx"
Cohesion: 0.17
Nodes (19): setSelectedClimbGym(), setSetting(), createDraftRowId(), createStyles(), EditableGradeRow, findDuplicateLabel(), getCreatedGymId(), GRADE_COLOR_OPTIONS (+11 more)

### Community 13 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, expo-haptics, expo-image-picker (+18 more)

### Community 14 - "LogScreen.tsx"
Cohesion: 0.19
Nodes (16): buildWeekActivity(), addDays(), formatElapsed(), formatLocalDate(), startOfWeek(), getSessionsForDateRange(), getLastRoutineId(), formatWeekRangeLabel() (+8 more)

### Community 15 - "sessionStore.ts"
Cohesion: 0.07
Nodes (34): ExternalClimbInput, ExternalClimbSessionInput, getAllCompletedSessionCount(), getSessionsForDate(), basePayload, mockGetFirst, mockRun, Sess (+26 more)

### Community 16 - "ClimbProgressView.tsx"
Cohesion: 0.09
Nodes (44): midpointGrade(), AllTimeStats, buildAllTimeStats(), buildGradeDistribution(), buildGradeDistributionAcrossGyms(), buildHardestSendTrend(), buildRecentSends(), buildStrengthVolumeTrend() (+36 more)

### Community 17 - "useTheme"
Cohesion: 0.15
Nodes (20): react, firstOfMonth(), getCompletedSessions(), getSessionStreak(), BodyweightCard(), createStyles(), createStyles(), MONTH_NAMES (+12 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (23): jest, preset, main, name, private, version, babel-preset-expo, @expo-google-fonts/geist (+15 more)

### Community 19 - "applyClimbEvents"
Cohesion: 0.23
Nodes (11): applyClimbEvents(), ClimbDeletePayload, ClimbEditPayload, ClimbLog, ClimbLogPayload, ClimbRelabelPayload, EventLike, isClimbPayload() (+3 more)

### Community 20 - "EndTimeSheet.tsx"
Cohesion: 0.28
Nodes (15): angleFromPoint(), clampToRange(), DIAL_MAX_SPAN_MS, dialRange, hourHandAngle(), minuteHandAngle(), snapToMinute(), stepMinutes() (+7 more)

### Community 21 - "bugReportApi.ts"
Cohesion: 0.20
Nodes (13): expo-crypto, authHeaders(), BugReportInput, BugReportSource, buildBugReportRow(), isBugReportApiConfigured(), SCREENSHOT_BUCKET, screenshotExtension() (+5 more)

### Community 22 - "kilterSync.ts"
Cohesion: 0.06
Nodes (48): clearKilterSession(), getKilterSession(), setKilterSession(), fetchKilterLogs(), call(), createKilterAuth(), Deps, form() (+40 more)

### Community 23 - "dashboard.ts"
Cohesion: 0.19
Nodes (12): buildRecentSessions(), durationOf(), ExerciseTopSet, GradeCount, lastClimbSessions(), lastStrengthSessions(), plural(), summarizeClimbSession() (+4 more)

### Community 24 - "GymSelectScreen.tsx"
Cohesion: 0.27
Nodes (10): setSessionGymId(), createStyles(), gradingTypeLabel(), GymSelectScreen(), GymSelectScreenProps, createStyles(), Props, StartCard() (+2 more)

### Community 27 - "react-native"
Cohesion: 0.36
Nodes (7): react-native, createStyles(), DockProps, TAB_BAR_HEIGHT, TAB_BAR_INSET, useTabBarBottomOffset(), useTabBarClearance()

### Community 28 - "ASCEND Design System"
Cohesion: 0.08
Nodes (25): ASCEND Design System, Buttons, CalendarScreen, Chips, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette, Components (+17 more)

### Community 29 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 30 - "ui/index.ts"
Cohesion: 0.11
Nodes (31): AppContent(), expo-haptics, ButtonProps, ButtonVariant, getVariantStyles(), Chip(), ChipProps, createStyles() (+23 more)

### Community 31 - "exerciseData.ts"
Cohesion: 0.19
Nodes (13): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+5 more)

### Community 32 - "LastSessionCard.tsx"
Cohesion: 0.17
Nodes (18): ClimbSessionSummary, LastSessions, StrengthSessionSummary, WeekActivity, countDelta(), Delta, percentDelta(), createStyles() (+10 more)

### Community 33 - "gymStore.test.ts"
Cohesion: 0.33
Nodes (4): mockGetAll, mockGetFirst, mockRun, GymRow

### Community 39 - "spacing"
Cohesion: 0.18
Nodes (10): Bar, BarChart(), BarChartProps, BarSegment, createStyles(), LegendItem, createStyles(), SegmentedControlOption (+2 more)

### Community 41 - "CalendarScreen.tsx"
Cohesion: 0.11
Nodes (28): buildMonthGrid(), chunkWeeks(), WEEKDAYS, getAbandonedSessions(), getSessionsForMonth(), CalendarNavProp, CalendarScreen(), formatGroupLabel() (+20 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — Mostly done, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 🔄 (+4 more)

### Community 43 - "applySetEvents"
Cohesion: 0.12
Nodes (17): buildSessionReplayMap(), CalendarInsightColors, findHardestClimb(), SessionReplay, colors, mockGetSessionEvents, applySetEvents(), EventLike (+9 more)

### Community 44 - "App.tsx"
Cohesion: 0.14
Nodes (16): Stack, Tab, TabIconProps, TabNavigator(), expo-font, expo-status-bar, expo-updates, @react-navigation/bottom-tabs (+8 more)

### Community 45 - "colors.ts"
Cohesion: 0.12
Nodes (24): CardProps, CardTone, ListRowProps, sectionHeaderStyles, gridStyles, StatGridProps, StatItem, StatRowProps (+16 more)

### Community 46 - "SessionHistoryScreen.tsx"
Cohesion: 0.17
Nodes (18): defaultOptionsForType(), setSessionNotes(), setSessionTitle(), ClimbDraft, createStyles(), EditingEntry, formatDateLine(), formatLogTime() (+10 more)

### Community 47 - "RecentSessionsList.tsx"
Cohesion: 0.31
Nodes (9): RecentSession, formatDuration(), createStyles(), DAY_SHORT, Props, RecentSessionsList(), whenLabel(), DumbbellIcon() (+1 more)

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 50 - "ChangelogScreen.tsx"
Cohesion: 0.26
Nodes (9): APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry, ChangelogScreen(), createStyles(), formatEntryDate(), KIND_LABEL (+1 more)

### Community 54 - "Release Readiness"
Cohesion: 0.25
Nodes (7): Apple Distribution Options Before Public App Store Release, Build Commands, Current Repo State, EAS Update Rules, Recommended ASCEND Path, Release Readiness, Still Required Before First EAS Build

### Community 55 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, android, ios, start, test, test:ci, typecheck, web

### Community 56 - "Climb + Gym Workout Tracker"
Cohesion: 0.29
Nodes (6): Climb + Gym Workout Tracker, Current Codebase Shape, Graph Index, Relationship Notes, Repo Graph, Runtime Map

### Community 57 - "App"
Cohesion: 0.33
Nodes (4): App(), config, { getDefaultConfig }, expo

### Community 58 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, babel-preset-expo, jest, jest-expo, @types/jest, @types/react, typescript

### Community 59 - "font"
Cohesion: 0.18
Nodes (18): react-native-safe-area-context, BodyweightLogRow, createStyles(), KilterConnectScreen(), createStyles(), GymScopeSheet(), Props, ActiveSessionCard() (+10 more)

### Community 60 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): expo/tsconfig.base, compilerOptions, strict, exclude, extends

### Community 61 - "web-coi-proxy.js"
Cohesion: 0.40
Nodes (3): COI_HEADERS, http, server

## Knowledge Gaps
- **387 isolated node(s):** `Stack`, `Tab`, `TabIconProps`, `name`, `slug` (+382 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 436 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `font()` connect `font` to `BugReportScreen.tsx`, `LastSessionCard.tsx`, `StrengthSessionScreen.tsx`, `spacing`, `CalendarScreen.tsx`, `ClimbSessionScreen.tsx`, `RoutineEditScreen.tsx`, `GymEditScreen.tsx`, `colors.ts`, `SessionHistoryScreen.tsx`, `RecentSessionsList.tsx`, `ClimbProgressView.tsx`, `useTheme`, `ChangelogScreen.tsx`, `EndTimeSheet.tsx`, `GymSelectScreen.tsx`, `react-native`, `ui/index.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `run()` connect `run` to `getAll`, `gymStore.test.ts`, `gymStore.ts`, `ClimbSessionScreen.tsx`, `RoutineEditScreen.tsx`, `GymEditScreen.tsx`, `SessionHistoryScreen.tsx`, `sessionStore.ts`, `kilterSync.ts`, `GymSelectScreen.tsx`, `exerciseData.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _387 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `StrengthSessionScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.058002735978112174 - nodes in this community are weakly interconnected._
- **Should `gymStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1452991452991453 - nodes in this community are weakly interconnected._
- **Should `ASCEND Project Instructions` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
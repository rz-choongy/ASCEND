# Graph Report - agent-a8083636fd0dd783d  (2026-10-21)

## Corpus Check
- 127 files · ~135,122 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 1120 nodes · 3732 edges · 55 communities (46 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `06381f92`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GymSelectScreen.tsx
- Dock.tsx
- strengthProgress.ts
- gymStore.ts
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- Icon.tsx
- EndTimeSheet.tsx
- run
- RoutineEditScreen.tsx
- ExerciseProgressScreen.tsx
- dependencies
- SettingsScreen.tsx
- domain/types.ts
- ClimbProgressView.tsx
- react
- package.json
- climbLogUtils.ts
- StrengthSessionScreen.tsx
- calendarInsights.ts
- kilterSync.ts
- sessionStore.ts
- LogScreen.tsx
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- App.tsx
- SessionHistoryScreen.tsx
- getSessionById
- ui/index.ts
- exerciseData.ts
- sessionStore.import.test.ts
- ClimbSessionScreen.tsx
- Execution Order (Build Steps 1-5)
- Dark Mode UI Design Style
- PRD: Target Users (Indoor Boulderers)
- PRD: Home Screen (Resume + Planned + Quick Starts)
- PRD: Settings (Units, Grade System, Export, Reset)
- font
- formatWeight
- CalendarScreen.tsx
- ASCEND Feature Roadmap
- applySetEvents
- jest
- colors.ts
- expo
- AGENTS.md
- useTheme
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
6. `getFirst()` - 49 edges
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

## Communities (55 total, 9 thin omitted)

### Community 0 - "GymSelectScreen.tsx"
Cohesion: 0.14
Nodes (23): expo-image-picker, expo-mail-composer, BugReportScreen(), createStyles(), diagnosticsBlock(), hasNativeModule(), createStyles(), gradingTypeLabel() (+15 more)

### Community 1 - "Dock.tsx"
Cohesion: 0.38
Nodes (8): createStyles(), Dock(), DockProps, TAB_BAR_HEIGHT, TAB_BAR_INSET, useTabBarBottomOffset(), useTabBarClearance(), useTabBarSideMargin()

### Community 2 - "strengthProgress.ts"
Cohesion: 0.14
Nodes (19): buildExerciseDetail(), buildLoggerReference(), collectHistories(), ExerciseDetail, ExerciseHistory, exerciseKeyFor(), ExerciseNames, ExerciseSession (+11 more)

### Community 3 - "gymStore.ts"
Cohesion: 0.08
Nodes (46): AppSettingRow, createGym(), CreateGymInput, defaultColorGrades, defaultNumericGrades, defaultOptionsForType(), defaultVScaleGrades, deleteGym() (+38 more)

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
Cohesion: 0.22
Nodes (10): TabIcon(), TabNavigator(), react-native-svg, ArrowRightIcon(), CalendarTabIcon(), IconProps, LogTabIcon(), MoonIcon() (+2 more)

### Community 9 - "EndTimeSheet.tsx"
Cohesion: 0.26
Nodes (16): formatClockTime(), angleFromPoint(), clampToRange(), DIAL_MAX_SPAN_MS, dialRange, hourHandAngle(), minuteHandAngle(), snapToMinute() (+8 more)

### Community 10 - "run"
Cohesion: 0.06
Nodes (62): Climb + Gym Workout Tracker, Current Codebase Shape, Graph Index, Relationship Notes, Repo Graph, Runtime Map, expo-crypto, expo-sqlite (+54 more)

### Community 11 - "RoutineEditScreen.tsx"
Cohesion: 0.14
Nodes (28): createCategory(), createExercise(), defaultExercises, deleteCategory(), ensureDefaultExercisesSeeded(), findCategoryByName(), getCategories(), getExercises() (+20 more)

### Community 12 - "ExerciseProgressScreen.tsx"
Cohesion: 0.21
Nodes (11): RootStackScreenProps, createStyles(), METRIC_TITLE, Range, RANGE_MONTHS, SessionRow(), SessionRowProps, createStyles() (+3 more)

### Community 13 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, expo-haptics, expo-image-picker (+18 more)

### Community 14 - "SettingsScreen.tsx"
Cohesion: 0.07
Nodes (63): APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry, getFirst(), ensureDefaultClimbGymSeeded(), ensureSelectedClimbGym(), getSelectedClimbGym() (+55 more)

### Community 15 - "domain/types.ts"
Cohesion: 0.11
Nodes (17): ActiveSessionEventType, ClimbEditPayload, ClimbResult, ClimbUndoPayload, DeleteLoggedEntryPayload, EventRow, ExerciseCategoryRow, SessionCorrectionEventType (+9 more)

### Community 16 - "ClimbProgressView.tsx"
Cohesion: 0.07
Nodes (57): applyClimbEvents(), AllTimeStats, buildAllTimeStats(), buildGradeDistribution(), buildGradeDistributionAcrossGyms(), buildRecentSends(), buildStrengthVolumeTrend(), buildWeekCompletion() (+49 more)

### Community 17 - "react"
Cohesion: 0.13
Nodes (20): react, react-native-safe-area-context, @react-navigation/native, firstOfMonth(), ChangelogScreen(), createStyles(), formatEntryDate(), KIND_LABEL (+12 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (23): main, name, private, version, babel-preset-expo, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono (+15 more)

### Community 19 - "climbLogUtils.ts"
Cohesion: 0.16
Nodes (11): ClimbDeletePayload, ClimbEditPayload, ClimbLogPayload, ClimbRelabelPayload, EventLike, isClimbPayload(), isDeletePayload(), isEditPayload() (+3 more)

### Community 20 - "StrengthSessionScreen.tsx"
Cohesion: 0.14
Nodes (22): estimateOneRepMax(), findRecordSetIds(), initialInputFor(), isNewRecord(), parseRepsInput(), parseWeightInput(), roundWeight(), mockGetSessionEvents (+14 more)

### Community 21 - "calendarInsights.ts"
Cohesion: 0.20
Nodes (7): buildSessionReplayMap(), CalendarInsightColors, findHardestClimb(), SessionReplay, colors, mockGetSessionEvents, ClimbLog

### Community 22 - "kilterSync.ts"
Cohesion: 0.07
Nodes (42): fetchKilterLogs(), call(), createKilterAuth(), Deps, form(), KilterAuthError, KilterAuthErrorKind, SessionStore (+34 more)

### Community 23 - "sessionStore.ts"
Cohesion: 0.18
Nodes (16): appendEvent(), appendSessionCorrectionEvent(), countWideGradeBandClimbs(), ExternalClimbInput, ExternalClimbSessionInput, findWideBandClimbs(), getAllCompletedSessionCount(), importExternalClimbSession() (+8 more)

### Community 24 - "LogScreen.tsx"
Cohesion: 0.07
Nodes (48): buildRecentSessions(), buildWeekActivity(), ClimbSessionSummary, durationOf(), ExerciseTopSet, GradeCount, lastClimbSessions(), LastSessions (+40 more)

### Community 27 - "App.tsx"
Cohesion: 0.23
Nodes (10): App(), AppContent(), Stack, Tab, TabIconProps, @react-navigation/bottom-tabs, @react-navigation/native-stack, RootStackParamList (+2 more)

### Community 28 - "SessionHistoryScreen.tsx"
Cohesion: 0.06
Nodes (43): ASCEND Design System, Buttons, CalendarScreen, Chips, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette, Components (+35 more)

### Community 29 - "getSessionById"
Cohesion: 0.23
Nodes (11): deleteEmptySession(), getEarliestEndAt(), getLastLogAt(), getSessionById(), setSessionEndedAt(), setSessionStatus(), mockGetAll, mockGetFirst (+3 more)

### Community 30 - "ui/index.ts"
Cohesion: 0.09
Nodes (38): createStyles(), ExercisePickerSheet(), Filter, Props, CardProps, CardTone, Chip(), ChipProps (+30 more)

### Community 31 - "exerciseData.ts"
Cohesion: 0.19
Nodes (12): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+4 more)

### Community 32 - "sessionStore.import.test.ts"
Cohesion: 0.22
Nodes (5): basePayload, mockGetFirst, mockRun, Sess, ClimbLogPayload

### Community 33 - "ClimbSessionScreen.tsx"
Cohesion: 0.17
Nodes (19): findSessionHighIndex(), formatVGrade(), loggedClimbVGrade(), getGyms(), canChangeSessionGym(), useClimbSessionLogs(), ClimbSessionScreen(), ClimbSessionScreenProps (+11 more)

### Community 39 - "font"
Cohesion: 0.14
Nodes (21): createStyles(), Props, ActiveSessionCard(), createStyles(), formatClock(), Props, BodyweightRow(), createStyles() (+13 more)

### Community 40 - "formatWeight"
Cohesion: 0.32
Nodes (8): formatVolume(), formatWeight(), sliceSeriesToRange(), deltaSub(), ExerciseProgressScreen(), formatSignedVolume(), formatSignedWeight(), formatSetLabel()

### Community 41 - "CalendarScreen.tsx"
Cohesion: 0.11
Nodes (30): formatLocalDate(), getAbandonedSessions(), getSessionsForDateRange(), getSessionsForMonth(), buildMonthGrid(), CalendarNavProp, CalendarScreen(), formatGroupLabel() (+22 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — In Progress 🔄, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 📋 (+4 more)

### Community 43 - "applySetEvents"
Cohesion: 0.23
Nodes (10): applySetEvents(), EventLike, isSetDeletePayload(), isSetEditPayload(), isSetPayload(), LoggedSet, SetDeletePayload, SetEditPayload (+2 more)

### Community 45 - "colors.ts"
Cohesion: 0.10
Nodes (26): Dividers & separators, react-native, createStyles(), Divider(), DividerProps, createStyles(), HitSlop, IconButtonProps (+18 more)

### Community 46 - "expo"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, expo

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 49 - "useTheme"
Cohesion: 0.22
Nodes (17): Cards & grouped lists, countExercisesInCategory(), CategoriesScreen(), countLabel(), createStyles(), Props, countLabel(), createStyles() (+9 more)

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
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `GymSelectScreen.tsx`, `Dock.tsx`, `gymStore.ts`, `EndTimeSheet.tsx`, `RoutineEditScreen.tsx`, `ExerciseProgressScreen.tsx`, `SettingsScreen.tsx`, `ClimbProgressView.tsx`, `react`, `StrengthSessionScreen.tsx`, `LogScreen.tsx`, `App.tsx`, `SessionHistoryScreen.tsx`, `ui/index.ts`, `ClimbSessionScreen.tsx`, `font`, `formatWeight`, `CalendarScreen.tsx`, `colors.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `run()` connect `run` to `sessionStore.import.test.ts`, `gymStore.ts`, `RoutineEditScreen.tsx`, `SettingsScreen.tsx`, `sessionStore.ts`, `SessionHistoryScreen.tsx`, `getSessionById`, `exerciseData.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _366 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `GymSelectScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13793103448275862 - nodes in this community are weakly interconnected._
- **Should `strengthProgress.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Should `gymStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08421985815602837 - nodes in this community are weakly interconnected._
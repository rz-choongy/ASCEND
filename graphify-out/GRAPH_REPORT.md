# Graph Report - ASCEND  (2026-10-20)

## Corpus Check
- 132 files · ~136,021 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 1132 nodes · 3737 edges · 59 communities (50 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `06381f92`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- Dock.tsx
- StrengthSessionScreen.tsx
- ClimbSessionScreen.tsx
- ASCEND Project Instructions
- expo
- J5: Create Strength Workout Template (HEVY-Style)
- PRD: Climbing Sessions (Gym Setup + Grade Chips)
- ui/index.ts
- sessionStore.ts
- run
- LogScreen.tsx
- sessionNotification.ts
- dependencies
- SettingsScreen.tsx
- dashboard.ts
- ClimbProgressView.tsx
- useTheme
- package.json
- applyClimbEvents
- EndTimeSheet.tsx
- SessionRow
- kilterSync.ts
- bugReportApi.ts
- RecentSessionsList.tsx
- App Navigation Design Prompt
- J4: Resume Interrupted Session
- App.tsx
- ASCEND Design System
- SessionHistoryScreen.tsx
- font
- exerciseData.ts
- kilterMapping.ts
- kilterSync.test.ts
- Execution Order (Build Steps 1-5)
- Dark Mode UI Design Style
- PRD: Target Users (Indoor Boulderers)
- PRD: Home Screen (Resume + Planned + Quick Starts)
- PRD: Settings (Units, Grade System, Export, Reset)
- LastSessionCard.tsx
- changelog.ts
- CalendarScreen.tsx
- ASCEND Feature Roadmap
- applySetEvents
- kilterSessionStore.ts
- colors.ts
- expo
- react-native
- AGENTS.md
- BugReportScreen.tsx
- StrengthProgressView.tsx
- BugReportScreen
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
5. `react-native` - 49 edges
6. `getFirst()` - 48 edges
7. `getSessionEvents()` - 48 edges
8. `react` - 47 edges
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
- `Current Focus` --references--> `LogScreen()`  [INFERRED]
  AGENTS.md → src/screens/LogScreen.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Climbing Grade Data Pipeline** — arch_grade_data_model, prd_gym_grade_mapping, img_tape_climbing, img_climbing_analytics [INFERRED 0.80]
- **Fast Logging UX Triad** — claudemd_fast_logging_principle, design_large_tap_targets, prd_design_principles [INFERRED 0.82]
- **Session Logging Core Loop** — arch_event_based_model, arch_local_first, prd_climbing_sessions, prd_strength_training [INFERRED 0.85]

## Communities (59 total, 9 thin omitted)

### Community 0 - "react"
Cohesion: 0.10
Nodes (27): react, ChipProps, createStyles(), HitSlop, IconButtonProps, IconButtonVariant, AnimatedPressable, HitSlop (+19 more)

### Community 1 - "Dock.tsx"
Cohesion: 0.38
Nodes (8): createStyles(), Dock(), DockProps, TAB_BAR_HEIGHT, TAB_BAR_INSET, useTabBarBottomOffset(), useTabBarClearance(), useTabBarSideMargin()

### Community 2 - "StrengthSessionScreen.tsx"
Cohesion: 0.06
Nodes (72): getCategories(), getExerciseNames(), getExercises(), setExerciseCategory(), setExerciseFavorite(), getRoutine(), getCompletedSessions(), routineFromSets() (+64 more)

### Community 3 - "ClimbSessionScreen.tsx"
Cohesion: 0.06
Nodes (71): AppSettingRow, createGym(), CreateGymInput, defaultColorGrades, defaultNumericGrades, defaultOptionsForType(), defaultVScaleGrades, deleteGym() (+63 more)

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
Nodes (24): createStyles(), ExercisePickerSheet(), Filter, Props, Chip(), createStyles(), DialogButton, DialogHost() (+16 more)

### Community 9 - "sessionStore.ts"
Cohesion: 0.07
Nodes (33): ExternalClimbInput, ExternalClimbSessionInput, getEarliestEndAt(), getLastLogAt(), basePayload, mockGetFirst, mockRun, Sess (+25 more)

### Community 10 - "run"
Cohesion: 0.05
Nodes (78): Climb + Gym Workout Tracker, Current Codebase Shape, Graph Index, Relationship Notes, Repo Graph, Runtime Map, db, getAll() (+70 more)

### Community 11 - "LogScreen.tsx"
Cohesion: 0.15
Nodes (25): lastClimbSessions(), getRoutines(), createSession(), getActiveSession(), getSessionsForDateRange(), getLastRoutineId(), setLastRoutineId(), formatDaysAgo() (+17 more)

### Community 12 - "sessionNotification.ts"
Cohesion: 0.21
Nodes (16): expo-notifications, formatClockTime(), formatDuration(), describeWhere(), dismiss(), ensureChannel(), formatClock(), loadModule() (+8 more)

### Community 13 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, expo, expo-crypto, expo-font, @expo-google-fonts/geist, @expo-google-fonts/geist-mono, expo-haptics, expo-image-picker (+18 more)

### Community 14 - "SettingsScreen.tsx"
Cohesion: 0.14
Nodes (29): requestSessionNotificationPermission(), countWideGradeBandClimbs(), findWideBandClimbs(), narrowWideGradeBands(), summarize(), AppSettingRow, getInstallId(), getKilterLastSyncedAt() (+21 more)

### Community 15 - "dashboard.ts"
Cohesion: 0.18
Nodes (12): buildRecentSessions(), durationOf(), ExerciseTopSet, GradeCount, lastStrengthSessions(), plural(), RecentSession, summarizeClimbSession() (+4 more)

### Community 16 - "ClimbProgressView.tsx"
Cohesion: 0.09
Nodes (48): buildWeekActivity(), addDays(), startOfWeek(), AllTimeStats, buildAllTimeStats(), buildGradeDistribution(), buildGradeDistributionAcrossGyms(), buildRecentSends() (+40 more)

### Community 17 - "useTheme"
Cohesion: 0.29
Nodes (11): firstOfMonth(), getSessionStreak(), BodyweightCard(), createStyles(), createStyles(), MONTH_NAMES, ProgressMode, ProgressScreen() (+3 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (25): jest, preset, main, name, private, version, babel-preset-expo, expo-font (+17 more)

### Community 19 - "applyClimbEvents"
Cohesion: 0.19
Nodes (13): applyClimbEvents(), ClimbDeletePayload, ClimbEditPayload, ClimbLogPayload, ClimbRelabelPayload, EventLike, findSessionHighIndex(), isClimbPayload() (+5 more)

### Community 20 - "EndTimeSheet.tsx"
Cohesion: 0.28
Nodes (15): angleFromPoint(), clampToRange(), DIAL_MAX_SPAN_MS, dialRange, hourHandAngle(), minuteHandAngle(), snapToMinute(), stepMinutes() (+7 more)

### Community 21 - "SessionRow"
Cohesion: 0.14
Nodes (9): buildSessionReplayMap(), CalendarInsightColors, findHardestClimb(), colors, mockGetSessionEvents, ClimbLog, mockGetSessionEvents, PALETTE (+1 more)

### Community 22 - "kilterSync.ts"
Cohesion: 0.12
Nodes (23): fetchKilterLogs(), call(), createKilterAuth(), Deps, form(), KilterAuthError, KilterAuthErrorKind, SessionStore (+15 more)

### Community 23 - "bugReportApi.ts"
Cohesion: 0.20
Nodes (13): expo-crypto, authHeaders(), BugReportInput, BugReportSource, buildBugReportRow(), isBugReportApiConfigured(), SCREENSHOT_BUCKET, screenshotExtension() (+5 more)

### Community 24 - "RecentSessionsList.tsx"
Cohesion: 0.27
Nodes (11): createStyles(), DAY_SHORT, Props, RecentSessionsList(), whenLabel(), createStyles(), Props, StartCard() (+3 more)

### Community 27 - "App.tsx"
Cohesion: 0.18
Nodes (15): App(), AppContent(), Stack, Tab, TabIcon(), TabIconProps, TabNavigator(), @react-navigation/bottom-tabs (+7 more)

### Community 28 - "ASCEND Design System"
Cohesion: 0.08
Nodes (24): ASCEND Design System, Buttons, CalendarScreen, Chips, Claude Design Prompt (copy-paste into design tools), ClimbSessionScreen, Color Palette, Components (+16 more)

### Community 29 - "SessionHistoryScreen.tsx"
Cohesion: 0.17
Nodes (18): setSessionNotes(), setSessionTitle(), ClimbDraft, createStyles(), EditingEntry, formatDateLine(), formatLogTime(), formatSessionType() (+10 more)

### Community 30 - "font"
Cohesion: 0.16
Nodes (17): expo-haptics, ChangelogScreen(), createStyles(), formatEntryDate(), KIND_LABEL, createStyles(), Props, createStyles() (+9 more)

### Community 31 - "exerciseData.ts"
Cohesion: 0.18
Nodes (14): belongsTo(), countExerciseData(), deleteExerciseWithData(), ExerciseDataCount, facePulls, mockCorrect, mockDeactivate, mockEvents (+6 more)

### Community 32 - "kilterMapping.ts"
Cohesion: 0.19
Nodes (17): CLIMB_NAME_KEYS, dayKeyOf(), extractLogList(), GradeOption, ImportedClimb, ImportedSession, KilterLog, mapKilterLogs() (+9 more)

### Community 33 - "kilterSync.test.ts"
Cohesion: 0.25
Nodes (5): importExternalClimbSession(), inTransaction(), kilterAuth, mockFetch, mockImport

### Community 39 - "LastSessionCard.tsx"
Cohesion: 0.18
Nodes (16): ClimbSessionSummary, LastSessions, StrengthSessionSummary, WeekActivity, countDelta(), Delta, percentDelta(), createStyles() (+8 more)

### Community 40 - "changelog.ts"
Cohesion: 0.38
Nodes (4): APP_VERSION, ChangeKind, CHANGELOG, ChangelogEntry

### Community 41 - "CalendarScreen.tsx"
Cohesion: 0.10
Nodes (31): SessionReplay, formatElapsed(), formatLocalDate(), getAbandonedSessions(), getSessionsForMonth(), buildMonthGrid(), CalendarNavProp, CalendarScreen() (+23 more)

### Community 42 - "ASCEND Feature Roadmap"
Cohesion: 0.15
Nodes (12): 2a — Supabase Sync (Priority), 2b — UI Upgrade, ASCEND Feature Roadmap, Decisions Made, Mode 1 — Core Logging (COMPLETE ✅), Mode 1 Polish — In Progress 🔄, Mode 2 — Cloud + UI Upgrade 🔜, Mode 3 — Progress + Analytics 📋 (+4 more)

### Community 43 - "applySetEvents"
Cohesion: 0.23
Nodes (10): applySetEvents(), EventLike, isSetDeletePayload(), isSetEditPayload(), isSetPayload(), LoggedSet, SetDeletePayload, SetEditPayload (+2 more)

### Community 44 - "kilterSessionStore.ts"
Cohesion: 0.48
Nodes (5): clearKilterSession(), getKilterSession(), setKilterSession(), databaseSessionStore, mockGet

### Community 45 - "colors.ts"
Cohesion: 0.15
Nodes (18): Cards & grouped lists, getThemeMode(), Card(), CardProps, CardTone, createStyles(), ThemeContext, ThemeContextValue (+10 more)

### Community 46 - "expo"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, expo

### Community 47 - "react-native"
Cohesion: 0.40
Nodes (5): Dividers & separators, react-native, createStyles(), Divider(), DividerProps

### Community 48 - "AGENTS.md"
Cohesion: 0.18
Nodes (10): About This Project, Current Focus, Decision State, Do Not, Engineering Rules, graphify, Mode 1 Architecture, Rules (+2 more)

### Community 49 - "BugReportScreen.tsx"
Cohesion: 0.11
Nodes (29): react-native-safe-area-context, @react-navigation/native, RootStackScreenProps, createStyles(), createStyles(), Props, createStyles(), GymSelectScreenProps (+21 more)

### Community 50 - "StrengthProgressView.tsx"
Cohesion: 0.16
Nodes (12): createStyles(), ExerciseRow(), ExerciseRowProps, NavProp, Props, Sparkline(), Bar, BarChart() (+4 more)

### Community 51 - "BugReportScreen"
Cohesion: 0.33
Nodes (6): expo-image-picker, expo-mail-composer, BugReportScreen(), collectDiagnostics(), formatDiagnostics(), hasNativeModule()

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

- **Why does `font()` connect `font` to `react`, `Dock.tsx`, `StrengthSessionScreen.tsx`, `ClimbSessionScreen.tsx`, `LastSessionCard.tsx`, `ui/index.ts`, `CalendarScreen.tsx`, `colors.ts`, `SettingsScreen.tsx`, `ClimbProgressView.tsx`, `BugReportScreen.tsx`, `useTheme`, `StrengthProgressView.tsx`, `EndTimeSheet.tsx`, `RecentSessionsList.tsx`, `SessionHistoryScreen.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `react`, `Dock.tsx`, `StrengthSessionScreen.tsx`, `ClimbSessionScreen.tsx`, `ui/index.ts`, `run`, `LogScreen.tsx`, `SettingsScreen.tsx`, `ClimbProgressView.tsx`, `EndTimeSheet.tsx`, `RecentSessionsList.tsx`, `App.tsx`, `SessionHistoryScreen.tsx`, `font`, `LastSessionCard.tsx`, `CalendarScreen.tsx`, `colors.ts`, `react-native`, `BugReportScreen.tsx`, `StrengthProgressView.tsx`, `BugReportScreen`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TabIconProps` to the rest of the system?**
  _372 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.09982174688057041 - nodes in this community are weakly interconnected._
- **Should `StrengthSessionScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06329113924050633 - nodes in this community are weakly interconnected._
- **Should `ClimbSessionScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05981981981981982 - nodes in this community are weakly interconnected._
# Graph Report - C:\Users\choon\Portfolio projects\ASCEND  (2026-04-20)

## Corpus Check
- 34 files · ~74,278 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 174 nodes · 182 edges · 39 communities detected
- Extraction: 64% EXTRACTED · 36% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]

## God Nodes (most connected - your core abstractions)
1. `run()` - 8 edges
2. `getAll()` - 8 edges
3. `setSessionStatus()` - 8 edges
4. `appendEvent()` - 7 edges
5. `ASCEND Project Instructions` - 7 edges
6. `getCompletedSessionsInRange()` - 5 edges
7. `createSession()` - 4 edges
8. `setSessionNotes()` - 4 edges
9. `handleLog()` - 4 edges
10. `parseGradeValue()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Strength Workout Session Screen Design` --semantically_similar_to--> `Strength Logger Session Screen (Pull Day)`  [INFERRED] [semantically similar]
  Docs for reference/Design Inspo.md → Design/strength_logger.png
- `Strength Workout Session Screen Design` --semantically_similar_to--> `Weight Trainer Session Screen (HEVY-style)`  [INFERRED] [semantically similar]
  Docs for reference/Design Inspo.md → Design/weight trainer session.png
- `Climbing Session Screen Design` --semantically_similar_to--> `Tape-Based Climbing Session Log Screen`  [INFERRED] [semantically similar]
  Docs for reference/Design Inspo.md → Design/tape based climbing session.png
- `Session Summary Screen Design` --semantically_similar_to--> `Climbing Session Finish/Review Screen`  [INFERRED] [semantically similar]
  Docs for reference/Design Inspo.md → Design/Climbing session finish screen.png
- `Fast Daily Logging Core Principle` --semantically_similar_to--> `Large Tap Targets UX Pattern`  [INFERRED] [semantically similar]
  CLAUDE.md → Docs for reference/Design Inspo.md

## Hyperedges (group relationships)
- **Session Logging Core Loop** — arch_event_based_model, arch_local_first, prd_climbing_sessions, prd_strength_training [INFERRED 0.85]
- **Climbing Grade Data Pipeline** — arch_grade_data_model, prd_gym_grade_mapping, img_tape_climbing, img_climbing_analytics [INFERRED 0.80]
- **Fast Logging UX Triad** — claudemd_fast_logging_principle, design_large_tap_targets, prd_design_principles [INFERRED 0.82]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (16): getAll(), getFirst(), run(), migrate(), addPlannedSession(), getPlannedSessionsForDate(), getPlannedSessionsInRange(), removePlannedSession() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (12): bump(), handleAbandon(), handleDone(), handleLog(), handleUndo(), appendEvent(), setSessionStatus(), bump() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (16): Event-Based Model (Append-Only Events), Event Types (SET_LOGGED, CLIMB_LOGGED, etc.), Future Backend (Postgres + Prisma + Auth), Local-First Architecture (SQLite as Source of Truth), Rationale: Never Overwrite, Append-Only Events, ASCEND Project Instructions, Expo Cross-Platform Target (iOS + Android), Fast Daily Logging Core Principle (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (14): Planner Rules (Template Snapshot Model), Strength Workout Session Screen Design, Hangboard Tracker Session Screen, Rest Timer Bottom Sheet Overlay, Strength Logger Session Screen (Pull Day), Training Routine Library Screen, Weight Trainer Session Screen (HEVY-style), Curated Exercise Library (Climbing-Specific) (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (11): Climbing Grade Data Model, Climbing Session Screen Design, Progress Dashboards Design, Session Summary Screen Design, Climbing Session Finish/Review Screen, Climbing Analytics Dashboard (V-Scale, Max Send Trend), Tape-Based Climbing Session Log Screen, J2: Climbing Session Fast Path (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (4): parseLocalDate(), toDayEndMs(), toDayStartMs(), getCompletedSessionsInRange()

### Community 6 - "Community 6"
Cohesion: 0.27
Nodes (4): compareGradeLabels(), gradeMidpointFor(), gradeValueFor(), parseGradeValue()

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (5): formatDate(), formatDuration(), handleConfirm(), setSessionNotes(), handleConfirm()

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 0.38
Nodes (3): handleLog(), handleResume(), navigateToSession()

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (2): Button(), getVariantStyles()

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (2): App Navigation Design Prompt, PRD: Navigation (Home, Planner, Progress, Settings)

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (2): J4: Resume Interrupted Session, PRD: Non-Functional Requirements (Crash Safety, Resume)

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): Execution Order (Build Steps 1-5)

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (1): Dark Mode UI Design Style

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (1): PRD: Target Users (Indoor Boulderers)

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): PRD: Home Screen (Resume + Planned + Quick Starts)

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): PRD: Settings (Units, Grade System, Export, Reset)

## Knowledge Gaps
- **24 isolated node(s):** `Mode 1 MVP (Log + Calendar)`, `Partial Rebuild Decision State`, `Expo Cross-Platform Target (iOS + Android)`, `React Navigation (native-stack + bottom-tabs)`, `Two-Tab Navigation (Log | Calendar)` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 13`** (2 nodes): `TabNavigator()`, `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `useClimbSessionLogs.ts`, `useClimbSessionLogs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `AppHeader()`, `AppHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `Card.tsx`, `Card()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `Divider.tsx`, `Divider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `IconButton.tsx`, `IconButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `ListRow.tsx`, `ListRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `SettingsScreen.tsx`, `SettingsScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `usePlannerMonth.ts`, `usePlannerMonth()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `usePlannerWeek.ts`, `usePlannerWeek()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `App Navigation Design Prompt`, `PRD: Navigation (Home, Planner, Progress, Settings)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `J4: Resume Interrupted Session`, `PRD: Non-Functional Requirements (Crash Safety, Resume)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `BottomTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `Chip.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `MetricCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `HomeScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `PlannerScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `Execution Order (Build Steps 1-5)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `Dark Mode UI Design Style`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `PRD: Target Users (Indoor Boulderers)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `PRD: Home Screen (Resume + Planned + Quick Starts)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `PRD: Settings (Units, Grade System, Export, Reset)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `run()` connect `Community 0` to `Community 1`, `Community 7`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `setSessionStatus()` connect `Community 1` to `Community 0`, `Community 7`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `getCompletedSessionsInRange()` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `run()` (e.g. with `migrate()` and `createSession()`) actually correct?**
  _`run()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `getAll()` (e.g. with `getSessionEvents()` and `getSessionsForMonth()`) actually correct?**
  _`getAll()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `setSessionStatus()` (e.g. with `run()` and `handleDone()`) actually correct?**
  _`setSessionStatus()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `appendEvent()` (e.g. with `run()` and `handleLog()`) actually correct?**
  _`appendEvent()` has 5 INFERRED edges - model-reasoned connections that need verification._
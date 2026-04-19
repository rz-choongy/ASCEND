# Graph Report - C:\Users\choon\Portfolio projects\ASCEND  (2026-04-19)

## Corpus Check
- 34 files · ~72,294 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 128 nodes · 137 edges · 29 communities detected
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `run()` - 8 edges
2. `getAll()` - 8 edges
3. `appendEvent()` - 8 edges
4. `setSessionStatus()` - 6 edges
5. `getCompletedSessionsInRange()` - 5 edges
6. `createSession()` - 4 edges
7. `setSessionNotes()` - 4 edges
8. `handleLog()` - 4 edges
9. `parseGradeValue()` - 4 edges
10. `addPlannedSession()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `run()` --calls--> `removePlannedSession()`  [INFERRED]
  C:\Users\choon\Portfolio projects\ASCEND\src\db\db.ts → C:\Users\choon\Portfolio projects\ASCEND\src\_quarantine\plannerStore.ts
- `appendEvent()` --calls--> `handleRelabel()`  [INFERRED]
  C:\Users\choon\Portfolio projects\ASCEND\src\domain\sessionStore.ts → C:\Users\choon\Portfolio projects\ASCEND\src\screens\SessionHistoryScreen.tsx
- `setSessionStatus()` --calls--> `handleFinish()`  [INFERRED]
  C:\Users\choon\Portfolio projects\ASCEND\src\domain\sessionStore.ts → C:\Users\choon\Portfolio projects\ASCEND\src\screens\StrengthSessionScreen.tsx
- `run()` --calls--> `migrate()`  [INFERRED]
  C:\Users\choon\Portfolio projects\ASCEND\src\db\db.ts → C:\Users\choon\Portfolio projects\ASCEND\src\db\migrate.ts
- `run()` --calls--> `createSession()`  [INFERRED]
  C:\Users\choon\Portfolio projects\ASCEND\src\db\db.ts → C:\Users\choon\Portfolio projects\ASCEND\src\domain\sessionStore.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (9): handleFinish(), formatDate(), formatDuration(), handleConfirm(), run(), migrate(), setSessionNotes(), setSessionStatus() (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (13): getAll(), getFirst(), addPlannedSession(), getPlannedSessionsForDate(), getPlannedSessionsInRange(), removePlannedSession(), uuid(), createSession() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (6): appendEvent(), handleCompleteSet(), handleFinish(), handleRestEnd(), handleRestStart(), handleUndo()

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (4): parseLocalDate(), toDayEndMs(), toDayStartMs(), getCompletedSessionsInRange()

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (3): compareGradeLabels(), handleRelabel(), parseGradeValue()

### Community 5 - "Community 5"
Cohesion: 0.27
Nodes (4): compareGradeLabels(), gradeMidpointFor(), gradeValueFor(), parseGradeValue()

### Community 6 - "Community 6"
Cohesion: 0.32
Nodes (4): handleLog(), handleResume(), navigateToSession(), getActiveSession()

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): Button(), getVariantStyles()

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

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
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

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

## Knowledge Gaps
- **Thin community `Community 10`** (2 nodes): `TabNavigator()`, `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `useClimbSessionLogs.ts`, `useClimbSessionLogs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `AppHeader()`, `AppHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `Card.tsx`, `Card()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `Divider.tsx`, `Divider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `IconButton.tsx`, `IconButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `ListRow.tsx`, `ListRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `SettingsScreen.tsx`, `SettingsScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `usePlannerMonth.ts`, `usePlannerMonth()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `usePlannerWeek.ts`, `usePlannerWeek()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `HomeScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `BottomTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `Chip.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `MetricCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `PlannerScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `appendEvent()` connect `Community 2` to `Community 0`, `Community 1`, `Community 4`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `run()` connect `Community 0` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `setSessionStatus()` connect `Community 0` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `run()` (e.g. with `migrate()` and `createSession()`) actually correct?**
  _`run()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `getAll()` (e.g. with `getSessionEvents()` and `getSessionsForMonth()`) actually correct?**
  _`getAll()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `appendEvent()` (e.g. with `run()` and `handleRelabel()`) actually correct?**
  _`appendEvent()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `setSessionStatus()` (e.g. with `run()` and `handleFinish()`) actually correct?**
  _`setSessionStatus()` has 5 INFERRED edges - model-reasoned connections that need verification._
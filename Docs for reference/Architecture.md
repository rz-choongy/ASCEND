# Architecture & Execution Plan

---

## Local-First Architecture

**Storage**

- SQLite
- Local device is source of truth

**Core rule**

- Never overwrite
- Only append events

---

## Event-Based Model

Examples:

- SET_LOGGED
- SET_UNDONE
- REST_STARTED
- CLIMB_LOGGED
- CLIMB_UPDATED
- SESSION_COMPLETED

Sessions are reconstructed from events.

**Benefits**

- No lost data
- Undo is trivial
- Sync later without rewriting logic

---

## Climbing Grade Data Model

Each climb stores:

- gym_id
- label (Purple / V5)
- grade_min
- grade_max
- grade_midpoint
- result (FLASH | SEND)
- timestamp

**Rules**

- Grades derived from labels
- Midpoint used for v1 analytics
- Range stored for future fractional distribution

---

## Planner Rules

- Planner references templates only
- Sessions snapshot templates at start
- Planner edits never affect past sessions
- Multiple sessions per day
- Order only, no time-of-day

---

## Future Backend (Not v1)

When ready:

- Postgres + Prisma
- Append-only event sync
- Email/password auth
- Google auth later

Local model maps directly to backend events.

---

## Execution Order (Do Not Deviate)

### Step 1

- SQLite schema
- Event logging
- Active session persistence

### Step 2

- Strength session screen
- Set logging
- Rest timer

### Step 3

- Climbing session screen
- Gym grade mapping
- Session summary

### Step 4

- Home
- Planner
- Progress basics

### Step 5

- CSV export
- Polish
- Then auth + sync
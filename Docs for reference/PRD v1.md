# PRD

**Climbing-First Workout Tracker**

---

## 1. Product Overview

**Goal**

Build a climbing-first training app that helps climbers plan, execute, and review climbing sessions and climbing-specific strength training with minimal friction and clear progress signals.

**Core promise (v1)**

A workout app for climbers that:

- Tracks climbing session-to-session progress
- Tracks climber-specific strength training
- Supports weekly planning
- Shows clean, motivating progress

**Platforms**

- Mobile: Android + iOS (Expo)
- Local-first (no accounts in v1)
- Backend + auth added later

**Design principles**

- Speed over completeness
- Opinionated defaults
- Local-first, no data loss
- Progress clarity, not analytics overload

---

## 2. Target Users

**Primary**

- Indoor boulderers
- Climbers who strength train for climbing

**Initial audience**

- You + friends (real climbers, real sessions)

---

## 3. Navigation (v1)

Bottom tabs:

- Home
- Planner
- Progress
- Settings

No floating action button.

Starting sessions happens from **Home**.

---

## 4. Home

**Top**

- Resume active session (if one exists)

**Middle**

- Today’s planned sessions (ordered)
- Each card has a Start button

**Bottom (always visible quick starts)**

- Start Strength
- Start Climb
- Start Warmup
- Start Free Session

---

## 5. Planner

- Week view (Mon–Sun)
- Multiple sessions per day
- Order only (no time-of-day)
- Planner references templates only
- Sessions snapshot templates at start
- Editing planner never mutates completed sessions

---

## 6. Strength Training

### Templates

- Curated exercise library (climbing-focused)
- Template defines:
    - Exercise order
    - Tracking type (reps, time, intervals)
    - Rest rules
    - Optional bodyweight offset
- Warmups are just templates

### Session UX

- Big tap targets
- Copy last set default ON
- Rest timer always visible
- Swipe to complete set
- Undo button small
- Finish button always visible

### Session Summary

- Review sets
- Adjust values
- Optional notes
- Confirm to save

---

## 7. Climbing Sessions

### Gym setup (forced onboarding)

Each gym defines:

- Grading type:
    - V-grade based
    - Color / label based
- For color gyms:
    - Label → grade range mapping (e.g. Purple → V3–V5)
    - Typical presets provided
    - Editable later

### Session logging

- Select gym
- Tap grade chip (label + grade range shown)
- Tap Flash or Send
- Timer visible
- Undo supported

**Out of scope (v1)**

- Attempt tracking
- Per-climb notes during session

### End-of-session summary

- List of climbs
- Edit result
- Optional notes
- Confirm

---

## 8. Progress

### Climbing

- Hardest send trend (time vs V-grade midpoint)
- Volume chart (stacked bars by grade bucket)
- Session frequency

### Strength

- Session count
- Total volume
- Simple trends

---

## 9. Settings

- Units
- Preferred grade system
- Gym grade mappings
- CSV export
- Reset local data

---

## 10. Non-Functional Requirements

- Resume active session on app open
- Local persistence is source of truth
- No data loss on crash
- Designed for future auth + sync
- Android-first testing, iOS supported
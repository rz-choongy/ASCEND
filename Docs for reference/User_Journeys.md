# App Flow

This document maps the user journey

## J1 — Start Strength Workout From Template

1. Open app → Home
2. Tap **Start Strength**
3. Select template
4. Session starts immediately
5. Log sets with minimal taps
6. Rest timer runs automatically
7. Tap Finish
8. Review session summary
9. Adjust values if needed
10. Confirm → saved locally

---

## J2 — Climbing Session (Fast Path)

1. Open app → Home
2. Tap **Start Climb**
3. Select gym
4. Grade chips appear
5. Tap grade → Flash or Send
6. Repeat
7. Tap Finish
8. Edit outcomes in summary
9. Add optional notes
10. Confirm

---

## J3 — Planner → Execution Loop

1. Open Planner
2. Add multiple sessions to a day
3. Reorder sessions
4. Home shows today’s plan
5. Tap Start on a session card
6. Template snapshot is created
7. Session runs independently of planner

---

## J4 — Resume Interrupted Session

1. App closed mid-session
2. Reopen app
3. Active session banner shown
4. Tap Resume
5. Continue exactly where left off

## J5 — Create a Strength Workout Template (HEVY-Style)

### Goal

Allow users to quickly create a reusable workout template with minimal configuration, using a curated exercise library where each exercise already implies its logging behavior.

---

### Entry Points

- From **Home → Start Strength → Create New Template**
- From **Planner → Add Session → Create Template**
- From **Settings → Templates**

---

### Step-by-Step Flow

1. **Open Create Template**
    - User taps “Create Template”
    - Enters:
        - Template name (required)
        - Optional description (optional)
2. **Add Exercises**
    - User taps “Add Exercise”
    - Exercise picker opens:
        - Curated list (strength + climbing-specific)
        - Search supported
        - No tagging or filtering complexity
3. **Select Exercise**
    - User taps an exercise
    - App knows the exercise’s:
        - Tracking type (reps, time, intervals)
        - Bodyweight default
    - Exercise is added immediately to the template list
4. **Configure Exercise (Inline)**
    
    For each exercise in the template:
    
    - Set:
        - Target sets
        - Target reps OR time OR interval preset (based on exercise type)
        - Optional weight offset (for BW exercises)
        - Rest time (default provided)
    - No advanced fields required
    - All inputs are inline (no extra screens)
5. **Reorder Exercises**
    - Drag and drop to reorder
    - Order reflects session execution order
6. **Repeat Until Done**
    - User continues adding exercises until template is complete
7. **Save Template**
    - User taps Save
    - Template becomes available for:
        - Planner
        - Start Strength
        - Warmup (if user chooses)

---

### Key UX Rules (Important)

- No required tags
- No required categories
- No forced metadata beyond what affects logging
- Exercise choice determines logging UI
- Template creation never feels like “setup hell”

---

### Example Template (Mental Model)

**Template name:** Pull + Hangboard

Exercises (in order):

1. Weighted Pull-ups
    - 4 sets x 5 reps
    - BW +10kg
    - Rest 180s
2. 3 Finger Drag Repeaters
    - 7s on / 3s off
    - 6 reps x 3 sets
    - Rest 120s
3. Face Pulls
    - 3 sets x 12 reps
    - Rest 90s

This template can now be:

- Planned in Planner
- Started from Home
- Used as a warmup or main session

---

### Non-Goals (v1)

- Creating brand-new exercise types
- Complex tagging systems
- Supersets
- Circuit logic
- Auto-progression rules

These are explicitly deferred.

---

### Edge Cases

- User deletes an exercise → removed from template only
- Editing a template does NOT affect completed sessions
- Editing a template DOES affect future sessions
- Templates are immutable once a session starts (snapshot model)
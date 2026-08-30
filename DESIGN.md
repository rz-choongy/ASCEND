# ASCEND Design System

> Paste this file as context into any design tool (Claude, Gemini, etc.) before generating UI.
> Claude Code reads this before any UI work in this project.

---

## What This App Is

A climbing and gym workout tracker for indoor boulderers. Think training journal, not social app. The user is mid-session, chalk on hands, logging V5 sends or tracking sets. Every tap costs attention. Speed and clarity beat visual polish.

---

## Personality

- **Athletic, not flashy.** Like a Moleskine training log that happens to be on your phone.
- **Dark and focused.** The gym is loud and bright — the screen should feel calm.
- **Data-forward.** Numbers are the hero. Labels exist to serve them.
- **No celebration, no gamification.** No confetti, no streaks UI, no badges.

---

## Color Palette

```
Background:      #0b1110  — near-black, desaturated forest
Background Warm: #10150f  — slightly warmer for contrast zones
Surface:         #151b18  — cards, panels
Surface Alt:     #1b241d  — elevated surfaces
Surface Raised:  #202a21  — modals, popovers
Border:          #2b352d  — hard borders
Border Soft:     #3a463b  — subtle dividers

Text Primary:    #f2eadc  — warm off-white
Text Secondary:  #cfc5b3  — supporting text
Text Muted:      #918a7d  — labels, metadata
Text Inverse:    #0b1110  — on accent buttons

Accent:          #d8a448  — amber/gold — CTAs, active states, highlights
Accent Muted:    #332817  — accent background tint
Accent Soft:     #4a371a  — hover/pressed accent

Success:         #7dbb6d  — SEND, completion, OK
Warning:         #f2c45f  — caution
Danger:          #e0644f  — abandon, delete, destructive

Overlay:         rgba(6,10,8,0.74) — modal backdrops
```

**Grade colour palette** (used for grade tiles, dots on calendar):
```
#e9dfc7  #d8a448  #9db56f  #4f8f7a  #486f9f  #9a6fb0  #d76f45  #3f473f
```

---

## Typography

All weights are heavy. Labels are loud. Numbers are king.

| Role        | Size | Weight | Notes                          |
|-------------|------|--------|-------------------------------|
| Display     | 34   | 900    | Screen titles, grade numbers   |
| Title       | 23   | 800    | Section headers                |
| Numeric     | 24   | 900    | Reps, weight, counts           |
| Section     | 12   | 800    | UPPERCASE, 1.1 tracking        |
| Body        | 14   | 600    | Primary content                |
| Body Muted  | 13   | 500    | Secondary content              |
| Meta        | 11   | 800    | UPPERCASE, 0.9 tracking        |

- No serif, no italic, no light weights.
- Section and Meta labels are always UPPERCASE with tracked spacing.
- Negative letter-spacing on Display and Numeric for density.

---

## Spacing (8pt grid)

```
xxs:  4    xs:  8    s:  12    sm: 16
md:  24    lg: 32    xl: 40    xxl: 48    xxxl: 64
```

- Screen padding: `sm` (16) on sides.
- Card internal padding: `sm` (16) or `s` (12) for tight cards.
- Between sections: `md` (24) or `lg` (32).
- Between related elements: `xs` (8) or `s` (12).

---

## Components

### Buttons
- Primary: accent background (`#d8a448`), black text, heavy weight, full-width or large tap target.
- Secondary: surface background, accent border, accent text.
- Destructive: danger colour text, no fill unless confirming.
- Always visible. Never hidden behind scroll.

### Cards
- Background: `surface` (`#151b18`).
- Border: `border` (`#2b352d`), 1px.
- Border radius: 12–16px.
- No shadows. Borders define depth.

### Chips
- Background: `surfaceAlt` or `accentMuted` when active.
- Border: `borderSoft` or `accent` when active.
- Text: `textSecondary` or `accent` when active.
- Use for grade selection, filters, tags.

### Grade Tiles
- Square-ish, fill the grid.
- Background = grade colour from palette.
- Label inside: `textInverse` or auto-contrast, weight 800.
- Active state: white border or scale transform, no glow.

### Dividers
- Colour: `border` or `borderSoft`.
- Thin (1px). Horizontal only.

### Empty States
- Centred in the available space.
- Muted text (`textMuted`), medium body size.
- No illustrations. One line of explanation, optionally one CTA.

---

## Motion & Animation

- **Minimal.** Only animate what earns it.
- No page transitions beyond the platform default.
- Modals slide in from bottom (React Native default sheet behaviour).
- Pressed state: opacity 0.7, immediate, no spring.
- No shimmer loaders. If something loads, it either shows or it doesn't.

---

## Layout Principles

1. **One primary action per screen.** The most important button is always visible without scrolling.
2. **Large tap targets.** Minimum 44pt. Grade tiles, action buttons — make them easy to hit with chalk-covered hands.
3. **Top-to-bottom reading flow.** Label → value → action. Don't bury the action.
4. **Flat information hierarchy.** Two levels max: screen → detail. No drill-down rabbit holes.
5. **No dead space.** If a section is empty, say so. Don't show blank panels.

---

## Screen-Specific Notes

### LogScreen (Home)
- Gym selector always visible at top.
- Active session resume banner if a session exists — amber accent, prominent.
- Today's sessions list below.
- Two CTAs at bottom: "Start climbing" and "Start strength" — equal weight.

### ClimbSessionScreen
- Grade grid is the hero. Full-width, colour-coded.
- SEND / FLASH are the two primary actions — large, always above the fold.
- Log list scrolls below. Each row: grade colour accent + label + result.
- Done button always visible at the bottom.

### StrengthSessionScreen
- Exercise name at top (large, bold).
- Set logging below: reps + weight in a row, large numerics.
- Sets list scrolls. Each row: exercise, reps, weight.

### CalendarScreen
- Month grid: coloured dots on days with sessions.
- Selected day: session cards expand below the grid.
- Month navigation: prev/next arrows, current month label centred.

### SessionHistoryScreen
- Session header: type, date, gym, duration.
- Log entries in a scrollable list.
- Edit inline via tap — no separate edit screen.

---

## What to Avoid

- White or light backgrounds (this is a dark-mode app)
- Gradients (except subtle surface-to-surface)
- Drop shadows
- Illustrations or icons as decoration
- Gamification elements (streaks, badges, XP)
- Multiple accent colours — amber is the only accent
- Rounded corners > 20px on interactive elements
- Any screen that requires more than 3 taps to log something

---

## Claude Design Prompt (copy-paste into design tools)

```
Design a screen for ASCEND, a climbing and gym workout tracker.

Design language:
- Dark mode only. Background: #0b1110 (near-black desaturated forest).
- Accent: #d8a448 (amber/gold) for primary CTAs and active states.
- Text: #f2eadc (warm off-white) primary, #918a7d muted.
- Surface cards: #151b18 with #2b352d borders.
- Success green: #7dbb6d. Danger: #e0644f.
- Typography: heavy weights (800–900), section labels UPPERCASE with tracking.
- 8pt spacing grid (8, 16, 24, 32, 40).
- No shadows, no gradients, no illustrations.
- Large tap targets (44pt min). One primary action always visible.
- Aesthetic: athletic training journal. Fast, functional, data-forward.
- Inspired by: HEVY (workout logger) but more minimal and darker.

Grade colour palette (for bouldering grade tiles):
#e9dfc7, #d8a448, #9db56f, #4f8f7a, #486f9f, #9a6fb0, #d76f45, #3f473f
```

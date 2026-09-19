# ASCEND Design System

> Paste this file as context into any design tool (Claude, Gemini, etc.) before generating UI.
> Claude Code reads this before any UI work in this project.

---

## What This App Is

A climbing and gym workout tracker for indoor boulderers. Think training journal, not social app. The user is mid-session, chalk on hands, logging V5 sends or tracking sets. Every tap costs attention. Speed and clarity beat visual polish.

---

## Personality

- **Native first.** The app should feel like it shipped with the phone: SF Pro (system font), iOS text styles, inset-grouped cards, hairline separators, capsule filters, circular icon buttons.
- **Athletic, not flashy.** Like a Moleskine training log that happens to be on your phone.
- **Calm and layered.** Depth comes from surface tone, not from outlines. The gym is loud and bright — the screen should not be.
- **Data-forward.** Numbers are the hero, set in tabular figures. Labels exist to serve them.
- **No celebration, no gamification.** No confetti, no streaks UI, no badges.

---

## Color Palette

Both themes are the iOS system palette. Translucent separators and fills are used
deliberately — they sit correctly on every surface layer without re-tuning.

**Dark (default)**
```
Background:      #000000  — true black ground
Background Warm: #0b0b0d
Surface:         #1c1c1e  — grouped cards, rows
Surface Alt:     #2c2c2e  — sheets, elevated panels
Surface Raised:  #3a3a3c  — segmented thumb, swatch wells
Border:          #2c2c2e  — hairline card edge
Border Soft:     #3a3a3c
Separator:       rgba(84,84,88,0.6)     — hairline rules between rows
Fill:            rgba(120,120,128,0.24) — segmented track, icon buttons, inputs
Fill Soft:       rgba(120,120,128,0.14) — row pressed state

Text Primary:    #ffffff
Text Secondary:  rgba(235,235,245,0.62)
Text Muted:      rgba(235,235,245,0.4)

Accent:          #eac60f  (amber, user-selectable — see below)
Accent Muted:    accent @ 16% — tinted button and banner fills
Accent Soft:     accent @ 28%

Success: #30d158   Warning: #ffd60a   Danger: #ff453a
Overlay: rgba(0,0,0,0.6)
```

**Light**
```
Background:  #f2f2f7   Surface: #ffffff   Surface Alt: #f2f2f7
Border:      #e5e5ea   Border Soft: #d1d1d6
Separator:   rgba(60,60,67,0.29)   Fill: rgba(118,118,128,0.12)
Text:        #000000 / rgba(60,60,67,0.6) / rgba(60,60,67,0.4)
Accent:      #b8860a
Success: #34c759   Warning: #ff9f0a   Danger: #ff3b30
```

**Accent is user-selectable** (Settings → Accent color): blue, teal, purple,
orange, rose, amber. Never hard-code a text colour on top of the accent — call
`getContrastText(colors.accent)`, since a bright tint needs dark text and a
saturated one needs white.

**Grade colour palette** (used for grade tiles, dots on calendar):
```
#e9dfc7  #d8a448  #9db56f  #4f8f7a  #486f9f  #9a6fb0  #d76f45  #3f473f
```

---

## Typography

The iOS text styles, set in the platform UI font. **No `fontFamily` is ever
set** — that gives SF Pro on iOS and Roboto on Android, which is the whole point
of the system look.

| Role        | Size | Weight | Notes                                  |
|-------------|------|--------|----------------------------------------|
| Display     | 34   | 700    | Large title — screen headers            |
| Title       | 22   | 700    | Card and section headings               |
| Numeric     | 24   | 700    | Figures, tabular-nums                   |
| Section     | 13   | 600    | Grouped-list header, **sentence case**  |
| Body        | 16   | 500    | Row titles, primary content             |
| Body Muted  | 14   | 400    | Supporting copy                         |
| Meta        | 12   | 500    | Timestamps, units, counts               |

- No ALL-CAPS labels. Modern iOS dropped shouted table headers, and so did this app.
- Negative letter-spacing on the larger sizes (-0.24 to -0.8) for optical tightness.
- Figures are tabular so columns of weights and counts stay aligned.

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

## Corner Radius

```
sm: 8    small controls, grade swatches, compact steppers
md: 12   rows, text fields, grade tiles
lg: 14   grouped cards, prominent buttons, panels
xl: 20   modal sheets and alerts
pill: 999  capsule filters, badges, "Use" controls
```

Purely round shapes (dots, colour swatches, icon buttons, the calendar's
selected-day marker) set their radius to half their size rather than using the
scale.

---

## Components

### Buttons
Mirrors the SwiftUI button roles. All labels are sentence case, 16/600.
- `primary` — filled accent, text from `getContrastText(accent)`. `.borderedProminent`.
- `secondary` — `accentMuted` fill, accent text. A tinted `.bordered`.
- `ghost` — `fill` background, primary text. The neutral grey button.
- `plain` — no background, accent text. Nav-bar and toolbar actions.
- `success` / `warning` — filled in the semantic colour.
- Minimum height 46. Always visible; never hidden behind scroll.

### Cards & grouped lists
- `Card` and `ListGroup` are the inset-grouped panel: `surface` background,
  `radius.lg`, a hairline border that barely resolves, `overflow: hidden`.
- Depth comes from surface tone, not from outlines or shadows.
- Rows inside a group are borderless and separated by hairline `separator`
  rules **inset to the text column** (`marginLeft: spacing.sm`).
- `ListRow` draws a disclosure chevron automatically when it is pressable and
  has no `right` slot.

### Chips
- Capsule (`radius.pill`), 14/600, sentence case.
- Unselected: `fill` background, secondary text. Selected: accent fill, contrast text.

### Segmented control
- `UISegmentedControl` proper: translucent `fill` track, radius 9, with a lifted
  **neutral** thumb (a surface, plus a soft shadow in light mode).
- Selection reads from elevation, not from the accent — the accent stays
  reserved for actions.

### Grade tiles
- `radius.md`, background = the grade's own colour from the palette.
- Label auto-contrasts via `getContrastText`.
- Active state: 3px accent ring. No glow.

### Dividers & separators
- Always `StyleSheet.hairlineWidth` in `colors.separator`, never 1px in `border`.
- `Divider` takes an `inset` prop for grouped-list alignment.

### Inputs
- Filled, not outlined: `fill` background, `radius.md`, 16–17pt, no border.

### Empty states
- A plain `surface` card, centred text, no dashed outlines.
- Muted text, one line of explanation, optionally one CTA. No illustrations.

---

## Motion & Animation

- **Minimal.** Only animate what earns it.
- No page transitions beyond the platform default.
- Modals slide in from bottom (React Native default sheet behaviour).
- Pressed state: `PressableScale` — a 0.97 scale on a tight spring plus a dim to
  0.72 opacity. Gentle and quick, the way UIKit's own controls settle. Never a bounce.
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

- Setting `fontFamily` anywhere — it breaks the system look on both platforms
- ALL-CAPS labels and letter-spaced "loud" text
- 1px borders where a hairline separator belongs; outlined boxes where a surface tone will do
- Sharp corners on surfaces, or radii > 20 on interactive elements
- Gradients (except subtle surface-to-surface), drop shadows (bar the segmented thumb in light mode)
- Illustrations or icons as decoration; dashed-outline empty states
- Gamification elements (streaks, badges, XP)
- More than one accent in play at a time — the accent is a single user-chosen tint
- Hard-coding a text colour on top of the accent instead of `getContrastText`
- Any screen that requires more than 3 taps to log something

---

## Claude Design Prompt (copy-paste into design tools)

```
Design a screen for ASCEND, a climbing and gym workout tracker.

Design language: native iOS / SwiftUI.
- Dark mode. Background: #000000. Grouped cards: #1c1c1e, corner radius 14,
  no visible outline — depth comes from the surface tone.
- Rows inside a card are separated by hairline rules in rgba(84,84,88,0.6),
  inset to the text column. Pressable rows get a disclosure chevron.
- Accent: a single tint (default amber #eac60f) for primary buttons, selection
  and chart lines. Text on the accent auto-contrasts.
- Text: #ffffff primary, rgba(235,235,245,0.62) secondary, rgba(235,235,245,0.4) muted.
- Typography: the system font (SF Pro) at iOS text-style sizes — 34 large title,
  22 title, 17 headline, 16 body, 14 subhead, 12 footnote. Sentence case
  throughout, no ALL-CAPS. Figures are tabular.
- Controls: capsule filter chips, iOS segmented controls with a neutral lifted
  thumb, filled (not outlined) text fields, circular translucent icon buttons.
- Success #30d158, warning #ffd60a, danger #ff453a.
- 8pt spacing grid (8, 16, 24, 32, 40).
- Large tap targets (44pt min). One primary action always visible.
- Aesthetic: athletic training journal that looks like a first-party Apple app.
- Inspired by: HEVY / Strong, but more restrained and more native.

Grade colour palette (for bouldering grade tiles):
#e9dfc7, #d8a448, #9db56f, #4f8f7a, #486f9f, #9a6fb0, #d76f45, #3f473f
```

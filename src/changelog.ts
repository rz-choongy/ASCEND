export type ChangeKind = 'new' | 'improved' | 'fixed';

export type ChangelogEntry = {
  version: string;
  /** ISO date the round of changes shipped. */
  date: string;
  changes: { kind: ChangeKind; text: string }[];
};

/**
 * Newest first. The top entry IS the displayed app version -- add a new entry here with each
 * shipped round of changes and Settings picks up both the number and the log.
 *
 * Deliberately separate from app.json's "version" field, which drives EAS's runtimeVersion
 * (policy: "appVersion") -- bumping that would break OTA updates for already-installed builds,
 * since it changes what runtime an `eas update` targets.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.1',
    date: '2026-09-24',
    changes: [
      { kind: 'new', text: 'Grade pyramid bars now split into flashes and sends, and read top to bottom from your easiest grade.' },
      { kind: 'new', text: 'Pin your regular gyms to the grade pyramid. Gyms you rarely visit sit under More, where you can star them to pin them.' },
      { kind: 'improved', text: 'This week on Today now compares sessions, sends and sets with last week, laid out like the last-session card.' },
      { kind: 'improved', text: 'The Calendar filter sits above the calendar and filters its dots too. Day dots now mark a climb (filled) or strength (ring) instead of a grade colour.' },
      { kind: 'improved', text: 'Bodyweight on Progress is a compact row with a small trend line.' },
      { kind: 'fixed', text: 'Chart labels no longer overlap the line or the card title, and bodyweight sets show BW and reps instead of 0 kg.' },
    ],
  },
  {
    version: '2.0',
    date: '2026-09-23',
    changes: [
      { kind: 'new', text: 'A new look across the whole app: cleaner cards, a new typeface, and buttons and highlights in your accent colour.' },
      { kind: 'new', text: 'Today is now a dashboard. Pick Climb or Strength and start in one tap, see how your last session compared with the one before, track the week, and jump back into recent sessions.' },
      { kind: 'new', text: 'Choosing an exercise: search, favourites and recent at the top, then everything A to Z. Type a new name to add it on the spot.' },
      { kind: 'new', text: 'Exercise categories: Pull, Push, Legs, Core, Fingers and Mobility built in, plus your own. Manage them from Settings or the exercise picker.' },
      { kind: 'new', text: 'Star exercises as favourites so they are always first in the picker.' },
      { kind: 'new', text: 'Log your bodyweight from Today and see the trend on Progress.' },
      { kind: 'new', text: 'Name individual climbs as you log them.' },
      { kind: 'improved', text: 'The strength logger is more compact: reps and weight side by side, the session timer and name in the header, and only this session\'s exercises in the top row.' },
      { kind: 'improved', text: 'The tab bar is now a floating dock, and light/dark mode lives in Settings.' },
      { kind: 'fixed', text: 'A batch of fixes to sessions and Kilter syncing.' },
    ],
  },
  {
    version: '1.10',
    date: '2026-09-21',
    changes: [
      { kind: 'fixed', text: 'Typing a weight or reps and tapping Log Set now logs the number you typed. Before, it could log the old value.' },
      { kind: 'improved', text: 'The weight buttons step by 1 kg again (and 5 kg for the big buttons). Type a number for anything in between, like 27.5.' },
    ],
  },
  {
    version: '1.9',
    date: '2026-09-20',
    changes: [
      { kind: 'new', text: 'Strength progress: every exercise with its trend, est. 1RM, top weight and volume, plus a tap-to-expand history of each session\'s sets.' },
      { kind: 'new', text: 'Kilter Board: connect your account and import your sends. This uses Kilter\'s unofficial sign-in, so it may stop working if Kilter changes something.' },
      { kind: 'improved', text: 'Progress is now split into Climbing and Strength, with compact stat tiles in place of the big Hardest send number.' },
      { kind: 'improved', text: 'Strength logging starts each exercise from your last set, shows what you did last time, and lets you type any weight or reps. Weight now steps by 2.5 kg.' },
      { kind: 'improved', text: 'Beating your best est. 1RM now gets a haptic, a "New est. 1RM" chip, and a PR badge on the set.' },
      { kind: 'fixed', text: 'Fixed Settings closing the app on Android.' },
    ],
  },
  {
    version: '1.8',
    date: '2026-09-19',
    changes: [
      { kind: 'improved', text: 'Climbs logged with a grade range now count toward a real grade in the pyramid instead of their own row.' },
      { kind: 'new', text: 'Settings shows which over-the-air update is actually running.' },
    ],
  },
  {
    version: '1.7',
    date: '2026-09-19',
    changes: [
      { kind: 'improved', text: 'A new look built around a native iOS design language: grouped cards, system-style controls, and a refreshed type scale.' },
      { kind: 'new', text: 'Discarded sessions now show in the Calendar, where you can restore or delete them.' },
      { kind: 'new', text: 'When you log a climb on a colour band that covers several grades, you can pin it to the exact grade. Settings has a Refine old grade ranges action for climbs logged before that.' },
      { kind: 'new', text: 'Settings has a Check for updates button and shows which update is running.' },
      { kind: 'improved', text: 'A Settings gear icon, an All-gyms filter on the grade pyramid, and a pass over confirmations, haptics, the keyboard and Android dialogs while logging.' },
      { kind: 'fixed', text: 'Grade colours for non-V-scale gyms, misaligned pyramid bars, and sparkline dots spilling into Personal bests.' },
    ],
  },
  {
    version: '1.6',
    date: '2026-09-05',
    changes: [
      { kind: 'improved', text: 'A redesigned interface: new layout, icons, a soft black background, and sharp corners.' },
      { kind: 'improved', text: 'Updates now download and apply as soon as you open the app.' },
      { kind: 'fixed', text: 'The default gym\'s grade list no longer doubles every time the app starts.' },
    ],
  },
  {
    version: '1.5',
    date: '2026-09-02',
    changes: [
      { kind: 'new', text: 'Pick an accent colour in Settings.' },
      { kind: 'new', text: 'A by-month view on the Progress screen.' },
      { kind: 'improved', text: 'More compact rows when editing grades and choosing a gym.' },
    ],
  },
  {
    version: '1.0.4',
    date: '2026-09-02',
    changes: [
      { kind: 'new', text: 'Week and List views in the Calendar, and session chips in the month view.' },
      { kind: 'new', text: 'Over-the-air updates, and the ASCEND route-line icon.' },
      { kind: 'improved', text: 'The grade pyramid can be filtered by gym, and remembers your choice.' },
      { kind: 'improved', text: 'The selected-day list in the Calendar is now a connected timeline.' },
      { kind: 'fixed', text: 'A round of fixes for hard-to-hit buttons, the gym editor, gym deletion, and the Calendar not resetting when you came back to it.' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-08-31',
    changes: [
      { kind: 'new', text: 'Log climbing and strength sessions, see them in a Calendar, and set up gyms with their own grade systems.' },
      { kind: 'new', text: 'Light and dark themes, a Progress screen, and a live session-length timer.' },
      { kind: 'new', text: 'A Settings screen and an icon-only bottom tab bar.' },
    ],
  },
];

/** What Settings displays as the app version. */
export const APP_VERSION = CHANGELOG[0].version;

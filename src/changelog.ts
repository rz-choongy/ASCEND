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
    ],
  },
];

/** What Settings displays as the app version. */
export const APP_VERSION = CHANGELOG[0].version;

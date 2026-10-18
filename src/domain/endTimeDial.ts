// Maths for the end-time clock dial: drag the minute hand round the face, the hour hand
// follows. Kept free of React so the rules (never before the start or the last log, never
// past now) are tested on their own.

const MIN = 60_000;
const HOUR = 60 * MIN;

/** Longest session the dial offers to stretch to: a clock face only tells 12 hours apart. */
export const DIAL_MAX_SPAN_MS = 12 * HOUR;

/** Degrees clockwise from 12 o'clock of the point (x, y) around the centre (cx, cy). */
export const angleFromPoint = (x: number, y: number, cx: number, cy: number): number => {
  const deg = (Math.atan2(x - cx, cy - y) * 180) / Math.PI;
  return (deg + 360) % 360;
};

/** Where the minute hand points for a wall-clock time, in degrees from 12. */
export const minuteHandAngle = (ms: number): number => {
  const d = new Date(ms);
  return ((d.getMinutes() + d.getSeconds() / 60) / 60) * 360;
};

/** Where the hour hand points for a wall-clock time, in degrees from 12. */
export const hourHandAngle = (ms: number): number => {
  const d = new Date(ms);
  return (((d.getHours() % 12) + d.getMinutes() / 60) / 12) * 360;
};

/**
 * Time moved by sweeping the minute hand from one angle to the next. Takes the short way
 * round, so crossing 12 goes forward an hour boundary rather than jumping back 59 minutes.
 */
export const sweepMs = (fromDeg: number, toDeg: number): number => {
  let delta = (toDeg - fromDeg) % 360;
  if (delta > 180) delta -= 360;
  if (delta <= -180) delta += 360;
  return (delta / 360) * HOUR;
};

export type DialRange = { earliest: number; latest: number };

/**
 * The window the end can move in: from the last log (and at least a minute after the start)
 * up to now, and at most 12 hours in unless it already ends later than that.
 */
export const dialRange = (
  startedAt: number,
  currentEnd: number,
  lastLogAt: number | null,
  now: number
): DialRange => {
  const earliest = Math.max(startedAt + MIN, lastLogAt ?? 0);
  const latest = Math.max(earliest, Math.min(now, Math.max(currentEnd, startedAt + DIAL_MAX_SPAN_MS)));
  return { earliest, latest };
};

export const clampToRange = (ms: number, { earliest, latest }: DialRange): number =>
  Math.min(latest, Math.max(earliest, ms));

/** Rounds to the whole minute, without stepping outside the range. */
export const snapToMinute = (ms: number, range: DialRange): number => {
  const rounded = Math.round(ms / MIN) * MIN;
  if (rounded < range.earliest) return range.earliest;
  if (rounded > range.latest) return range.latest;
  return rounded;
};

/** Steps by whole minutes, for the screen reader's increment/decrement. */
export const stepMinutes = (ms: number, minutes: number, range: DialRange): number =>
  clampToRange(Math.round(ms / MIN) * MIN + minutes * MIN, range);

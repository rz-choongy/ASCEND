import {
  DIAL_MAX_SPAN_MS,
  angleFromPoint,
  clampToRange,
  dialRange,
  hourHandAngle,
  minuteHandAngle,
  snapToMinute,
  stepMinutes,
  sweepMs,
} from './endTimeDial';

const MIN = 60_000;
const HOUR = 60 * MIN;
// Local wall-clock times, so the hand angles hold in any time zone.
const at = (h: number, m: number, s = 0) => new Date(2026, 9, 17, h, m, s).getTime();

describe('angleFromPoint', () => {
  it('reads clockwise from 12 o\'clock', () => {
    expect(angleFromPoint(100, 0, 100, 100)).toBeCloseTo(0);
    expect(angleFromPoint(200, 100, 100, 100)).toBeCloseTo(90);
    expect(angleFromPoint(100, 200, 100, 100)).toBeCloseTo(180);
    expect(angleFromPoint(0, 100, 100, 100)).toBeCloseTo(270);
  });
});

describe('hand angles', () => {
  it('points the minute hand by the minute', () => {
    expect(minuteHandAngle(at(20, 0))).toBe(0);
    expect(minuteHandAngle(at(20, 15))).toBe(90);
    expect(minuteHandAngle(at(20, 45))).toBe(270);
  });

  it('moves the hour hand between hours, on a 12-hour face', () => {
    expect(hourHandAngle(at(15, 0))).toBe(90);
    expect(hourHandAngle(at(20, 30))).toBe(255);
    expect(hourHandAngle(at(8, 30))).toBe(hourHandAngle(at(20, 30)));
  });
});

describe('sweepMs', () => {
  it('turns a quarter turn into 15 minutes either way', () => {
    expect(sweepMs(0, 90)).toBe(15 * MIN);
    expect(sweepMs(90, 0)).toBe(-15 * MIN);
  });

  it('crosses 12 going forward instead of jumping back an hour', () => {
    expect(sweepMs(354, 6)).toBeCloseTo(2 * MIN);
    expect(sweepMs(6, 354)).toBeCloseTo(-2 * MIN);
  });

  it('adds up to an hour over a full turn of small steps', () => {
    let total = 0;
    for (let deg = 0; deg < 360; deg += 10) total += sweepMs(deg, deg + 10);
    expect(total).toBeCloseTo(HOUR);
  });
});

describe('dialRange', () => {
  const start = at(18, 5);

  it('runs from the last log up to the current end', () => {
    const r = dialRange(start, at(21, 45), at(20, 12), at(23, 0));
    expect(r.earliest).toBe(at(20, 12));
    expect(r.latest).toBe(at(23, 0));
  });

  it('never lets the end come before the start', () => {
    // Nothing logged: a minute in is the floor.
    expect(dialRange(start, at(21, 45), null, at(23, 0)).earliest).toBe(start + MIN);
    // A log whose clock reads before the start (phone clock changed) still can't pull it earlier.
    expect(dialRange(start, at(21, 45), at(17, 0), at(23, 0)).earliest).toBe(start + MIN);
  });

  it('never goes past now', () => {
    const now = at(21, 0);
    expect(dialRange(start, at(20, 50), at(20, 12), now).latest).toBe(now);
  });

  it('caps at 12 hours in, unless the session already ran longer', () => {
    const muchLater = start + 30 * HOUR;
    expect(dialRange(start, at(21, 45), null, muchLater).latest).toBe(start + DIAL_MAX_SPAN_MS);
    const longEnd = start + 14 * HOUR;
    expect(dialRange(start, longEnd, null, muchLater).latest).toBe(longEnd);
  });

  it('keeps latest at or after earliest even when now is behind the last log', () => {
    const r = dialRange(start, at(20, 30), at(20, 12), at(19, 0));
    expect(r.latest).toBeGreaterThanOrEqual(r.earliest);
  });
});

describe('clamping and snapping', () => {
  const range = { earliest: at(20, 12, 34), latest: at(21, 45) };

  it('holds a drag at the edges', () => {
    expect(clampToRange(at(19, 0), range)).toBe(range.earliest);
    expect(clampToRange(at(23, 0), range)).toBe(range.latest);
    expect(clampToRange(at(21, 0), range)).toBe(at(21, 0));
  });

  it('snaps to the minute but not below the last log', () => {
    expect(snapToMinute(at(20, 40, 29), range)).toBe(at(20, 40));
    expect(snapToMinute(at(20, 40, 31), range)).toBe(at(20, 41));
    // 8:12:34 rounds to 8:13 -- fine; 8:12:10 would round below the floor, so it holds.
    expect(snapToMinute(at(20, 12, 10), range)).toBe(range.earliest);
  });

  it('steps a minute at a time within the range', () => {
    expect(stepMinutes(at(21, 0), 5, range)).toBe(at(21, 5));
    expect(stepMinutes(at(21, 43), 5, range)).toBe(range.latest);
    expect(stepMinutes(at(20, 14), -5, range)).toBe(range.earliest);
  });
});

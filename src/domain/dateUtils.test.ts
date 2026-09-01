import { addDays, formatElapsed, formatLocalDate, startOfWeek } from './dateUtils';

describe('formatLocalDate', () => {
  it('formats dates as local YYYY-MM-DD', () => {
    expect(formatLocalDate(new Date(2026, 3, 5))).toBe('2026-04-05');
  });
});

describe('formatElapsed', () => {
  it('formats under a minute as 00:SS', () => {
    expect(formatElapsed(45_000)).toBe('00:45');
  });

  it('formats minutes and seconds as MM:SS', () => {
    expect(formatElapsed(4 * 60_000 + 32_000)).toBe('04:32');
  });

  it('rolls to H:MM:SS past an hour', () => {
    expect(formatElapsed(60 * 60_000 + 4 * 60_000 + 32_000)).toBe('1:04:32');
  });

  it('clamps negative values to zero', () => {
    expect(formatElapsed(-5_000)).toBe('00:00');
  });
});

describe('startOfWeek', () => {
  it('returns the same Monday when given a Monday', () => {
    // 2026-08-31 is a Monday
    const monday = new Date(2026, 7, 31);
    expect(formatLocalDate(startOfWeek(monday))).toBe('2026-08-31');
  });

  it('anchors back to Monday for a mid-week date', () => {
    // 2026-09-02 is a Wednesday
    const wednesday = new Date(2026, 8, 2);
    expect(formatLocalDate(startOfWeek(wednesday))).toBe('2026-08-31');
  });

  it('anchors a Sunday back to the preceding Monday', () => {
    // 2026-09-06 is a Sunday
    const sunday = new Date(2026, 8, 6);
    expect(formatLocalDate(startOfWeek(sunday))).toBe('2026-08-31');
  });
});

describe('addDays', () => {
  it('adds positive days, rolling into the next month', () => {
    expect(formatLocalDate(addDays(new Date(2026, 7, 30), 3))).toBe('2026-09-02');
  });

  it('subtracts days for a negative offset', () => {
    expect(formatLocalDate(addDays(new Date(2026, 8, 2), -3))).toBe('2026-08-30');
  });
});

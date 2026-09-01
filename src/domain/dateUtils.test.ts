import { formatElapsed, formatLocalDate } from './dateUtils';

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

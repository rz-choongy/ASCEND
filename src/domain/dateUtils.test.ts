import { formatLocalDate } from './dateUtils';

describe('formatLocalDate', () => {
  it('formats dates as local YYYY-MM-DD', () => {
    expect(formatLocalDate(new Date(2026, 3, 5))).toBe('2026-04-05');
  });
});

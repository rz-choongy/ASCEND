import { buildMonthGrid, chunkWeeks } from './calendarGrid';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const columnOf = (weeks: (Date | null)[][], dayOfMonth: number) => {
  for (const week of weeks) {
    const col = week.findIndex((d) => d?.getDate() === dayOfMonth);
    if (col >= 0) return WEEKDAYS[col];
  }
  return null;
};

describe('month grid', () => {
  const weeks = chunkWeeks(buildMonthGrid(new Date(2026, 9, 1)));

  it('renders full 7-day weeks', () => {
    expect(weeks).toHaveLength(5);
    weeks.forEach((week) => expect(week).toHaveLength(7));
  });

  it('puts October 2026 dates under the right weekday', () => {
    expect(columnOf(weeks, 1)).toBe('Th');
    expect(columnOf(weeks, 4)).toBe('Su');
    expect(columnOf(weeks, 5)).toBe('Mo');
    expect(columnOf(weeks, 26)).toBe('Mo');
    expect(columnOf(weeks, 31)).toBe('Sa');
  });

  it('starts Sunday-first months in the last column', () => {
    // 1 Nov 2026 is a Sunday.
    const nov = chunkWeeks(buildMonthGrid(new Date(2026, 10, 1)));
    expect(columnOf(nov, 1)).toBe('Su');
    expect(nov[0].slice(0, 6).every((d) => d === null)).toBe(true);
  });
});

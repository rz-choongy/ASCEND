/** Returns a Monday-anchored grid of Date | null for the month. */
export function buildMonthGrid(monthStart: Date): (Date | null)[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDayOfWeek = monthStart.getDay(); // 0=Sun
  // Convert to Mon-based offset: Mon=0, Sun=6.
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayIndex = i - offset + 1;
    if (dayIndex < 1 || dayIndex > daysInMonth) {
      cells.push(null);
    } else {
      cells.push(new Date(year, month, dayIndex));
    }
  }
  return cells;
}

/** Splits the month grid into rows of 7 so each week renders as its own row. */
export function chunkWeeks<T>(cells: T[]): T[][] {
  const weeks: T[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export type Delta = { text: string; tone: 'up' | 'flat' };

// Only improvements are worth a line; an equal or worse session shows nothing rather than a telling-off.
export const countDelta = (latest: number, previous: number | undefined, suffix = 'vs last', unit = ''): Delta | null => {
  if (previous === undefined) return null;
  const diff = latest - previous;
  return diff > 0 ? { text: `+${diff}${unit} ${suffix}`, tone: 'up' } : null;
};

export const percentDelta = (latest: number, previous: number | undefined): Delta | null => {
  if (previous === undefined || previous === 0) return null;
  const pct = Math.round(((latest - previous) / previous) * 100);
  return pct > 0 ? { text: `+${pct}% vs last`, tone: 'up' } : null;
};

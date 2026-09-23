export type Delta = { text: string; tone: 'up' | 'flat' };

// Only improvements get colour; a dip reads neutral rather than as a telling-off.
export const countDelta = (latest: number, previous: number | undefined, suffix = 'vs last', unit = ''): Delta | null => {
  if (previous === undefined) return null;
  const diff = latest - previous;
  if (diff === 0) return { text: `same as ${suffix.replace(/^vs /, '')}`, tone: 'flat' };
  return { text: `${diff > 0 ? '+' : '−'}${Math.abs(diff)}${unit} ${suffix}`, tone: diff > 0 ? 'up' : 'flat' };
};

export const percentDelta = (latest: number, previous: number | undefined): Delta | null => {
  if (previous === undefined || previous === 0) return null;
  const pct = Math.round(((latest - previous) / previous) * 100);
  if (pct === 0) return { text: 'same as last', tone: 'flat' };
  return { text: `${pct > 0 ? '+' : '−'}${Math.abs(pct)}% vs last`, tone: pct > 0 ? 'up' : 'flat' };
};

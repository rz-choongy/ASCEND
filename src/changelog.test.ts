import { APP_VERSION, CHANGELOG } from './changelog';

/** Versions are major.minor, or major.minor.patch for the earliest ones. */
const parse = (version: string): number[] => {
  const parts = version.split('.').map(Number);
  return [parts[0], parts[1], parts[2] ?? 0];
};

describe('CHANGELOG', () => {
  it('lists versions newest first with no repeats', () => {
    const versions = CHANGELOG.map((entry) => parse(entry.version));
    versions.slice(1).forEach((older, i) => {
      const newer = versions[i];
      const cmp = newer[0] - older[0] || newer[1] - older[1] || newer[2] - older[2];
      expect(cmp).toBeGreaterThan(0);
    });
  });

  it('uses numeric versions and ISO dates', () => {
    CHANGELOG.forEach((entry) => {
      expect(entry.version).toMatch(/^\d+\.\d+(\.\d+)?$/);
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(entry.date))).toBe(false);
    });
  });

  it('never ships an empty entry or empty line', () => {
    CHANGELOG.forEach((entry) => {
      expect(entry.changes.length).toBeGreaterThan(0);
      entry.changes.forEach((change) => expect(change.text.trim().length).toBeGreaterThan(0));
    });
  });

  it('takes the displayed app version from the newest entry', () => {
    expect(APP_VERSION).toBe(CHANGELOG[0].version);
  });
});

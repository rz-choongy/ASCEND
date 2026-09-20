import { APP_VERSION, CHANGELOG } from './changelog';

const parse = (version: string): number[] => version.split('.').map(Number);

describe('CHANGELOG', () => {
  it('lists versions newest first with no repeats', () => {
    const versions = CHANGELOG.map((entry) => parse(entry.version));
    versions.slice(1).forEach((older, i) => {
      const newer = versions[i];
      const cmp = newer[0] - older[0] || newer[1] - older[1];
      expect(cmp).toBeGreaterThan(0);
    });
  });

  it('uses major.minor versions and ISO dates', () => {
    CHANGELOG.forEach((entry) => {
      expect(entry.version).toMatch(/^\d+\.\d+$/);
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

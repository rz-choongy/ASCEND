import { isNewer } from './release';

// The UI barrel pulls in fonts, which don't load under Jest.
jest.mock('./ui', () => ({ showDialog: jest.fn() }));

describe('isNewer', () => {
  it('compares dotted versions numerically', () => {
    expect(isNewer('1.1.0', '1.0.0')).toBe(true);
    expect(isNewer('1.10.0', '1.9.0')).toBe(true);
    expect(isNewer('1.0.0', '1.0.0')).toBe(false);
    expect(isNewer('1.0.0', '1.1.0')).toBe(false);
    expect(isNewer('2', '1.9.9')).toBe(true);
  });
});

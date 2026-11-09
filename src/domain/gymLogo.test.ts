import { pickConfidentMatch, resolveLogoDomain } from './gymLogo';
import type { GymRow } from './types';

jest.mock('./gymStore', () => ({}));

const gym = (overrides: Partial<GymRow>): GymRow => ({
  id: 'g',
  name: 'Gym',
  grading_type: 'v_scale',
  is_default: 0,
  parent_id: null,
  logo_domain: null,
  created_at: 0,
  updated_at: 0,
  ...overrides,
});

describe('pickConfidentMatch', () => {
  it('skips a result that only shares letters with the gym name', () => {
    const match = pickConfidentMatch('Blochaus', [
      { name: 'Bloch Australia', domain: 'bloch.com.au' },
      { name: 'BlocHaus Bouldering', domain: 'blochaus.com.au' },
    ]);
    expect(match?.domain).toBe('blochaus.com.au');
  });

  it('matches a company name inside a longer gym name', () => {
    const match = pickConfidentMatch('Urban Climb Collingwood', [
      { name: 'Urban Climb', domain: 'urbanclimb.com.au' },
    ]);
    expect(match?.domain).toBe('urbanclimb.com.au');
  });

  it('returns null when nothing agrees', () => {
    expect(pickConfidentMatch('Lactic Factory', [{ name: 'Lactic Labs', domain: 'lactic.io' }])).toBeNull();
  });

  it('does not match on filler words alone', () => {
    expect(pickConfidentMatch('Climbing Gym', [{ name: 'Climbing Centre', domain: 'x.com' }])).toBeNull();
  });
});

describe('resolveLogoDomain', () => {
  const parent = gym({ id: 'p', logo_domain: 'urbanclimb.com.au' });

  it('uses the parent logo for a branch without its own', () => {
    expect(resolveLogoDomain(gym({ parent_id: 'p' }), [parent])).toBe('urbanclimb.com.au');
  });

  it('keeps a branch with logos turned off blank', () => {
    expect(resolveLogoDomain(gym({ parent_id: 'p', logo_domain: '' }), [parent])).toBeNull();
  });

  it('returns null for a gym with no logo', () => {
    expect(resolveLogoDomain(gym({ logo_domain: '' }), [])).toBeNull();
  });
});

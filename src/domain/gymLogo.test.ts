import { gymLogoUrl, numberVariant, pickConfidentMatch, resolveLogoUri } from './gymLogo';
import type { GymRow } from './types';

jest.mock('./gymStore', () => ({}));

const gym = (overrides: Partial<GymRow>): GymRow => ({
  id: 'g',
  name: 'Gym',
  grading_type: 'v_scale',
  is_default: 0,
  parent_id: null,
  logo_domain: null,
  logo_image: null,
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

  it('matches a mapped venue that adds its suburb', () => {
    const match = pickConfidentMatch('Nine Degrees', [
      { name: 'Nine Degrees North Hospitality', domain: 'ninedegreesnorth.com', source: 'company' },
      { name: '9 degrees Chatswood', domain: '9degrees.com.au', source: 'place' },
    ]);
    expect(match?.domain).toBe('9degrees.com.au');
  });

  it('does not let a company add a word to a short name', () => {
    expect(pickConfidentMatch('Bump', [{ name: 'Bump Boxes', domain: 'bumpboxes.com', source: 'company' }])).toBeNull();
  });

  it('prefers the climbing gym among same-name results', () => {
    const match = pickConfidentMatch('Crux', [
      { name: 'Crux', domain: 'cruxnow.com', source: 'company' },
      { name: 'Crux Climbing Center', domain: 'cruxclimbingcenter.com', source: 'company' },
    ]);
    expect(match?.domain).toBe('cruxclimbingcenter.com');
  });

  it('returns null when nothing agrees', () => {
    expect(pickConfidentMatch('Lactic Factory', [{ name: 'Lactic Labs', domain: 'lactic.io' }])).toBeNull();
  });

  it('does not match on filler words alone', () => {
    expect(pickConfidentMatch('Climbing Gym', [{ name: 'Climbing Centre', domain: 'x.com' }])).toBeNull();
  });
});

describe('numberVariant', () => {
  it('swaps number words and digits', () => {
    expect(numberVariant('Nine Degrees')).toBe('9 Degrees');
    expect(numberVariant('9 Degrees')).toBe('nine Degrees');
    expect(numberVariant('Blochaus')).toBeNull();
  });
});

describe('resolveLogoUri', () => {
  const parent = gym({ id: 'p', logo_domain: 'urbanclimb.com.au' });

  it('uses the parent logo for a branch without its own', () => {
    expect(resolveLogoUri(gym({ parent_id: 'p' }), [parent])).toBe(gymLogoUrl('urbanclimb.com.au'));
  });

  it('keeps a branch with logos turned off blank', () => {
    expect(resolveLogoUri(gym({ parent_id: 'p', logo_domain: '' }), [parent])).toBeNull();
  });

  it('returns null for a gym with no logo', () => {
    expect(resolveLogoUri(gym({ logo_domain: '' }), [])).toBeNull();
  });

  it('prefers a picked photo over the website logo', () => {
    expect(resolveLogoUri(gym({ logo_domain: 'x.com', logo_image: 'data:image/jpeg;base64,AA' }), [])).toBe(
      'data:image/jpeg;base64,AA'
    );
  });
});

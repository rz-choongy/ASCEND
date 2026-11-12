import { autoMatchGymLogos, gymLogoUrl, logoNameKey, numberVariant, pickConfidentMatch, resolveLogoUri } from './gymLogo';
import { getGyms, setGymLogoDomain, setGymLogoImage } from './gymStore';
import { lookupDirectoryLogos, shareGymLogo } from './gymLogoDirectory';
import type { GymRow } from './types';

jest.mock('./gymStore', () => ({
  getGyms: jest.fn(() => []),
  setGymLogoDomain: jest.fn(),
  setGymLogoImage: jest.fn(),
  isUnnamedDefaultGym: () => false,
}));
jest.mock('./gymLogoDirectory', () => ({
  lookupDirectoryLogos: jest.fn(async () => new Map()),
  shareGymLogo: jest.fn(async () => true),
}));
jest.mock('./settingsStore', () => ({
  getInstallId: () => 'install-1',
  getSharedGymLogos: () => new Set<string>(),
  setSharedGymLogos: jest.fn(),
}));

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

describe('logoNameKey', () => {
  it('gives the same key to a gym with and without filler words', () => {
    expect(logoNameKey('Bump Bouldering')).toBe('bump');
    expect(logoNameKey('Bump')).toBe('bump');
    expect(logoNameKey('Nine Degrees Climbing')).toBe(logoNameKey('9 Degrees'));
  });
});

describe('autoMatchGymLogos', () => {
  it('uses the shared directory before searching the web', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    (getGyms as jest.Mock).mockReturnValue([gym({ id: 'bump', name: 'Bump Bouldering' })]);
    (lookupDirectoryLogos as jest.Mock).mockResolvedValue(
      new Map([['bump', { domain: null, imageUrl: 'https://x.supabase.co/storage/v1/object/public/gym-logos/a.jpg', votes: 3 }]])
    );

    expect(await autoMatchGymLogos()).toBe(true);
    expect(setGymLogoImage).toHaveBeenCalledWith('bump', 'https://x.supabase.co/storage/v1/object/public/gym-logos/a.jpg');
    expect(setGymLogoDomain).toHaveBeenCalledWith('bump', '');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('shares a gym logo this phone already has', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
    (getGyms as jest.Mock).mockReturnValue([gym({ id: 'ul', name: 'Urban Climb', logo_domain: 'urbanclimb.com.au' })]);

    await autoMatchGymLogos();
    expect(shareGymLogo).toHaveBeenCalledWith(
      expect.objectContaining({ nameKey: 'urban', domain: 'urbanclimb.com.au', picked: false })
    );
  });
});

jest.mock('../../domain/settingsStore', () => ({
  getKilterSession: jest.fn(),
  setKilterSession: jest.fn(),
  clearKilterSession: jest.fn(),
}));

import { clearKilterSession, getKilterSession, setKilterSession } from '../../domain/settingsStore';
import { databaseSessionStore } from './kilterSessionStore';

const mockGet = getKilterSession as jest.Mock;

describe('databaseSessionStore', () => {
  beforeEach(() => jest.clearAllMocks());

  it('round-trips a session through JSON', async () => {
    await databaseSessionStore.set({ refreshToken: 'r1', username: 'climber' });
    expect(setKilterSession).toHaveBeenCalledWith(JSON.stringify({ refreshToken: 'r1', username: 'climber' }));

    mockGet.mockReturnValue(JSON.stringify({ refreshToken: 'r1', username: 'climber' }));
    expect(await databaseSessionStore.get()).toEqual({ refreshToken: 'r1', username: 'climber' });
  });

  it.each([[null], ['not json'], [JSON.stringify({ refreshToken: 5 })], [JSON.stringify({ username: 'u' })]])(
    'reads %p as signed out',
    async (stored) => {
      mockGet.mockReturnValue(stored);
      expect(await databaseSessionStore.get()).toBeNull();
    }
  );

  it('clears the stored session', async () => {
    await databaseSessionStore.clear();
    expect(clearKilterSession).toHaveBeenCalled();
  });
});

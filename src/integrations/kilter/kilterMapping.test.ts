import {
  mapKilterLogs,
  parseKilterLogs,
  pickGradeOption,
  vGradeForDifficultyId,
  type GradeOption,
  type KilterLog,
} from './kilterMapping';

const OPTIONS: GradeOption[] = [
  { id: 'g-v3', label: 'V3', gradeMin: 3, gradeMax: 3, colorHex: '#F59E0B' },
  { id: 'g-v4', label: 'V4', gradeMin: 4, gradeMax: 4, colorHex: '#F97316' },
  { id: 'g-v11', label: 'V11+', gradeMin: 11, gradeMax: 17, colorHex: '#111827' },
];

const at = (day: number, hour: number) => new Date(2026, 8, day, hour).getTime();

const log = (id: string, overrides: Partial<KilterLog> = {}): KilterLog => ({
  logUuid: id,
  attempts: 1,
  topped: true,
  flashed: false,
  createdAt: at(1, 18),
  difficultyId: 18, // V4
  ...overrides,
});

describe('vGradeForDifficultyId', () => {
  it('maps difficulty ids onto the V-scale', () => {
    expect(vGradeForDifficultyId(10)).toBe(0);
    expect(vGradeForDifficultyId(18)).toBe(4);
    expect(vGradeForDifficultyId(39)).toBe(22);
    expect(vGradeForDifficultyId(999)).toBeNull();
  });
});

describe('parseKilterLogs', () => {
  const raw = {
    logUuid: 'a',
    createdAt: '2026-09-01T18:00:00Z',
    attempts: 0,
    topped: true,
    flashed: true,
    currentDifficultyId: 18,
  };

  it('accepts a bare array or a wrapped list', () => {
    expect(parseKilterLogs([raw])).toHaveLength(1);
    expect(parseKilterLogs({ logs: [raw] })).toHaveLength(1);
    expect(parseKilterLogs({ data: [raw] })).toHaveLength(1);
    expect(parseKilterLogs({ nope: 1 })).toEqual([]);
    expect(parseKilterLogs(null)).toEqual([]);
  });

  it('drops entries without an id or a usable date, and floors attempts at 1', () => {
    const parsed = parseKilterLogs([raw, { ...raw, logUuid: undefined }, { ...raw, createdAt: 'garbage' }, 5]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ logUuid: 'a', attempts: 1, topped: true, flashed: true, difficultyId: 18 });
  });
});

describe('pickGradeOption', () => {
  it('picks the covering bucket and clamps outside the range', () => {
    expect(pickGradeOption(OPTIONS, 4)?.id).toBe('g-v4');
    expect(pickGradeOption(OPTIONS, 13)?.id).toBe('g-v11');
    expect(pickGradeOption(OPTIONS, 22)?.id).toBe('g-v11');
    expect(pickGradeOption(OPTIONS, 0)?.id).toBe('g-v3');
    expect(pickGradeOption([], 4)).toBeNull();
  });
});

describe('mapKilterLogs', () => {
  it('imports sends and flashes, skips attempt-only logs and unknown grades', () => {
    const sessions = mapKilterLogs(
      [
        log('send'),
        log('flash', { flashed: true, createdAt: at(1, 19) }),
        log('attempt', { topped: false, createdAt: at(1, 20) }),
        log('mystery', { difficultyId: 999, createdAt: at(1, 21) }),
        log('nograde', { difficultyId: null, createdAt: at(1, 22) }),
      ],
      OPTIONS,
      'gym-kilter'
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0].climbs.map((c) => [c.externalId, c.payload.result])).toEqual([
      ['send', 'SEND'],
      ['flash', 'FLASH'],
    ]);
    expect(sessions[0].climbs[0].payload).toMatchObject({
      gradeLabel: 'V4',
      gradeId: 'g-v4',
      gymId: 'gym-kilter',
    });
  });

  it('groups by local day and spans first to last send', () => {
    const sessions = mapKilterLogs(
      [log('c', { createdAt: at(3, 9) }), log('a', { createdAt: at(1, 18) }), log('b', { createdAt: at(1, 20) })],
      OPTIONS,
      'gym'
    );
    expect(sessions.map((s) => s.dayKey)).toEqual(['2026-09-01', '2026-09-03']);
    expect(sessions[0]).toMatchObject({ startedAt: at(1, 18), completedAt: at(1, 20) });
    expect(sessions[0].climbs.map((c) => c.externalId)).toEqual(['a', 'b']);
  });

  it('collapses duplicate log ids', () => {
    const sessions = mapKilterLogs([log('x'), log('x')], OPTIONS, 'gym');
    expect(sessions[0].climbs).toHaveLength(1);
  });

  it('clamps grades harder than any bucket onto the hardest one', () => {
    const [session] = mapKilterLogs([log('hard', { difficultyId: 36 })], OPTIONS, 'gym'); // V19
    expect(session.climbs[0].payload.gradeLabel).toBe('V11+');
  });
});

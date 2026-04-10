import { extractActivitiesList } from '../extractActivitiesList';

describe('extractActivitiesList', () => {
  it('reads data as array', () => {
    expect(extractActivitiesList({ data: [{ id: 1 }] } as Record<string, unknown>)).toEqual([{ id: 1 }]);
  });

  it('reads nested activities', () => {
    expect(
      extractActivitiesList({ data: { activities: [{ id: 2 }] } } as unknown as Record<string, unknown>)
    ).toEqual([{ id: 2 }]);
  });

  it('reads root activities', () => {
    expect(extractActivitiesList({ activities: [{ id: 3 }] } as Record<string, unknown>)).toEqual([{ id: 3 }]);
  });

  it('reads items', () => {
    expect(extractActivitiesList({ data: { items: [{ id: 4 }] } } as unknown as Record<string, unknown>)).toEqual([
      { id: 4 },
    ]);
  });

  it('returns null when unknown', () => {
    expect(extractActivitiesList({ data: {} } as Record<string, unknown>)).toBeNull();
  });
});

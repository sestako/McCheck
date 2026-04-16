import { mapActivity, mapAttendee, pickDisplayName } from '../mappers';

describe('mapActivity', () => {
  it('maps camelCase activity', () => {
    const a = mapActivity({
      id: 1,
      uuid: 'u',
      state: 'PUBLIC',
      name: 'Test',
      teaser: null,
      capacity: 10,
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-02T00:00:00.000Z',
      registrationsCount: 5,
      attendingGuestsCount: 1,
      owner: { id: 2, displayName: 'Owner' },
    });
    expect(a.name).toBe('Test');
    expect(a.registrationsCount).toBe(5);
    expect(a.owner.displayName).toBe('Owner');
    expect(a.address).toBeNull();
    expect(a.lat).toBeNull();
    expect(a.lon).toBeNull();
    expect(a.category).toBeNull();
    expect(a.slug).toBeNull();
    expect(a.isSpecial).toBe(false);
    expect(a.createdAt).toBeNull();
    expect(a.updatedAt).toBeNull();
  });

  it('maps snake_case counts and owner_id', () => {
    const a = mapActivity({
      id: 3,
      uuid: 'x',
      state: 'x',
      name: 'N',
      registrations_count: 9,
      attending_guests_count: 2,
      owner_id: 4,
      owner: { id: 4, public_name: 'Pat' },
      start: 'a',
      end: 'b',
    });
    expect(a.registrationsCount).toBe(9);
    expect(a.attendingGuestsCount).toBe(2);
    expect(a.owner.displayName).toBe('Pat');
  });

  it('maps activity_id and starts_at / ends_at', () => {
    const a = mapActivity({
      activity_id: 7,
      uuid: 'u7',
      status: 'draft',
      name: 'Draft run',
      starts_at: '2026-06-01T08:00:00.000Z',
      ends_at: '2026-06-01T09:00:00.000Z',
      owner: { id: 1 },
    });
    expect(a.id).toBe(7);
    expect(a.state).toBe('draft');
    expect(a.start).toContain('2026-06-01');
    expect(a.end).toContain('2026-06-01');
  });

  it('maps JSON:API style resource with attributes', () => {
    const a = mapActivity({
      id: '12',
      attributes: {
        uuid: 'uuid-12',
        state: 'public',
        name: 'API style',
        start: '2026-01-01T00:00:00.000Z',
        end: '2026-01-01T01:00:00.000Z',
        owner: { id: 3, displayName: 'Org' },
      },
    });
    expect(a.id).toBe(12);
    expect(a.name).toBe('API style');
  });

  it('maps venue, category, slug, special flag, and timestamps from snake_case', () => {
    const a = mapActivity({
      id: 99,
      uuid: 'u',
      state: 'public',
      name: 'Full',
      address: '  Main St 1  ',
      latitude: '49.2',
      longitude: 16.61,
      category: 'cycling',
      slug: 'full-ride',
      is_special: true,
      created_at: '2025-06-01T08:00:00.000Z',
      updated_at: '2026-01-02T09:00:00.000Z',
      start: '2026-02-01T00:00:00.000Z',
      end: '2026-02-01T02:00:00.000Z',
      owner: { id: 1 },
    });
    expect(a.address).toBe('Main St 1');
    expect(a.lat).toBeCloseTo(49.2, 5);
    expect(a.lon).toBeCloseTo(16.61, 5);
    expect(a.category).toBe('cycling');
    expect(a.slug).toBe('full-ride');
    expect(a.isSpecial).toBe(true);
    expect(a.createdAt).toBe('2025-06-01T08:00:00.000Z');
    expect(a.updatedAt).toBe('2026-01-02T09:00:00.000Z');
  });
});

describe('mapAttendee', () => {
  it('maps nested user and blocked snake_case', () => {
    const row = mapAttendee({
      user: { id: 1, public_name: 'Alex', last_name: 'Q' },
      is_blocked: true,
    });
    expect(row.user.displayName).toBe('Alex');
    expect(row.isBlocked).toBe(true);
  });

  it('uses flat user shape', () => {
    const row = mapAttendee({ id: 2, first_name: 'Jo', last_name: 'Do' } as Record<string, unknown>);
    expect(row.user.displayName).toBe('Jo Do');
  });
});

describe('pickDisplayName', () => {
  it('prefers display_name', () => {
    expect(pickDisplayName({ display_name: 'DN' })).toBe('DN');
  });
});

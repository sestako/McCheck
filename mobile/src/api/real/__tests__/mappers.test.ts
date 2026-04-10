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

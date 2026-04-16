import type { Activity } from '../../api/types';
import { isActiveEvent } from '../isActiveEvent';

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 1,
    uuid: 'u',
    state: 'public',
    name: 'Test',
    teaser: null,
    capacity: 100,
    start: '2026-04-10T10:00:00.000Z',
    end: '2026-04-10T12:00:00.000Z',
    registrationsCount: 0,
    attendingGuestsCount: 0,
    owner: { id: 1, displayName: 'Owner' },
    address: null,
    lat: null,
    lon: null,
    category: null,
    slug: null,
    isSpecial: false,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe('isActiveEvent', () => {
  it('returns true when event is ongoing', () => {
    const now = new Date('2026-04-10T11:00:00.000Z');
    expect(isActiveEvent(makeActivity(), now)).toBe(true);
  });

  it('returns true when event is upcoming', () => {
    const now = new Date('2026-04-09T11:00:00.000Z');
    expect(isActiveEvent(makeActivity(), now)).toBe(true);
  });

  it('returns false when event has ended', () => {
    const now = new Date('2026-04-10T13:00:00.000Z');
    expect(isActiveEvent(makeActivity(), now)).toBe(false);
  });

  it('returns false for invalid dates', () => {
    const now = new Date('2026-04-10T11:00:00.000Z');
    expect(isActiveEvent(makeActivity({ start: 'bad', end: 'bad' }), now)).toBe(false);
  });
});

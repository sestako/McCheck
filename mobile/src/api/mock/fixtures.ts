import type { Activity, AttendeeRow } from '../types';
import { isMockTicketCheckedIn, mockTicketCheckedInAt } from './checkInStore';
import { namesForActivity } from './mockAttendeeNames';
import { mockTicketPublicId } from './mockTicketIds';

const owner = { id: 1, displayName: 'Alex Organizer' };

function activityDetailFields(
  override: Partial<
    Pick<
      Activity,
      'address' | 'lat' | 'lon' | 'category' | 'slug' | 'isSpecial' | 'createdAt' | 'updatedAt'
    >
  > = {}
): Pick<Activity, 'address' | 'lat' | 'lon' | 'category' | 'slug' | 'isSpecial' | 'createdAt' | 'updatedAt'> {
  return {
    address: null,
    lat: null,
    lon: null,
    category: null,
    slug: null,
    isSpecial: false,
    createdAt: null,
    updatedAt: null,
    ...override,
  };
}

/**
 * Baseline mock activities: one upcoming, one ongoing, one past (filtered out by isActiveEvent).
 * Used for normal mock mode.
 */
export const mockActivitiesCore: Activity[] = [
  {
    id: 101,
    uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee101',
    state: 'PUBLIC',
    name: 'Spring 5K — Packet pickup',
    teaser: 'Evening pickup at the community center.',
    capacity: 200,
    start: new Date(Date.now() + 86400000 * 2).toISOString(),
    end: new Date(Date.now() + 86400000 * 2 + 7200000).toISOString(),
    registrationsCount: 142,
    attendingGuestsCount: 8,
    owner,
    ...activityDetailFields({
      address: '123 River Road, Springfield',
      lat: 50.075538,
      lon: 14.4378,
      category: 'running',
      slug: 'spring-5k-packet-pickup',
      isSpecial: true,
      createdAt: '2025-11-01T09:00:00.000Z',
      updatedAt: '2026-01-15T12:30:00.000Z',
    }),
  },
  {
    id: 102,
    uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee102',
    state: 'PUBLIC',
    name: 'Workshop: Door check-in',
    teaser: 'Hands-on entrance flow.',
    capacity: 50,
    start: new Date(Date.now() - 3600000).toISOString(),
    end: new Date(Date.now() + 3600000 * 3).toISOString(),
    registrationsCount: 44,
    attendingGuestsCount: 2,
    owner,
    ...activityDetailFields({ category: 'fitnessConditioning', slug: 'workshop-door-check-in' }),
  },
  {
    id: 103,
    uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee103',
    state: 'PAST',
    name: 'Old event (past)',
    teaser: null,
    capacity: 100,
    start: new Date(Date.now() - 86400000 * 10).toISOString(),
    end: new Date(Date.now() - 86400000 * 9).toISOString(),
    registrationsCount: 80,
    attendingGuestsCount: 0,
    owner,
    ...activityDetailFields(),
  },
];

/**
 * Extra activities for `EXPO_PUBLIC_MOCK_SCENARIO=edge_layout` — long titles, odd offsets, empty guests, volume.
 */
export const mockActivitiesEdge: Activity[] = [
  {
    id: 104,
    uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee104',
    state: 'PUBLIC',
    name: `${'Very long event title — '.repeat(8)}stress test for list and detail wrapping`,
    teaser: 'Edge case: title length.',
    capacity: 500,
    start: '2026-07-15T10:00:00+14:00',
    end: '2026-07-15T22:00:00+14:00',
    registrationsCount: 3,
    attendingGuestsCount: 1,
    owner,
    ...activityDetailFields({ slug: 'very-long-title-edge', lat: -33.8688, lon: 151.2093 }),
  },
  {
    id: 105,
    uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee105',
    state: 'PUBLIC',
    name: 'No registrants yet (edge)',
    teaser: null,
    capacity: 40,
    start: new Date(Date.now() + 86400000).toISOString(),
    end: new Date(Date.now() + 86400000 * 2).toISOString(),
    registrationsCount: 0,
    attendingGuestsCount: 0,
    owner,
    ...activityDetailFields(),
  },
  {
    id: 106,
    uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee106',
    state: 'PUBLIC',
    name: 'High-volume guest list (edge)',
    teaser: 'Pagination stress.',
    capacity: 1000,
    start: new Date(Date.now() - 1800000).toISOString(),
    end: new Date(Date.now() + 7200000).toISOString(),
    registrationsCount: 250,
    attendingGuestsCount: 60,
    owner,
    ...activityDetailFields({ address: 'Arena North, Gate 4' }),
  },
];

/** @deprecated Use mockActivitiesCore; kept as core-only for older references. */
export const mockActivities = mockActivitiesCore;

export function mockAttendeesPage(
  activityId: number,
  page: number,
  search: string | null
): { items: AttendeeRow[]; hasMore: boolean } {
  const perPage = 8;
  let names = namesForActivity(activityId);
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    names = names.filter((n) => n.toLowerCase().includes(q));
  }
  const start = (page - 1) * perPage;
  const slice = names.slice(start, start + perPage);
  const items: AttendeeRow[] = slice.map((displayName, i) => {
    const registrationId = 10_000 + start + i;
    const ticketPublicId = mockTicketPublicId(activityId, registrationId);
    const checkedIn = isMockTicketCheckedIn(ticketPublicId);
    const globalIndex = start + i;
    const isGuest = activityId === 102 && globalIndex % 2 === 1;
    return {
      user: { id: registrationId, displayName },
      isBlocked: false,
      registrationId,
      ticketPublicId,
      checkedInAt: checkedIn ? mockTicketCheckedInAt(ticketPublicId) : null,
      isGuest,
    };
  });
  const hasMore = start + perPage < names.length;
  return { items, hasMore };
}

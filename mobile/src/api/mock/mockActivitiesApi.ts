import { getMockScenario } from '../../config/mockScenario';
import { isActiveEvent } from '../../lib/isActiveEvent';
import type { CheckInResult, TicketResolveResult } from '../checkInTypes';
import type { ActivitiesApi, Activity, ActivityFilter, PaginatedAttendees } from '../types';
import { ApiError } from '../types';
import {
  isMockTicketCheckedIn,
  markMockTicketCheckedIn,
  mockTicketCheckedInAt,
} from './checkInStore';
import { mockActivitiesCore, mockActivitiesEdge, mockAttendeesPage } from './fixtures';
import {
  mockDisplayNameForRegistration,
  mockIsValidRegistration,
  mockTicketPublicId,
  parseMockTicketPayload,
} from './mockTicketIds';

export function createMockActivitiesApi(): ActivitiesApi {
  return {
    async getMyActivities(filter: ActivityFilter = 'all'): Promise<Activity[]> {
      await delay(400);
      if (getMockScenario() === 'activities_fail') {
        throw new ApiError('Could not load events', 503);
      }
      const source = mockActivitySource();
      return applyMockFilter(source, filter);
    },

    async getActivity(id: number): Promise<Activity> {
      await delay(250);
      if (getMockScenario() === 'detail_404') {
        throw new ApiError('Not found', 404);
      }
      const a = mockActivitySource().find((x) => x.id === id);
      if (!a) throw new ApiError('Not found', 404);
      return a;
    },

    async getAttendees(
      activityId: number,
      page: number,
      search: string | null
    ): Promise<PaginatedAttendees> {
      await delay(300);
      if (getMockScenario() === 'guests_403') {
        throw new ApiError('Forbidden', 403);
      }
      const { items, hasMore } = mockAttendeesPage(activityId, page, search);
      return { items, page, hasMore };
    },

    async resolveTicket(activityId: number, scannedPayload: string): Promise<TicketResolveResult> {
      await delay(200);
      if (getMockScenario() === 'checkin_unknown') {
        return { status: 'error', code: 'unknown_ticket' };
      }
      const parsed = parseMockTicketPayload(scannedPayload);
      if (!parsed) {
        return { status: 'error', code: 'unknown_ticket' };
      }
      if (parsed.activityId !== activityId) {
        return { status: 'error', code: 'wrong_activity' };
      }
      if (!mockIsValidRegistration(activityId, parsed.registrationId)) {
        return { status: 'error', code: 'unknown_ticket' };
      }
      const ticketPublicId = mockTicketPublicId(activityId, parsed.registrationId);
      const displayName = mockDisplayNameForRegistration(activityId, parsed.registrationId)!;
      return {
        status: 'ok',
        ticketPublicId,
        displayName,
        alreadyCheckedIn: isMockTicketCheckedIn(ticketPublicId),
      };
    },

    async checkInTicket(activityId: number, ticketPublicId: string): Promise<CheckInResult> {
      await delay(250);
      if (getMockScenario() === 'checkin_unknown') {
        return { status: 'error', code: 'unknown_ticket' };
      }
      const parsed = parseMockTicketPayload(ticketPublicId);
      if (!parsed) {
        return { status: 'error', code: 'unknown_ticket' };
      }
      if (parsed.activityId !== activityId) {
        return { status: 'error', code: 'wrong_activity' };
      }
      if (!mockIsValidRegistration(activityId, parsed.registrationId)) {
        return { status: 'error', code: 'unknown_ticket' };
      }
      const tid = mockTicketPublicId(activityId, parsed.registrationId);
      if (isMockTicketCheckedIn(tid)) {
        return { status: 'already_checked_in' };
      }
      const checkedInAt = new Date().toISOString();
      markMockTicketCheckedIn(tid, checkedInAt);
      return { status: 'ok', checkedInAt: mockTicketCheckedInAt(tid) ?? checkedInAt };
    },
  };
}

function mockActivitySource(): Activity[] {
  if (getMockScenario() === 'edge_layout') {
    return [...mockActivitiesCore, ...mockActivitiesEdge];
  }
  return mockActivitiesCore;
}

/**
 * Mirrors MoveConcept `GET /users/me/activities?filter=…` semantics locally:
 * - `'upcoming'` → start is in the future.
 * - `'ongoing'`  → `now` is between start and end (inclusive).
 * - `'all'` (or undefined) → every active event the organizer owns (upcoming OR ongoing).
 *
 * McCheck **does not surface drafts** in the mobile app; `state === 'draft'` rows
 * are dropped regardless of filter, matching the real client.
 */
function applyMockFilter(source: Activity[], filter: ActivityFilter): Activity[] {
  const now = new Date();
  const nonDraft = source.filter((a) => a.state?.toLowerCase() !== 'draft');
  if (filter === 'upcoming') {
    return nonDraft.filter((a) => {
      const start = new Date(a.start);
      return !Number.isNaN(start.getTime()) && start.getTime() > now.getTime();
    });
  }
  if (filter === 'ongoing') {
    return nonDraft.filter((a) => {
      const start = new Date(a.start);
      const end = new Date(a.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
      const t = now.getTime();
      return start.getTime() <= t && end.getTime() >= t;
    });
  }
  return nonDraft.filter((a) => isActiveEvent(a, now));
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

import { getMockScenario } from '../../config/mockScenario';
import { isActiveEvent } from '../../lib/isActiveEvent';
import type { CheckInResult, TicketResolveResult } from '../checkInTypes';
import type { ActivitiesApi, Activity, PaginatedAttendees } from '../types';
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
    async getMyActivities(): Promise<Activity[]> {
      await delay(400);
      if (getMockScenario() === 'activities_fail') {
        throw new ApiError('Could not load events', 503);
      }
      const source = mockActivitySource();
      return source.filter((a) => isActiveEvent(a));
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

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

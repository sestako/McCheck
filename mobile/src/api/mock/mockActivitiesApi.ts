import { getMockScenario } from '../../config/mockScenario';
import { isActiveEvent } from '../../lib/isActiveEvent';
import type { ActivitiesApi, Activity, PaginatedAttendees } from '../types';
import { ApiError } from '../types';
import { mockActivitiesCore, mockActivitiesEdge, mockAttendeesPage } from './fixtures';

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

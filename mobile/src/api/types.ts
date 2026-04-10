/** Mirrors MoveConcept `ActivityResource` subset for V1. */
export interface ActivityOwner {
  id: number;
  /** Display name; backend may use different field names — map in API layer. */
  displayName: string;
}

export interface Activity {
  id: number;
  uuid: string;
  state: string;
  name: string;
  teaser: string | null;
  capacity: number | null;
  start: string;
  end: string;
  registrationsCount: number;
  attendingGuestsCount: number;
  owner: ActivityOwner;
}

export interface UserSummary {
  id: number;
  displayName: string;
}

export interface AttendeeRow {
  user: UserSummary;
  isBlocked: boolean;
}

export interface PaginatedAttendees {
  items: AttendeeRow[];
  page: number;
  hasMore: boolean;
}

export interface ActivitiesApi {
  getMyActivities(): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity>;
  getAttendees(
    activityId: number,
    page: number,
    search: string | null
  ): Promise<PaginatedAttendees>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

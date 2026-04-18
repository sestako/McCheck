import type { CheckInResult, TicketResolveResult } from './checkInTypes';

/** Mirrors MoveConcept `ActivityResource` fields used by McCheck (no long `description`). */
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
  address: string | null;
  lat: number | null;
  lon: number | null;
  category: string | null;
  slug: string | null;
  isSpecial: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserSummary {
  id: number;
  displayName: string;
}

export interface AttendeeRow {
  user: UserSummary;
  isBlocked: boolean;
  /** Registration row id from API (V2 / guest list). */
  registrationId: number;
  /** Opaque ticket id for QR when backend provides it; null until V2 fields exist on staging. */
  ticketPublicId: string | null;
  /** ISO timestamp when checked in; null if not yet. */
  checkedInAt: string | null;
  /** Guest registration (no MoveConcept user) vs user registration — when known from API. */
  isGuest?: boolean;
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
  /** V2: resolve scanned opaque ticket id for this activity (owner-only on backend). */
  resolveTicket(activityId: number, scannedPayload: string): Promise<TicketResolveResult>;
  /** V2: record check-in for an opaque ticket id (idempotent on backend). */
  checkInTicket(activityId: number, ticketPublicId: string): Promise<CheckInResult>;
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

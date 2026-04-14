import { API_BASE_URL } from '../../config/env';
import type { ActivitiesApi, Activity, AttendeeRow, PaginatedAttendees } from '../types';
import { ApiError } from '../types';
import { extractActivitiesList } from './extractActivitiesList';
import { mapActivity, mapAttendee } from './mappers';

type TokenGetter = () => Promise<string | null>;

/**
 * Calls MoveConcept JSON API. Shapes are best-effort until backend handoff is implemented;
 * adjust mappers when contract is fixed.
 */
export function createRealActivitiesApi(getToken: TokenGetter): ActivitiesApi {
  return {
    getMyActivities: () => fetchMyActivities(getToken),
    getActivity: (id) => fetchActivity(getToken, id),
    getAttendees: (activityId, page, search) =>
      fetchAttendees(getToken, activityId, page, search),
  };
}

async function authHeaders(getToken: TokenGetter): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new ApiError('Not authenticated', 401);
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError('Invalid JSON response', res.status || 500);
  }
}

/** Uses documented MoveConcept endpoint for organizer activities. */
async function fetchMyActivities(getToken: TokenGetter): Promise<Activity[]> {
  const headers = await authHeaders(getToken);
  const url = `${API_BASE_URL}/api/auth/users/me/activities`;
  const res = await fetch(url, { headers });
  const body = (await parseJson(res)) as Record<string, unknown> | null;
  if (!res.ok) {
    throw new ApiError(
      typeof body?.message === 'string' ? body.message : res.statusText,
      res.status
    );
  }
  const list = extractActivitiesList(body);
  if (!Array.isArray(list)) {
    return [];
  }
  return list.map((x) => mapActivity(x));
}

async function fetchActivity(getToken: TokenGetter, id: number): Promise<Activity> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`${API_BASE_URL}/api/activities/${id}`, { headers });
  const body = (await parseJson(res)) as Record<string, unknown> | null;
  if (!res.ok) {
    throw new ApiError(
      typeof body?.message === 'string' ? body.message : res.statusText,
      res.status
    );
  }
  const data = (body?.data ?? body) as { activity?: unknown };
  const act = data?.activity;
  if (!act || typeof act !== 'object') throw new ApiError('Missing activity', 500);
  return mapActivity(act);
}

async function fetchAttendees(
  getToken: TokenGetter,
  activityId: number,
  page: number,
  search: string | null
): Promise<PaginatedAttendees> {
  const headers = await authHeaders(getToken);
  const params = new URLSearchParams({ page: String(page) });
  if (search?.trim()) params.set('search', search.trim());
  const res = await fetch(
    `${API_BASE_URL}/api/activities/${activityId}/registrations?${params}`,
    { headers }
  );
  const body = (await parseJson(res)) as Record<string, unknown> | null;
  if (!res.ok) {
    throw new ApiError(
      typeof body?.message === 'string' ? body.message : res.statusText,
      res.status
    );
  }
  const data = (body?.data ?? body) as {
    registrations?: {
      data?: unknown[];
      meta?: {
        currentPage?: number;
        current_page?: number;
        lastPage?: number;
        last_page?: number;
      };
    };
  };
  const paginated = data?.registrations;
  const rows = Array.isArray(paginated?.data) ? paginated!.data! : [];
  const items: AttendeeRow[] = rows.map((row) => mapAttendee(row));
  const meta = paginated?.meta;
  const current = meta?.currentPage ?? meta?.current_page ?? page;
  const last = meta?.lastPage ?? meta?.last_page ?? current;
  return {
    items,
    page: current,
    hasMore: current < last,
  };
}

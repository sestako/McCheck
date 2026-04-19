import { API_BASE_URL, MY_ACTIVITIES_LIST_PATH } from '../../config/env';
import type {
  ActivitiesApi,
  Activity,
  ActivityFilter,
  AttendeeRow,
  PaginatedAttendees,
} from '../types';
import { ApiError } from '../types';
import { extractActivitiesList } from './extractActivitiesList';
import { mapActivity, mapAttendee } from './mappers';

type TokenGetter = () => Promise<string | null>;

/**
 * Calls MoveConcept JSON API. Contract target: `docs/api-docs.json`; adjust mappers when the export drifts.
 */
export function createRealActivitiesApi(getToken: TokenGetter): ActivitiesApi {
  return {
    getMyActivities: (filter) => fetchMyActivities(getToken, filter),
    getActivity: (id) => fetchActivity(getToken, id),
    getAttendees: (activityId, page, search) =>
      fetchAttendees(getToken, activityId, page, search),
    resolveTicket: () => Promise.reject(checkInNotAvailable()),
    checkInTicket: () => Promise.reject(checkInNotAvailable()),
  };
}

function checkInNotAvailable(): ApiError {
  return new ApiError(
    'Check-in is not available yet. MoveConcept resolve/check-in endpoints are not wired in this build (see docs/mcheck-v2-implementation-plan.md).',
    501
  );
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

/**
 * MoveConcept `GET /api/users/me/activities` (see `MY_ACTIVITIES_LIST_PATH` / `docs/api-docs.json`)
 * supports optional `filter`: `draft` | `upcoming` | `ongoing`. McCheck intentionally **does not
 * surface drafts** (organizer manages drafts on the web); this client only requests upcoming
 * and/or ongoing.
 *
 * - `filter === 'upcoming' | 'ongoing'` → **single** request with that param.
 * - `filter === 'all' | undefined` → fetch **upcoming + ongoing** in parallel and merge by id,
 *   with an unfiltered fallback if both return empty (some staging deployments return empty
 *   when `filter` is set and the organizer owns no events in that bucket).
 */
async function fetchMyActivities(
  getToken: TokenGetter,
  filter: ActivityFilter = 'all'
): Promise<Activity[]> {
  const headers = await authHeaders(getToken);
  const base = `${API_BASE_URL}${MY_ACTIVITIES_LIST_PATH}`;

  const mergeInto = (byId: Map<number, Activity>, body: Record<string, unknown> | null) => {
    const list = extractActivitiesList(body);
    if (!Array.isArray(list)) return;
    for (const raw of list) {
      try {
        const a = mapActivity(raw);
        if (!Number.isFinite(a.id) || a.id <= 0) continue;
        if (a.state?.toLowerCase() === 'draft') continue;
        byId.set(a.id, a);
      } catch {
        /* skip malformed row */
      }
    }
  };

  async function fetchPage(
    backendFilter?: 'upcoming' | 'ongoing'
  ): Promise<{ ok: boolean; status: number; body: Record<string, unknown> | null }> {
    const q = new URLSearchParams({ page: '1', perPage: '100' });
    if (backendFilter) q.set('filter', backendFilter);
    const res = await fetch(`${base}?${q}`, { headers });
    const body = (await parseJson(res)) as Record<string, unknown> | null;
    return { ok: res.ok, status: res.status, body };
  }

  const byId = new Map<number, Activity>();

  if (filter !== 'all') {
    const single = await fetchPage(filter);
    if (!single.ok) {
      throw new ApiError(
        typeof single.body?.message === 'string' ? single.body.message : 'Could not load events',
        single.status
      );
    }
    mergeInto(byId, single.body);
    return Array.from(byId.values()).sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }

  const [up, on] = await Promise.all([fetchPage('upcoming'), fetchPage('ongoing')]);

  if (!up.ok && !on.ok) {
    const first = up.body ?? on.body;
    throw new ApiError(
      typeof first?.message === 'string' ? first.message : 'Could not load events',
      up.status
    );
  }
  if (up.ok) mergeInto(byId, up.body);
  if (on.ok) mergeInto(byId, on.body);

  if (byId.size === 0) {
    const plain = await fetchPage();
    if (!plain.ok) {
      throw new ApiError(
        typeof plain.body?.message === 'string' ? plain.body.message : 'Could not load events',
        plain.status
      );
    }
    mergeInto(byId, plain.body);
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
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

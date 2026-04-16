import type { Activity, ActivityOwner, AttendeeRow } from '../types';

/** JSON:API-style `{ id, attributes }` or plain object → flat record for mapping. */
function flattenActivityRaw(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const attrs = r.attributes;
  if (attrs && typeof attrs === 'object' && !Array.isArray(attrs)) {
    const a = attrs as Record<string, unknown>;
    return { ...a, id: r.id ?? a.id, uuid: r.uuid ?? a.uuid };
  }
  return r;
}

function optTrimmedString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function optFiniteNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Maps a single activity JSON object (camelCase or snake_case) to `Activity`. */
export function mapActivity(raw: unknown): Activity {
  const o = flattenActivityRaw(raw);
  const ownerRaw = o.owner as Record<string, unknown> | undefined;
  const owner: ActivityOwner = {
    id: Number(ownerRaw?.id ?? o.owner_id ?? 0),
    displayName: pickDisplayName(ownerRaw) ?? 'Organizer',
  };
  const id = Number(o.id ?? o.activity_id ?? 0);
  const lat = optFiniteNumber(o.lat ?? o.latitude);
  const lon = optFiniteNumber(o.lon ?? o.longitude ?? o.lng);
  return {
    id,
    uuid: String(o.uuid ?? ''),
    state: String(o.state ?? o.status ?? ''),
    name: String(o.name ?? ''),
    teaser: o.teaser != null ? String(o.teaser) : null,
    capacity: o.capacity != null ? Number(o.capacity) : null,
    start: String(o.start ?? o.starts_at ?? o.start_at ?? ''),
    end: String(o.end ?? o.ends_at ?? o.end_at ?? ''),
    registrationsCount: Number(o.registrationsCount ?? o.registrations_count ?? 0),
    attendingGuestsCount: Number(o.attendingGuestsCount ?? o.attending_guests_count ?? 0),
    owner,
    address: optTrimmedString(o.address),
    lat,
    lon,
    category: optTrimmedString(o.category),
    slug: optTrimmedString(o.slug),
    isSpecial: Boolean(o.isSpecial ?? o.is_special),
    createdAt: optTrimmedString(o.createdAt ?? o.created_at),
    updatedAt: optTrimmedString(o.updatedAt ?? o.updated_at),
  };
}

export function mapAttendee(raw: unknown): AttendeeRow {
  const o = raw as Record<string, unknown>;
  const isGuest = Boolean(o.isGuest ?? o.is_guest);
  const u = ((isGuest ? o.guest : o.user) ?? o) as Record<string, unknown>;
  const displayName =
    pickDisplayName(u) ??
    (typeof u.email === 'string' && u.email.trim() ? u.email.trim() : null) ??
    'Guest';
  return {
    user: {
      id: Number(u.id ?? 0),
      displayName,
    },
    isBlocked: Boolean(o.isBlocked ?? o.is_blocked ?? false),
  };
}

export function pickDisplayName(u: Record<string, unknown> | undefined): string | null {
  if (!u) return null;
  const pub =
    u.publicName ??
    u.public_name ??
    u.displayName ??
    u.display_name ??
    u.name;
  if (typeof pub === 'string' && pub.trim()) return pub;
  const first = u.firstname ?? u.first_name;
  const last = u.lastname ?? u.last_name;
  if (typeof first === 'string' || typeof last === 'string') {
    return [first, last].filter(Boolean).join(' ').trim() || null;
  }
  return null;
}

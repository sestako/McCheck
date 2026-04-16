/**
 * MoveConcept `GET /auth/me` → `MeResource` (see `docs/api-docs.json`).
 * Used after login and on cold start when a token exists.
 */
export type AuthUser = {
  email: string;
  displayName: string;
  id: number | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  hasGoogleAuth: boolean | null;
};

export function placeholderAuthUser(email: string, displayName?: string): AuthUser {
  const e = email.trim().toLowerCase();
  return {
    email: e,
    displayName: displayName ?? e.split('@')[0] ?? 'Organizer',
    id: null,
    username: null,
    firstName: null,
    lastName: null,
    fullName: null,
    phone: null,
    bio: null,
    profilePhotoUrl: null,
    createdAt: null,
    updatedAt: null,
    hasGoogleAuth: null,
  };
}

function optTrimmedString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function optFiniteInt(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function optBool(v: unknown): boolean | null {
  if (v == null) return null;
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1') return true;
  if (v === 0 || v === '0') return false;
  return null;
}

/** Parses MoveConcept JSON envelope (`code` + `data.user` / `data.me` / nested `user`). */
export function parseMeApiResponse(body: unknown): AuthUser | null {
  const r = body as Record<string, unknown> | null;
  const data = (r?.data as Record<string, unknown> | undefined) ?? r;
  const u =
    (data?.user as Record<string, unknown> | undefined) ??
    (data?.me as Record<string, unknown> | undefined) ??
    data;
  if (!u || typeof u !== 'object') return null;

  const email =
    typeof u.email === 'string'
      ? u.email.trim().toLowerCase()
      : typeof u.mail === 'string'
        ? u.mail.trim().toLowerCase()
        : '';
  if (!email) return null;

  const firstName = optTrimmedString(u.firstname ?? u.firstName ?? u.first_name);
  const lastName = optTrimmedString(u.lastname ?? u.lastName ?? u.last_name);
  const fullName = optTrimmedString(u.fullName ?? u.full_name);
  const displayName =
    optTrimmedString(u.publicName ?? u.public_name) ??
    optTrimmedString(u.displayName ?? u.display_name) ??
    fullName ??
    optTrimmedString(u.name) ??
    (firstName || lastName ? [firstName, lastName].filter(Boolean).join(' ').trim() : null) ??
    email.split('@')[0] ??
    'Organizer';

  return {
    email,
    displayName,
    id: optFiniteInt(u.id),
    username: optTrimmedString(u.username),
    firstName,
    lastName,
    fullName,
    phone: optTrimmedString(u.phone),
    bio: optTrimmedString(u.bio),
    profilePhotoUrl: optTrimmedString(u.profilePhotoUrl ?? u.profile_photo_url),
    createdAt: optTrimmedString(u.createdAt ?? u.created_at),
    updatedAt: optTrimmedString(u.updatedAt ?? u.updated_at),
    hasGoogleAuth: optBool(u.hasGoogleAuth ?? u.has_google_auth),
  };
}

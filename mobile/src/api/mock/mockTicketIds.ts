import { namesForActivity } from './mockAttendeeNames';

/** Deterministic opaque ticket id for mock registrations (matches QR payload). */
export function mockTicketPublicId(activityId: number, registrationId: number): string {
  return `mct-${activityId}-${registrationId}`;
}

/**
 * Parses `mct-{activityId}-{registrationId}` from QR / manual entry.
 * Returns null if the string does not match the mock format.
 */
export function parseMockTicketPayload(trimmed: string): { activityId: number; registrationId: number } | null {
  const m = trimmed.trim().match(/^mct-(\d+)-(\d+)$/);
  if (!m) return null;
  const activityId = Number(m[1]);
  const registrationId = Number(m[2]);
  if (!Number.isFinite(activityId) || !Number.isFinite(registrationId)) return null;
  return { activityId, registrationId };
}

/** Display name for a mock ticket, or null if index is out of range for that activity. */
export function mockDisplayNameForRegistration(activityId: number, registrationId: number): string | null {
  const idx = registrationId - 10_000;
  if (idx < 0) return null;
  const names = namesForActivity(activityId);
  return names[idx] ?? null;
}

/** Whether `registrationId` is a valid row index for this activity's guest list in mocks. */
export function mockIsValidRegistration(activityId: number, registrationId: number): boolean {
  return mockDisplayNameForRegistration(activityId, registrationId) != null;
}

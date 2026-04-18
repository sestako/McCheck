/**
 * Normalize QR payload: URLs may wrap the opaque id — extract `mct-{activityId}-{registrationId}` when present.
 */
export function extractTicketPayload(raw: string): string {
  const t = raw.trim();
  const embedded = t.match(/mct-\d+-\d+/);
  if (embedded) return embedded[0];
  return t;
}

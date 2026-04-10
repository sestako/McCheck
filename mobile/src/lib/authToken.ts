/**
 * Parses MoveConcept-style login JSON for a bearer token (shape varies by backend).
 */
export function extractAuthTokenFromBody(body: unknown): string | null {
  const r = body as Record<string, unknown> | null;
  const data = (r?.data as Record<string, unknown> | undefined) ?? r;
  const candidates = [
    data?.token,
    data?.access_token,
    data?.plainTextToken,
    (data?.authorization as Record<string, unknown> | undefined)?.token,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return null;
}

/** Laravel-style `message` or `errors` bag. */
export function parseApiErrorBody(body: unknown, fallback: string): string {
  const record = body as Record<string, unknown> | null;
  if (typeof record?.message === 'string' && record.message.trim()) return record.message;
  const errors = record?.errors as Record<string, unknown[]> | undefined;
  if (errors) {
    for (const values of Object.values(errors)) {
      if (Array.isArray(values) && typeof values[0] === 'string') return values[0];
    }
  }
  return fallback;
}

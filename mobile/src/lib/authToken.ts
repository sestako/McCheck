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

function firstFieldError(errors: Record<string, unknown[]> | undefined): string | null {
  if (!errors) return null;
  for (const values of Object.values(errors)) {
    if (Array.isArray(values) && typeof values[0] === 'string' && values[0].trim()) return values[0];
  }
  return null;
}

/** Laravel-style `message` / `errors`, plus MoveConcept `{ code, data: { errors } }`. */
export function parseApiErrorBody(body: unknown, fallback: string): string {
  const record = body as Record<string, unknown> | null;
  if (typeof record?.message === 'string' && record.message.trim()) return record.message;

  const topErr = firstFieldError(record?.errors as Record<string, unknown[]> | undefined);
  if (topErr) return topErr;

  const data = record?.data as Record<string, unknown> | undefined;
  const nestedErr = firstFieldError(data?.errors as Record<string, unknown[]> | undefined);
  if (nestedErr) return nestedErr;

  const code = typeof record?.code === 'string' ? record.code.trim() : '';
  if (code === 'INVALID_CREDENTIALS') return 'Invalid email or password.';
  if (code === 'UNAUTHENTICATED') return 'Please sign in again.';
  if (code === 'UNAUTHORIZED') return "You don't have permission for this action.";

  return fallback;
}

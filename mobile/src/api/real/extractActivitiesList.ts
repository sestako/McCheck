/**
 * Normalizes list responses until MoveConcept contract is fixed.
 */
export function extractActivitiesList(body: Record<string, unknown> | null): unknown[] | null {
  if (!body) return null;
  const root = body as Record<string, unknown>;
  const data = (root.data as Record<string, unknown> | unknown[] | undefined) ?? root;

  if (Array.isArray(data)) return data;
  if (Array.isArray((data as { activities?: unknown }).activities)) {
    return (data as { activities: unknown[] }).activities;
  }
  if (Array.isArray((root as { activities?: unknown }).activities)) {
    return (root as { activities: unknown[] }).activities;
  }
  if (Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: unknown[] }).items;
  }
  return null;
}

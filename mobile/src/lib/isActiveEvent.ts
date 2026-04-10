import type { Activity } from '../api/types';

/**
 * “Active” = owned by user (caller filters list) AND (upcoming OR ongoing).
 * Adjust here when MoveConcept contract for “my activities” is final.
 */
export function isActiveEvent(activity: Activity, now: Date = new Date()): boolean {
  const start = new Date(activity.start);
  const end = new Date(activity.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  const t = now.getTime();
  const upcoming = start.getTime() > t;
  const ongoing = start.getTime() <= t && end.getTime() >= t;
  return upcoming || ongoing;
}

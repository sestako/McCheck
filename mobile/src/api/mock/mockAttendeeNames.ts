/** Guest display names per mock activity (shared by fixtures + ticket resolve). */
export function namesForActivity(activityId: number): string[] {
  if (activityId === 105) return [];
  if (activityId === 106) {
    return Array.from({ length: 60 }, (_, i) => `Registrant ${String(i + 1).padStart(3, '0')}`);
  }
  if (activityId === 101 || activityId === 104) {
    return ['Jordan Lee', 'Sam Rivera', 'Taylor Chen', 'Riley Morgan', 'Casey Brooks'];
  }
  return ['Morgan Blake', 'Jamie Fox'];
}

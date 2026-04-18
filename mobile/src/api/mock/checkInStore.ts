/**
 * In-memory check-in state for mock API (V2). Reset on app reload.
 * Jest can call `resetMockCheckInStore` between tests.
 */
const checkedAtByTicket = new Map<string, string>();

export function isMockTicketCheckedIn(ticketPublicId: string): boolean {
  return checkedAtByTicket.has(ticketPublicId.trim());
}

export function mockTicketCheckedInAt(ticketPublicId: string): string | null {
  return checkedAtByTicket.get(ticketPublicId.trim()) ?? null;
}

export function markMockTicketCheckedIn(ticketPublicId: string, checkedInAtIso: string): void {
  checkedAtByTicket.set(ticketPublicId.trim(), checkedInAtIso);
}

export function resetMockCheckInStore(): void {
  checkedAtByTicket.clear();
}

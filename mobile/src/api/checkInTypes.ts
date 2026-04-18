/** V2 check-in / ticket resolve — mock + future MoveConcept contract. */

export type TicketResolveOk = {
  status: 'ok';
  ticketPublicId: string;
  displayName: string;
  alreadyCheckedIn: boolean;
};

export type TicketResolveError = {
  status: 'error';
  code: 'unknown_ticket' | 'wrong_activity' | 'cancelled';
};

export type TicketResolveResult = TicketResolveOk | TicketResolveError;

export type CheckInOk = {
  status: 'ok';
  checkedInAt: string;
};

export type CheckInAlready = {
  status: 'already_checked_in';
};

export type CheckInError = {
  status: 'error';
  code: 'unknown_ticket' | 'wrong_activity' | 'cancelled';
};

export type CheckInResult = CheckInOk | CheckInAlready | CheckInError;

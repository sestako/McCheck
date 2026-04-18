import { resetMockCheckInStore } from '../checkInStore';
import { createMockActivitiesApi } from '../mockActivitiesApi';

describe('mock check-in API', () => {
  beforeEach(() => {
    resetMockCheckInStore();
    delete process.env.EXPO_PUBLIC_MOCK_SCENARIO;
  });

  it('resolves a valid mock ticket then idempotent check-in', async () => {
    const api = createMockActivitiesApi();
    const r = await api.resolveTicket(102, 'mct-102-10000');
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    expect(r.displayName).toBe('Morgan Blake');
    expect(r.alreadyCheckedIn).toBe(false);

    const c = await api.checkInTicket(102, r.ticketPublicId);
    expect(c.status).toBe('ok');

    const r2 = await api.resolveTicket(102, 'mct-102-10000');
    expect(r2.status).toBe('ok');
    if (r2.status === 'ok') expect(r2.alreadyCheckedIn).toBe(true);

    const c2 = await api.checkInTicket(102, r.ticketPublicId);
    expect(c2.status).toBe('already_checked_in');
  });

  it('returns wrong_activity when ticket belongs to another activity', async () => {
    const api = createMockActivitiesApi();
    const r = await api.resolveTicket(102, 'mct-101-10000');
    expect(r.status).toBe('error');
    if (r.status === 'error') expect(r.code).toBe('wrong_activity');
  });
});

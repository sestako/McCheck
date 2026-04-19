import { createMockActivitiesApi } from '../mockActivitiesApi';

describe('mock getMyActivities — filter parameter', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_MOCK_SCENARIO;
  });

  it('defaults to active events (upcoming + ongoing) when called with no filter', async () => {
    const api = createMockActivitiesApi();
    const all = await api.getMyActivities();
    const ids = all.map((a) => a.id).sort();
    expect(ids).toEqual([101, 102]);
  });

  it("honours filter: 'all' — same shape as no argument", async () => {
    const api = createMockActivitiesApi();
    const all = await api.getMyActivities('all');
    const ids = all.map((a) => a.id).sort();
    expect(ids).toEqual([101, 102]);
  });

  it("honours filter: 'upcoming' — returns only events whose start is in the future", async () => {
    const api = createMockActivitiesApi();
    const upcoming = await api.getMyActivities('upcoming');
    expect(upcoming.map((a) => a.id)).toEqual([101]);
  });

  it("honours filter: 'ongoing' — returns only events currently live (start <= now <= end)", async () => {
    const api = createMockActivitiesApi();
    const ongoing = await api.getMyActivities('ongoing');
    expect(ongoing.map((a) => a.id)).toEqual([102]);
  });

  it('propagates activities_fail scenario regardless of filter', async () => {
    process.env.EXPO_PUBLIC_MOCK_SCENARIO = 'activities_fail';
    const api = createMockActivitiesApi();
    await expect(api.getMyActivities('upcoming')).rejects.toMatchObject({ status: 503 });
  });
});

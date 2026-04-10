import { USE_MOCK_API } from '../config/env';
import { createMockActivitiesApi } from './mock/mockActivitiesApi';
import { createRealActivitiesApi } from './real/realActivitiesApi';
import type { ActivitiesApi } from './types';

export function createActivitiesApi(getToken: () => Promise<string | null>): ActivitiesApi {
  if (USE_MOCK_API) return createMockActivitiesApi();
  return createRealActivitiesApi(getToken);
}

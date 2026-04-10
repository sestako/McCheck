/**
 * Optional mock-only scenarios for QA (no backend). Set `EXPO_PUBLIC_MOCK_SCENARIO`
 * in `.env` / `.env.local` when `EXPO_PUBLIC_USE_MOCK_API` is not false.
 */
export type MockScenario =
  | 'normal'
  | 'login_fail'
  | 'activities_fail'
  | 'detail_404'
  | 'guests_403'
  | 'edge_layout';

const ALLOWED = new Set<string>([
  'login_fail',
  'activities_fail',
  'detail_404',
  'guests_403',
  'edge_layout',
]);

export function getMockScenario(): MockScenario {
  const raw = process.env.EXPO_PUBLIC_MOCK_SCENARIO?.trim().toLowerCase() ?? '';
  if (ALLOWED.has(raw)) return raw as MockScenario;
  return 'normal';
}

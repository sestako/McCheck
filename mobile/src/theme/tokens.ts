/**
 * Forest Minimalist (Stitch) — McCheck Event Manager.
 * @see docs/mcheck-design-vs-backend.md
 */
export const colors = {
  surface: '#f9f9fe',
  surfaceContainerLow: '#f3f3f8',
  surfaceContainerLowest: '#ffffff',
  primary: '#005f48',
  primaryContainer: '#007a5e',
  onSurface: '#1a1c1f',
  onSurfaceVariant: '#3e4944',
  onPrimary: '#ffffff',
  outlineVariant: '#bdc9c2',
  outlineSoft: '#d7e0db',
  error: '#ba1a1a',
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const type = {
  titleLg: 28,
  titleMd: 24,
  titleSm: 20,
  bodyLg: 16,
  bodyMd: 14,
  labelSm: 12,
  labelXs: 11,
} as const;

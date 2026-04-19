/**
 * Forest Minimalist (Stitch) — McCheck Event Suite.
 * Source of truth: `docs/stitch-ref/` HTML exports (HTML wins over DESIGN.md).
 *
 * Values picked to match the canonical Stitch HTML screens:
 *  - event-hub.html            (`#066141` primary, `#E7F2EE` light-green, `#F8FAFC` body)
 *  - upcoming-events.html      (`#f8f9fc` body, `#16a34a` accent variant)
 *  - guest-list.html           (`#006D4E` brand, `#E6F1ED` active-nav bg, `#F5F5F9` body)
 *  - profile-staff.html        (`#F7F9FB` body, `#F1F3F5` section-card, `#10413B` ring)
 *  - login.html                (`#0f7652` CTA, emerald-800 logo tile, `#f7f8f9` body)
 *
 * Normalized single palette so all screens share identity.
 */
export const colors = {
  surface: '#F7F9FB',
  surfaceContainer: '#EDEFF1',
  surfaceContainerLow: '#F1F3F5',
  surfaceContainerLowest: '#FFFFFF',
  primary: '#066141',
  primaryContainer: '#0B7A52',
  primaryDark: '#004D34',
  onSurface: '#0F172A',
  onSurfaceVariant: '#71717A',
  onPrimary: '#FFFFFF',
  secondaryContainer: '#E6F1ED',
  outline: '#94A3B8',
  outlineVariant: '#CBD5E1',
  outlineSoft: '#E2E8F0',
  divider: '#EEF2F6',
  error: '#E53E3E',
  errorSurface: '#FFE9E9',
  iconMuted: '#94A3B8',
  profileRing: '#10413B',
  slate900: '#0F172A',
  slate700: '#334155',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
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
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
} as const;

export const type = {
  display: 36,
  titleLg: 28,
  titleMd: 24,
  titleSm: 20,
  bodyLg: 16,
  bodyMd: 14,
  labelSm: 12,
  labelXs: 11,
  labelXxs: 10,
} as const;

/** Very soft elevation used on white cards (see upcoming-events.html, guest-list.html). */
export const elevation = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  lifted: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  },
  primaryCta: {
    shadowColor: '#066141',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

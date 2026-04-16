/**
 * MoveConcept API uses `/api/auth/login`, not `/api/login` (that path 404s).
 * Normalize common misconfigurations from .env or EAS env.
 */
export function normalizeAuthPath(
  envValue: string | undefined,
  defaultPath: string,
  /** Exact paths (always leading `/`) to rewrite to defaultPath */
  legacyWrongPaths: readonly string[]
): string {
  const raw = envValue?.trim();
  if (!raw) return defaultPath;
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  if (legacyWrongPaths.includes(withLeading)) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        `[McCheck] Path "${withLeading}" is invalid for MoveConcept; using "${defaultPath}". Fix EXPO_PUBLIC_* in .env or EAS.`
      );
    }
    return defaultPath;
  }
  return withLeading;
}

# McCheck — App Store / Play release checklist

Use before **public** or **internal** store submission. Backend can still be staging for TestFlight / internal tracks.

## Identity & assets

- [ ] **`app.json`**: `name`, `slug`, version align with product.
- [ ] **Icons & splash** in `mobile/assets/` — replace Expo defaults for brand.
- [ ] **Bundle IDs** — `ios.bundleIdentifier` / `android.package` (`com.moveconcept.mccheck` or org choice).
- [ ] **Privacy policy URL** — required for store listings; host before submission.
- [ ] **Screenshots** — capture on target device sizes (Apple + Google requirements differ).

## Build & distribution

- [ ] **EAS**: from `mobile/`, run `npx eas-cli@latest build` (or install `eas-cli` globally and use `eas build`). See `eas.json` profiles: `preview` internal, `production` store.
- [ ] **Secrets**: no API keys in repo; use EAS secrets / env for production if needed.
- [ ] **Sentry / crash reporting** (optional): add `@sentry/react-native`, call `Sentry.init` from `src/lib/observability.ts` when `EXPO_PUBLIC_SENTRY_DSN` is set.

## Compliance & copy

- [ ] **Data handling**: attendee PII only shown to authorized organizers; align with MoveConcept privacy posture.
- [ ] **Store description** — “organizer / door list” positioning; no scanner claims until V2 if not shipped.

## Post-release

- [ ] Monitor crash-free sessions (if Sentry or equivalent enabled).
- [ ] Staging smoke test after each backend deploy ([staging-runbook.md](./staging-runbook.md)).

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-09 | Initial checklist |

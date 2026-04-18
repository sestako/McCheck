# McCheck — App Store / Play release checklist

Use before **public** or **internal** store submission. Backend can still be staging for TestFlight / internal tracks.

## Platform status (2026-04-19)

| Platform | Status |
|----------|--------|
| **iOS** | **V1 verified** on **staging** (TestFlight / physical device, 2026-04-17). Continue checklist items for each new build you ship to testers or the store. |
| **Android** | **V1 verified** on **staging** with a **physical device** (EAS **`preview` APK**, 2026-04-19). **Play Console** org verification + **`eas submit --platform android`** (service account JSON on first submit) still apply when you promote to **Internal / production** tracks; until then use **Expo build page QR** or **`adb install`** ([../mobile/README.md](../mobile/README.md)). |

## Identity & assets

- [ ] **`app.json`**: `name`, `slug`, version align with product.
- [ ] **Icons & splash** in `mobile/assets/` — replace Expo defaults for brand.
- [ ] **Bundle IDs** — `ios.bundleIdentifier` / `android.package` (`com.moveconcept.mccheck` or org choice).
- [ ] **Privacy policy URL** — required for store listings; host before submission.
- [ ] **Screenshots** — capture on target device sizes (Apple + Google requirements differ).

## Build & distribution

- [ ] **EAS**: from `mobile/`, run `npx eas-cli@latest build` (or install `eas-cli` globally and use `eas build`). See `eas.json` profiles: **`preview`** = internal **APK** (+ install **QR** on the Expo build page), **`production`** = store **AAB** / TestFlight iOS.
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
| 1.1 | 2026-04-17 | iOS V1 sign-off vs Android Play verification + service account for submit |
| 1.2 | 2026-04-18 | Android internal QA: EAS preview APK + Expo build page QR; EAS profile wording |
| 1.3 | 2026-04-19 | Platform table: V1 staging sign-off on physical Android + iOS |

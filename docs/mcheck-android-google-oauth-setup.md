# McCheck — Google Sign-In (native) + Android signing (Expo / EAS)

McCheck uses **`@react-native-google-signin/google-signin`** (same flow on **iOS and Android**). There is **no** `expo-auth-session` / `https://auth.expo.io` proxy. You need an **EAS build** or **`expo run:*`** — **not Expo Go** (Expo Go does not include this native module).

**Install binary on Android:** run **`eas build --platform android --profile preview`**, then open the **Expo build page** from the CLI output — use the **QR code** there to install the **APK**, or download the `.apk` / use `adb install` (see [../mobile/README.md](../mobile/README.md)).

App expects:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — **Web** OAuth client (`GoogleSignin.configure({ webClientId })`).
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — **iOS** OAuth client (bundle `com.moveconcept.mccheck`).
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` — kept for parity / docs; native Android matching uses **package + SHA-1** on the Android client in Google Cloud (same project as the Web client).

Package / application ID: **`com.moveconcept.mccheck`** (`mobile/app.json`).

## iOS URL scheme (required)

`mobile/app.json` includes the config plugin **`@react-native-google-signin/google-signin`** with **`iosUrlScheme`** set to the **reversed iOS client id**:

`com.googleusercontent.apps.<prefix>` where `<prefix>` is the numeric part before `.apps.googleusercontent.com` in your **iOS** OAuth client id.

If you **rotate or replace** the iOS OAuth client in Google Cloud, update **`iosUrlScheme`** in `app.json` to match, then rebuild iOS.

---

## 1. Android signing (EAS)

**You must run this on your machine** (interactive prompts; cannot be completed headlessly in CI without prior credentials):

```bash
cd mobile
npx eas-cli@latest credentials -p android
```

Or configure build credentials for a profile:

```bash
npx eas-cli@latest credentials:configure-build -p android -e production
```

- If prompted to **generate a new keystore**, choose **yes** for a managed Expo keystore (typical) unless you already upload your own.
- After credentials exist, **download the keystore** (or `credentials.json`) from **Expo dashboard → Project → Credentials → Android** when you need the file for a third-party form.

**Values for “keystore password / alias / key password”** — copy exactly from Expo’s credential screen or the downloaded `credentials.json` (`keystorePassword`, `keyAlias`, `keyPassword`). Do not invent values.

---

## 2. SHA-1 for Google Cloud (Android OAuth client)

Google needs the **SHA-1 certificate fingerprint** of the key that signs the **APK/AAB** you install (EAS keystore for internal builds; Play App Signing for store).

From a `.jks` file:

```bash
keytool -list -v -keystore /path/to/your-upload-key.jks -alias YOUR_KEY_ALIAS
```

Use the **SHA1** line in Google Cloud → **OAuth 2.0 Client ID → Android** → **SHA-1 certificate fingerprint**.

**Note:** Preview APK and Play production builds can use **different** keystores → different SHA-1. Add **both** fingerprints to the same Android OAuth client (or separate clients — keep `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` aligned with the client used for the build you test).

---

## 3. Google Cloud Console

1. **APIs & Services → Credentials**.
2. **OAuth client ID → Android**  
   - Package name: `com.moveconcept.mccheck`  
   - SHA-1: from step 2 for the binary you install.
3. **OAuth client ID → iOS**  
   - Bundle ID: `com.moveconcept.mccheck`  
   - Use this client’s id for `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and derive **`iosUrlScheme`** as above.
4. **OAuth client ID → Web application**  
   - Use its client id as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (required for `idToken` / server verification on both platforms).

---

## 4. Expo env (local + EAS builds)

`EXPO_PUBLIC_*` is inlined at **bundle** time.

- **Local:** `mobile/.env` or `mobile/.env.local` (see `mobile/.env.example`).
- **EAS cloud builds:** variables in **Expo dashboard → Environment variables** or under `env` in `mobile/eas.json`.

After changing env, restart Metro with cache clear: `npx expo start --clear`.

---

## 5. Verify

- `EXPO_PUBLIC_USE_MOCK_API=false`
- Login screen shows live Google button (not the “add OAuth client IDs” alert).
- Install a **fresh EAS build** after changing `app.json` plugins or Google client ids.

---

## Document control

| Version | Date       | Notes |
|---------|------------|--------|
| 1.0     | 2026-04-16 | Initial Android runbook |
| 1.1–1.3 | 2026-04-17–18 | Legacy `expo-auth-session` / `auth.expo.io` proxy (removed in 2.0) |
| 2.0     | 2026-04-18 | **Native Google Sign-In** (`@react-native-google-signin/google-signin`); iOS `iosUrlScheme`; Android SHA-1 unchanged |
| 2.1     | 2026-04-18 | Expo Go vs EAS APK QR install; align with `mobile/README.md` |

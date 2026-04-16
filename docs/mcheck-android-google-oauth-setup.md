# McCheck — Android Google OAuth + signing (Expo / EAS)

Use this when configuring **Google Cloud OAuth (Android)** and **EAS Android signing** for McCheck. App code expects:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — Web OAuth client (used by `expo-auth-session` + token exchange).
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` — Android OAuth client (required on Android; see `src/config/env.ts`).

Package / application ID: **`com.moveconcept.mccheck`** (`mobile/app.json`).

Expo Go redirect (dev only): **`https://auth.expo.io/@ondrejsestak/mccheck`** — add as **Authorized redirect URI** on the **Web** client in Google Cloud.

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

Google needs the **SHA-1 certificate fingerprint** of the key that signs the app you ship (EAS release keystore).

From a `.jks` file:

```bash
keytool -list -v -keystore /path/to/your-upload-key.jks -alias YOUR_KEY_ALIAS
```

Use the **SHA1** line in Google Cloud → **OAuth 2.0 Client ID → Android** → **SHA-1 certificate fingerprint**.

**Note:** Debug builds and EAS production builds can use **different** keystores → different SHA-1. Add **both** fingerprints to the same Android OAuth client (or separate clients — then you still need one client ID in `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` that matches your shipping build).

---

## 3. Google Cloud Console

1. **APIs & Services → Credentials**.
2. **Create credentials → OAuth client ID → Android**  
   - Package name: `com.moveconcept.mccheck`  
   - SHA-1: from step 2 (EAS upload key for store/internal builds).
3. Ensure a **Web application** client exists; use its client ID as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
4. Copy the **Android** client’s client ID → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.

---

## 4. Expo env (local + EAS builds)

`EXPO_PUBLIC_*` is inlined at **bundle** time.

- **Local:** `mobile/.env` or `mobile/.env.local` (see `mobile/.env.example`).
- **EAS cloud builds:** set the same variables in **Expo dashboard → Environment variables** for the build profile, **or** add them under `env` in `mobile/eas.json` for `preview` / `production` (avoid committing secrets if the repo is shared; dashboard is often safer).

After changing env, restart Metro with cache clear: `npx expo start --clear`.

---

## 5. Verify

- `EXPO_PUBLIC_USE_MOCK_API=false`
- Login screen shows live Google button (not the “add OAuth client IDs” alert).
- If Google returns no token, recheck **Android client ID**, **SHA-1**, and **package name** match the installed binary.

---

## Document control

| Version | Date       | Notes                    |
|---------|------------|--------------------------|
| 1.0     | 2026-04-16 | Initial Android runbook  |

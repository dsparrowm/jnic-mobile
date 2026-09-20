# JNLOP Mobile

Expo (React Native) companion to [jnic-management](../jnic-management) for **Admin** and **Lead Pastor** HQ workflows on iOS and Android.

## Stack

- Expo SDK 57 + Expo Router
- Bearer JWT auth (SecureStore) against the existing NestJS API
- Shared enums/helpers from `jnic-management/packages/types` (Metro watch folder)

## Setup

```bash
cd jnic-mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your Render API URL (not localhost — phone cannot reach WSL)
npm install
```

### Physical device via Expo Go (recommended)

No Android Studio or EAS native build required.

1. Install **Expo Go** from the Play Store / App Store on your phone.
2. Put your deployed API URL in `.env`:

```bash
EXPO_PUBLIC_API_URL=https://your-api.onrender.com
```

3. From WSL, start Metro with **tunnel** (LAN usually fails from WSL2):

```bash
npm run start:tunnel
```

4. In the terminal, if it says “development build”, press **`s`** to switch to **Expo Go**.
5. Scan the QR code with Expo Go (Android) or the Camera app (iOS).

If the QR fails, open the `exp://…` URL shown in the terminal inside Expo Go.

### EAS development client (optional later)

Only needed if you add native modules Expo Go does not ship. See `eas.json` profiles and:

```bash
npm run start:dev-client
```

EAS Simulator remains deferred (waitlist).

## Scripts

| Script | Purpose |
| ------ | ------- |
| `npm start` | Metro (LAN — fine on same Wi‑Fi outside WSL) |
| `npm run start:tunnel` | Expo Go + tunnel (physical phone from WSL; needs `@expo/ngrok`) |
| `npm run start:dev-client` | Custom EAS dev client + tunnel |
| `npm run typecheck` | TypeScript |

## v1 scope

- Auth + role gate (ADMIN / LEAD_PASTOR)
- Pastors, Org, Approvals (rolling milestones M1–M3)
- Other roles see an “use the web app” screen

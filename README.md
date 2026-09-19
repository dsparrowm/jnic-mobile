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
# Set EXPO_PUBLIC_API_URL to your Render API URL
npm install
```

### Physical device (EAS QR) — primary

1. Install EAS CLI and log in: `npm i -g eas-cli && eas login`
2. Link the project: `eas init`
3. Build a development client:

```bash
eas build --profile development --platform android
# and/or
eas build --profile development --platform ios
```

4. On [expo.dev](https://expo.dev), open the build and **scan the install QR** to put the JNLOP dev client on your phone.
5. Start Metro with tunnel (needed from WSL2):

```bash
npm run start:tunnel
```

6. Scan the **Metro QR** inside the installed dev client.

### EAS Simulator

Deferred (waitlist). When you have access, see [EAS Simulator docs](https://docs.expo.dev/preview/eas-simulator/introduction/).

## Scripts

| Script | Purpose |
| ------ | ------- |
| `npm start` | Metro (LAN) |
| `npm run start:tunnel` | Dev client + tunnel (physical phone from WSL) |
| `npm run typecheck` | TypeScript |

## v1 scope

- Auth + role gate (ADMIN / LEAD_PASTOR)
- Pastors, Org, Approvals (rolling milestones M1–M3)
- Other roles see an “use the web app” screen

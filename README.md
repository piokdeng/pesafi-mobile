# PesaFi Mobile

> **The Venmo / Robinhood / Kalshi / FX of Africa** — iOS + Android.

A native mobile app for [PesaFi.ai](https://pesafi.ai), built with **Expo (React Native) + TypeScript + Expo Router**. Ports the full feature set of the PesaFi web dashboard — including the new **South Sudan SSP↔USDC FX** flow — to a single codebase that ships to both the App Store and Google Play.

---

## ✨ What's inside

| Feature | Screen | Status |
|---|---|---|
| Dark mode (full rebrand) | global theme | ✅ |
| Email/password sign in | `(auth)/login` | ✅ |
| Sign up with phone + country detection | `(auth)/register` | ✅ |
| Hero balance card (USD + local currency) | `(tabs)/index` | ✅ |
| **5-button quick actions (FX / Send / Receive / Deposit / Withdraw)** | `(tabs)/index` | ✅ |
| **South Sudan SSP→USDC FX converter** | `fx` | ✅ NEW |
| Recent activity feed | `(tabs)/index` | ✅ |
| Full transaction history with search + filters | `(tabs)/activity` | ✅ |
| Contacts (favorites + all) | `(tabs)/contacts` | ✅ |
| Profile, privacy toggles, currency picker | `(tabs)/profile` | ✅ |
| Send to wallet address (with USD↔local toggle) | `send` | ✅ |
| Send to mobile money (M-Pesa / MTN / Airtel) | `send` | ✅ |
| Auto-detect country & currency from phone | `lib/currency.ts` | ✅ |
| QR code scanning (`expo-camera`) | `scan` | ✅ |
| Receive (QR code + share + copy address) | `receive` | ✅ |
| Deposit method picker (Coinbase / Kotani / Flutterwave) | `deposit` | ✅ |
| Withdraw to mobile money | `withdraw` | ✅ |

The UI matches the latest PesaFi web brand: **dark navy (`#08101D`) background, emerald (`#22C55E`) primary, orange (`#F97316`) accent**, plus the signature gradient hero balance card.

---

## 🆕 What's new in v2

This version was rebuilt against the latest **KermaPay-PesaFi-Update-** repo:

- **Full dark theme rebrand** — every screen, every component, every color token. Pulled directly from the new web `globals.css` (`--background: 222 47% 6%`, `--primary: 142 71% 45%`, `--accent: 25 95% 53%`).
- **South Sudan FX** — new `app/fx.tsx` screen with the same SSP→USDC conversion logic as the web (`6,200 SSP/USD mid × 1.175 spread = ~7,285 SSP/USD`). Live rate card, conversion estimator, Business FX contact section. Logic ported in `lib/fx.ts`.
- **5-button quick actions** — FX added as the first action with an amber gradient, matching the new web dashboard layout.
- **Gradient action buttons** — every quick action is now its own `LinearGradient` for visual punch on the dark surface.

---

## 🚀 Quick start

```bash
cd pesafi-mobile
npm install
npx expo start
```

Then press **`i`** for the iOS simulator, **`a`** for Android emulator, or scan the QR with the **Expo Go** app on your phone.

The app **runs out of the box with mock data** — no backend required. Sign in with any email/password to get past the auth screen.

---

## 🔌 Wiring it to the real backend

The mobile app talks to the existing PesaFi Next.js API routes (`/api/wallet/*`, `/api/transactions/*`, `/api/auth/*`). To switch from mocks to real:

1. Copy the env example: `cp .env.example .env`
2. Edit `.env`:
   ```bash
   EXPO_PUBLIC_USE_MOCKS=false
   EXPO_PUBLIC_API_BASE_URL=https://pesafi.ai
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. Restart Metro: `npx expo start --clear`

The API client (`lib/api/client.ts`) is a thin typed wrapper — all endpoints are in one file, so swapping to a different backend is a 5-minute job.

### Endpoints used

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/signin` | Email/password sign in |
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/signout` | Sign out |
| `GET`  | `/api/user/wallet?type=personal` | Fetch user wallet |
| `GET`  | `/api/wallet/[userId]/balance` | Refresh on-chain balance |
| `GET`  | `/api/wallet/phone/[phone]` | Lookup wallet by phone |
| `POST` | `/api/wallet/send-sponsored` | Gasless USDC transfer |
| `POST` | `/api/wallet/send` | Mobile money send via Kotani Pay |
| `GET`  | `/api/transactions/[userId]` | Transaction history |
| `GET/POST/DELETE` | `/api/user/contacts` | Contacts CRUD |

---

## 📱 Building for production

```bash
npm install -g eas-cli
eas login
eas build:configure

# Internal preview
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production
eas build --platform all --profile production
eas submit --platform ios
eas submit --platform android
```

Bundle IDs are pre-set in `app.json`:
- iOS: `ai.pesafi.app`
- Android: `ai.pesafi.app`

---

## 🗂 Project structure

```
pesafi-mobile/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout + auth gating + dark backdrop
│   ├── (auth)/{login,register}.tsx
│   ├── (tabs)/                   # Bottom tab navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home / dashboard with 5 quick actions
│   │   ├── activity.tsx
│   │   ├── contacts.tsx
│   │   └── profile.tsx
│   ├── fx.tsx                    # 🆕 South Sudan SSP↔USDC FX
│   ├── send.tsx                  # Modal: send (wallet / mobile / QR)
│   ├── receive.tsx               # Modal: receive QR
│   ├── deposit.tsx               # Modal: deposit method picker
│   ├── withdraw.tsx              # Modal: withdraw to mobile money
│   └── scan.tsx                  # Modal: camera QR scanner
│
├── components/
│   ├── BalanceCard.tsx           # Gradient hero card
│   ├── QuickActions.tsx          # 5 gradient action buttons (FX first)
│   ├── TransactionItem.tsx
│   └── ui/{Button,Card,Input}.tsx
│
├── lib/
│   ├── auth.tsx                  # Auth context (SecureStore-backed)
│   ├── currency.ts               # FX, formatting, phone-country detection
│   ├── fx.ts                     # 🆕 SSP↔USDC math (port of fx-ssp.ts)
│   ├── mockData.ts
│   ├── types.ts
│   └── api/client.ts             # Typed API client (mocks ↔ real backend)
│
├── constants/
│   └── theme.ts                  # 🆕 Dark theme: navy bg, emerald primary, orange accent
│
├── app.json                      # Expo config (bundle IDs, perms, dark splash)
├── eas.json
└── package.json
```

---

## 🎨 Brand (v2 — dark)

Pulled directly from the latest web `globals.css`:

| Token | HSL | Hex | Use |
|---|---|---|---|
| `background` | `222 47% 6%`  | `#08101D` | App canvas |
| `card`       | `222 41% 11%` | `#111A2A` | Surfaces |
| `border`     | `217 24% 20%` | `#2A3344` | Dividers |
| `primary`    | `142 71% 45%` | `#22C55E` | CTAs, links, active states |
| `accent`     | `25 95% 53%`  | `#F97316` | Highlights, deposit |
| `fx`         | amber-500/700 | `#F59E0B → #B45309` | FX action gradient |

---

## 🛣 Roadmap

- [ ] Real Supabase Auth integration
- [ ] Push notifications (Expo Notifications)
- [ ] Biometric unlock (`expo-local-authentication`)
- [ ] In-app Coinbase Onramp via `expo-web-browser`
- [ ] Native Kotani Pay flow
- [ ] Live FX rate feed (currently uses constants)
- [ ] Business mode dashboard
- [ ] Deep links for `pesafi://send?to=...` and `pesafi://fx`

---

## 📄 License

MIT — same as the parent PesaFi project.

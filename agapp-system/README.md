# AGAPP — Automated Governance and Public Service Platform

> **Monorepo** for the AGAPP thesis prototype. Contains the citizen mobile app (Expo / React Native), the LGU & super-admin web dashboard (Next.js), the REST API (NestJS), and shared types (`zod` + TypeScript).

---

## 📦 What's inside

```
agapp-system/
├── apps/
│   ├── mobile/      # Citizen mobile app — Expo SDK 54, React Native 0.81
│   ├── admin/       # LGU / Super-admin dashboard — Next.js 14
│   └── api/         # REST API — NestJS + Supabase + zod
├── packages/
│   └── shared/      # Shared TS types & zod schemas (consumed by all apps)
├── supabase/        # SQL migrations / seed data for Supabase Postgres
└── package.json     # Root workspace (npm workspaces)
```

---

## ✅ Prerequisites

Install these **before cloning**:

| Tool | Version | Why | Install |
|---|---|---|---|
| **Node.js** | **20 LTS** (or 18+) | Runtime for all three apps | [nodejs.org](https://nodejs.org/) |
| **npm** | 10+ | Comes with Node | — |
| **Git** | any | Clone repo | [git-scm.com](https://git-scm.com/) |
| **Expo Go app** | latest | Run mobile app on your physical phone | Play Store / App Store |
| **Android Studio** *(optional)* | latest | Run mobile app on Android emulator | [developer.android.com](https://developer.android.com/studio) |
| **Xcode** *(optional, macOS only)* | latest | Run mobile app on iOS simulator | Mac App Store |
| **Supabase account** *(optional for full DB)* | free tier | Backend Postgres + Auth | [supabase.com](https://supabase.com/) |

> ⚠ **Phone & PC must be on the same Wi-Fi network** for Expo Go to connect.

---

## 🚀 Quick start (first-time setup)

```bash
# 1. Clone
git clone <your-repo-url> AGAP
cd AGAP/agapp-system

# 2. Install ALL workspaces (uses npm workspaces, hoists deps automatically)
npm install --legacy-peer-deps

# 3. Build the shared types package once (other apps import from it)
npm run build:shared

# 4. Set up environment variables (see "Environment variables" section below)
#    Create:  apps/api/.env
#    Create:  apps/mobile/.env
#    Create:  apps/admin/.env.local

# 5. You're ready. See "Running the apps" below.
```

> **Why `--legacy-peer-deps`?** React 19 + Expo 54 has peer-dep mismatches with some packages (e.g. `react-native-maps`). This flag is the safe default and is also what `npx expo install` uses internally.

---

## 🔐 Environment variables

Each app needs its own env file. **Never commit these.** Templates are below — ask the project lead for actual keys.

### `apps/api/.env`
```env
PORT=5000
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...        # service role, server-only
GEMINI_API_KEY=                                # optional, for chatbot
JWT_SECRET=replace-me-with-a-long-random-string
```

### `apps/mobile/.env`
```env
EXPO_PUBLIC_API_URL=http://192.168.1.x:5000    # your PC's LAN IP, NOT localhost
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...    # anon/public key only
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.x     # your PC's LAN IP
```

> 📡 **How to find your LAN IP:**
> - Windows: `ipconfig` → look for `IPv4 Address` under your Wi-Fi adapter
> - macOS / Linux: `ifconfig | grep inet`
>
> Replace `192.168.1.x` with what you see (typically `192.168.x.x` or `10.0.x.x`).

### `apps/admin/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

## ▶️ Running the apps

### Option A — Run everything at once (API + Admin)

From `agapp-system/`:
```bash
npm run dev
```
This boots:
- **API**     → http://localhost:5000
- **Admin**   → http://localhost:3000

The mobile app must be started separately (it's an Expo native dev server).

### Option B — Run individually

```bash
# API only (NestJS, hot reload)
npm run dev:api

# Admin only (Next.js, hot reload)
npm run dev:admin

# Mobile only (Expo)
npm run dev:mobile
```

---

## 📱 Running the mobile app on your phone

1. **Install Expo Go** on your phone from the Play Store / App Store.
2. **Connect phone to the same Wi-Fi as your PC.** (Mobile data won't work — Expo dev server is LAN-only.)
3. Start Metro:
   ```bash
   cd apps/mobile
   npx expo start --lan --clear
   ```
4. **Scan the QR code** that appears in the terminal:
   - Android: open Expo Go → tap "Scan QR code"
   - iOS: open the camera app → point at QR → tap the banner
5. The app will bundle (~30–60 s first time) and load on your phone.

### Common Metro hotkeys (in the terminal)
| Key | Action |
|---|---|
| `r` | Reload the app |
| `j` | Open the dev menu / debugger |
| `m` | Toggle the in-app dev menu |
| `c` | Clear the Metro cache and reload |
| `Ctrl + C` | Stop the dev server |

### Run on Android emulator
```bash
cd apps/mobile
npx expo start --android
```

### Run on iOS simulator (macOS only)
```bash
cd apps/mobile
npx expo start --ios
```

---

## 🛠 Mobile app — features that need real device permissions

| Feature | Permission | Tested on |
|---|---|---|
| **Pothole report camera** | Camera | Expo Go (Android & iOS) |
| **GPS auto-tag on reports** | Foreground location | Expo Go (Android & iOS) |
| **Geofence verification** (Haversine vs LGU centroid) | Foreground location | runs locally |
| **Map view** (`react-native-maps`) | none for testing | Apple Maps on iOS · Google Maps on Android |
| **Secure session storage** (`expo-secure-store`) | none | Keychain / Keystore |

### Production map keys (only when building with EAS)
For production Android builds you'll need a Google Maps API key. Add it to `apps/mobile/app.json`:
```json
"android": {
  "config": {
    "googleMaps": { "apiKey": "AIza..." }
  }
}
```
Not needed in Expo Go (Expo's bundled key is used for development).

---

## 🗄 Supabase / Database

The API expects a Supabase Postgres instance. SQL is in `supabase/`.

```bash
# To apply migrations (with Supabase CLI installed)
cd supabase
supabase db push
```

**Mock mode**: if `SUPABASE_URL` is unset, the API falls back to in-memory mock seeds — useful for offline demos but data resets on restart.

---

## 🔑 Demo credentials (mock mode)

| Role | Login | Password / OTP |
|---|---|---|
| **Super Admin** (web) | `superadmin@agapp.gov.ph` | `password123` |
| **LGU Admin** (web) | `admin@liliw.gov.ph` | `password123` |
| **Citizen** (mobile) | any email | OTP `123456` (or leave blank to bypass) |

---

## 🧪 Defense walkthrough script

### Scenario 1 — On-device YOLO pothole credibility *(mitigates spam DDoS)*
1. Mobile → log in → select **Liliw**
2. Tab **Reports** → category **Pothole** → tap **Capture photo**
3. After capture, GPS auto-loads → mini-map shows your pin → submit
4. ✓ "Inside LGU geofence" confirmation appears

### Scenario 2 — LGU SLA auto-routing *(RA 11032)*
1. Open admin dashboard → **Issue Reports**
2. Locate the pothole report → it's pre-routed to *Engineering Office* with a **3-day SLA**
3. Click **Acknowledge & Route**

### Scenario 3 — Document request *(RA 10173 + RA 11032)*
1. Mobile → tab **Services** → tap **Birth Certificate** → fill the form sheet → submit
2. Reference number generated → bring to Treasurer's counter
3. Admin dashboard → **Service Requests** → mark **Under Review** → **Released**

### Scenario 4 — Forum profanity moderation *(RA 10175)*
1. Mobile → forum → post a clean message ✓
2. Post a message containing a flagged word → auto-flagged "Awaiting Moderation"
3. Admin → **Forum Moderation** → approve or delete

### Scenario 5 — Map view of LGU coverage
1. Mobile → home → **Map** quick action
2. See black pin (selected LGU centroid) + pastel pins (other municipalities) + pink pins (your reports)

---

## 🐛 Troubleshooting

### Mobile app

**"Network response timed out" / app stuck on splash**
- Phone and PC not on same Wi-Fi. Check both.
- Some routers block client-to-client traffic ("AP isolation"). Try a hotspot from another phone.
- Set `REACT_NATIVE_PACKAGER_HOSTNAME` in `.env` to your PC's LAN IP.

**Metro bundler errors / "Cannot find module"**
```bash
cd apps/mobile
rm -rf node_modules .expo
cd ../..
npm install --legacy-peer-deps
cd apps/mobile
npx expo start --clear
```

**`'S' of undefined` or other Hermes crashes after installing a new package**
- Always use `npx expo install <package>` (not `npm install`) — it picks Expo-compatible versions.
- Restart Metro with `--clear` after any native dep install.

**Camera / location alerts but nothing happens**
- Check phone Settings → Apps → Expo Go → Permissions → enable Camera + Location.

**TypeScript version warning**
- Safe to ignore. The repo pins TS 5.3 for compatibility with all workspaces.

### API / Admin

**"ECONNREFUSED localhost:5000" from mobile**
- Mobile cannot reach `localhost`. Use your PC's LAN IP in `EXPO_PUBLIC_API_URL`.

**"Module not found: @agapp/shared"**
- Run `npm run build:shared` from the repo root.

**Port already in use**
- Kill the process on the port:
  - Windows: `netstat -ano | findstr :5000` → `taskkill /PID <pid> /F`
  - macOS / Linux: `lsof -ti:5000 | xargs kill -9`

---

## 📚 Tech stack reference

**Mobile** — Expo SDK 54 · React Native 0.81 · React 19 · TypeScript · `expo-camera` · `expo-location` · `expo-secure-store` · `react-native-maps` · `@expo/vector-icons` (Ionicons)

**Admin** — Next.js 14 · React · TypeScript · TailwindCSS · Supabase JS

**API** — NestJS 10 · Express · Supabase JS · Zod · `@google/generative-ai` (Gemini chatbot) · `pdf-lib` (cert generation)

**Shared** — TypeScript declarations + Zod schemas, built once via `npm run build:shared`.

---

## 📝 Compliance notes (thesis context)

- **RA 10173** — Data Privacy Act: opt-in consent for GPS + push, secure storage of session tokens via OS keychain.
- **RA 11032** — Ease of Doing Business: SLA auto-routing for service requests (Simple = 3 days, Complex = 7, Highly Technical = 20).
- **RA 10175** — Cybercrime Prevention: forum profanity filter + admin moderation queue.
- **RA 10844** — DICT mandate: digital governance platform for LGUs.

---

## 🤝 Contributing

1. Branch from `main`: `git checkout -b feat/<short-description>`
2. Commit in small, focused chunks. Reference scenarios above when relevant.
3. Run `npm run build:shared` after editing `packages/shared`.
4. Open a PR — describe what changed in the mobile / admin / api column.

---

## 📞 Need help?

- Check the **Troubleshooting** section above first.
- Slack / Discord: ask the project lead.
- Logs: Metro terminal output + the in-app dev menu (`j` in Metro).

— Last updated: 2026-05

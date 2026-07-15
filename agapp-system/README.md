# AGAPP — Automated Governance and Public Service Platform

> **Monorepo** for the AGAPP system: the citizen mobile app (Expo / React Native), the
> LGU + Super-Admin web dashboard (Next.js), the API (NestJS), and shared types.
> Pilot LGU: Liliw, Laguna. All three client apps talk **directly to Supabase** —
> the API is intentionally thin (chatbot + one guarded ML endpoint only).

---

## 📦 What's inside

```
agapp-system/
├── apps/
│   ├── mobile/      # Citizen mobile app — Expo SDK 54, React Native 0.81, React 19
│   ├── admin/       # LGU / Super-Admin dashboard — Next.js 14 (App Router), React 18
│   └── api/         # NestJS API — chatbot + a guarded photo-verification ML endpoint ONLY
├── packages/
│   └── shared/      # Shared TS types (consumed by the other workspaces)
├── stubs/           # Placeholder packages that force npm to nest React 18 for admin
│                     # (see "React 18/19 split" gotcha below — do not remove)
└── supabase/        # schema.sql, seed.sql, storage_setup.sql, verification_setup.sql
```

> ⚠️ There used to be a fourth app, `apps/field-officer` — it was cut from the project
> and deleted. If you see it referenced anywhere (old docs, old branches), it's gone;
> don't try to resurrect it.

---

## ✅ Prerequisites

| Tool | Version | Why |
|---|---|---|
| **Node.js** | 20 LTS (or 18+) | Runtime for all three apps |
| **npm** | 10+ | Comes with Node |
| **Git** | any | Clone the repo |
| **Expo Go app** | latest | Run the mobile app on your physical phone (Play Store / App Store) |
| **A Supabase project** | free tier is fine | The shared Postgres backend — **required**, there is no mock/offline mode |
| Android Studio / Xcode | optional | Only if you want an emulator/simulator instead of a physical phone |

> ⚠️ **Phone and PC must be on the same Wi-Fi network** for Expo Go to reach your
> machine — the mobile app talks to Supabase directly over the internet, but if you
> also run the API locally (for the chatbot/ML endpoints), your phone needs to reach
> your PC's LAN IP, not `localhost`.

---

## 🚀 First-time setup

```bash
# 1. From the repo root, go to the actual system
cd agapp-system

# 2. Install every workspace (npm workspaces hoists shared deps automatically)
npm install --legacy-peer-deps

# 3. Build the shared types package once — other workspaces import from it
npm run build:shared

# 4. Set up environment variables — see below. Create:
#    apps/api/.env
#    apps/mobile/.env
#    apps/admin/.env.local
```

**Why `--legacy-peer-deps`?** Mobile needs React 19 (Expo 54); admin needs React 18
(Next.js 14). That mismatch means some peer-dep warnings are expected — this flag
(and `npx expo install` for mobile packages) is the correct way to handle it in this
repo. See the React 18/19 gotcha further down before touching root `package.json` or
`stubs/`.

---

## 🔐 Environment variables

Every app fails silently (or shows no data) without its `.env` file. **None of these
are committed** — copy the `.example` file in each app and ask the project lead for
the real values (they're one shared Supabase project + a couple of third-party API keys).

### `apps/api/.env` (copy from `.env.example`)
```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<service-role-secret-key>      # bypasses RLS — server-only, never share
MISTRAL_API_KEY=<key>                        # chatbot LLM fallback (mistral-small-latest)
ROBOFLOW_API_KEY=<key>                       # pothole + stray-pet photo-verification ML
ROBOFLOW_POTHOLE_MODEL_URL=https://serverless.roboflow.com/<pothole-slug>/<version>
ROBOFLOW_STRAYPETS_MODEL_URL=https://serverless.roboflow.com/<straypets-slug>/<version>
PORT=5000
# ALLOWED_ORIGINS=https://your-deployed-admin-url   # CORS allowlist; unset = open + a warning, fine for local dev
```
Missing `ROBOFLOW_*` just means the AI photo-verification badge returns "not analyzed"
instead of a result — it never fabricates a confidence score, so it's safe to skip if
you're not working on that feature. `MISTRAL_API_KEY` missing means the chatbot falls
back to "couldn't find an answer" once its keyword FAQ match fails.

### `apps/mobile/.env` (copy from `.env.example`)
```env
EXPO_PUBLIC_API_URL=http://192.168.1.x:5000/api   # your PC's LAN IP, NOT localhost
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon/public key>
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.x        # your PC's LAN IP
```
> 📡 Find your LAN IP: Windows → `ipconfig` (look for `IPv4 Address`); macOS/Linux →
> `ifconfig | grep inet`.

### `apps/admin/.env.local` (copy from `.env.local.example`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/public key>
NEXT_PUBLIC_API_URL=http://localhost:5000
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret-key>   # server-only; needed for staff creation ("Add Staff") and LGU onboarding

# Demo Quick Login (seeded accounts) — base64-encoded, ask the project lead for the
# actual passwords, then encode locally:
#   node -e "console.log(Buffer.from('yourPassword','utf8').toString('base64'))"
DEMO_SUPERADMIN_PASSWORD_B64=
DEMO_LGUADMIN_PASSWORD_B64=
DEMO_PERSONNEL_PASSWORD_B64=
```

---

## ▶️ Running the apps

From `agapp-system/`:

```bash
npm run dev          # API (:5000) + Admin (:3000) together
npm run dev:api       # API only (NestJS, hot reload)
npm run dev:admin     # Admin only (Next.js, hot reload)
npm run dev:mobile    # Mobile only (Expo)
```

The mobile app is a separate native dev server and isn't part of `npm run dev` —
start it on its own (see below).

---

## 📱 Running the mobile app on your phone

```bash
cd apps/mobile
npx expo start --lan --clear
```
1. Make sure your phone is on the **same Wi-Fi** as your PC.
2. Scan the QR code Metro prints: Android → open Expo Go → "Scan QR code"; iOS →
   point the Camera app at it and tap the banner.
3. First bundle takes ~30–60s.

To run on an emulator/simulator instead: `npx expo start --android` or
`npx expo start --ios` (macOS only).

**Adding a mobile dependency?** Use `npx expo install <package>` — not
`npm install` — so you get an Expo-SDK-54-compatible version.

---

## 🗄 Supabase / Database

The whole system needs one real Supabase project (Postgres + PostGIS) — every client
talks to it directly. Ask the project lead for access, or stand up your own project
and run the SQL in `supabase/` in this order:

```
schema.sql              # tables, RLS policies, triggers, functions
storage_setup.sql        # storage buckets + their access policies
verification_setup.sql   # citizen ID-verification tables/RPCs
seed.sql                 # demo LGUs + accounts (optional, for local testing)
```

Run these through the Supabase SQL editor (or `supabase db push` if you have the CLI
set up against the project). `patches/` holds smaller, dated one-off fixes that were
already applied to the shared project — check dates before re-running one.

> ⚠️ **Free-tier Supabase projects pause when idle.** If everything suddenly "can't
> connect," check the project isn't `INACTIVE` in the dashboard and restore it.

---

## 🔑 Logging in / demo accounts

There's no mock mode and no OTP — authentication is real Supabase Auth
(`signInWithPassword` / `signUp`), and Row-Level Security enforces who can see what.

- **Admin dashboard** (`apps/admin`) has three roles: Super Admin, LGU Admin, LGU
  Personnel. The login page has **Quick Login** buttons for seeded demo accounts —
  wired to the `DEMO_*_PASSWORD_B64` env vars above. Ask the project lead for the
  actual passwords (they're not in this README).
- **Citizen mobile app** — real email/password sign-up. New accounts start
  **unverified**: submitting a report, applying for a service, or posting in the
  forum requires completing ID verification first (an ID photo + a selfie, reviewed
  and approved by an LGU Admin in the dashboard). Browsing (Home, News, Map) works
  without an account or verification.

---

## 🐛 Troubleshooting

**Mobile app stuck on splash / "Network request failed"**
- Phone and PC aren't on the same Wi-Fi, or the router blocks client-to-client
  traffic ("AP isolation") — try a phone hotspot instead.
- Double-check `REACT_NATIVE_PACKAGER_HOSTNAME` and `EXPO_PUBLIC_API_URL` are your
  PC's actual LAN IP, not `localhost`.

**Metro bundler errors / "Cannot find module"**
```bash
cd apps/mobile
rm -rf node_modules .expo
cd ../.. && npm install --legacy-peer-deps
cd apps/mobile && npx expo start --clear
```

**Installed a package and now the mobile app crashes on native code**
- You probably used `npm install` instead of `npx expo install` — reinstall with the
  latter, then restart Metro with `--clear`.

**`Module not found: @agapp/shared`**
- Run `npm run build:shared` from `agapp-system/`.

**Admin "Add Staff" or the Super Admin onboarding wizard's admin-creation step 500s**
- `SUPABASE_SERVICE_ROLE_KEY` is missing from `apps/admin/.env.local`.

**Port already in use**
- Windows: `netstat -ano | findstr :5000` → `taskkill /PID <pid> /F`
- macOS/Linux: `lsof -ti:5000 | xargs kill -9`

**A weird React error in the admin app after touching dependencies**
- This monorepo deliberately nests React 18 inside `apps/admin/node_modules` while
  the root pins React 19 for mobile (see the gotcha below). Don't remove
  `stubs/`, the root `react`/`react-dom` version pins, or the admin `tsconfig.json`
  path overrides — re-run `npm install --legacy-peer-deps` and re-check
  `apps/admin/node_modules/react/package.json` still says 18.x if something looks off.

---

## ⚠️ Gotchas worth knowing before you dig in

- **Only the API's two endpoints exist:** `POST /api/chatbot/ask` and the guarded
  `POST /api/reports/verify-image`. Every other feature (reports, services, forum,
  facilities, notifications…) is the client apps talking straight to Supabase, with
  Postgres RLS as the real security/multi-tenancy boundary — not the NestJS layer.
- **`@supabase/supabase-js` version differs across apps** — mobile is on `2.108`,
  admin/api on `2.43`. Don't assume a newer client API is available everywhere.
- **Realtime subscriptions need their table in the `supabase_realtime` publication.**
  If a live-update feature (forum, notifications, tracking) silently does nothing,
  check `pg_publication_tables` before assuming the client code is broken.
- **No automated tests exist anywhere in this repo yet**, and `any` types are common
  in older code. Don't assume test coverage when refactoring.
- **AI photo verification is real, not simulated** — pothole and stray-pet reports
  get a genuine confidence score from Roboflow-hosted models. The admin report views
  show a three-state badge (detected / not detected / not analyzed) — don't collapse
  that to a boolean, "not analyzed" and "analyzed but nothing found" are different states.

---

## 📚 Tech stack reference

**Mobile** — Expo SDK 54 · React Native 0.81 · React 19 · TypeScript · `expo-camera` ·
`expo-location` · `expo-secure-store` · `react-native-maps` · `react-native-view-shot`

**Admin** — Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS ·
Recharts · Leaflet (`react-leaflet`) · Supabase JS

**API** — NestJS 10 · Express · Supabase JS · Mistral AI (chatbot) · Roboflow
(hosted inference for photo verification)

**Shared** — TypeScript types, built once via `npm run build:shared`; re-run it after
any edit under `packages/shared`.

**Database** — Supabase (Postgres + PostGIS), Row-Level Security on every tenant table.

---

## 🤝 Contributing

1. Branch from `main`: `git checkout -b feat/<short-description>`.
2. Match the surrounding file's existing style (this codebase uses inline
   presentational helpers and theme tokens rather than a component library).
3. Run `npm run build:shared` after editing `packages/shared`.
4. Check `Docs/` (in the repo root, one level up) before starting a feature —
   it tracks what's already built, what's mid-flight, and what's intentionally
   deferred, and it's kept more current than this README's feature descriptions.
5. Open a PR describing what changed, and which app(s) it touches.

---

## 📞 Need help?

Check **Troubleshooting** above first, then ask the project lead. Logs: the Metro
terminal (mobile), the `npm run dev` terminal (API/admin), and your browser's
devtools console (admin).

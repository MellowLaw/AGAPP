# AGAPP System — Full Codebase Audit

> **Scope:** `agapp-system/` monorepo (mobile, admin, field-officer, api, shared, supabase)
> **Date:** 2026-06-17 · Last updated: 2026-06-30
> **Purpose:** Ground-truth status of every folder/file — what's done, what's stubbed, what's broken, what's not connected. Use this instead of the AI-generated requirements doc, which is partly inaccurate.

---

## 🔄 Update — 2026-06-29 (Citizen ID Verification)

A new **citizen identity-verification feature** was added after the original audit
and is now wired end-to-end across all three layers:

- **Mobile** — `apps/mobile/src/screens/VerifyIdentityScreen.tsx` (4-step wizard:
  barangay → ID photo → selfie-with-ID → review/submit). Uploads to the private
  `citizen-ids` bucket and inserts a `verification_requests` row; a DB trigger
  flips the user to `pending`. Uses the same image-upload pattern that already
  works in `ReportsScreen`. Submit now cleans up orphaned uploads on failure and
  shows a friendly message if RLS rejects the insert (LGU mismatch).
- **Supabase** — `supabase/verification_setup.sql`: `verification_requests` table,
  `verify_citizen()` RPC (SECURITY DEFINER, atomic approve/reject), a guard
  trigger that blocks clients from self-setting verification columns, RLS, and the
  private `citizen-ids` bucket. **Idempotent — must be applied to the live DB**
  (it was the missing link; until applied, the queue looks "not connected").
- **Admin** — `apps/admin/src/app/lgu/verifications/page.tsx`: review queue with
  signed-URL image preview and approve/reject via the RPC. The per-request user
  lookup was collapsed into a single `.in()` query (no more N+1).
- **Shared** — `apps/admin/src/lib/lgu.ts` now centralizes the `lgu_id ↔ name`
  mapping that login + verifications pages previously hand-rolled.

**Corrections to the original audit below:**
1. **Admin login is real Supabase auth.** `apps/admin/src/app/page.tsx` calls
   `supabase.auth.signInWithPassword` on the shared client, so RLS `auth.uid()`
   resolves once an admin is logged in. (The dead `auth/*Login.tsx` mocks remain,
   but they are unmounted — the live login is the unified page.)
2. **The admin "not connected" symptom** was not a wiring bug — `.env` files exist
   and the LGU id derivation happens to match the seeded ids. The cause was simply
   that `verification_setup.sql` had not yet been run against the live project.

---

## 🔄 Update — 2026-06-30 (Cleanup, shared consolidation, dependency audit)

### Files deleted
- `apps/api/src/server.ts` — dead 810-line legacy Express server (never ran; `dev:api` uses `main.ts`). PDF route was in here but unmounted; still tracked as a bug.
- `apps/api/src/mock-db.ts` — 422-line mock data fallback; `app.controllers.ts` was importing it and crashing with `Cannot find module './mock-db'` after it was removed. Fixed by rewriting controllers to throw `503` instead of using mock data.
- `apps/field-officer/CLAUDE.md` and `AGENTS.md` — empty stubs.
- `.expo/` directories (mobile + root) — machine-specific auto-generated device caches. Added to `.gitignore`.
- `apps/admin/tsconfig.tsbuildinfo` — 653 KB build cache. Added `*.tsbuildinfo` to `.gitignore`.

### `packages/shared` — shared code consolidation
`ThemeContext.tsx`, `AgappLogo.tsx`, and the shared theme tokens (`PASTELS`, `ACCENT`, `TOKENS`, `globalStyles`) were moved from mobile and field-officer into `packages/shared`:

| New file in `packages/shared/src/` | What it contains |
|---|---|
| `theme.ts` | `PASTELS`, `ACCENT`, `TOKENS` (light/dark), `globalStyles` StyleSheet |
| `contexts/ThemeContext.tsx` | `ThemeProvider` + `useTheme` hook — works in both apps |
| `components/AgappLogo.tsx` | Shared RN logo component |
| `react-native-compat.d.ts` | Augments `NativeMethods.refs` to fix TS2786 `View`/`Text` JSX errors |

Original files in mobile and field-officer replaced with one-line re-exports:
```ts
// e.g. apps/mobile/src/contexts/ThemeContext.tsx
export { ThemeProvider, useTheme } from '@agapp/shared';
```

**`packages/shared` TypeScript note:** must compile against `@types/react@^19.x` (not 18) because `react-native` 0.81 ships bundled types that reference React 19's `ReactNode` (includes `bigint`). Admin is protected by `skipLibCheck: true`. Do not downgrade shared's `@types/react` to 18 — it will break the build.

### `apps/api/src/app.controllers.ts` — rewrite
Removed all `mock-db` imports and `if (!supabase)` fallback branches. Every controller now returns `503 SERVICE_UNAVAILABLE` if the Supabase client is absent. This is cleaner and prevents the `Cannot find module './mock-db'` crash.

### `apps/admin/tsconfig.json` — fixed two errors
1. Removed incorrect `paths` entries that mapped `react` and `react-dom` to `@types/...` packages.
2. Removed deprecated `baseUrl: "."` (TypeScript 5.x warns).
Result matches the canonical Next.js 14 App Router template exactly.

### `apps/mobile/src/contexts/AuthContext.tsx` — auth timeout increase
- Default `withTimeout` increased: `2500ms` → `6000ms`
- `getSession()` call timeout: `3000ms` → `8000ms`
Reason: cold Supabase connections on the free tier regularly exceeded 2.5s and caused `[Error: Query timeout]` on startup.

### Dependency audit (context7-verified)
| Package | Status | Notes |
|---|---|---|
| Expo SDK 54 + RN 0.81 + React 19.1.0 | ✅ Correct | Official SDK matrix confirms exact match |
| Next.js 14 + React 18.3.1 | ✅ Correct | Matches official upgrade guide |
| React Navigation 7 | ✅ Correct | Min req is RN 0.72 / Expo 52 |
| NestJS 10.3.8 | ✅ Correct | Current v10 stable |
| `@supabase/supabase-js` admin/api | ✅ Fixed | Upgraded `2.43.2` → `2.108.1` to match mobile (all changes additive) |
| Admin `tsconfig.json` | ✅ Fixed | `moduleResolution: "bundler"`, no `baseUrl` |
| `@types/react-native@^0.73` in shared | ⚠️ Outdated | RN 0.81 ships bundled types; 0.73 is the root cause of the `NativeMethods.refs` bug. The augmentation file in shared patches it. Low priority to fix. |

### `.gitignore` additions (root `agapp-system/`)
```
*.tsbuildinfo       # TypeScript build cache (regenerated on every build)
.expo/              # Expo device cache (machine-specific, auto-generated)
```

---

## 🏗️ Architecture at a glance

```
agapp-system/  (npm workspaces monorepo)
├── apps/
│   ├── mobile/         Expo RN citizen app  →  talks DIRECTLY to Supabase (only chatbot hits API)
│   ├── admin/          Next.js 14 dashboard →  talks DIRECTLY to Supabase (API not used at all)
│   ├── field-officer/  Expo RN officer app  →  talks DIRECTLY to Supabase
│   └── api/            NestJS + Supabase    →  ⚠️ mostly bypassed by clients
├── packages/shared/    TS types + zod schemas
└── supabase/           schema.sql, seed.sql, storage_setup.sql
```

**Critical architectural fact:** Despite the README describing a NestJS-centric backend, **three of the four apps bypass the API and query Supabase directly.** The only thing that actually flows through the NestJS API is the chatbot (`/api/chatbot/ask`) and Gemini-based forum moderation. This is the single biggest architectural inconsistency in the project.

Also note: `apps/api/src/server.ts` is an **~810-line legacy Express server** that duplicates every NestJS endpoint — but `npm run dev:api` runs `src/main.ts` (NestJS), so `server.ts` is **dead code**. Worse, the working `/api/services/:id/pdf` endpoint only exists in that dead Express file, not in NestJS.

### Stack (actual)
- **Mobile / Field Officer** — Expo SDK 54, React Native 0.81, React 19, React Navigation v7, `expo-camera`, `expo-location`, `expo-secure-store`, `react-native-maps`, Supabase JS v2
- **Admin** — Next.js 14 (App Router), Tailwind, custom SVG charts (no chart lib), Supabase JS
- **API** — NestJS 10, Supabase JS, `@google/generative-ai` (Gemini 2.0-flash), `pdf-lib`, `expo-server-sdk`, zod, class-validator
- **DB** — Supabase Postgres + PostGIS + pgvector; RLS on all tenant tables
- **Shared** — `@agapp/shared` TypeScript interfaces + zod schemas (built once, consumed by api; declared but unused in mobile)

---

## ✅ What's DONE (real, wired to live data)

### 📱 Mobile app (citizen) — most complete
| Feature | Status | Notes |
|---|---|---|
| Auth (login/register/forgot) | ✅ Real | Supabase Auth + SecureStore adapter |
| LGU selection flow | ✅ Real | Query `lgus` + AsyncStorage persistence + rehydration |
| Home dashboard | ✅ Real | news, facilities, reports, requests, unread notif count |
| News + detail | ✅ Real | `news_announcements` |
| Forum (posts + comments) | ✅ Real | CRUD + Supabase realtime channels + client profanity filter |
| Service requests | ✅ Real | Submission to `service_requests` |
| Reports (incident) | ✅ Real | Photo → Storage, GPS, haversine geofence, 2-min spam cooldown |
| Map Explorer | ✅ Real | Most polished screen — facilities, filters, bottom sheet, deep links |
| Notifications | ✅ Real | Realtime INSERT subscription + markAsRead |
| Chatbot | ✅ Real | Calls NestJS `/chatbot/ask` |
| Profile | 🟡 Partial | Display real; consent/badges/menu stubbed |

### 🖥️ Admin (Next.js) — ~85% functional
- **Real Supabase login** with role routing (Super / LGU Admin / Personnel)
- **LGU Admin:** dashboard charts, reports triage (ack/reassign/reject/resolve), service workflow w/ printable receipt, news CRUD + scheduling, forum moderation, settings (LGU profile + staff + notifications) — all live
- **Personnel:** queue dashboard + report status updates — live
- **Super Admin:** cross-LGU analytics, LGU directory management, analytics pivot, `system_config` settings — all live
- 11 reusable UI primitives (custom SVG charts, no chart lib)

### 👷 Field Officer app — minimal but real
- Role-gated auth (rejects CITIZENs)
- Tasks list (real `reports` query for Under Review / In Progress in their LGU)
- Task detail + "Mark as Resolved"
- Offline sync queue (AsyncStorage) with 30s auto-retry
- Profile + manual force-sync

### ⚙️ API (NestJS, the live one)
- Chatbot: keyword-scored FAQ matching → Gemini 2.0-flash fallback → graceful "no answer / support ticket"
- Forum moderation: local profanity/PII/URL filter + Gemini safety check
- Audit log writer (when Supabase connected)
- `SupabaseAuthGuard` (validates JWT via `supabase.auth.getUser`)
- `PushService`: listens to `notifications` table via Supabase realtime → sends via Expo SDK

### 🗄️ Supabase backend — solid
- 14 tables: `lgus, users, offices, reports, service_requests, forum_posts, forum_comments, audit_logs, news_announcements, notifications, chatbot_faqs, lgu_facilities, faq_embeddings`
- RLS policies on every tenant table
- PostGIS `verify_geofence()` function (20 km)
- Profanity trigger (`trg_moderate_forum` + comment variant)
- `pgvector` extension + `faq_embeddings` table
- Storage buckets (`report-photos`, `service-attachments`) with policies
- Seed data for Liliw

---

## ⚠️ STUBBED / partial (UI exists, no real behavior)

| Item | Where | Reality |
|---|---|---|
| **On-device pothole ML (YOLO)** | `mobile/src/screens/ReportsScreen.tsx:225-227` | `ml_confidence: 0.95, ml_verified: true` **hardcoded**. UI says "captured by YOLOv11" — **no model exists.** Biggest thesis risk. |
| **PDF generation** | `api/src/pdf-generator.ts` works, but `/api/services/:id/pdf` route only exists in **dead `server.ts`**, not NestJS | Feature unreachable from live API |
| **QR codes** | `mobile/src/screens/ServicesScreen.tsx:78` | `qr_code_url: ''` always empty; client builds a qrserver.com URL on the fly |
| **Push notifications** | `mobile/src/utils/push.ts` | Skips registration entirely in Expo Go (SDK 54). Only works in standalone EAS builds. |
| **Admin notifications panel** | `admin/.../layout/Header.tsx:32`, `UserMenu.tsx:73` | "coming soon" toast |
| **News attachments** | `admin/src/app/lgu/news/page.tsx` | Drop-zone UI but always inserts `attachments: []` |
| **Report assignment history** | `admin/src/app/lgu/reports/page.tsx` | Tracked in component state, never persisted to DB |
| **Forum follow / copy-link / image upload** | `mobile/src/screens/ForumScreen.tsx` | Local-only / no-op |
| **Profile consent toggle, "Verified" badge, Help/Privacy buttons** | `mobile/src/screens/ProfileScreen.tsx` | Hardcoded / dead |
| **`faq_embeddings` (pgvector RAG)** | `supabase/schema.sql` only | Table exists but **nothing populates or queries it** — chatbot uses keyword match + Gemini, not vector search |
| **Personnel settings** | `admin/src/app/personnel/settings/page.tsx` | Pure hardcoded mockup ("Ana Reyes") |

---

## 🐛 BUGS to fix (ranked by severity)

1. **🔴 Report map never renders (mobile)** — `mobile/src/screens/TrackingDetailScreen.tsx:68-85` reads `data.location.lat/lng/address` as a JSON object, but `ReportsScreen` writes flat `latitude`/`longitude`/`barangay` columns. Service branch works; report branch is broken.
2. **🔴 Fake ML verification** — hardcoded `ml_*` in `mobile/src/screens/ReportsScreen.tsx:225-227`. Either wire a real model or honestly label it as "manual review."
3. **🔴 PDF route orphaned** — `server.ts` (which held the only `/api/services/:id/pdf` route) was deleted 2026-06-30. The PDF generator (`src/pdf-generator.ts`) still works but has no NestJS endpoint. Port it into a new controller.
4. **🟠 Staff can't log in** — `admin/src/app/lgu/settings/page.tsx` inserts a `users` row via `crypto.randomUUID()` but never calls Supabase Auth `admin.createUser`. New staff have no credentials.
5. **🟠 `UserMenu.handleSignOut`** navigates home without calling `supabase.auth.signOut()` → orphaned session. `Sidebar` does it correctly.
6. **🟠 Liliw hardcoding in boundary check** — `mobile/src/screens/ReportsScreen.tsx:163,169` hardcodes Liliw coords + the name "Liliw" in the alert. Breaks for Nagcarlan/Pila/etc.
7. **🟠 React Hooks violation** — `useBottomTabBarHeight()` called inside `try/catch` in `mobile/src/screens/ChatbotScreen.tsx:65-69` and `ForumScreen.tsx:35-40`. Violates Rules of Hooks.
8. **🟡 Personnel reports tab filter is a no-op** — `admin/src/app/personnel/reports/page.tsx:119` condition `tab === 'assigned' || tab === 'office'` is always true → tab switching does nothing.
9. **🟡 Client-generated reference numbers** (`Math.random` / `reports.length+1`) → collision risk under concurrent submissions. Should be a DB sequence/trigger.
10. **🟡 Dead `admin/src/app/lgu/page.tsx`** — early `return null` on line 75 makes ~370 lines unreachable. Delete it.
11. **🟡 Dead auth components** — `admin/src/components/auth/LGUAdminLogin.tsx`, `SuperAdminLogin.tsx` use fake `setTimeout` mocks, unmounted, and `SuperAdminLogin` redirects to non-existent `/super/dashboard`.
12. **🟡 No `middleware.ts` in admin** — every route is publicly URL-reachable; auth enforced only inside page effects.
13. **🟡 `@agapp/shared` declared as dep in mobile `package.json` but never imported** — dead dependency.

---

## 🔌 Systems NOT connected / integration gaps

1. **The NestJS API is 90% orphaned.** Mobile, admin, and field-officer all hit Supabase directly. The API's report/service/LGU/forum CRUD endpoints are effectively unused. **Consequence: most citizen & admin actions never create audit logs**, because audit logging only happens inside API controllers. Either route writes through the API, or move audit logging into Supabase triggers.
2. **PDF generation disconnected** — generator code is good but no live route exposes it.
3. **pgvector RAG not wired** — `faq_embeddings` is an empty shell; the "RAG pipeline" described in the roadmap isn't implemented (chatbot is keyword + Gemini, not semantic search).
4. **Push notifications end-to-end untested** — backend listener exists, mobile registration is inert in Expo Go. Needs a standalone build to verify.
5. **No `.env*` files committed** — every app needs externally-supplied Supabase keys to run.
6. **No shared data-access layer** — all three clients reimplement queries against the same Supabase tables (the `TrackingDetailScreen` location-shape bug is a symptom of this).
7. **No CI/CD** (Phase 5 of the roadmap is entirely untouched).

---

## 🎯 Recommended next steps (priority order)

### Must-fix before any demo/defense
1. Fix `TrackingDetailScreen` location-shape bug (small mapping fix)
2. Decide ML story: either ship a real TFLite model or remove the "YOLOv11" claims and relabel as manual verification
3. Port `/api/services/:id/pdf` into NestJS (or delete `server.ts`)
4. Fix Liliw hardcoding in report geofence

### High-value enhancements
5. Add `middleware.ts` route guards to admin
6. Wire staff creation through Supabase Auth `admin.createUser`
7. Move audit logging into Supabase triggers (since clients bypass the API)
8. Replace client-side reference numbers with a DB sequence/trigger
9. Either implement pgvector RAG or drop the `faq_embeddings` table to avoid implying it works

### Cleanup
10. Delete dead code: `api/src/server.ts`, `admin/src/app/lgu/page.tsx`, `admin/src/components/auth/LGUAdminLogin.tsx`, `SuperAdminLogin.tsx`, unused `components/ui/Modal.tsx`, `LoadingSpinner.tsx`
11. Remove `@agapp/shared` from mobile's deps or actually use it
12. Strip committed demo credentials from `admin/src/app/page.tsx:10-13`

---

## 📁 File-by-file reference

### `apps/mobile/` (citizen app)
| File | Status |
|---|---|
| `App.tsx`, `index.js`, `app.json`, `metro.config.js` | ✅ Real config |
| `supabaseClient.ts` | ✅ SecureStore adapter; warns on missing env (no hard fail) |
| `src/contexts/AuthContext.tsx` | ✅ Real; 15+ `console.log` left in |
| `src/contexts/ThemeContext.tsx` | ✅ Dark-mode persistence |
| `src/navigation/AppNavigator.tsx` | ✅ Gates Login → LguSelect → Main tabs |
| `src/screens/LoginScreen.tsx` | ✅ Real; password check says "8 chars" but enforces 6; orphaned-auth-user risk on profile-insert failure |
| `src/screens/LguSelectScreen.tsx` | ✅ Real |
| `src/screens/HomeScreen.tsx` | ✅ Real + mock-landmark fallback when facilities empty |
| `src/screens/ServicesScreen.tsx` | ✅ Real submit; `qr_code_url` empty; client-generated ref# |
| `src/screens/ReportsScreen.tsx` | 🟡 Real submit; **fake ML**; **Liliw hardcoding** |
| `src/screens/TrackingDetailScreen.tsx` | 🐛 Report-branch map broken (data shape) |
| `src/screens/ForumScreen.tsx` | ✅ Real CRUD + realtime; follow/copy-link/image-upload stubbed; hooks-rule violation |
| `src/screens/ChatbotScreen.tsx` | ✅ Real backend call; mic stubbed; hooks-rule violation |
| `src/screens/MapExplorerScreen.tsx` | ✅ Most polished screen |
| `src/screens/NewsDetailScreen.tsx` | ✅ Real; blank screen during load (no spinner) |
| `src/screens/NotificationsScreen.tsx` | ✅ Real realtime + markAsRead |
| `src/screens/ProfileScreen.tsx` | 🟡 Display real; consent/badges/menu stubbed |
| `src/utils/push.ts` | 🟡 Inert in Expo Go by design |

### `apps/admin/` (Next.js dashboard)
| File | Status |
|---|---|
| `src/app/page.tsx` | ✅ Real login w/ role routing; **committed plaintext creds** |
| `src/app/layout.tsx` | ✅ Real |
| `src/app/lgu/page.tsx` | ❌ Dead stub (early `return null`) |
| `src/app/lgu/{dashboard,forum,news,reports,services,settings}/page.tsx` | ✅ Real (attachments + assignment history partial) |
| `src/app/personnel/{dashboard,reports}/page.tsx` | ✅ Real (reports tab filter is a no-op bug) |
| `src/app/personnel/settings/page.tsx` | ❌ Pure mockup |
| `src/app/super/{page,analytics,lgus,settings}/page.tsx` | ✅ Real (`responseTime` hardcoded; `/super` add-LGU is local-only) |
| `src/components/auth/{LGUAdminLogin,SuperAdminLogin}.tsx` | ❌ Fake setTimeout mocks, unmounted |
| `src/components/auth/LoginLayout.tsx` | ✅ Presentational |
| `src/components/layout/{DashboardLayout,Header,Sidebar}.tsx` | ✅ Real (Header/UserMenu notif = stub) |
| `src/components/layout/UserMenu.tsx` | ⚠️ signOut missing `supabase.auth.signOut()` |
| `src/components/ui/*` (11 files) | ✅ All real; `Modal.tsx` + `LoadingSpinner.tsx` unused |
| `src/lib/supabase.ts` | ✅ Real client |

### `apps/field-officer/` (officer app)
| File | Status |
|---|---|
| `App.tsx` | ✅ Boots offline-sync interval (30s) |
| `src/navigation/AppNavigator.tsx` | ✅ Login ↔ Main tabs (Tasks/Profile) |
| `src/contexts/AuthContext.tsx` | ✅ Real Supabase session + profile |
| `src/screens/LoginScreen.tsx` | ✅ Real; role-gates (rejects CITIZENs) |
| `src/screens/TasksScreen.tsx` | ✅ Real `reports` query (Under Review/In Progress) |
| `src/screens/TaskDetailsScreen.tsx` | ✅ Resolve via offline queue |
| `src/screens/ProfileScreen.tsx` | ✅ Profile + manual force-sync |
| `src/utils/OfflineSyncManager.ts` | ✅ AsyncStorage queue; only handles `UPDATE_REPORT_STATUS` |
| `src/utils/supabaseClient.ts` | ✅ Real |

### `apps/api/` (NestJS)
| File | Status |
|---|---|
| `src/main.ts` | ✅ The actual entry (`npm run dev:api`) |
| `src/app.module.ts` | ✅ Registers 7 controllers + SupabaseService + PushService |
| `src/app.controllers.ts` | ✅ Rewritten 2026-06-30: all mock-db imports removed; returns `503` if Supabase unavailable |
| `src/supabase.service.ts` | ✅ Lazy client init (warns if env missing) |
| `src/supabase-auth.guard.ts` | ✅ JWT validation |
| `src/push/push.service.ts` | ✅ Realtime listener → Expo push |
| `src/pdf-generator.ts` | ✅ Working pdf-lib generator — but **not mounted as a route in NestJS** |
| `src/storage.service.ts` | ✅ base64 upload to Storage buckets |
| `src/generate-sample-pdfs.ts` | 🔧 Standalone script |
| ~~`src/mock-db.ts`~~ | 🗑️ Deleted 2026-06-30 — 422-line mock data, was never needed with real Supabase |
| ~~`src/server.ts`~~ | 🗑️ Deleted 2026-06-30 — dead 810-line Express server that never ran |

### `packages/shared/`
| File | Status |
|---|---|
| `src/index.ts` | ✅ Exports types + zod schemas + theme + ThemeContext + AgappLogo |
| `src/theme.ts` | ✅ NEW 2026-06-30 — `PASTELS`, `ACCENT`, `TOKENS` (light/dark), `globalStyles` |
| `src/contexts/ThemeContext.tsx` | ✅ NEW 2026-06-30 — `ThemeProvider` + `useTheme` for both Expo apps |
| `src/components/AgappLogo.tsx` | ✅ NEW 2026-06-30 — shared RN logo component |
| `src/react-native-compat.d.ts` | ✅ NEW 2026-06-30 — augments `NativeMethods.refs` to fix TS2786 |
| Used by | api ✅ · admin ✅ (shared lib) · mobile ✅ (re-exports theme/ThemeContext/Logo) · field-officer ✅ (same) |

### `supabase/`
| File | Status |
|---|---|
| `schema.sql` | ✅ 14 tables, RLS, PostGIS, pgvector, profanity triggers |
| `seed.sql` | ✅ Liliw seed (lgus, users, reports, services, facilities, faqs) |
| `storage_setup.sql` | ✅ Buckets + policies |
| `patches/001_fix_rls_and_security.sql` | ✅ RLS hardening |
| `reset.sql` | 🔧 Reset script |
| `SUPABASE_SETUP_GUIDE.md` | 📖 Docs |

---

*End of audit. This document reflects the actual state of the code as of 2026-06-17 and supersedes descriptions in `AGAPP-Complete-System-Requirements.md` where they disagree.*

# AGAPP — To-Do

> **Updated:** 2026-06-30 · Living list. Synthesized from the
> [Codebase-Audit](../Audits/Codebase-Audit.md) and current work.

## 🔴 Now (active)

- [ ] Restore the paused Supabase project if it went INACTIVE (free tier).
- [ ] Apply `supabase/verification_setup.sql` to the live DB (SQL Editor).
- [ ] Test the verification flow end-to-end (mobile submit → admin approve).
      See [Plan-Verification-Feature](../Planning/Plan-Verification-Feature.md).
- [ ] Port PDF generation into a real NestJS controller — `src/pdf-generator.ts`
      works but has no live route now that `server.ts` was deleted.

## 🟠 Next (high value)

- [ ] Make the **pothole ML real** — replace hardcoded `ml_confidence: 0.95` in
      `apps/mobile/src/screens/ReportsScreen.tsx`. See
      [Plan-ML-Pothole-Detection](../Planning/Plan-ML-Pothole-Detection.md).
- [ ] Reconcile model name: code says "YOLOv11", paper says "YOLOv8n".
- [ ] Fix report map bug — `TrackingDetailScreen.tsx` reads `location.lat/lng` but
      `ReportsScreen` writes flat `latitude/longitude/barangay`.
- [ ] Remove Liliw hardcoding in the report geofence (`ReportsScreen.tsx`).
- [ ] Staff login: admin creates a `users` row but no Supabase Auth user → new staff
      can't log in. Fix: call `supabase.auth.admin.createUser` in the settings page.

## 🟡 Later (cleanup / robustness)

- [ ] Add `middleware.ts` route guard to admin (routes currently URL-reachable by anyone).
- [ ] Decide audit logging: move into DB triggers (clients bypass the NestJS API).
- [ ] Delete dead admin code: `src/app/lgu/page.tsx` (early `return null`),
      `src/components/auth/LGUAdminLogin.tsx`, `SuperAdminLogin.tsx`.
- [ ] Strip committed demo credentials from `apps/admin/src/app/page.tsx:10-13`.
- [ ] Either implement pgvector RAG or drop `faq_embeddings` table to avoid implying it works.
- [ ] Fix `UserMenu.handleSignOut` — missing `supabase.auth.signOut()` call (see `Sidebar` for the correct pattern).
- [ ] Fix React Hooks violations — `useBottomTabBarHeight()` inside `try/catch` in
      `ChatbotScreen.tsx:65-69` and `ForumScreen.tsx:35-40`.
- [ ] Replace client-generated reference numbers (`Math.random`) with a DB sequence/trigger.
- [ ] Add tests (none exist yet anywhere).

## ✅ Done

- [x] **Supabase JS version aligned** — admin + api upgraded from `2.43.2` → `2.108.1`
      (matches mobile/field-officer; all changes between versions were additive).
- [x] **Shared code consolidation** — `ThemeContext`, `AgappLogo`, and theme tokens
      moved to `packages/shared`; mobile + field-officer now re-export from `@agapp/shared`.
- [x] **`packages/shared` TypeScript type errors fixed** — `react-native-compat.d.ts`
      augments `NativeMethods.refs`; `@types/react@^19.x` pinned locally in shared
      (required because RN 0.81 bundled types reference React 19's ReactNode).
- [x] **API crash fixed** — `Cannot find module './mock-db'`; `app.controllers.ts`
      rewritten to remove all mock-db imports; returns `503` when Supabase unavailable.
- [x] **`apps/api/src/server.ts` deleted** — dead 810-line Express server that never ran.
- [x] **`apps/api/src/mock-db.ts` deleted** — 422-line mock data, never needed with real Supabase.
- [x] **`apps/admin/tsconfig.json` fixed** — removed wrong `react`/`react-dom` path entries
      and deprecated `baseUrl: "."`. Now matches canonical Next.js 14 template.
- [x] **Auth timeout increased** — `withTimeout` default `2500ms` → `6000ms`,
      `getSession()` → `8000ms`; fixes cold-start `[Error: Query timeout]` on mobile.
- [x] **`.gitignore` updated** — added `*.tsbuildinfo` and `.expo/` to prevent build
      caches and machine-specific device files from being tracked.
- [x] **Dependency audit completed** (context7-verified) — all versions correct;
      see the 2026-06-30 update block in Codebase-Audit.md for the full table.
- [x] Verification: cleanup-on-failure + friendly RLS message (mobile).
- [x] Verification: fixed admin N+1 query; extracted `lib/lgu.ts` helper.
- [x] Refreshed the Codebase-Audit with the verification feature + corrections.
- [x] Organized docs into this vault.

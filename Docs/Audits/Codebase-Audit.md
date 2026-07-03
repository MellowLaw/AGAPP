# AGAPP System — Full Codebase Audit

> **Scope:** `agapp-system/` monorepo (mobile, admin, field-officer, api, shared, supabase)
> **Date:** 2026-06-17 · Last updated: 2026-07-03
> **Purpose:** Ground-truth status of every folder/file — what's done, what's stubbed, what's broken, what's not connected. Use this instead of the AI-generated requirements doc, which is partly inaccurate.

---

## 🔄 Update — 2026-07-03 (eServices: document requests + QR pickup)

Full feature per `Docs/Planning/Plan-eServices-QR-Pickup.md`, live-tested end to end.

- **DB:** new `lgu_services` catalog table (admin-editable, RLS: citizens read active rows, LGU_ADMIN/SUPER_ADMIN manage own/all). `service_requests` gains `'Ready for Pickup'` status, `claim_code`/`claim_code_used_at`/`released_at`/`released_by`/`lgu_service_id`. Three SECURITY DEFINER RPCs — `mark_service_ready`, `lookup_claim_code`, `release_service_request` — mirror the `verify_citizen` pattern (role+LGU re-checked server-side, `REVOKE FROM PUBLIC, anon` then `GRANT TO authenticated`). QR encodes only the opaque `claim_code`, never the reference number; scanning is not the trust boundary, the release RPC is.
- **Bug fixed in passing:** `notifications.type` is `NOT NULL` with no default; both `notify_report_status_change()` and `notify_service_status_change()` never set it, so every citizen status-change notification had been silently failing (`23502`) since these triggers were created. Fixed for both.
- **Mobile (`apps/mobile`):** `ServicesScreen.tsx` now reads the live `lgu_services` catalog (grouped by office, detail sheet with requirements/fee/processing time) instead of the old `system_config` hardcoded list. `TrackingDetailScreen.tsx` adds a 5-step realtime status timeline and renders the claim QR client-side (`react-native-qrcode-svg`) when Ready for Pickup — no more `api.qrserver.com` external dependency.
- **Field-officer (`apps/field-officer`):** new "Scan" tab (`ScanPickupScreen.tsx`) — native camera QR scan (`expo-camera`) + manual code fallback → `lookup_claim_code` → confirmation card → **Confirm Release** → `release_service_request`. This is the app's first real feature beyond login/tasks.
- **Admin (`apps/admin`):** `lgu/services` and `personnel/dashboard` rewritten to use the DB status strings directly (`'Submitted' | 'Under Review' | 'In Progress' | 'Ready for Pickup' | 'Released' | 'Rejected'`) instead of a separate UI-status vocabulary that had bugs (Ready for Pickup and Released were conflated; fabricated Payment Amount/Status fields removed — there is no in-app payment). Mark Ready shows the generated code in a modal; Ready-for-Pickup rows get a "Mark Released (manual override)" action for the no-phone edge case. New `/lgu/eservices-catalog` CRUD page (sidebar: "eServices Catalog") for managing the per-LGU document catalog.
- **Verified live:** anon blocked, LGU_ADMIN/LGU_PERSONNEL authorized, claim-code normalization (case/dash-insensitive), double-release blocked, wrong-LGU codes return not-found (no cross-LGU leak); admin Mark Ready → real code → manual release → state persists after reload; catalog CRUD loads/edits seeded rows. Mobile/field-officer screens type-check clean but weren't run in a simulator this session.
- Seeded 26 catalog rows (13 documents × Liliw + Nagcarlan) — placeholder-truth until the municipal-hall interview; that's exactly why the catalog is an admin-editable table, not hardcoded.

**Reporting-system polish (same day):** final category set locked per client
direction — `pothole` (Pothole / Road Damage), `clogged_drainage` (Drainage / Canal),
`stray_animal` (Stray Pets), `damaged_pole` (Damaged Pole, NEW). Fixes shipped:
- **Mobile report submission was 100% broken** — `ReportsScreen.tsx` sent category
  ids (`infrastructure/environment/safety/other`) and `status: 'Pending'`, none of
  which pass the DB CHECK constraints; every citizen report insert failed with a
  constraint violation. Now uses the 4 real slugs (proper icons/labels) and lets
  status default to `'Submitted'`.
- **Fake ML claims removed everywhere, boundary kept:** mobile no longer hardcodes
  `ml_confidence: 0.95 / ml_verified: true`; it calls a single boundary module
  `apps/mobile/src/utils/mlAnalysis.ts` that returns nulls ("not analyzed") until
  the pothole model exists. DB defaults (`1.0`/`true`) dropped, existing rows nulled.
  API `verify-image` endpoint no longer returns random confidences (it's the future
  server-side inference slot). Shared `Report` type + Zod schema now nullable.
  Admin's "AI Verified" badge stays — it simply never shows until real values exist.
  "captured by YOLOv11" subtitle removed from the mobile Report screen.
- **Labels everywhere:** shared `REPORT_CATEGORY_LABELS`/`reportCategoryLabel()` in
  `packages/shared`; raw slugs no longer render in mobile (Reports list, Tracking
  detail, Home activity) or admin (5 label maps updated); the notification trigger
  now says "Your Drainage / Canal report REP-… is now …" instead of the slug.
  `ReportStatusBadge` gained the missing `submitted`/`under_review` keys (pills on
  lgu/reports literally displayed "under_review" before).
- Migrations: `reports_category_pole_and_honest_ml_defaults`,
  `report_notification_category_labels`; schema.sql + seed.sql synced; one demo
  `damaged_pole` report seeded live. CHECK verified live (bogus category rejected,
  `damaged_pole` accepted); admin verified in preview (labels correct, no raw
  slugs, no fake AI badge, status pills readable).

**Hole-fix pass (same day):** a follow-up audit found and fixed three gaps:
- **Realtime was dead system-wide** — the `supabase_realtime` publication had ZERO tables, so every `postgres_changes` subscriber (API push service, mobile Forum/Notifications screens, the new tracking subscription) silently received nothing, ever. Combined with the `notifications.type` bug this means push notifications had never once worked end-to-end. Fixed by migration `enable_realtime_publication_tables` (adds `notifications, reports, service_requests, forum_posts, forum_comments`); mirrored into `schema.sql`. **Verified live** with three concurrent subscribers: authenticated + simple RLS (forum_posts), authenticated + subquery RLS + id filter (the exact TrackingDetailScreen pattern), and service-key (the exact push-service pattern) — all received events. Note: the poller can lag ~1–2 min after `ALTER PUBLICATION`.
- **`apps/field-officer/.env` didn't exist** — its Supabase client was built with an empty URL, so login and the new QR scanner could never connect. Created `.env` (same project creds as mobile) + committed `.env.example`; fixed the copy-pasted `[mobile/supabase]` warn label.
- **Facility descriptions never reached citizens** — admin Facilities form edits a description "shown to citizens" but the mobile Map Explorer POI sheet didn't render it. Now shown under the address (3-line clamp).

**Admin visual redesign — "Cosmic Slate & Editorial Modern" (same day, user spec + reference screenshots):**
Scope: shared chrome (applies to ALL roles) + a full bento rebuild of the LGU
dashboard specifically (the page shown in the reference screenshots). NOT a
full-app token migration — see the honest gap noted at the end.
- **Real, working light/dark theme system added** — the CSS vars + `darkMode:
  'class'` config already existed in `globals.css`/`tailwind.config.ts` but
  were completely disconnected (no provider, no toggle, nothing ever added
  `.dark` to `<html>`). Built `contexts/ThemeContext.tsx` (persists to
  `localStorage`, respects `prefers-color-scheme` on first load) and wired it
  into `app/layout.tsx`. New semantic Tailwind tokens (`bg`, `surface`,
  `surface-alt`, `text-primary/muted/faint`, `theme` → generates the
  `border-theme` utility, `accent`/`accent-soft`) read the CSS vars so
  components never hardcode literal hex again.
- **Brand rose standardized to `#FF758F`** across the new components and the
  logo's accent dot (was a slightly different pastel pink, `#F27983`/`#F497A2`,
  in different places).
- **Fonts:** added `JetBrains Mono` (`--font-mono`) for data/coordinates/clock/
  IDs; kept the existing EB Garamond italic serif for display headers and
  Plus Jakarta Sans for body (both already good choices, not generic Inter).
- **Sidebar rewritten** (`framer-motion` added as a new dependency) — no more
  solid-fill active pill; active state is +2% scale, bold rose text, and a
  barely-visible 3%-opacity accent backdrop glow with broad rounded corners;
  hover is a 2%-opacity wash. Spring transitions on both.
- **New `StatusRow` component** — SYS_LIVE pulsing-dot indicator (Tailwind
  `animate-ping`), a real ticking `Asia/Manila` (UTC+8) clock in bold
  monospace, and a Sun/Moon theme toggle that rotates/scales on switch — all
  in one `bg-surface/50` + `border-theme` pill, divided by thin verticals.
  New `DashboardHero` component (kicker + italic serif headline + colored
  suffix + subtitle + StatusRow) used by the main Dashboard pages only;
  other pages keep the compact `Header` bar (now themed too).
- **Dynamic map theming** — `LeafletMap.tsx` swaps tile providers by theme:
  CartoDB `dark_all` (deep midnight canvas) / `light_all` (soft parchment),
  both free/no-API-key OSM-data basemaps. Report markers/legend re-theme
  via the new tokens.
- **LGU dashboard rebuilt as a 12-col bento grid** (8-col Reports Hotspot Map /
  4-col "Precise Data Metrics" categorical distribution panel) with real
  data throughout — category counts/percentages come from actual `reports`
  rows grouped by our 4 real categories (pothole, drainage, stray pets, poles),
  animated in with Framer Motion springs. Deliberately did NOT fabricate a
  historical trend sparkline (no time-series data exists to back one) — used
  a proportion-based decorative accent bar instead. Verified live in both
  themes: metrics, map (pins render correctly on both dark and light tiles),
  and distribution panel all show real Liliw data.
- **Honest scope gap:** only the LGU dashboard's own content was rebuilt.
  Every other page (reports, services, forum, settings, super/personnel
  dashboards, etc.) still hardcodes light-only colors — confirmed live: in
  dark mode they render as a light-mode island inside the now-dark shared
  chrome (sidebar/header/map re-theme correctly, page content does not).
  Extending the token migration to those pages is the natural next step if
  full dark-mode coverage is wanted.

**Security hole + dead code cleanup (same day, flagged during map work):**
- **`/api/create-staff` had ZERO auth check** — it's not covered by
  `middleware.ts`'s matcher (page routes only, not `/api/*`), and the route
  itself never verified the caller. Anyone who could reach the endpoint
  (unauthenticated, curl, anything) could create an `LGU_ADMIN` or
  `LGU_PERSONNEL` account for **any** LGU with attacker-chosen credentials —
  a full admin-account-creation hole. Fixed: added the same
  `@supabase/ssr` session-cookie check `middleware.ts` already uses,
  looks up the caller's role/`lgu_id`, and only allows SUPER_ADMIN (any LGU)
  or an LGU_ADMIN acting on **their own** `lgu_id`. Also added a
  `CREATABLE_ROLES` allowlist so a forged `role: 'SUPER_ADMIN'` in the request
  body is rejected outright regardless of caller, independent of the
  authorization check. **Verified live** (dev preview, real cookies): no
  session → 401; LGU_ADMIN targeting a different LGU → 403; forged
  `role: 'SUPER_ADMIN'` → 400; legitimate own-LGU request → passes
  authorization cleanly (only stopped by the already-known-missing
  `SUPABASE_SERVICE_ROLE_KEY` env var in this dev environment).
- **`components/auth/LoginLayout.tsx` deleted** — dead code with the old
  logo, zero importers anywhere (its sibling `LGUAdminLogin.tsx`/
  `SuperAdminLogin.tsx` were already deleted 2026-06-30; this was the last
  file in that directory, which is now removed too).

**Mobile UI/upload bug fixes (same day):**
- **Map pins rendered as clipped arcs, then went fully invisible after a first
  attempted fix** — root cause: the marker view CHANGED SIZE (label
  bubble mounting on tap/zoom, isSelected-driven resizing), and
  react-native-maps snapshots the view into a bitmap on every change; a
  snapshot mid-resize produced the clipped fragments. A first attempt (fixed
  canvas + fading label) still regressed to pins not rendering at all, so per
  user direction the whole marker was **rewritten from scratch** rather than
  patched further: `MapExplorerScreen.tsx`'s `FacilityMarker` is now a plain
  circle + CSS-triangle tail at ONE constant size always (selection shows only
  via border color, never a size change), the on-map zoom-driven label and the
  `zoomLevel` state that drove it were deleted entirely (tapping a pin already
  opens the bottom sheet with the name — no functionality lost), and
  `tracksViewChanges` settles to `false` shortly after mount/selection. Colors
  and icons still match `apps/admin/src/components/map/markers.ts`
  `FACILITY_COLORS`/`makePinIcon` (same category→color mapping, same
  rounded-top/pointed-bottom silhouette) — verified in code, not yet confirmed
  on a real device by the user.
- **Chatbot input sank under the tab bar after the first message** — removed
  `tabBarHideOnKeyboard: true` from the mobile tab navigator; it raced with
  ChatbotScreen's own KeyboardAvoidingView (worst when the Quick Suggestions
  row appears and changes content height at the same moment).
- **Image uploads failed with "Network request failed"** — both
  `ReportsScreen.tsx` and `VerifyIdentityScreen.tsx` uploaded via
  `fetch(uri).blob()`; React Native's Blob doesn't serialize through
  supabase-js. Switched both to `arrayBuffer()` (the supported RN/Expo path).
  Buckets/policies were verified fine — the bug was purely client-side.
- **Admin forum: comment threads now visible + moderatable** — count was
  hardcoded 0 and threads were invisible; posts now expand to show comments
  with Approve/Delete on flagged ones. **Cross-tenant RLS hole fixed in
  passing:** `forum_comments` policies checked only `role='LGU_ADMIN'` with no
  LGU scoping (any admin could moderate any LGU's comments) and the INSERT
  policy's `OR auth.uid() IS NOT NULL` let any user comment as anyone. Both
  fixed via join to `forum_posts.lgu_id` (migration
  `fix_forum_comments_cross_tenant_rls`; schema.sql synced).

**Legacy PDF generation removed (same day, user direction):** `src/pdf-generator.ts`
+ `src/generate-sample-pdfs.ts` deleted, `pdf-lib` dep dropped. It server-generated
printable municipal application forms (birth cert, business permit, etc.) — legacy
from before the eServices redesign settled on QR-only pickup with no in-app payment
and checklist-only requirements. Was never mounted as a live NestJS route. Confirmed
zero other references before deleting; API typechecks clean.

**Pothole ML explicitly deferred (user direction, not a gap to fix now).** The
`mlAnalysis.ts` boundary + `POST /reports/verify-image` both correctly return
"not analyzed" and are NOT to be filled in yet — revisit only when asked.

**⚠️ Still outstanding, keep visible:** leaked-password protection is still OFF in
the Supabase Dashboard (Authentication → Sign In / Providers → Password). One toggle,
~2 minutes, not reachable via migrations. Repeatedly deferred — see 🔴 Now in
[TODO](../Tasks/TODO.md).

## 🔄 Update — 2026-07-02 (Maps overhaul, security hardening, perf, coordinate fix)

Large multi-part session. Grouped by area. **Read the ⚠️ KNOWN BROKEN item first if you
are about to run a production build.**

### ⚠️ KNOWN BROKEN: `next build` in apps/admin (React 18/19 hoist clash)
`npx next build` in `apps/admin` crashes with
`TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')` in
`node_modules/react-dom/cjs/react-dom-server-legacy...`. **Root cause:** npm workspaces
hoists `react@19.1.0` (mobile / Expo 54 needs 19) and `react-dom@18.3.1` (admin / Next 14
needs 18) side-by-side at the root; react-dom 18 loads react 19 at require-time and dies.
The root `package.json` `workspaces.nohoist` field is **Yarn-only — npm ignores it**, so it
provides zero protection. `next dev` works fine (Next 14 App Router uses its own bundled
React; only build-time prerender of `/_error` `/404` touches root react-dom). **A separate
session is fixing this** (options: nest react-dom@18 in admin, or move admin to React 19 +
Next 15 which forces react-leaflet@4→5). Until then: **dev mode is the source of truth;
don't trust a failed `next build` as a sign your code is wrong.** The pre-existing
`TS2786`/`TS2322` "`bigint`/ReactNode" type errors across admin come from the same React
18-vs-19 `@types` split and are also expected — filter them out when type-checking
(`tsc --noEmit 2>&1 | grep -vE "TS2786|TS2322"`).

### Maps overhaul (Leaflet) — the big feature
- **Library:** `leaflet` + `react-leaflet@^4.2.1` + OpenStreetMap tiles (no API key,
  no billing). react-leaflet pinned to **v4** because admin is React 18 (v5 needs React 19).
  Mobile keeps `react-native-maps` — unchanged. **The two apps do NOT share a map library;
  they share the DATABASE.** A pin edited in admin shows in the mobile app because both
  read the same Supabase tables, not because they run the same map code.
- **New shared components:** `apps/admin/src/components/map/` — `LeafletMap.tsx`,
  `ReportsMap.tsx`, `FacilityPickerMap.tsx`, `markers.ts` (status/facility colors +
  `makePinIcon` divIcon, avoids Leaflet's webpack-broken default icon), `types.ts`, and
  `index.tsx`. **`index.tsx` is the ONLY sanctioned import path** — it wraps every map
  component in `next/dynamic(..., { ssr: false })`. Importing `./ReportsMap` etc. directly
  from a page crashes the build with "window is not defined". Always import from
  `@/components/map`.
- **New page `/lgu/facilities`** (`apps/admin/src/app/lgu/facilities/page.tsx`, added to
  LGU sidebar): click map to place a pin, fill form (name / category / address /
  description / phone / image), drag pin to reposition, edit/delete existing. Writes
  `lgu_facilities`. This is the tool that fixes inaccurate facility pins — admins drag them
  to the true spot. Image upload → `facility-images` bucket → `image_url`.
- **Dashboards: charts replaced by report maps.** `apps/admin/src/components/ui/Chart.tsx`
  is **deleted** (Bar/Line/Pie). LGU dashboard shows a town-scoped report map with popups
  that deep-link to `/lgu/reports?reportId=`. Super dashboard shows an all-LGU **view-only**
  map (no action links; respects the LGU filter tabs). Stat cards, leaderboard, Recent
  Submissions all kept.
- **Reports detail panel** (`/lgu/reports`): text coordinates replaced by an embedded
  single-marker map (`key={dbId}` so it re-centers on selection); added a citizen
  verification badge (`users.verification_status`) + registered barangay for legitimacy
  checks. Handles null `citizen_id` ("Account deleted").
- **DB migration:** `lgu_facilities` gained a `description` column; new `facility-images`
  public-read storage bucket (admin-only write/delete). Mirrored into `schema.sql` +
  `storage_setup.sql`. The LGU-admin write RLS policy on `lgu_facilities` already existed.

### Seed coordinates were WRONG (reports pinned in Batangas)
Seeded reports sat at lat ~13.92–13.93 — **~23 km south of Liliw, in the wrong province.**
LGU centers/facilities were ~300–500m off the true poblacion. Fixed via migration
`fix_seed_coordinates_liliw_nagcarlan` using PhilAtlas anchors: **Liliw poblacion ≈
14.131, 121.4365; Nagcarlan poblacion ≈ 14.136, 121.4165.** Rebased all 13 reports into
their real towns, snapped both `lgus` centers, repositioned all 10 facilities. `seed.sql`
synced. Admin map fallback constants updated; the super-admin map now defaults to the
**Liliw–Nagcarlan corridor (`[14.1335, 121.4265]`)** — pilot scope is these two Laguna
municipalities only, no other provinces. **Facility spots are best-effort around the
verified town centers — exact street-level positions get fine-tuned via the Facilities
drag tool, not from code.**

### Security hardening (all verified live against real accounts)
- **Closed `users` table PII leak.** The SELECT RLS policy was `auth.uid() IS NOT NULL` —
  ANY logged-in account (incl. every mobile citizen) could read the whole `users` table
  (all names, emails, barangays, roles, across all LGUs). Replaced with
  `"Users can read their own record" USING (auth.uid() = id)`. LGU admins / super admins
  still read their scope via the existing ALL-command management policies. Traced all 17
  `users` readers first — nothing depended on the open read. **`schema.sql` was synced** to
  match (it still had the old policy).
- **Role-based route guard** added to `apps/admin/src/middleware.ts`: was auth-only, now
  also checks role→path (`/super`→SUPER_ADMIN, `/lgu`→LGU_ADMIN, `/personnel`→
  LGU_PERSONNEL); wrong role redirects to its own dashboard. Defense-in-depth (RLS already
  blocked the data).
- **SECURITY DEFINER function hardening:** pinned `search_path` on 8 functions; revoked
  needless `EXECUTE` on `rls_auto_enable` / `set_user_pending_on_request` (trigger funcs)
  and `anon` on `verify_citizen`. **Gotcha:** revoking from `anon`/`authenticated` alone
  didn't work — each also had an implicit `PUBLIC` grant that must be
  `REVOKE ... FROM PUBLIC`. `verify_citizen` already self-checks the caller's role
  internally (confirmed by reading the body).
- **Manual step still pending:** enable leaked-password protection in the Supabase
  Auth dashboard (not reachable via SQL/migrations). See TODO.

### Admin auth was completely broken → fixed
`middleware.ts` (added 2026-06-30) checked for a session cookie, but `lib/supabase.ts` used
plain `createClient` which only persists to `localStorage`, so **every login bounced back
to `/`**. Fixed by switching `lib/supabase.ts` to `@supabase/ssr` `createBrowserClient` and
rewriting `middleware.ts` to `createServerClient` + `getUser()`. Tested all 3 roles.

### Demo Quick Login — passwords restored without exposing them
The 3 demo buttons log in via a **server-side route** `apps/admin/src/app/api/demo-login/
route.ts` (reads non-public env vars, signs in server-side, sets cookie — password never
reaches the browser bundle). **Two gotchas, both documented in TODO:** (1) `NEXT_PUBLIC_`
env vars would have leaked the passwords into the client bundle — don't use them for
secrets; (2) Next.js's `@next/env` loader does `$VAR` expansion on `.env` values (unlike
plain dotenv), silently truncating passwords containing `$` — so demo passwords are stored
**base64-encoded** (`DEMO_*_PASSWORD_B64`) and decoded in the route.

### Other fixes
- **Real turnaround time** replacing the fake static "2.0 days": `reports` /
  `service_requests` gained an `updated_at` column + `BEFORE UPDATE` trigger; new
  `apps/admin/src/lib/turnaround.ts` computes avg days-to-resolve. (Shows "0.0 days" for
  seed data that never transitioned — accurate, not a bug.)
- **Admin mock data removed:** `UserMenu.tsx` hardcoded "Admin User"; `personnel/settings`
  had a fake "Ana Reyes" profile with save buttons that only toasted — both now real.
- **`showToast`-in-`useEffect`-deps infinite refetch loop** fixed in 6 files (`useToast()`
  returns a new fn each render). Symptom was 10+ duplicate fetches + typed input getting
  wiped mid-edit.
- **Perf:** `next.config.mjs` gained
  `experimental.optimizePackageImports: ['@phosphor-icons/react']` — that lib ships ~3,000
  icon files behind a barrel; dev compile dropped from ~9,600 modules / ~12s to
  ~600–700 modules / <1s. This was the "admin loads slow" complaint.
- **`create-staff` route** now checks `SUPABASE_SERVICE_ROLE_KEY` presence and builds its
  admin client inside the handler (so `next build` page-data collection doesn't need the
  secret at import time).

---

## 🔄 Update — 2026-07-01 (Chatbot LLM provider swap: Gemini → Mistral)

**What changed:** `ChatbotController.askChatbot` in `apps/api/src/app.controllers.ts` now
falls back to **Mistral** (`mistral-small-latest` via `@mistralai/mistralai`) instead of
Gemini when the keyword FAQ has no match. Env var is now `MISTRAL_API_KEY`.

**Why:** Gemini hit an account/region restriction for this user. Mistral was picked over
Groq/Cerebras because they already had a Mistral subscription — which turned out to be
**Le Chat Pro** (the consumer chat app, `chat.mistral.ai`), a completely separate product
from **La Plateforme** (the actual developer API — key management lives at
`admin.mistral.ai/organization/api-keys`). Le Chat Pro gives zero API credits. La Plateforme
has its own free tier (~1B tokens/month) which covers this use case at no extra cost — a
new API key from La Plateforme was still required.

**What did NOT change:** Forum post/comment AI moderation (`createForumPost` /
`createForumComment`, same file) still uses Gemini via `GEMINI_API_KEY` — left alone on
purpose to keep the change small. It already degrades to a local keyword/PII filter if the
Gemini call fails, so there was no urgency to migrate it in the same pass.

**Guardrail parity:** the prompt-injection hardening from 2026-06-30 carried over exactly —
guardrails in a `system` message (Mistral has no separate `systemInstruction` field, so it's
just the first message in the array), query + history as separate role-tagged messages,
`responseFormat: {type:'json_object'}`, `safePrompt: true` (Mistral's built-in moderation,
equivalent role to Gemini's `safetySettings`), and `redirect.screen` still validated against
the same allowlist. Nothing about the guardrail *design* was weakened by the swap.

**Setup required:** `apps/api/.env` needs `MISTRAL_API_KEY` from
`admin.mistral.ai/organization/api-keys` (La Plateforme's key management page — not the
Le Chat subscription). See `.env.example` for both keys and what each is used for.

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

### Chatbot security hardening + RAG removal
The Gemini fallback in `apps/api/src/app.controllers.ts` (`ChatbotController.askChatbot`)
was hardened against prompt injection and abuse (security was flagged high-priority):
- **Guardrails moved to `systemInstruction`** (LGU-only scope, "treat user text as data",
  refuse off-topic/role-change/prompt-leak attempts) instead of being string-interpolated
  into one big prompt.
- **User input is now role-separated `contents`** (`{role:'user'|'model', parts}`), so the
  query and history can't overwrite the instructions. **Client history is sanitized**:
  capped to last 6 turns, each clamped to 500 chars, `sender` mapped to a safe role,
  leading model turns stripped (Gemini requires a leading user turn).
- **Gemini `safetySettings`** added (harassment / hate / sexual / dangerous → BLOCK_MEDIUM_AND_ABOVE),
  plus `maxOutputTokens: 512` and `temperature: 0.3`.
- **Output validated**: the model's `redirect.screen` is checked against an allowlist
  (`ALLOWED_REDIRECT_SCREENS`) before being sent to the client (which calls
  `navigation.navigate()` with it). Label clamped to 60 chars.
- **DTO input caps**: `query` `@MaxLength(500)`, `history` `@ArrayMaxSize(20)`.
- **`ValidationPipe` registered globally in `main.ts`** (`whitelist`, `forbidNonWhitelisted`,
  `transform`) — previously *no* pipe existed, so all class-validator decorators were inert.
- Fixed a keyword-redirect precedence bug (track/status FAQs were routing to "Submit a
  Report"); added a MapTab redirect branch.

**RAG artifacts removed (DB + schema):** verified `faq_embeddings` was empty (0 rows), had
no FKs/views, and its only reference (`match_faqs` RPC) is never called by app code. Dropped
`match_faqs`, `faq_embeddings`, and the `vector` extension from the live DB (PostGIS intact);
removed the block from `schema.sql`. The chatbot is keyword FAQ + Gemini by design.

**FAQ content enhanced:** `chatbot_faqs` went from 3 → **13 realistic, plain-language
citizen FAQs per LGU** (barangay clearance, cedula, business permit new/renew, birth/marriage/
death certs, indigency, senior ID, pothole report, track status, office hours, hall location)
in both `seed.sql` and the live DB. Mobile welcome suggestions updated to match (removed
off-topic "surprise me with a fact" / "today's news" prompts).

### `.gitignore` additions (root `agapp-system/`)
```
*.tsbuildinfo       # TypeScript build cache (regenerated on every build)
.expo/              # Expo device cache (machine-specific, auto-generated)
```

---

## 🔄 Update — 2026-06-30 (Bug-fix wave: map, hooks, auth, middleware, sequences)

### Bugs fixed
| Bug | Root cause | Fix |
|---|---|---|
| Report map never shows | `TrackingDetailScreen` read `data.location.lat/lng` but `reports` table has flat `latitude`/`longitude` columns (no JSONB `location`) | Changed all reads to `data.latitude` / `data.longitude`; guard is `data.latitude && data.longitude` |
| Liliw hardcoded in geofence error message | Literal string `"from Liliw"` and hardcoded fallback coords `14.1350, 121.4363` | Now uses `selectedLgu.latitude/longitude` directly; skips boundary check if LGU has no coords; error message uses `selectedLgu.name` |
| React Hooks violation | `useBottomTabBarHeight()` called inside `try/catch` in `ChatbotScreen` and `ForumScreen`; the variable was unused in both (SafeAreaView handles bottom inset) | Removed the try/catch block and the now-unused import entirely |
| Admin sign-out leaves session | `UserMenu.handleSignOut` only called `router.push('/')` without `supabase.auth.signOut()` | Added `await supabase.auth.signOut()` before redirect, matching the existing `Sidebar.tsx` pattern |
| Staff can't log in | "Add Staff" in settings created a `users` profile row with a random UUID but never created a Supabase Auth account — no credentials to log in with | New Next.js Route Handler `/api/create-staff` uses the service role key (server-only) to call `supabase.auth.admin.createUser()`, then inserts the profile row with the real auth UID. Rolls back on failure. |
| Math.random reference numbers | Duplicate refs possible under concurrent inserts; client-generated IDs are a consistency risk | DB migration `reference_number_sequences` added sequences + `BEFORE INSERT` trigger on both `reports` and `service_requests`. Format: `REP-2026-1000`. Mobile screens now omit `reference_number` from insert and read it back via `.select('reference_number').single()` |
| No route guard on admin | All `/lgu/*`, `/super/*`, `/personnel/*` routes were URL-accessible without login | `apps/admin/src/middleware.ts` added; checks for `sb-jrureblhypfdljwflout-auth-token` cookie and redirects unauthenticated requests to `/` |
| Demo passwords in source | `DEMO_USERS` array in `apps/admin/src/app/page.tsx` committed real passwords to git | Passwords removed; quick-fill buttons now pre-fill email only |

### Dead code removed
- `apps/admin/src/app/lgu/page.tsx` — was 443 lines with `return null` on line 75, making all code below unreachable. Trimmed to a 14-line redirect-only file.
- `apps/admin/src/components/auth/LGUAdminLogin.tsx` and `SuperAdminLogin.tsx` — mock auth UIs that were never mounted after the unified login page replaced them.

### Important schema fact (easy to forget)
The `reports` table stores GPS as **flat columns** `latitude DOUBLE PRECISION` and `longitude DOUBLE PRECISION`, **not** as a JSONB `location` object. `service_requests` has no location at all.

### New env var required
`SUPABASE_SERVICE_ROLE_KEY` must be added to `apps/admin/.env.local` for staff creation to work. Get it from Supabase Dashboard → Project Settings → API → service_role. It is **never prefixed `NEXT_PUBLIC_`** — it stays server-side only.

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
- **Admin** — Next.js 14 (App Router), Tailwind, `@supabase/ssr` (browser + server clients; middleware route guard), `leaflet` + `react-leaflet@4` + OpenStreetMap for maps (replaced the old custom SVG charts, which are deleted). ⚠️ `next build` currently broken — see the 2026-07-02 update block.
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
- Storage buckets (`report-photos`, `service-attachments`) with policies
- 13 realistic citizen FAQs per LGU in `chatbot_faqs` (keyword-matched by the chatbot)
- _(pgvector / `faq_embeddings` / `match_faqs` removed 2026-06-30 — chatbot is keyword FAQ + Gemini, not RAG)_
- Seed data for Liliw

---

## ⚠️ STUBBED / partial (UI exists, no real behavior)

| Item | Where | Reality |
|---|---|---|
| **On-device pothole ML (YOLO)** | `mobile/src/screens/ReportsScreen.tsx:225-227` | `ml_confidence: 0.95, ml_verified: true` **hardcoded**. UI says "captured by YOLOv11" — **no model exists.** Biggest thesis risk. |
| ~~**PDF generation**~~ | 🗑️ Removed 2026-07-03 | Was legacy from before the eServices QR-pickup redesign (no in-app payment, checklist-only requirements, pickup verified by QR not a printed form). Never mounted as a live route; deleted along with `pdf-lib` dep. |
| **QR codes** | `mobile/src/screens/ServicesScreen.tsx:78` | `qr_code_url: ''` always empty; client builds a qrserver.com URL on the fly |
| **Push notifications** | `mobile/src/utils/push.ts` | Skips registration entirely in Expo Go (SDK 54). Only works in standalone EAS builds. |
| **Admin notifications panel** | `admin/.../layout/Header.tsx:32`, `UserMenu.tsx:73` | "coming soon" toast |
| **News attachments** | `admin/src/app/lgu/news/page.tsx` | Drop-zone UI but always inserts `attachments: []` |
| **Report assignment history** | `admin/src/app/lgu/reports/page.tsx` | Tracked in component state, never persisted to DB |
| **Forum follow / copy-link / image upload** | `mobile/src/screens/ForumScreen.tsx` | Local-only / no-op |
| **Profile consent toggle, "Verified" badge, Help/Privacy buttons** | `mobile/src/screens/ProfileScreen.tsx` | Hardcoded / dead |
| ~~`faq_embeddings` table~~ | 🗑️ Removed 2026-06-30 | Was unused legacy from the abandoned RAG plan. Dropped from live DB + schema (along with `match_faqs` RPC and `vector` ext). Chatbot is keyword FAQ + Gemini by design. |
| **Personnel settings** | `admin/src/app/personnel/settings/page.tsx` | Pure hardcoded mockup ("Ana Reyes") |

---

## 🐛 BUGS to fix (ranked by severity)

1. **🔴 Report map never renders (mobile)** — `mobile/src/screens/TrackingDetailScreen.tsx:68-85` reads `data.location.lat/lng/address` as a JSON object, but `ReportsScreen` writes flat `latitude`/`longitude`/`barangay` columns. Service branch works; report branch is broken.
2. **🔴 Fake ML verification** — hardcoded `ml_*` in `mobile/src/screens/ReportsScreen.tsx:225-227`. Either wire a real model or honestly label it as "manual review."
3. ~~**PDF route orphaned**~~ — moot; `src/pdf-generator.ts` deleted 2026-07-03 (legacy, superseded by QR pickup — see STUBBED table above).
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
3. ~~**Chatbot RAG / faq_embeddings**~~ ✅ Resolved 2026-06-30. The chatbot is keyword FAQ + Gemini by design (the roadmap's "RAG + pgvector" was never adopted). The unused `faq_embeddings` table, `match_faqs` RPC, and `vector` extension were dropped; the Gemini fallback was hardened against prompt injection (see the 2026-06-30 update block).
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
9. ~~Drop the unused `faq_embeddings` table~~ ✅ Done 2026-06-30 (also hardened the Gemini chatbot against prompt injection)

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
| `src/storage.service.ts` | ✅ base64 upload to Storage buckets |
| ~~`src/pdf-generator.ts`~~ | 🗑️ Deleted 2026-07-03 — legacy eServices form-PDF generator, superseded by the QR-pickup redesign (no in-app payment, checklist-only, QR verification) |
| ~~`src/generate-sample-pdfs.ts`~~ | 🗑️ Deleted 2026-07-03 — standalone script for the removed PDF generator |
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

# AGAPP — To-Do

> **Updated:** 2026-07-03 · Living list. Synthesized from the
> [Codebase-Audit](../Audits/Codebase-Audit.md) and current work.

## 🔴 Now (active)

- [ ] **Add `MISTRAL_API_KEY` to `apps/api/.env`** — required for the chatbot fallback
      (replaced Gemini 2026-07-01). Get it from **admin.mistral.ai/organization/api-keys**
      (La Plateforme's key management page), NOT chat.mistral.ai/Le Chat — those are
      separate products with separate billing. Free tier is enough. Without it, chatbot
      silently falls through to the generic "couldn't find an answer" message whenever
      the keyword FAQ has no match.
- [ ] **Add `SUPABASE_SERVICE_ROLE_KEY` to `apps/admin/.env.local`** — required for the
      new staff creation flow (`/api/create-staff` route). Get value from Supabase dashboard
      → Project Settings → API → service_role key. Without it, "Add Staff" throws 500.
- [ ] Apply `supabase/verification_setup.sql` to the live DB if not already fully applied
      (`verification_requests` table exists but confirm `verify_citizen` RPC and
      `citizen-ids` storage bucket are also present).
- [ ] Test the verification flow end-to-end (mobile submit → admin approve).
      See [Plan-Verification-Feature](../Planning/Plan-Verification-Feature.md).
- [ ] ⚠️ **Enable leaked-password protection in Supabase Dashboard** — Authentication →
      Sign In / Providers → Password → "Leaked password protection" toggle. One click,
      ~2 minutes, zero risk, not reachable via SQL/migrations. Keeps getting deferred —
      do this before any real users sign up.

## 🟠 Next (high value)

- [ ] **Admin dashboard chart ideas, being done one at a time (user-directed):**
      real turnaround time — done above; still to build: barangay hotspot ranking
      (unresolved reports by barangay, no schema change needed), citizen
      ratings/feedback surface (`reports.rating`/`feedback` are captured on mobile
      but shown nowhere in admin — currently 100% unused real data), SLA-breach
      queue ("X reports overdue right now"), personnel workload chart (needs
      `service_requests.assigned_personnel` to actually be set when staff click
      "Start Processing" — it exists in the schema but nothing writes to it yet).
- [ ] ⏸️ **Pothole ML — explicitly DEFERRED, do not implement yet** (user direction,
      2026-07-03). The fake hardcoded values are gone; the model now plugs into ONE
      boundary: `apps/mobile/src/utils/mlAnalysis.ts` (on-device) or the API's
      `POST /reports/verify-image` (server-side), both currently returning
      null = "not analyzed". Admin's "AI Verified" badge lights up automatically
      once real `ml_confidence`/`ml_verified` are written — nothing else needs to
      change when this is picked back up. See
      [Plan-ML-Pothole-Detection](../Planning/Plan-ML-Pothole-Detection.md).
      If a usable model/dataset exists for the other categories (drainage, poles,
      stray pets), the same boundary supports them — pothole first.
- [ ] Reconcile model name: code says "YOLOv11", paper says "YOLOv8n".
- [ ] Decide audit logging: move into DB triggers (clients bypass the NestJS API).
- [ ] Replace client-generated reference numbers (`Math.random`) with DB sequences —
      DB side **done** (sequences + BEFORE INSERT trigger deployed 2026-06-30);
      mobile screens updated to omit `reference_number` and read it back via `.select()`.

## ✅ Done

- [x] **Dead PDF form generation removed** — `apps/api/src/pdf-generator.ts` and
      `generate-sample-pdfs.ts` deleted (2026-07-03), plus the `pdf-lib` dependency.
      It filled out municipal application forms server-side (birth cert, business
      permit, etc.) — legacy from before the eServices redesign: no in-app payment,
      checklist-only requirements, and pickup verification is QR-based, not a
      printed form. Never mounted as a live NestJS route; only referenced by the
      sample-generator script. Confirmed no other references anywhere in the
      codebase before deleting. Typechecks clean.
- [x] **Maps overhaul (facilities manager + report maps)** — Leaflet + OpenStreetMap
      (react-leaflet@4, React-18 compatible; no API key) added to admin. New shared map
      components in `apps/admin/src/components/map/` (dynamic-import barrel is the ONLY
      sanctioned import path — direct react-leaflet imports crash the build with
      "window is not defined"). New `/lgu/facilities` page: click-to-place pin + form
      (name/category/address/description/phone/image) + drag-to-reposition + delete;
      writes `lgu_facilities`, which the mobile MapExplorer already reads live (zero
      mobile changes — the map library is just a renderer, the DB is the sync layer).
      DB migration added `lgu_facilities.description` + `facility-images` storage bucket.
      Dashboard charts replaced by interactive report maps (LGU = town-scoped with
      popup links to /lgu/reports; super = all-LGU view-only, respects filter tabs);
      `components/ui/Chart.tsx` deleted. Reports detail panel: embedded location map +
      citizen verification badge (`users.verification_status`, works under RLS for LGU
      admins). Verified live: facilities CRUD round-trip against real DB, popups,
      legends, pin colors.
- [x] **Seed coordinates were wrong — reports were pinned in Batangas** — seeded
      reports sat at latitude ~13.92–13.93 (~23 km south of Liliw, wrong province);
      LGU centers/facilities were ~300–500m off the true poblacion. Fixed via migration
      `fix_seed_coordinates_liliw_nagcarlan` using PhilAtlas-verified anchors (Liliw
      poblacion ~14.131, 121.4365; Nagcarlan poblacion ~14.136, 121.4165): rebased all
      13 seeded reports into their actual towns with realistic scatter, snapped both
      `lgus` centers, repositioned all 10 facilities around the true centers (exact
      spots are best-effort — fine-tune with the Facilities Map drag tool). seed.sql
      synced; admin fallback constants updated; super-admin map defaults to the
      Liliw–Nagcarlan Laguna corridor (pilot scope — no other provinces). Verified
      live with screenshots: both pin clusters now sit on the correct towns.
- [x] **Demo Quick Login restored with passwords, without exposing them** —
      `apps/admin/src/app/page.tsx`'s three demo buttons previously only filled in the
      email (passwords were stripped as a security fix on 2026-06-30). Restored full
      one-click login, but through a new server-side route
      (`apps/admin/src/app/api/demo-login/route.ts`) instead of hardcoding passwords back
      into client code: the route reads passwords from **non-public** env vars, calls
      `supabase.auth.signInWithPassword` server-side, and writes the session cookie
      directly — the password value itself never reaches the browser. Verified by scanning
      every served JS bundle for the actual password strings and the env var names: clean.
      Also added real frontend validation (email format + required password, checked
      before any network call) to the manual login form; the actual security boundary
      remains Supabase Auth server-side, as it always was.
      **Gotcha hit and fixed:** first attempt used `NEXT_PUBLIC_`-prefixed env vars so the
      client-side quick-login buttons could read them directly — the auto mode classifier
      correctly blocked this before it went further, since `NEXT_PUBLIC_` vars are compiled
      into the client bundle and would be readable by anyone visiting a deployed copy of
      the login page, not just people with git access. Switched to the server-route
      design above instead.
      **Second gotcha:** the LGU_ADMIN demo password contains a `$` character
      (`hQt00bB5[1$C`). Next.js's built-in env loader (`@next/env`) performs `$VAR`-style
      variable expansion on `.env` values — unlike the plain `dotenv` package — so the
      password was silently truncated at load time and login failed with "Invalid login
      credentials" even though the credential itself was correct (confirmed via a direct
      Supabase Auth API call, bypassing Next.js entirely). Fixed by storing all three demo
      passwords base64-encoded (`_B64` suffix) in `.env.local`, decoded server-side in the
      route — base64 output only contains `[A-Za-z0-9+/=]`, which can't collide with the
      expansion syntax. **If a future password contains `$`, this is why it'll break.**
- [x] **Fixed unstable `showToast` in `useEffect` deps (5 files)** — `useToast()`
      returns a non-memoized function, so including it in an effect's dependency array
      caused an infinite refetch loop that silently overwrote typed form input. Fixed in
      `personnel/settings/page.tsx`, `super/settings/page.tsx`, `lgu/reports/page.tsx`,
      `lgu/news/page.tsx`, `lgu/services/page.tsx`, `lgu/settings/page.tsx`. (A parallel
      background session was also spawned for this; archived once this session's fix
      landed directly — same change, avoided a redundant/conflicting diff.)
- [x] **Role-based route guard added to `middleware.ts`** — previously only checked "is
      logged in," not "does this role belong on this route" (RLS already blocked the
      underlying data, so this closes the cosmetic gap, not a real breach). Added a
      role → allowed-path-prefix check (`/super` → SUPER_ADMIN, `/lgu` → LGU_ADMIN,
      `/personnel` → LGU_PERSONNEL); wrong role gets redirected to their own dashboard
      instead of seeing another role's page shell. Verified live via curl replicating the
      real `@supabase/ssr` cookie format for all 6 combinations (3 roles × wrong/correct
      route) plus the no-session case — all redirect exactly as expected.
- [x] **Supabase advisor security hardening** — pinned `search_path` on 8 functions
      (`check_forum_profanity`, `notify_report_status_change`, `notify_service_status_change`,
      `set_user_pending_on_request`, `verify_citizen`, `guard_verification_columns`,
      `generate_reference_number`, `touch_updated_at`) to close the
      `function_search_path_mutable` advisor warnings. Revoked needless `EXECUTE` grants:
      `rls_auto_enable` (event-trigger function) and `set_user_pending_on_request`
      (trigger function) should never be called directly via RPC — Postgres already
      blocks direct invocation of both outside their proper trigger context regardless of
      grants, so this is hygiene, not a live hole. `verify_citizen` (approve/reject
      verification) already self-checks the caller's role internally (confirmed by
      reading the function body — a non-admin gets `'Not authorized to review this
      request.'`), but its `anon` execute grant was still revoked as defense-in-depth.
      **Gotcha hit twice:** revoking `EXECUTE ... FROM anon` alone didn't work — each
      function also had an implicit `PUBLIC` grant that `anon`/`authenticated` inherit
      from regardless of a per-role revoke; had to `REVOKE ... FROM PUBLIC` too. Verified
      live: anon calling `verify_citizen` via REST now gets a clean `401 permission
      denied` before reaching the function body; a real LGU admin call still succeeds
      (`204`); the `set_user_pending_on_request` trigger still fires correctly on a real
      insert (trigger execution bypasses the EXECUTE check entirely — expected Postgres
      behavior). One item left requiring manual action — see 🟠 Next.
- [x] **Closed `users` table PII leak (RLS)** — the SELECT policy was
      `auth.uid() IS NOT NULL`, meaning *any* logged-in account (including citizens on
      mobile) could read every row of `public.users` — every name, email, barangay, role
      across all LGUs. Traced all 17 files reading `users` in the codebase: every read is
      either "own record" or a super-admin/LGU-admin page already covered by the existing
      `ALL`-command management policies. Replaced the blanket policy with
      `USING (auth.uid() = id)` for SELECT. Verified live via the REST API with real
      accounts: personnel now gets 1 row (self) instead of the whole table; LGU admin
      still sees their own LGU's 2 staff and is blocked from Nagcarlan; super admin still
      sees all 5 existing users. Checked for the same pattern elsewhere — the three other
      `USING (true)` SELECT policies (`chatbot_faqs`, `lgu_facilities`, `lgus`) are
      legitimately public reference data, not PII, left as-is.
- [x] **Real turnaround time replacing fake "2.0 days"** — `reports`/`service_requests`
      got a real `updated_at` column + `BEFORE UPDATE` trigger (auto-stamped on every
      status change, mirrors the `reference_number` trigger pattern). New shared helper
      `apps/admin/src/lib/turnaround.ts` computes actual average days-to-resolve from
      `updated_at - created_at` on Resolved/Released rows. Wired into `super/page.tsx`
      and `super/lgus/page.tsx` leaderboard tables. Currently shows "0.0 days" for seed
      data (accurate — seed rows never went through a real transition); will show real
      durations once admins actually resolve reports through the UI going forward.
- [x] **Admin mock data removed** — `UserMenu.tsx` showed hardcoded "Admin User" (now
      fetches real name/email like `Sidebar.tsx` already did); `personnel/settings/page.tsx`
      showed a fabricated "Ana Reyes" profile with Save buttons that only toasted without
      writing to Supabase (now loads/saves real `users.name`/`email`/`notification_preferences`,
      password change wired to `supabase.auth.updateUser`); dead unused "Add LGU" modal
      state (`handleAddLgu`, `showAddModal`, etc.) removed from `super/page.tsx` — the real
      Add LGU flow at `/super/lgus` was already correctly wired and untouched.
- [x] **Admin auth completely broken, now fixed** — `middleware.ts` (added 2026-06-30)
      checked for a session cookie, but the admin's Supabase client only persisted
      sessions to `localStorage`, so every login bounced straight back to `/` on the next
      request. Fixed by switching `lib/supabase.ts` to `@supabase/ssr`'s
      `createBrowserClient` (drop-in replacement) and rewriting `middleware.ts` to use
      `createServerClient` + `supabase.auth.getUser()`. Tested live for all three roles
      (Super Admin, LGU Admin, LGU Personnel): login, route-guard blocking, and sign-out
      all confirmed working end-to-end in the browser.
- [x] **Chatbot LLM fallback swapped Gemini → Mistral** — `ChatbotController.askChatbot`
      now uses `@mistralai/mistralai` (`mistral-small-latest`) instead of Gemini when the
      keyword FAQ has no match. Reason: user's Gemini account hit an account/region
      restriction. Same guardrail design carried over 1:1 (system message, role-tagged
      history, JSON output, redirect allowlist). Forum AI moderation is untouched — still
      Gemini, separate code path, out of scope for this change. ⚠️ Requires
      `MISTRAL_API_KEY` in `apps/api/.env` (from admin.mistral.ai/organization/api-keys —
      **not** the Le Chat subscription, which gives no API access).
- [x] **Staff login fixed** — `lgu/settings/page.tsx` now calls `/api/create-staff`
      (NestJS-style Next.js Route Handler using service role key) which creates a real
      Supabase Auth user + `users` profile row atomically. Old flow created only a `users`
      row with a random UUID, so staff could never log in.
      ⚠️ Requires `SUPABASE_SERVICE_ROLE_KEY` in `apps/admin/.env.local`.
- [x] **Admin `middleware.ts` added** — guards `/lgu/:path*`, `/super/:path*`,
      `/personnel/:path*`; checks for `sb-<project_ref>-auth-token` cookie and redirects
      unauthenticated requests to `/` (login page).
- [x] **Dead admin code deleted** — `src/app/lgu/page.tsx` trimmed to redirect-only (300+
      lines of dead mock-data code removed); `LGUAdminLogin.tsx` and `SuperAdminLogin.tsx`
      deleted entirely.
- [x] **Demo credentials stripped** — `apps/admin/src/app/page.tsx` DEMO_USERS no longer
      contains passwords; quick-fill buttons now pre-fill email only (passwords must be
      typed manually or moved to `.env.local`).
- [x] **`UserMenu.handleSignOut` fixed** — added `await supabase.auth.signOut()` before
      `router.push('/')`, matching the correct pattern already in `Sidebar.tsx`.
- [x] **React Hooks violations fixed** — removed `useBottomTabBarHeight()` inside
      `try/catch` from `ChatbotScreen.tsx` and `ForumScreen.tsx`; `tabBarHeight` was unused
      in both (SafeAreaView handles bottom inset via `edges`). Also removed now-unused imports.
- [x] **Report map bug fixed** — `TrackingDetailScreen.tsx` read `data.location.lat/lng`
      but `reports` table has flat `latitude`/`longitude` columns (no `location` JSONB).
      Now reads `data.latitude` / `data.longitude` with correct guard `data.latitude && data.longitude`.
- [x] **Liliw hardcoding removed** — geofence boundary check in `ReportsScreen.tsx`
      now uses `selectedLgu.latitude/longitude` directly (skips check if null) and shows
      `selectedLgu.name` in the error message instead of the literal string "Liliw".
- [x] **Reference number sequences deployed** — DB migration `reference_number_sequences`
      creates `reports_ref_seq` / `service_requests_ref_seq` and a `BEFORE INSERT` trigger
      on both tables. Format: `REP-YYYY-NNNN` / `REQ-YYYY-NNNN`. Mobile screens updated:
      `reference_number` removed from insert payload; response read via `.select('reference_number').single()`.
- [x] **Chatbot security hardened (Gemini)** — guardrails moved to `systemInstruction`,
      user query + history passed as role-separated `contents` (not interpolated),
      client history sanitized (cap 6 turns / 500 chars), Gemini `safetySettings` +
      `maxOutputTokens`, output `redirect.screen` validated against an allowlist.
      Fixes prompt injection / forged-history / cost-abuse / unvalidated-navigation.
- [x] **Global `ValidationPipe` added to API `main.ts`** — DTO validators were inert
      before (no pipe). Now `whitelist` + `forbidNonWhitelisted` + `transform`; chatbot
      DTO caps `query` (500) and `history` (20).
- [x] **RAG artifacts removed** — dropped `faq_embeddings`, `match_faqs` RPC, and the
      `vector` extension from the live DB + `schema.sql` (verified unused: 0 rows, no
      refs, RPC never called). Chatbot is keyword FAQ + Gemini by design.
- [x] **FAQ content enhanced** — `chatbot_faqs` 3 → 13 realistic, plain-language citizen
      FAQs per LGU (seed.sql + live DB); mobile welcome suggestions updated to match.
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

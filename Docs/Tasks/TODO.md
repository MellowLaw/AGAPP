# AGAPP — To-Do

> **Updated:** 2026-07-06 · Living list. Synthesized from the
> [Codebase-Audit](../Audits/Codebase-Audit.md) and current work.

## 🔴 Now (active)

- [x] **Simplified ID verification: dropped back-of-ID capture and the
      two-shot "blink twice" liveness check (2026-07-17)**, per explicit
      request. Single front-only ID photo + single selfie now. Removed:
      `id_back` step/state/handlers, `requiresBack` from `ID_TYPES`,
      `POST /api/verification/check-liveness` (was never wired to a real
      vendor anyway), and the `id_document_back_path`/`liveness_passed`/
      `liveness_checked_at` columns. `submit_verification_request()` RPC back
      to its original 5-arg signature (migration
      `simplify_verification_drop_back_photo_and_liveness`, live-verified
      exactly one overload remains). **New:** citizen ID + selfie photos are
      now deleted from `citizen-ids` storage right after an LGU admin
      approves/rejects a request (data-minimization; needed a new storage
      DELETE policy for LGU_ADMIN/SUPER_ADMIN, migration
      `add_staff_delete_policy_citizen_ids` — previously only the file owner
      could delete). See `Plan-ID-Verification-Redesign.md`'s "Simplified
      2026-07-17" section.
- [ ] **One pre-existing test verification request still has live photos in
      storage** (rejected, `nagcarlan-laguna`, from before the auto-delete
      change above) — not retroactively purged; ask before deleting real
      stored files without an explicit go-ahead.
- [ ] **Device-test the simplified ID verification flow (2026-07-17)** — single
      front ID photo + single selfie, OCR autofill, and the atomic submit RPC
      end-to-end on a real phone; plus the still-open guide-box/output
      alignment issue from the prior device-test round. See
      `Plan-ID-Verification-Redesign.md`'s Verification section.
- [ ] **Device-test the reporting overhaul (2026-07-06)** — camera-only capture, automatic
      GPS with denied/loading states, and the stamped-photo review step were all built and
      typecheck clean, but never run on a physical device/simulator (none available in this
      environment). See `Plan-Reporting-Camera-GPS-Hardening.md`'s verification section for
      the exact checklist (camera-only, GPS auto-fetch + Settings button, stamp preview/
      retake/confirm, submitted photo caption matches DB coordinates).

- [ ] **Add `SUPABASE_SERVICE_ROLE_KEY` to `apps/admin/.env.local`** — required for the
      staff creation flow (`/api/create-staff` route). Get value from Supabase dashboard
      → Project Settings → API → service_role key. Without it, "Add Staff" throws 500.
      _(2026-07-04: user believed env was fully configured — checked the file directly;
      this key is genuinely still absent from `.env.local`. `MISTRAL_API_KEY` in the api
      app IS present — that one's done.)_
- [ ] Test the verification flow end-to-end (mobile submit → admin approve).
      See [Plan-Verification-Feature](../Planning/Plan-Verification-Feature.md).
- [ ] ⚠️ **Enable leaked-password protection in Supabase Dashboard** — Authentication →
      Sign In / Providers → Password → "Leaked password protection" toggle. One click,
      ~2 minutes, zero risk, not reachable via SQL/migrations. Keeps getting deferred —
      do this before any real users sign up.

### From the 2026-07-06 security checklist review (remaining items)
- [ ] **Finish mobile password reset** — the flow sends the email (`resetPasswordForEmail`)
      but is called with no `redirectTo` and there's no deep-link handler, so the link
      opens a web page, not the app. Needs a Supabase Auth redirect URL + an app deep-link
      scheme (`app.json` + a handler) — requires a real build to test end-to-end.
- [ ] **Set `ALLOWED_ORIGINS` in `apps/api/.env` for production** — CORS is now
      env-configurable (defaults to open + a startup warning). Set it to the deployed
      admin origin before going live. (Mobile is React Native / not CORS-bound.)
- [ ] **"Approaching rate limit" indicator (optional UX)** — the API now returns 429 when
      throttled; the mobile/admin clients could surface a friendly "slow down" message on
      429 (and, if wanted, read the rate-limit headers to show remaining quota). Small,
      client-side, low priority.
- [ ] **Input-validation polish (not a security gap)** — injection is already impossible
      (parameterized supabase-js + React output escaping, no `dangerouslySetInnerHTML`);
      remaining work is consistent length/format validation across forms for data quality.
- [ ] **Error monitoring (optional)** — no Sentry/APM today. A free Sentry project + SDK in
      mobile/admin/api would give crash/error visibility for the defense; not load-bearing.
      (Infra logs — Postgres/Auth/API — are already available in the Supabase Dashboard.)
- See the full checklist assessment in the conversation / `Sweep-2026-07-06-Findings.md`
      neighborhood; phone-login is captured separately in `Plan-Phone-Login-SMS.md`.

## 🟠 Next (high value)

- [ ] **Finish sweep §1: move ML writes server-side** — the forcing triggers now stop
      status/tenant/identity/pickup forgery, but `ml_verified`/`ml_confidence` are still
      written client-side and thus forgeable (a citizen can fake the AI-verified badge).
      Fix: have the `verify-image` API endpoint (service role) write them to the report
      after insert, and force them NULL on client inserts. Needs API + mobile flow change
      — deferred deliberately so the working ML badge isn't degraded before the server
      path exists. See `Sweep-2026-07-06-Findings.md` §1.
- [ ] **Sweep §4/§5 backlog (remaining)** — client-only submission cooldown (bypassable),
      pre-checked RA 10173 consent checkbox, office-backed assignment (part of the personnel
      trio). Storage path-ownership, `verify-image` URL validation, and audit-log writing
      are now DONE (see below). Ranked in `Sweep-2026-07-06-Findings.md` §4–§5.
- [ ] **Run `npm install` in `agapp-system/`** — prunes the deleted field-officer from
      `package-lock.json` (and the removed Gemini dep). Cosmetic; do it next time you're
      installing anyway.
- [ ] **Personnel-web trio (pending user go/no-go)** — real assignment + internal
      notes + attach resolution proof; the manuscript's Fig. 34 / UAT Table 3 promise
      these exact features. Full breakdown in `Plan-Personnel-and-FieldOfficer.md`.

- [ ] **Admin dashboard chart ideas, being done one at a time (user-directed):**
      real turnaround time — done above; still to build: barangay hotspot ranking
      (unresolved reports by barangay, no schema change needed), citizen
      ratings/feedback surface (`reports.rating`/`feedback` are captured on mobile
      but shown nowhere in admin — currently 100% unused real data), SLA-breach
      queue ("X reports overdue right now"), personnel workload chart (needs
      `service_requests.assigned_personnel` to actually be set when staff click
      "Start Processing" — it exists in the schema but nothing writes to it yet).

## ✅ Done

- [x] **ID verification redesign built (2026-07-06, DB+API by me, mobile UI via
      subagent, all independently re-verified)** — `Plan-ID-Verification-Redesign.md`
      implemented end-to-end. **DB** (`verification_setup.sql`, applied + synced):
      `verification_requests` gained `id_document_back_path`, `liveness_passed`
      (nullable, never fabricated — same tri-state convention as `reports.ml_verified`),
      `liveness_checked_at`; `submit_verification_request` RPC extended to 7 args
      (old 5-arg overload dropped to avoid PostgREST resolution ambiguity — confirmed
      exactly one overload exists live). **API** (`app.controllers.ts`, `tsc` clean):
      two new guarded endpoints mirroring `verify-image`'s exact pattern — a shared
      `isOwnStorageUrl()` helper (refactored out of the existing pothole/stray-pet
      check) now validates EITHER public-bucket URLs or signed private-bucket URLs;
      `extract-id-text` (OCR.space, needs `OCR_SPACE_API_KEY`, returns `{text:null}`
      gracefully without it) and `check-liveness` (intentionally stubbed pending a
      vendor decision, always `{analyzed:false, passed:null}`, never blocks). Caught
      and fixed one real bug before the mobile side was built against it: the first
      draft of `isOwnStorageUrl` only recognized public URLs, but `citizen-ids` is a
      PRIVATE bucket — would have rejected every real OCR/liveness call; fixed to
      also accept signed URLs, restricted per-endpoint to the `citizen-ids` bucket
      specifically. **Mobile** (`VerifyIdentityScreen.tsx` reworked, new
      `GuidedCapture.tsx` component, `ID_TYPES` gained `requiresBack`): new step order
      ID front → ID back (conditional) → Residency (OCR-prefilled ZIP + seeded street
      address) → Selfie (two-shot liveness, second shot canonical, first shot
      best-effort deleted after the liveness call) → Review; `GuidedCapture` is a
      reusable full-screen camera + SVG true-cutout guide overlay (card ratio for ID,
      oval for face) + auto-crop (`expo-image-manipulator`, inverting the camera's
      "cover" fit to map the on-screen guide back to photo-pixel space) + Retake/Use-
      this-photo review — camera-only throughout, no gallery option anywhere in the
      new flow. Independently re-verified (not just trusting the subagent's report):
      re-ran `tsc --noEmit` myself (clean), confirmed `react-native-svg` was an
      already-hoisted dependency (not a new/missing one), read `GuidedCapture.tsx` and
      the final RPC call site directly to confirm the crop math and the 7-parameter
      wiring were actually correct. **Not device-tested — see 🔴 Now above.**
- [x] **Fixed: misleading "municipality doesn't match your account" verification-submit
      error (2026-07-06)** — the mobile client did two separate requests (an `UPDATE
      users.lgu_id` "sync", trusting `error: null` without checking a row actually
      changed, then a separate `INSERT verification_requests` whose RLS re-reads
      `users.lgu_id`) — a race/staleness window that could throw an opaque RLS 42501,
      which the client then guessed was always an LGU mismatch (sometimes masking a
      different real cause). Checked live DB state first (no lingering pending rows/bad
      statuses, ruling out the "duplicate pending request" theory) before concluding
      this was the real bug class. Fixed with a new `submit_verification_request()`
      SECURITY DEFINER RPC (`verification_setup.sql`, applied live) that does the LGU
      sync + insert atomically and raises a specific message per actual failure
      (already pending / already verified / invalid LGU / missing photos) instead of a
      generic policy-violation guess. `VerifyIdentityScreen.tsx` now calls the RPC
      instead of two sequential writes; `tsc --noEmit` clean. The bigger redesign asked
      for alongside this (ID-first OCR autofill, custom selfie camera, blink-twice
      liveness) is planned separately in `Plan-ID-Verification-Redesign.md` — it needs
      real vendor/architecture decisions (OCR approach, and the Expo-Go-vs-dev-client
      tradeoff for liveness detection) before writing code.
- [x] **Mobile audit fixes — verification enforcement + perf + dead code (2026-07-06,
      subagents + DB)** — from the mobile flow/security/optimization audit. **Server-side
      (migration `verification_enforcement_cooldown_cancel`, verified, `schema.sql` synced):**
      the #1 finding — verification was enforced client-side ONLY — is closed: the
      report/request guard triggers + new forum post/comment guard triggers now RAISE if the
      caller isn't `verified` (matches the app's gates; blocks raw-REST bypass) and add a 90s
      submission-cooldown backstop; confirmed all active/demo citizens are `verified` so legit
      submits still work. Also: profanity trigger now scans the post **title** (was
      content-only); `cancel_report`/`cancel_request` RPCs + a `'Cancelled'` status let a
      citizen withdraw their own still-Submitted item. **Mobile (2 subagents, both `tsc`
      clean):** forum fetch bounded (`.limit(50)`) + realtime refetch debounced (was
      full-refetch on every event); wired the fake "copy link" (expo-clipboard) and removed
      the fake "follow" bell; notifications `.limit(50)`; chatbot redirect re-validated
      client-side; sign-out now nulls `expo_push_token`; Profile "Privacy notice"/"Help" now
      open real modals + removed the fake GPS-consent toggle; password min 6→8; ML timeout
      15s→8s + "Checking photo…" label; upload-failure keeps data + retry; invalid
      tracking/news id shows an empty state (was blank); Withdraw buttons on own Submitted
      reports/requests. Full `apps/mobile` `tsc --noEmit` clean.
- [x] **Super Admin overhaul: full-PH onboarding + comparison charts + needs-attention
      (2026-07-06, orchestrated with subagents; verified live in the browser)** — 4 phases:
      **(1) Foundation:** `lgus` got nullable `region`/`province` columns (migration +
      `schema.sql` + shared `LGU` type, rebuilt); fixed the load-bearing id↔name round-trip
      bug so wizard-added LGUs resolve correctly (login redirect now prefers the DB name
      when it slugifies back to the id; `NotificationBell` prefers the URL `?lguName=`) —
      the old hardcoded `ID_TO_NAME` map only knew the 2 seeded LGUs.
      **(2) Full-PH location picker:** new `apps/admin/src/data/ph-locations.ts` — a
      static MIT-licensed PSGC dataset (17 regions, 82 provinces, 1,634 cities/municipalities;
      source cited in the file header; NCR handled as "Metro Manila"; no coords in source so
      lat/lng stay 0 → set via Configure). Replaced the hardcoded 5-town `MUNICIPALITY_OPTIONS`
      dropdown in `super/lgus/page.tsx` with a **4-step onboarding wizard** (Location →
      Branding → optional First-Admin → Review): cascading Region→Province→City selects,
      derives `name="City, Province"` + id, blocks duplicates; optional first-admin step
      POSTs `/api/create-staff` (`LGU_ADMIN`) — **needs `SUPABASE_SERVICE_ROLE_KEY`**, and a
      failure there doesn't roll back the LGU (skippable).
      **(3) Comparison charts (Recharts 3.9.2, React-18 verified):** new
      `apps/admin/src/components/charts/*` — LGU ranking bars with a metric toggle
      (reports/requests/users/avg-response), status-breakdown stacked bars (reuses
      `markers.ts` STATUS_COLORS), and a reports-vs-requests trend line on `/super/analytics`.
      Fed from already-fetched data (no new queries); leaderboard table + CSV kept below.
      **(4) Cross-LGU "Needs attention" panel** on `/super`: aggregates `importantNotices`
      aging logic across all LGUs (overdue/stale reports+requests) + flags LGUs inactive 14+
      days.
      Verified live (super-admin demo login): dashboard renders all charts + the panel
      ("15 flagged", Nagcarlan inactive) with zero console errors (recharts didn't introduce
      a 2nd React instance); the wizard's picker cascades correctly (CALABARZON → 5 provinces
      → Laguna → all 30 real municipalities). Full `apps/admin` `tsc --noEmit` clean.
      Design plan: `~/.claude/plans/encapsulated-gliding-reddy.md`.
- [x] **TODO cleanup pass — storage + verify-image hardening, stray-pets UI (2026-07-06)** —
      knocked out the doable open items via subagents + DB. **Storage path-ownership** (DB,
      sweep §4): `report-photos`/`service-attachments` uploads pinned to the uploader's own
      UID folder, `facility-images` to the admin's own LGU (super-admin exempt) — verified
      the deployed policy text matches the real upload paths (`${uid}/…`, `${lguId}/…`), so
      legit uploads pass and cross-folder writes are blocked; `storage_setup.sql` synced.
      **verify-image URL validation** (API subagent, `tsc` clean): rejects any `photoUrl`
      not under this project's Supabase storage (quota-abuse guard), trailing-slash edge
      handled. **Stray-pets "Last Seen" UI** (mobile+admin subagent, both `tsc` clean):
      `Plan-StrayPets-Reporting.md` v1 items 1+3 — stray_animal reports now show "Last
      Seen: [barangay] · [relative time]"; shared `timeAgo`/`getRelativeTime` helpers
      lifted to lib/util; strictly gated on the raw `stray_animal` category so other
      categories render byte-for-byte unchanged; plan doc marked v1-complete. **Stale items
      removed:** YOLOv11 reconcile (0 refs left), audit-logging "decide" (implemented this
      session), reference-number sequences (already done). **Deferred (documented, not
      churned):** ML server-side write refactor (risky to the working badge), personnel
      trio (needs go/no-go), dashboard charts (user-directed), mobile reset deep-link
      (needs a build + dashboard config), Sentry (needs a DSN).
- [x] **Security-checklist hardening — 5 fixes (2026-07-06, orchestrated w/ subagents)** —
      from the user's checklist review. **(1) API rate limiting + CORS** (subagent, `tsc`
      clean): `@nestjs/throttler@6.5.0` caps the two paid endpoints — chatbot 20/min,
      verify-image 10/min (→ 429) — protecting Mistral/Roboflow quota; CORS is now an
      env allowlist (`ALLOWED_ORIGINS`, defaults open + startup warning; set it in prod).
      **(2) Audit logging** (DB, verified live): exception-safe `AFTER UPDATE` triggers on
      `reports` + `service_requests` write actor (auth.uid()→users email/role) + status
      from→to to `audit_logs` — the RA-10173 trail the manuscript promises, finally
      populated; the EXCEPTION handler guarantees a failed audit write can't roll back the
      real update; `schema.sql` synced. **(3) Admin "Forgot password?"** (subagent, `tsc`
      clean): was a dead `href="#"`, now a real button → `resetPasswordForEmail` with the
      existing banner for success/error feedback. **(4) Mobile themed toast** (subagent,
      `tsc` clean): new `src/components/Toast.tsx` (`ToastProvider` + `useToast`, animated,
      themed, variant success/error/info), mounted inside ThemeProvider→AuthProvider so
      `useTheme`/`useSafeAreaInsets` resolve; 49/51 native `Alert.alert` calls across 7
      screens converted — the 2 multi-button confirmations (location-required, sign-in-
      required) correctly kept as `Alert` since a toast can't carry actions. **(5) Assessed
      the rest:** data isolation (RLS/UUID-lock) confirmed sound; injection already
      impossible (parameterized supabase-js + React escaping, no `dangerouslySetInnerHTML`);
      API confirmed JWT-guarded (not world-open). Remaining smaller items (mobile reset
      deep-link, prod CORS origin, 429 UX indicator, validation polish, optional Sentry)
      logged under 🔴 Now. Phone-login captured as a future plan (`Plan-Phone-Login-SMS.md`).
- [x] **Sweep §2 SELECT scoping + §3 rating applied + verified (2026-07-06)** — migration
      `sweep_select_scoping_and_rating` (`patches/002_...sql` + `schema.sql` synced).
      `reports` read split into own-rows (citizens) + LGU-scoped (staff) — closes the
      PII/cross-citizen leak without blanking the admin pages; `lgu_services` draft reads +
      `forum_posts`/`forum_comments` approved reads scoped to the caller's LGU; new scoped
      `rate_report` SECURITY DEFINER RPC replaces the mobile's silently-failing direct
      rating `.update()` (`TrackingDetailScreen.tsx` wired to `rpc('rate_report')`, checks
      error; `tsc` clean). **Verified before trusting it** via role-simulated reads through
      the Supabase MCP (`SET LOCAL role authenticated` + jwt claims, rolled-back tx) on real
      data: Liliw admin still sees all 11 Liliw reports + 0 cross-LGU; citizen Jechris sees
      only their own 1 report, 0 leaked. Forum stays LGU-scoped + own-posts visible.
- [x] **Sweep fixes applied — insert-forgery guards + 3 code fixes (2026-07-06)** — from
      `Sweep-2026-07-06-Findings.md`. **§1 (live migration `guard_citizen_insert_forgery`):**
      BEFORE INSERT forcing triggers on `reports` + `service_requests` — pin
      `citizen_id`/`lgu_id`/`citizen_name`, force `status='Submitted'`, null the lifecycle
      columns (Resolved / claim_code / released_* forgery), gated on `auth.uid() IS NOT NULL`
      so seed/service-role inserts pass through. No-op for the legit app (verified the
      mobile insert payloads match every forced value), only forged fields get overwritten;
      triggers confirmed installed + enabled; `schema.sql` synced. **ml_verified/ml_confidence
      deliberately left forgeable** (still client-written) — closing that needs the
      server-side-write refactor, kept as an open item so the working ML badge isn't broken
      first. **§3 code fixes (sub-agent, `tsc` clean):** CSV formula-injection escaping on
      the admin reports export; `.select('id')` guards so silent 0-row admin updates stop
      showing false "success"; API auth guard fails **closed** on missing env instead of
      open. **§2 SELECT scoping + rating RPC staged** (not applied — gates reads, needs
      in-app verify) in `patches/002_...sql`. `verify_geofence` confirmed dead code.
- [x] **Field-officer app deleted + create-staff regression fixed (2026-07-06)** — cut
      per the earlier decision (`Plan-Personnel-and-FieldOfficer.md`): `git rm` of the
      whole `apps/field-officer/` workspace + its orphaned `.env`; CLAUDE.md/memory/docs
      updated; `lookup_claim_code`/`release_service_request` RPCs kept (admin web uses
      them); `npm install` still needed to prune the lockfile (see above). **Also fixed a
      CRITICAL self-inflicted regression found by the same-day sweep:** the
      `handle_new_citizen_signup()` trigger added earlier today fired on the admin
      create-staff route's `admin.createUser()` too, inserting a CITIZEN row that made
      the route's own insert duplicate-key-fail → every staff creation 500'd. Fixed
      (migration `fix_signup_trigger_skip_staff`): trigger now skips when `role` is in
      `user_metadata` (staff path) and only runs for genuine citizen signup. `schema.sql`
      synced; verified live.
- [x] **Reporting flow hardened: camera-only, automatic GPS, stamped photo (2026-07-06)**
      — `Plan-Reporting-Camera-GPS-Hardening.md` implemented in sequence in
      `ReportsScreen.tsx`. (1) **Camera-only:** deleted `choosePhoto()`/gallery picker
      entirely — only a live camera capture is accepted, closing the "upload an old/fake
      photo" exploit. (2) **Automatic GPS:** `useFocusEffect` fetches location on mount +
      every re-focus (no more tap-to-fetch); a tri-state status card shows fetching/locked/
      denied, with a **Settings** button (`Linking.openSettings()`) on denial; submit
      explains and retries instead of silently failing. (3) **Stamped photo:** installed
      `react-native-view-shot` (dropped `expo-image-manipulator` from the original plan —
      it can't draw text, so it wasn't actually needed); built an **on-screen** review step
      (photo + caption bar for reverse-geocoded place/coordinates/timestamp, with Retake/
      Use-This-Photo buttons) rather than the originally-planned off-screen hidden capture,
      since an unrendered view is a known source of blank-image bugs in that library — this
      is also a small UX upgrade (a natural confirm step). `takePhoto()` refuses to open the
      camera at all until GPS is locked, so a stamp can never be created without real
      coordinates; a failed capture falls back to the unstamped photo instead of leaving the
      submit button dead. Framing note carried into the plan doc: the stamp is documentary/
      reviewer-convenience, not a security control — the real anti-fraud chain is
      camera-only + live GPS + the existing 15km geofence + the ML check.
      Verified: `tsc --noEmit` clean (exit 0) after every step; confirmed `captureRef`'s
      actual installed type signature accepts a `RefObject` directly; full read-through for
      dangling references and stale-closure risks. **Not yet run on a physical device/
      simulator** (none available this session) — see the 🔴 Now item above.
- [x] **Fixed three mobile bugs from co-dev's iOS test run (2026-07-06)** — user
      reported (via Expo logs screenshot): citizen account creation broken, iOS map
      pins not loading, and a nav crash, then asked to check login/logout too.
      1. **Signup broken (`42501` RLS error).** `LoginScreen.tsx`'s `handleRegister`
         inserted the `public.users` profile row client-side immediately after
         `auth.signUp()`, with no check for whether a session actually existed yet.
         Any gap before one does (email confirmation enabled, or just propagation
         lag) means the insert runs as anon — `auth.uid() = id` in the INSERT policy
         evaluates false since `auth.uid()` is null for anon, hence
         `new row violates row-level security policy for table "users"`. Fixed the
         root cause, not just the symptom: moved profile creation into a
         `SECURITY DEFINER` trigger `handle_new_citizen_signup()` on `auth.users`
         (migration `citizen_signup_profile_trigger`, applied live + `schema.sql`
         synced) — atomic with the auth row, immune to RLS/session timing
         regardless of email-confirmation settings. Confirmed the guard trigger
         `guard_verification_columns` only fires on `UPDATE`, not `INSERT`, so no
         conflict. `LoginScreen.tsx` now passes `full_name` via `signUp()`'s
         `options.data` (trigger reads it) and no longer inserts `users` itself;
         also fixed the success message to distinguish "account created" (session
         present) from "check your email to confirm" (session null) instead of
         always claiming success.
      2. **Guest tapping the Home notification bell crashed the navigator**
         (`The action 'NAVIGATE' with payload {"name":"Notifications"} was not
         handled by any navigator`). Root cause: `HomeScreen.tsx`'s bell button had
         no session check, but `AppNavigator.tsx` only registers the
         `Notifications` screen in the branch where `session && selectedLgu` are
         both truthy — guests hit a screen that doesn't exist in their tree. Fixed
         by gating the bell the same way every other tab already does (`AuthGate`
         pattern): guests get a "Sign in to view your notifications" prompt instead
         of a crash.
      3. **iOS map showed no pins.** `MapExplorerScreen.tsx` read only `selectedLgu`
         (set after login+profile) despite the Map tab being intentionally
         guest-accessible per `AuthGate`'s own copy ("browse Home, News, and the Map
         without an account"). No `guestLgu` fallback meant `facilities` never
         fetched for a guest — likely the same root cause as bug #1 in the actual
         test session (broken signup → no profile → guest state → empty map, not a
         platform-specific Apple Maps rendering bug). Fixed by adding the same
         `activeLgu = selectedLgu || guestLgu || {...fallback}` pattern already
         established in `HomeScreen.tsx`, replacing every `selectedLgu` reference
         in the file's facilities fetch, region/boundary calculation, and header
         title.
      4. **Login/logout checked and confirmed working** — `handleLogin`
         (`signInWithPassword`) and `AuthContext.signOut()` (`supabase.auth.signOut()`
         + full local state reset) were both already correct; not part of the bug.
      Verified: `tsc --noEmit` clean in `apps/mobile` after all three fixes; the new
      trigger confirmed live via `pg_trigger` (`tgenabled = 'O'`).
- [x] **Fixed: `super/lgus` "Add LGU" used a different, buggy hand-rolled slugify
      (2026-07-06)** — found while re-verifying the 2026-07-05 security sweep's claim
      that "six admin pages" were all converted to `lguIdFromName()`. A seventh spot,
      `apps/admin/src/app/super/lgus/page.tsx`'s `handleAdd()`, was missed: it derived
      the new LGU's id with `name.split(',')[0].toLowerCase().replace(/\s+/g,'-')`,
      which drops everything after the first comma. For `"Pila, Laguna"` this produced
      `"pila"` and wrote that as the literal `lgus.id` primary key — inconsistent with
      `lguIdFromName()`'s `"pila-laguna"` used by every other lookup in the app, which
      would have silently broken that LGU's data (reports/requests/facilities queries
      scoped by `lgu_id`) the moment someone added a new municipality through this
      screen. Fixed by importing and using `lguIdFromName()` like the other six pages.
      Not a security issue — a data-consistency bug. Verified: `tsc --noEmit` clean;
      confirmed the id-generation logic directly (`Pila, Laguna` → `pila-laguna` etc.
      for all 5 addable municipalities) since no super-admin browser session was
      available to click through the live form.
- [x] **Fixed: ML "not detected" result was invisible in both admin report views
      (2026-07-06)** — user tested a real pothole report after the ML rollout below and
      saw no AI indicator at all, reported as "still no implementation of the ai/ml."
      Root cause wasn't the backend: a direct DB query showed the tested report
      (`REP-2026-1009`) had `ml_confidence=0, ml_verified=false` — proof Roboflow had
      actually run (a genuine not-analyzed row is `null`/`null`, not `0`/`false`); the
      test photo just scored 0% confidence, a model/threshold question, not a wiring
      one. The actual bug: both `lgu/reports/page.tsx` and `personnel/reports/page.tsx`
      only rendered the AI badge when `ml_verified === true` — `false` (model ran,
      found nothing) and `null` (model never ran) both showed nothing, so a working
      negative result was indistinguishable from the feature not existing. Fixed:
      badge is now tri-state (green "AI Verified — {pothole/animal} detected (N%)" /
      amber "No {pothole/animal} detected — review photo" / nothing for `null`) in
      both files via a shared `ML_SUBJECT_LABEL` map. `personnel/reports/page.tsx` also
      had **no photo and no AI badge at all** before this — added both, it previously
      only fetched category/location/status. Verified: `tsc --noEmit` clean in
      `apps/admin`; confirmed live via an authenticated personnel-session browser
      check that `REP-2026-1009` now shows its photo + the amber badge.
- [x] **Stray-pets ML: deployed, wired, and VERIFIED LIVE (2026-07-06)** — no
      training needed (stock COCO-pretrained YOLOv8n already detects dog/cat).
      Deployed the stock `yolov8n.pt` to Roboflow Hosted as a vessel project
      (`mrlaws-workspace/agapp-stray-pets`, version 2) — most of the Roboflow-side
      setup (create project, upload+annotate 10 filler images, generate version,
      set active model) was automated directly via the Roboflow MCP; the only
      user-run step was a 3-cell Kaggle notebook to download the stock weights and
      call `deploy()`. `apps/api` `verify-image` refactored to a small `ML_MODELS`
      map keyed by category: pothole uses its single-class model (any detection =
      valid); `stray_animal` calls the COCO model and **keeps only `dog`/`cat`
      predictions** (people/cars in a stray photo don't validate it — the anti-troll
      check). `apps/mobile/utils/mlAnalysis.ts` now sends `stray_animal` to the API
      too. New env var `ROBOFLOW_STRAYPETS_MODEL_URL` (in `.env` +
      documented in `.env.example`). **Verified live via the real endpoint:** a dog
      photo → `dog` detected 0.49 → `mlVerified:true`; a people/bus photo → filtered
      to zero dog/cat → `mlVerified:false` (correctly rejects a non-animal photo).
      Both apps typecheck clean, API boots clean.
      **Kaggle gotcha logged for reuse:** don't call `YOLO("yolov8n.pt")` in your own
      cell just to re-save the file — the old pinned `ultralytics==8.0.196` +
      modern PyTorch `weights_only` default fights you (unpickling errors, and
      monkey-patching `torch.load` recurses on cell re-runs). The file is already a
      finished artifact; just `urllib.request.urlretrieve` it and hand it to
      Roboflow's `deploy()`, which loads it correctly itself.
- [x] **Pothole ML: trained, deployed, wired, and VERIFIED LIVE end-to-end
      (2026-07-06)** — the admin "AI Verified" badge is real now, not a stub.
      `best.pt` (YOLOv8n, RSDD + New Pothole Detection, ~15.4k imgs) deployed to
      Roboflow Hosted (project `mrlaws-workspace/agapp-y5jbd`). Code side:
      `apps/api` `ReportController.verifyImage` calls it for real (guarded, `401`
      without auth confirmed); `apps/mobile/utils/mlAnalysis.ts` calls that
      endpoint instead of stubbing nulls; `ReportsScreen.tsx` passes the
      *uploaded* photo URL, not the local device URI (bug fixed in passing).
      **Three real bugs found and fixed during deployment/testing, not just
      planning:**
      1. Roboflow's `deploy()` needs the specific pinned `ultralytics==8.0.196`
         — a newer version installed via plain `pip install ultralytics` gets
         rejected with a version-mismatch prompt.
      2. `deploy()` expects weights at `<model_path>/weights/best.pt` by
         default (Ultralytics' standard run-folder layout) — fixed by passing
         `filename="best.pt"` explicitly since the uploaded checkpoint had no
         `weights/` wrapper folder, plus copying out of Kaggle's read-only
         `/kaggle/input/` into `/kaggle/working/` first (Roboflow's export
         needs to *write* a `model_artifacts.json` sidecar alongside the weights).
      3. **The actual live-testing blocker:** a fresh Roboflow project's
         deployment has no "selected model" by default even after a successful
         model upload (dashboard showed "Current Model: None") — found and
         fixed directly via the Roboflow MCP (`project_deployment_set_model`),
         confirmed via `project_deployment_get` (`"status":"deployable"`).
      4. Confidence threshold is a **0–1 fraction, not 0–100** — the NestJS code
         initially had `confidence=40`; fixed to `confidence=0.4` after Roboflow's
         own (masked) error response revealed the real request shape.
      5. `apps/api/.env`'s `ROBOFLOW_POTHOLE_MODEL_URL` was left as the literal
         `.env.example` placeholder (`your-project-slug`) — this, not the API
         key, was why the first live test 404'd. Confirmed real value:
         `https://serverless.roboflow.com/agapp-y5jbd/1`.
      **Verified with a real test image from the training set:** two potholes
      correctly detected at 0.63/0.61 confidence, response shape matches the
      NestJS parsing logic exactly. Next real pothole report with a photo gets
      genuine `ml_confidence`/`ml_verified` — nothing else to build.

- [x] **2026-07-05 security sweep (while the pothole model trains on Kaggle)** — full
      details in the Codebase-Audit's 2026-07-05 block. Highlights:
      1. **API attack surface deleted:** only `POST /api/chatbot/ask` was ever called by
         any client, yet 7 controllers (~20 endpoints) were exposed with NO auth guard on
         a service-role key — unauthenticated RLS-bypassing writes once deployed. All dead
         controllers deleted (auth, lgus, reports CRUD, services, forum, audit-logs);
         kept chatbot + a now-guarded `verify-image` ML slot. Dropped
         `@google/generative-ai` dep, `GEMINI_API_KEY`, orphaned `storage.service.ts`,
         and the fake-IP `writeAuditLog()`. API boots clean with exactly 2 guarded routes.
      2. **notifications RLS hardened** (migration `notifications_rls_hardening`):
         the `WITH CHECK (true)` INSERT policy (anyone could forge notifications for
         anyone) dropped — notify_* triggers are SECURITY DEFINER now; and the MISSING
         UPDATE policy added, fixing mobile mark-as-read which had been silently
         updating 0 rows forever. Also dropped the 3 public-bucket listing policies
         (advisor 0025; buckets hold 0 objects, nothing calls .list()).
      3. **Personnel reports tabs fixed:** fake "Assigned to me / My office" (no-op AND
         unimplementable — schema has no per-personnel assignment) → real status tabs
         (All/Open/In Progress/Done), verified filtering live (9/4/2/3).
      4. **Legacy cleanup:** 6 admin pages' hand-rolled LGU slugify → `lguIdFromName()`;
         unused `LoadingSpinner.tsx` deleted; hardcoded `lguName` prop removed from
         personnel reports. CLAUDE.md architecture facts corrected (API = chatbot + push
         only; forum moderation = DB trigger).
      Still-open honest stubs listed at the end of the audit block (ProfileScreen dead
      buttons, forum follow/copy-link no-ops, news attachments `[]`, assignment history
      not persisted).
- [x] **`MISTRAL_API_KEY` configured in `apps/api/.env`** — verified present with a value
      (2026-07-04, key-name check only, value never read). Chatbot LLM fallback is live.
- [x] **`verification_setup.sql` confirmed fully applied to the live DB** — all pieces
      verified live 2026-07-04: `verification_requests` table (used all session),
      `verify_citizen()` RPC + `guard_verification_columns` trigger (both exercised —
      the guard actively blocked writes, the RPC path restored the demo citizen), and
      the private `citizen-ids` bucket (`public: false`).
- [x] **Demo citizen "Juan Dela Cruz" restored to `verified`** — user ran the one-time
      guard-bypass SQL in the Supabase SQL editor (2026-07-04); verified live:
      `verification_status='verified'`, `verified_barangay='Poblacion'`, `verified_by` =
      the Liliw admin. This was the last piece of test residue from the notification
      scope-testing — DB is now fully clean.
- [x] **Post-notification cleanup: test data purged + a mock-data audit run** — user asked
      to "get rid of the test things" and check for remaining mocks/fake data (2026-07-04).
      DB: deleted all test reports/notifications created while verifying the nav-badge and
      bell work this session; reset `nav_seen`/`notifications_seen_at` on the 3 demo staff
      accounts so they start fresh. Codebase audit (full-repo grep for mock/stub/placeholder
      patterns, ML stub and seed data excluded as already-intentional):
      - **Fixed:** `apps/mobile/src/screens/HomeScreen.tsx` had a `getMockLandmarks()`
        fallback (hardcoded fake Liliw/Nagcarlan landmark cards with stock Unsplash photos)
        feeding a `landmarksToShow` value that was computed but **never actually rendered
        anywhere in the file** — fully dead code. Deleted it along with the `facilities`
        state/fetch that only fed it (one fewer unnecessary network call too).
      - **Confirmed dead, not fixed in place:** `apps/api/src/app.controllers.ts`
        `writeAuditLog()` hardcodes `ip_address: '127.0.0.1'` and demo user ids — but see
        the "Decide audit logging" item above, the calling endpoints are unreachable from
        the real admin frontend (0 rows in `audit_logs` confirms it). Left as-is pending
        the DB-trigger redesign rather than patching an endpoint nothing calls.
      - **Not a mock, left as-is:** the `'Liliw, Laguna'` fallback used across admin pages
        when no `lguName` URL param is present — this is the pilot's single default LGU,
        not fabricated data (see `lib/lgu.ts`).
      - **Confirmed real, no action:** admin dashboards/charts, field-officer app, and all
        other API controllers are genuinely Supabase-backed — no fake deltas, sparklines,
        or hardcoded counts found anywhere in the admin UI.
- [x] **Nav "new since last visit" badges + bell narrowed to important notices only** —
      follow-up to the v1 bell (below). Two changes per user direction ("get rid of the
      test... the notification is only for important notices... in the nav have like a
      notification number indicator... if we go to that nav it will be cleared"):
      1. **Nav badges** (`NavBadgeContext.tsx`, new): each admin/personnel nav tab that
         maps to a data section (Issue Reports, Service Requests/My Queue, Forum,
         Verifications) shows a count of items created since that admin last visited it
         (`users.nav_seen` jsonb, per section). Realtime `postgres_changes` INSERTs bump
         the count live; opening the section's route marks it seen (writes `now()`) and
         the badge clears. LGU admin gets all 4 sections; personnel gets Reports +
         Services only; super admin has none in v1 (cross-LGU rollup deferred).
      2. **Bell narrowed to important-only** (`NotificationBell.tsx`, `importantNotices.ts`
         new): the routine `new_report`/`new_service_request` triggers were dropped
         entirely (`notify_staff_new_report`, `notify_staff_new_service_request` — that
         volume is now nav badges, not bell noise). The bell now shows two groups:
         stored "Recent notices" (verification pending + forum flagged — unchanged) and
         computed "Needs attention" (overdue reports past `sla_due_date`; abandoned
         reports — `Submitted` >3 days or any non-terminal status untouched >7 days;
         stale requests — `Submitted`/`Under Review` untouched >3 days; uncollected
         requests — `Ready for Pickup` >7 days). Needs-attention items are computed
         fresh each time the panel opens (no cron, no stored rows) and are **not**
         cleared by "mark all read" — they persist while the underlying problem is
         still true, by design (an overdue report is still overdue).
      Migration `nav_badges_and_bell_scope`: added `users.nav_seen jsonb`; dropped the
      two routine trigger functions + their rows; added `verification_requests` to the
      `supabase_realtime` publication (for the Verifications badge). `schema.sql` +
      `verification_setup.sql` synced (the publication line had to go in
      `verification_setup.sql`, not `schema.sql`, since that table is created there).
      **Bug hit and fixed:** the nav-badge "mark seen" write
      (`supabase.from('users').update(...)`) was fire-and-forget with no `.then()`/
      `await` — supabase-js query builders are lazily thenable, so the HTTP request
      never actually fired; the badge silently never cleared. Fixed by awaiting it.
      **Second bug hit and fixed:** the original design had two independent effects —
      one computing the badge count, one marking the section seen — racing each other;
      whichever resolved last clobbered the other's result. Redesigned so marking-seen
      happens synchronously before computing counts in one sequenced flow (keyed off
      the route via `usePathname()` inside the provider itself), removing the race.
      Verified live for admin + personnel: badges render, clear on visit and stay
      cleared across navigation, update in realtime without reload, and are correctly
      role/LGU-scoped; bell shows real aging seed data under "Needs attention".
- [x] **Admin notification bell built (v1)** — `Docs/Planning/Plan-Admin-Notifications.md`
      implemented end-to-end. Migration `admin_staff_notifications`: `notifications.audience`
      (`lgu_admin`/`lgu_personnel`/`super_admin`), `users.notifications_seen_at`, and a new
      RLS SELECT policy scoping staff rows to matching role+lgu (super admin gets a
      cross-LGU rollup). New AFTER INSERT triggers write staff-audience rows for the v1
      set: new report + new service request (→ personnel & admin, plus a super-admin
      rollup row), new verification pending (→ admin only), forum post/comment flagged
      (→ admin only, reusing `check_forum_profanity()`'s `flagged_keywords`). New
      `apps/admin/src/components/layout/NotificationBell.tsx`: realtime `postgres_changes`
      subscription (RLS-scoped, no manual role filtering needed client-side), unread badge
      via the `notifications_seen_at` model, dropdown panel, deep-links (reports link
      straight to the reference-number-matched row via `?reportId=`; other types land on
      the relevant list page). Wired into `StatusRow.tsx`, replacing the old "coming soon"
      toast placeholder. Also removed the dead `Bell` import in `Sidebar.tsx` while in the
      area (flagged after the other-AI redesign pass, never actually used post-move).
      Verified live for all three roles + realtime push + click-through deep link +
      role-scoping (personnel sees reports/services only; admin also sees
      verifications/forum-flags; a test report/verification pair confirmed the RLS split
      exactly as designed). `schema.sql` synced (new trigger placed after
      `verification_requests` lives in `verification_setup.sql` since that table is
      created there, not in the base schema — the two forum triggers were placed after
      `forum_comments`'s own `CREATE TABLE`, both to preserve top-to-bottom apply order).
      ML detection intentionally NOT touched this pass (explicit user direction — separate
      plan, separate work).
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

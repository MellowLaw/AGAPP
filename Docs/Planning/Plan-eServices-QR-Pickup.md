# Plan — eServices: Document Requests + QR Pickup Flow

**Status:** Built and verified (2026-07-03). All steps complete:
- Step 1 — DB migration + 3 RPCs, live-tested (anon/staff/cross-role).
- Step 2 — schema.sql/seed.sql synced with the eServices layer.
- Step 3 — Mobile: catalog-driven ServicesScreen, 5-step timeline + client QR
  in TrackingDetailScreen.
- Step 4 — Field-officer: Scan tab (camera + manual fallback) →
  lookup → Confirm Release.
- Step 5 — Admin: lgu/services and personnel/dashboard use DB status strings
  directly, Mark Ready modal, manual release override, Reject with reason;
  new /lgu/eservices-catalog CRUD page in the sidebar.
- Step 6 — Notification copy shipped as part of Step 1's trigger rewrite.

Verified live in the admin preview: Mark Ready → real claim code → manual
release → Released state persists after reload; catalog CRUD loads/edits
seeded rows correctly. Mobile/field-officer screens type-check clean but
were not run in a simulator (no browser preview for Expo apps in this session).

Hole-fix pass (2026-07-03): the `supabase_realtime` publication was empty
(ALL realtime dead system-wide, incl. push + the live QR flip) — fixed and
verified with live subscribers; `apps/field-officer/.env` was missing (scanner
couldn't connect) — created; mobile map now renders facility descriptions.
See the 2026-07-03 block in [[Codebase-Audit]].

## Context

Citizens should request common municipal-hall documents from the mobile app, track
preparation progress, and get notified when the paper is **ready for pickup** — then
claim it at the hall by showing a QR. **No in-app payment** (fees are paid at the
hall; the app is a convenience so the hall prepares in advance). The pieces mostly
half-exist today: `service_requests` flows through statuses, push notifications
already work end-to-end (DB insert → Realtime → Expo push), but **QR is completely
unimplemented** (the `qr_code_url` column is always `''`, nothing renders or scans
one), there's no "Ready for Pickup" status, and the document list is a global
config key + hardcoded fallback.

**User decisions (locked):**
- Scan → show details → staff taps **Confirm Release** (never auto-release on scan)
- Scanning happens in the **field-officer mobile app** (native phone camera), not a
  browser page — this becomes that app's first real feature alongside future
  report-task duties
- Document catalog = **admin-editable per-LGU table** (offerings will change after
  the municipal-hall interview; zero-code updates)
- Requirements = **checklist only** (no in-app document uploads; originals are
  checked physically at the hall)

**Researched document catalog to seed** (verified via FilePino / Citizen's Charters /
requirementph): Mayor's (Business) Permit — New & Renewal (BPLO) · Community Tax
Certificate/Cedula (Treasurer) · Certified copies of Birth / Marriage / Death
certificates + Marriage License application (Local Civil Registrar) · Certificate of
Indigency (MSWDO) · Mayor's Clearance · Sanitary Permit · Health Certificate (Health
Office) · Zoning/Locational Clearance · Occupational/Work Permit. Each entry: name,
office, description, requirements checklist, fee note ("pay at Municipal Hall"),
processing-time estimate, active toggle.

## How the QR trust model works (answers to the user's questions)

- The QR encodes **only an opaque single-use claim code** (`agap:claim:ABC-1234`) —
  never the reference number (sequential/guessable) and no PII. Generated
  server-side only when staff marks the request Ready.
- **Anyone's camera can read a QR — scanning is not the security boundary.** The
  boundary is the release RPC: SECURITY DEFINER, internally verifies the caller is
  an authenticated LGU_ADMIN/LGU_PERSONNEL **of the same LGU as the request**, the
  request is in 'Ready for Pickup', and the code matches. A random person scanning
  the QR sees a meaningless string and can do nothing without a staff login.
- Scan pulls up citizen name + document + ref so the officer visually matches the
  person, then taps **Confirm Release** → status becomes Released, code is consumed
  (single-use, enforced atomically by the status gate). Mis-scans/double-scans get
  clear errors ("already released at <time>").
- QR rendered **client-side on the citizen's phone** (`react-native-qrcode-svg`) —
  drop the current `api.qrserver.com` idea (external service, leaks ref numbers).

## Step 1 — DB migration (Supabase MCP `apply_migration`, mirror into schema.sql)

- **Drift capture first:** the live DB has `notify_service_status_change()` +
  trigger that are MISSING from schema.sql — pull the live definition
  (`pg_get_functiondef`) into schema.sql before editing it.
- **Status lifecycle:** extend the CHECK constraint (schema.sql ~line 102) to
  `('Submitted','Under Review','In Progress','Ready for Pickup','Released','Rejected')`.
  New columns on `service_requests`: `claim_code text UNIQUE`,
  `claim_code_used_at timestamptz`, `released_at timestamptz`,
  `released_by uuid REFERENCES users(id)`, `lgu_service_id uuid REFERENCES lgu_services(id)`.
  `ALTER COLUMN qr_code_url DROP NOT NULL` (deprecate; drop later after a grep
  shows no readers).
- **Catalog table `lgu_services`:** `(id, lgu_id FK, office_id FK, name, description,
  requirements jsonb '[]', fee_note default 'Pay at Municipal Hall',
  processing_time, is_active, sort_order, timestamps)`. RLS: SELECT active rows for
  all authenticated (citizens browse); ALL for same-LGU LGU_ADMIN; ALL for
  SUPER_ADMIN. Seed both LGUs with the researched catalog joined to existing
  `offices` rows.
- **Trigger extension:** add the new-status messages (Step 6) to
  `notify_service_status_change()`, pin `search_path`.

## Step 2 — RPCs (mirror `verify_citizen` pattern in supabase/verification_setup.sql)

All SECURITY DEFINER + `SET search_path = public`, internal caller check (role IN
LGU_ADMIN/LGU_PERSONNEL AND caller.lgu_id = request.lgu_id), and — **the known
gotcha** — `REVOKE EXECUTE ... FROM PUBLIC` then `GRANT ... TO authenticated`
(per-role revokes alone don't stick because of the implicit PUBLIC grant).

1. `mark_service_ready(p_request_id) → text` — asserts status is Under
   Review/In Progress; generates the claim code (random via `gen_random_bytes`,
   formatted `ABC-1234`, ambiguous chars 0/O/1/I excluded); sets status →
   'Ready for Pickup'; returns the code (trigger sends the push).
2. `lookup_claim_code(p_code) → request summary` — normalizes input; returns
   citizen_name (denormalized on the row — important: LGU_PERSONNEL cannot read
   other `users` rows under current RLS, so never join users here), service_type,
   reference_number, office, status. Wrong-LGU lookups return "not found" (don't
   leak cross-LGU existence). Already-released returns the release timestamp.
3. `release_service_request(p_code) → void` — atomic
   `UPDATE ... WHERE claim_code = ... AND status = 'Ready for Pickup' RETURNING`;
   sets Released + released_at/released_by/claim_code_used_at. Single-use by
   construction.

## Step 3 — Mobile citizen app (`apps/mobile`)

- Install `react-native-qrcode-svg` (+ `npx expo install react-native-svg`).
- **ServicesScreen.tsx:** replace the `system_config`/hardcoded list (lines ~27-44)
  with a `lgu_services` fetch (active, sorted), grid grouped by office. Tapping a
  card opens a **detail sheet**: description, requirements checklist, fee note,
  processing time → "Request this document" → existing minimal form (full name,
  purpose, copies). Insert gains `lgu_service_id` + real office fields; stop
  inserting `qr_code_url: ''`.
- **TrackingDetailScreen.tsx (service branch):** 5-step status timeline
  (Submitted → Under Review → In Progress → Ready for Pickup → Released; Rejected
  shows the reason). When Ready: big QR card (`agap:claim:<code>`) + human-readable
  fallback "or give this code: ABC-1234" + office/fee reminder. Realtime-subscribe
  to the row so the QR appears live.

## Step 4 — Field-officer app scanner (`apps/field-officer`)

- `npx expo install expo-camera` (CameraView scans QR natively via
  `barcodeScannerSettings`/`onBarcodeScanned` — no extra QR library).
- New `ScanPickupScreen`: camera view with QR framing overlay + a manual code
  `TextInput` fallback (dead camera / worn screen). Decoded/typed code →
  `rpc('lookup_claim_code')` → confirmation card (citizen name, document, ref,
  office) → **Confirm Release** button → `rpc('release_service_request')` → success
  state. Clear error states: not found / already released (with time) / not ready.
- Wire into the app's navigation as a home action ("Scan Pickup QR") next to the
  existing/future report-task area. Login already rejects CITIZEN accounts; the RPC
  re-checks role+LGU server-side regardless.

## Step 5 — Admin panel (`apps/admin`, dev mode — build fix is separate work)

- **lgu/services/page.tsx:** remove the fabricated Payment Amount/Status UI
  (no in-app payments); fix the status maps so 'Ready for Pickup' and 'Released'
  are distinct (today 'Released' is conflated); detail panel shows the catalog
  requirements + fee note (join `lgu_service_id`); actions become: Start Review →
  Start Processing → **Mark Ready** (calls `mark_service_ready`, shows the returned
  code in a modal) → (Released happens at the counter via scan; keep a "Mark
  Released (manual override)" for the no-phone edge case — it's logged in
  status_history) + Reject with reason.
- **personnel/dashboard/page.tsx:** same status-mapping fix + Ready badge.
- **New lgu catalog manager page** (e.g. `/lgu/eservices-catalog`, added to LGU
  sidebar): CRUD over `lgu_services` — name, office select, description,
  requirements list editor, fee note, processing time, active toggle, sort. Reuse
  `Card/Input/Modal/ConfirmModal/useToast` (mind the known `showToast`-in-deps
  refetch-loop gotcha).

## Step 6 — Notification copy (in the trigger; pipeline needs zero changes)

- Under Review: "Your {service_type} request {ref} is now under review."
- In Progress: "{service_type} {ref} is being prepared."
- **Ready for Pickup:** "{service_type} {ref} is ready! Pay the fee and show your
  QR code at {office_name}."
- Released: "{service_type} {ref} has been released. Thank you!"
- Rejected: "{service_type} {ref} was rejected: {reject_reason}."
- Payload `{type:'service_status', request_id}` for deep-linking from
  NotificationsScreen.

## Verification (all against real seeded accounts, dev mode)

1. Migration applies; `get_advisors` security scan stays clean.
2. **RPC negative tests via REST** (the ones that matter): anon → permission
   denied; citizen JWT calling `mark_service_ready` → not authorized; LGU-B staff
   releasing an LGU-A code → not found; garbage code → not found; double release →
   second fails; release while still 'Submitted' → fails.
3. Citizen can SELECT own `claim_code` but cannot UPDATE status directly.
4. Mobile: catalog renders per LGU; detail sheet; request submits; timeline
   updates; QR appears on Ready; push arrives on each transition.
5. Field-officer: scan the mobile QR → details card → Confirm Release → mobile
   timeline flips to Released in realtime; manual code entry path works.
6. Admin: catalog CRUD; Mark Ready modal shows code; status maps correct.

## Risks / notes

- Catalog contents are placeholder-truth until the municipal-hall interview — which
  is exactly why it's an admin-editable table.
- schema.sql ↔ live-DB drift (`notify_service_status_change` missing from the file)
  must be captured before editing, or a future reset silently loses the trigger.
- Staff can still UPDATE status directly through their ALL RLS policy (bypassing
  the RPCs). Acceptable for capstone; optional later hardening: a guard trigger
  blocking direct transitions to 'Released' outside the RPC.
- Field-officer app is minimal today — the scan screen is its first real feature;
  keep it self-contained so future report-task features slot in beside it.

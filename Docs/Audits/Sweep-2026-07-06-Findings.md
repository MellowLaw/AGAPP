# Full-system sweep — findings + action plan (2026-07-06)

> **How this was produced:** three parallel read-only sub-agent sweeps (mobile app,
> admin panel, Supabase backend + API), each verifying every finding against real
> `file:line` and quoting the actual RLS policy as proof. Deduplicated + prioritized here.
> **Status of this doc:** the two items marked ✅ DONE were fixed during the sweep; the
> rest are **proposed, awaiting your go-ahead** — nothing else has been changed.

## Already done in this pass
- ✅ **Field-officer app DELETED** (`git rm` of `apps/field-officer/` + orphaned `.env`).
- ✅ **Regression fixed** (§0): staff-creation break from today's signup trigger — live
  migration `fix_signup_trigger_skip_staff`, verified.
- ✅ **`verify_geofence` confirmed DEAD** — grep across the whole repo: only its own
  definition (`schema.sql:588`) + a patch that recreates it. Zero call sites (no trigger,
  policy, `.rpc()`, or client ref). The 15 km check is client-side JS only, as suspected.
- ✅ **§1 insert-forgery — status/tenant/identity/pickup half FIXED live** (migration
  `guard_citizen_insert_forgery`): BEFORE INSERT forcing triggers on `reports` +
  `service_requests` pin `citizen_id`/`lgu_id`/`citizen_name`, force `status='Submitted'`,
  and null the lifecycle fields (Resolved/claim_code/released_* forgery). No-op for the
  legit app; only forged values get overwritten. `schema.sql` synced. **ml_verified/
  ml_confidence forgery is NOT yet fixed — see §1 below (needs the server-side-write
  refactor).**
- ✅ **§3 code fixes DONE** (sub-agent, `tsc` clean both apps): CSV formula injection
  (admin reports export), silent no-op admin updates (`.select('id')` guard on every
  reports mutation), API auth guard now fails **closed** when Supabase env is missing.
- ✅ **§2 (SELECT scoping) + §3 rating — APPLIED + verified** (migration
  `sweep_select_scoping_and_rating`; `patches/002_...sql` + `schema.sql` synced). Reports
  read split into own-rows (citizens) + LGU-scoped (staff); lgu_services drafts + forum
  posts/comments scoped to the caller's LGU; a scoped `rate_report` RPC replaces the
  silently-failing direct rating update (mobile `TrackingDetailScreen` wired to it, `tsc`
  clean). **Verified via role-simulated reads** (Supabase MCP, `SET LOCAL role
  authenticated` + jwt claims on real data): Liliw admin still reads all 11 Liliw reports
  and 0 cross-LGU; citizen Jechris reads only their own 1 report (0 leaked) — so staff
  pages don't break and the PII/cross-LGU leaks are closed.

---

## §0 — ✅ FIXED: `create-staff` 500 regression (was CRITICAL)

The `handle_new_citizen_signup()` trigger added earlier today fired on **every**
`auth.users` insert, including `admin.createUser()` in
`apps/admin/src/app/api/create-staff/route.ts:68`. It inserted a `role='CITIZEN'`
profile row first, so the route's own users insert (same `id`) hit a duplicate-key
error → rollback → **every LGU_ADMIN/LGU_PERSONNEL creation 500'd.** Fixed: the trigger
now skips when `raw_user_meta_data ? 'role'` (staff path always sets it; citizen signup
sets only `full_name`). Verified live: staff insert skips the trigger, citizen signup
still creates its row.

---

## §1 — CRITICAL: the `reports` / `service_requests` / `forum_posts` INSERT policies are wide open

**All three sweeps independently flagged this — it's the #1 hole in the system.**

The insert policies only check *ownership*, e.g. `schema.sql` "Allow Citizens to insert
reports" is `WITH CHECK (auth.uid() = citizen_id)` — and nothing else. Because every
client talks to Supabase directly with the anon key, a citizen can hand-roll a REST
insert (bypassing the app entirely) and forge:

- **`ml_verified=true, ml_confidence=0.99`** → fakes the AI-verification badge admins
  now trust for triage (undermines the whole ML feature we just shipped).
- **`lgu_id` = another town** → injects reports/requests/posts into a different tenant's
  queue (cross-tenant spam). Contrast `verification_requests`, which *does* pin
  `lgu_id = (SELECT lgu_id FROM users WHERE id = auth.uid())` — the correct pattern.
- **`status='Resolved'`** (reports) or **`status='Released', claim_code=…, released_at=…`**
  (service_requests) → fabricates a completed pickup/resolution without ever going
  through `release_service_request()`.
- **any `latitude`/`longitude`** → `verify_geofence()` exists (`schema.sql`) but is
  **never called by any trigger or policy**; the 15 km check is client-side JS only.

**Fix (one migration):** replace the bare-ownership `WITH CHECK`s with column-locked
ones, ideally via a `BEFORE INSERT` trigger per table (mirrors the existing
`guard_verification_columns()` pattern on `users`) that forces, on any client insert:
`ml_confidence/ml_verified/is_low_credibility` → NULL/false; `status` → the initial
value; `claim_code/released_at/released_by/sla_due_date` → NULL; `lgu_id` → the caller's
own; and wires `verify_geofence()` in so out-of-bounds coordinates are rejected
server-side. This is the highest-value security work in the repo.

## §2 — HIGH: over-broad SELECT policies leak cross-citizen / cross-LGU data

Each verified against the policy text + a real client call site:

- **`reports` SELECT** — "Allow Citizens to read reports in their LGU" grants every
  citizen read on *every* report in the LGU (name, exact GPS, barangay, photo), not just
  their own. The app hides it (`.eq('citizen_id', …)`), but `TrackingDetailScreen.tsx`
  fetches by bare `id` — anyone with another citizen's report UUID sees full detail.
  `service_requests` correctly scopes SELECT to `auth.uid() = citizen_id`; reports should
  match. → narrow to `citizen_id = auth.uid() OR <staff exists-check>`.
- **`lgu_services` SELECT** (admin) — staff branch never checks the row's `lgu_id` vs the
  caller's; any staff of any LGU reads every LGU's full catalog incl. drafts. A Liliw
  admin visiting `?lguName=Nagcarlan, Laguna` gets a real cross-tenant read
  (`eservices-catalog/page.tsx`). → add `AND lgu_id = get_current_user_lgu()`.
- **`forum_posts` / `forum_comments` SELECT** — `USING (is_approved = true)` with no LGU
  scoping → cross-LGU read of approved posts/comments via the `?lguName=` param.
- **`lgu_facilities` SELECT** — `USING (true)`, fully open (writes are still protected).
- **`news_announcements` SELECT** — `status='published'`, unscoped (likely intentional
  since news is public-facing, but inconsistent — decide explicitly).

**Common root:** admin pages derive the target LGU from the editable `?lguName=` URL
param, so cross-tenant reads are one URL edit away wherever the table's RLS doesn't also
scope by `lgu_id`. Fix each policy's SELECT to scope by the caller's own `lgu_id`.

## §3 — MED/HIGH: correctness bugs

- **Citizen star-rating never persists** (`TrackingDetailScreen.tsx`) — there's no
  citizen UPDATE policy on `reports`, so the rating update matches 0 rows (no error), yet
  the UI says "You rated this X stars." Re-loads unrated. This also explains the "unused
  `reports.rating`" note in TODO. → add a scoped citizen UPDATE policy limited to
  `rating`/`feedback` on own Resolved reports, and check `error`/count before updating UI.
- **Admin status/reassign updates can silently no-op** (`lgu/reports/page.tsx`,
  `personnel/reports/page.tsx`) — `.update().eq('id',…)` with no `.select()`; supabase-js
  returns `error:null` on a 0-row update, so a blocked/no-op write shows a success toast
  while the DB is unchanged, desyncing until reload. → chain `.select('id')`, treat empty
  as failure.
- **CSV export formula injection** (`lgu/reports/page.tsx`) — `citizen_name`
  (attacker-controlled via signup `full_name`) is written to a CSV cell; Excel/Sheets
  evaluate a cell starting with `= + - @` even when quoted. A citizen named
  `=HYPERLINK(...)` runs on the staffer's machine. → prefix `'` / neutralize leading
  `=+-@`.
- **API auth fail-open** (`apps/api/src/supabase-auth.guard.ts`) — if `SUPABASE_URL/KEY`
  are unset the guard `return true`s (unauthenticated access to verify-image/chatbot →
  Roboflow/Mistral cost abuse). → fail closed outside local dev.

## §4 — MED/LOW: hardening + hygiene

- **Storage path ownership** — `report-photos` / `service-attachments` / `facility-images`
  INSERT policies don't pin the object path to the caller's own folder (contrast
  `citizen-ids`, which checks `(storage.foldername(name))[2] = auth.uid()::text`). Any
  authenticated user can write into another's prefix (pollution now; overwrite if any
  path ever uses `upsert:true`). → add the folder-prefix check.
- **`verify-image` relays an unvalidated client `photoUrl`** to Roboflow — burns paid
  quota on attacker-chosen URLs. → require the URL start with this project's Supabase
  storage prefix.
- **Submission cooldown is client-only** (`AsyncStorage`) — reset by reinstall, useless
  against scripted inserts (compounds §1). → server-side rate limit if it matters.
- **Privacy consent pre-checked** (`LoginScreen.tsx` `privacyAccepted=true`) — weak
  RA 10173 consent record; should require an affirmative tap.
- **Office assignment is fake data** — `offices` table + `reports.assigned_office_id` FK
  exist but the reassign UI writes a hardcoded 4-item free-text `assigned_office`;
  `assigned_office_id` is never written. Ties into the personnel-trio assignment work.
- **`audit_logs` provisioned but never written** — no admin action is audited (known;
  the manuscript claims audit logging → this is a real gap for the paper).

## §5 — Feature gaps a defense panel would notice

Staff-facing: office-backed assignment (not a hardcoded list); audit logging actually
writing rows; CSV export on requests/verifications/forum (only reports has it); an
SLA/due-date badge on the reports list (data exists, only the bell uses it).

Citizen-facing: withdraw/cancel a submitted report or request; pagination on the
unbounded list fetches; resumable photo upload on failure; a verification history/timeline
for rejected-then-resubmitted citizens; an RA 10173 "delete my account/data" path (we
collect ID + selfie PII and consent, but offer no deletion path).

## Is LGU Personnel still needed? — YES

Nothing in the sweep changes the earlier conclusion (`Plan-Personnel-and-FieldOfficer.md`):
Personnel is a **manuscript-promised role** (Fig. 34 + UAT Table 3) and the demo loop's
resolver now that field-officer is gone. The personnel-web **trio** (real assignment,
internal notes, attach resolution proof) remains the recommended build — and §3/§4 above
(office-backed assignment, the assigned-office data model) feed directly into it.

## Suggested order of attack
1. **§1** — the insert-forgery lockdown (one migration; protects the ML feature + tenancy).
2. **§2** — LGU-scope the leaky SELECT policies (same migration or a sibling one).
3. **§3** — the four correctness bugs (rating persistence, silent no-op updates, CSV
   injection, API fail-open) — mostly small client/route changes.
4. **§4/§5** — hardening + the personnel trio (already its own plan).

All of §1–§4 are additive migrations / localized code changes — no rewrites, and they
don't touch the flows shipped earlier today.

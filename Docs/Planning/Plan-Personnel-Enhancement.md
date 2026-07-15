# Plan — LGU Personnel enhancement: office-based accounts + a real front-line workflow

> **Status:** 🔵 Draft for review · not started in code · _living doc._
> **Updated:** 2026-07-06
> **Scope:** Make the **LGU Personnel** role genuinely useful and non-redundant vs. LGU
> Admin, organized around **municipal offices**, with ease-of-use for a non-technical
> clerk as the top priority. (The field-officer mobile app is CUT — confirmed again by
> the user 2026-07-06; this is purely the web Personnel role. See
> [[Plan-Personnel-and-FieldOfficer]].)

## The problem (why this is worth doing)

Right now LGU Personnel is basically "**Admin minus buttons**": it sees the *whole* LGU's
reports/requests filtered only by status, has no office scoping, no real assignment (the
`assigned_personnel` column exists but nothing writes it; `offices` table exists but is
empty and unwired), and none of the manuscript-promised front-line tools. So a clerk at
the Civil Registry sees Engineering's potholes and vice-versa — cluttered and confusing,
the opposite of "easy for a non-technical person." And the manuscript's **Figure 34 + UAT
Table 3** already commit to Personnel-specific features (assigned queue, internal notes,
attach released document / resolution proof) that don't exist yet.

## The idea (user's, and it's sound): each office = its own account + its own scoped UI

Municipal work is organized by office — Civil Registry (birth/marriage/death certs),
Business Permits & Licensing (BPLO), Engineering (potholes/roads), Health, MDRRMO
(disasters), Agriculture (stray animals), etc. Personnel should log in and see **only
their office's queue**, not everything. That's simultaneously the biggest usability win
(a focused, uncluttered screen) *and* what makes Personnel a real role rather than a
watered-down Admin.

## Recommendation (phased, each shippable)

### Phase 1 — Offices as real data + personnel↔office link
- **Seed the standard municipal offices per LGU** into the existing `offices` table
  (currently empty): Civil Registry, BPLO, Engineering, Health, MDRRMO, Agriculture,
  General Services (tune per LGU). Additive; the table + `reports.assigned_office_id` FK
  already exist.
- **Link personnel to an office:** add `users.office_id` (nullable FK → `offices`).
  The admin's **create-staff** flow (and the super-admin onboarding wizard's first-admin
  step) gets an "Office" picker when the role is `LGU_PERSONNEL`.
- Result: every personnel account belongs to exactly one office.

### Phase 2 — Route work to offices (kill the fake assignment)
- **Reports:** map each category → a default office (pothole/drainage/pole → Engineering,
  stray_animal → Agriculture/Health) so a new report is auto-routed; the LGU Admin can
  reassign office via the existing Reassign action (wire `assigned_office_id`, not just the
  legacy free-text `assigned_office`). This finally makes the office data real (closes the
  admin-sweep finding that Reassign writes a hardcoded 4-item list).
- **Service requests:** already carry `office_name`/`office_id` from the catalog; ensure
  they're set, and let the admin assign a specific personnel (`assigned_personnel`) or leave
  it to the office pool.

### Phase 3 — Office-scoped Personnel UI + the front-line trio
- **Scoped queue:** `/personnel/dashboard` and `/personnel/reports` show ONLY items routed
  to the signed-in personnel's office (RLS + query by `office_id`). A clerk sees a short,
  relevant list — the non-technical win. Keep the status tabs (All/Open/In Progress/Done).
- **The trio (manuscript Fig 34 / UAT Table 3):**
  1. **Assigned/office queue** — now real (Phase 2 makes it non-fake).
  2. **Internal notes** — staff-only note thread per report/request (new `internal_notes`
     table, RLS staff-only). This is the single most "real government workflow" feature.
  3. **Attach resolution proof / released document** — upload on resolve/release
     (`report-photos` / `service-attachments` buckets already exist + are path-owned);
     surfaces to the citizen on their tracking screen. Ties into the unused
     `reports.rating`/`feedback` (citizens rate after seeing proof).
- (Phases 2–3 overlap the pending "personnel trio" in [[Plan-Personnel-and-FieldOfficer]] —
  this plan supersedes/absorbs it and adds the office-scoping layer.)

### Phase 4 — Non-technical ease-of-use polish
- Personnel dashboard leads with "**Your office's pending work: N items**" and big, clearly
  labeled actions (Acknowledge / Start / Resolve / Add note / Attach proof) — minimal
  config, plain wording, no cross-office noise. This is the top-priority deliverable framing.

## Is a *separate account per office* the right call? (the key decision)
Two ways to do the office split:
- **A. One account per office-staff, each tied to `office_id` (recommended).** Matches the
  user's "each office = different account/UI," mirrors real org structure, cleanest RLS
  (scope by the caller's `office_id`). More accounts to provision (the wizard/create-staff
  handles it).
- **B. One Personnel role per LGU with an office *filter*.** Fewer accounts, but then it's
  not really "each office = its own account," and it's closer to today's "Admin minus
  buttons." Weaker separation-of-duties story.
Recommend **A** — it's the version that makes Personnel defensibly non-redundant.

## Architecture & how it connects (mobile ↔ admin ↔ personnel ↔ super)

### Data model (Supabase — additive, backward-compatible)
| Object | State | Change |
|---|---|---|
| `offices` | exists, **empty** | Seed the standard offices per LGU (Civil Registry, BPLO, Engineering, Health, MDRRMO, Agriculture, General Services). `id, lgu_id, name, slug, type, is_active`. |
| `users.office_id` | — | **New** nullable FK → `offices`. Non-null only for `LGU_PERSONNEL`; ties a clerk to exactly one office. |
| `reports.assigned_office_id` | exists, **unwired** | Set on insert by a category→office router; admin-reassignable. Wire it (stop using the legacy free-text `assigned_office` + hardcoded 4-item list). |
| `service_requests.office_id`/`office_name` | exists | Already derivable from the service catalog (each `lgu_service` has an `office_name`) — ensure it's set; optional `assigned_personnel` for a specific clerk. |
| `internal_notes` | — | **New** table: `id, subject_type ('report'\|'request'), subject_id, lgu_id, author_id, body, created_at`. Staff-only via RLS; citizens have NO policy (invisible). |
| `lgu_category_office` | — | **New** small map `(lgu_id, category, office_id)` so admins can tune which office a report category routes to (else a sane default in the router). |

### RLS (the actual enforcement — an office dimension on top of the existing LGU scoping)
- **Personnel read** on `reports`/`service_requests`: `role = LGU_PERSONNEL AND assigned_office_id = (caller's users.office_id)` → a clerk sees ONLY their office's queue. LGU Admin keeps LGU-wide read; Super keeps all. (Null `office_id` personnel fall back to LGU-wide = today's behavior, so nothing breaks pre-migration.)
- **`internal_notes`**: read/write by staff of the same LGU only; no citizen policy → notes never leak to the mobile app.
- Mirrors the existing per-LGU RLS pattern we already use; verifiable the same way (role-simulated reads).

### The end-to-end flow (who touches what)
```
CITIZEN (mobile)  ── submits report/request ──▶  guard trigger auto-ROUTES to an office
                                                 (reports: category→office map;
                                                  requests: office from the service catalog)
                                                        │
                                                        ▼
                                   appears in THAT OFFICE's PERSONNEL queue (admin web
                                   /personnel/*) — RLS-scoped to the clerk's office_id
                                                        │  personnel: acknowledge / start /
                                                        │  resolve · add internal note ·
                                                        │  attach resolution proof
                                                        ▼
        status change + proof ──▶ Realtime ──▶ CITIZEN (mobile) sees new status + proof
                                                 on TrackingDetail (+ optional "Handled by:
                                                 <Office>" for transparency; notes stay hidden)

LGU ADMIN (web)   ── oversees ALL offices · reassigns office · breaks down dashboards by
                     office · CREATES personnel accounts WITH an office (create-staff)
SUPER ADMIN (web) ── creates the LGU + seeds its offices (onboarding wizard) + first admin
```

### Per surface
- **Mobile (citizen)** — submit flow *unchanged*; the routing is invisible to them. NEW: TrackingDetail shows the resolution proof + richer status (ties into the unused `reports.rating`/`feedback` — they rate after seeing proof). Citizens never see offices/notes. Optional: a read-only "Handled by: <Office>" line.
- **Admin (LGU Admin)** — `create-staff` route + the staff-creation UIs (`lgu/settings`, the super-admin wizard's first-admin step) gain an **Office picker** when role = `LGU_PERSONNEL`. `lgu/reports` Reassign writes real `assigned_office_id`. Admin dashboards can add an office breakdown (reuses the new Recharts components).
- **Personnel (office staff)** — the bulk of new UI: office-scoped `personnel/dashboard` + `personnel/reports`, internal notes, attach-proof. Dashboard leads with "**Your office's pending work: N**".
- **Super Admin** — the onboarding wizard (just built) gains an office-seeding step, or seeds the default office set automatically on LGU create.
- **NestJS API** — unaffected (still just chatbot + verify-image). *Optional later:* extend the `notify_*` triggers to target the assigned office's personnel (audience-by-office) so a routed report pings the right desk.

### Backward compatibility (the 2 existing LGUs)
Seed offices for Liliw + Nagcarlan; one-time backfill of `assigned_office_id` on existing reports by category; assign existing personnel an `office_id` (or default them to "General Services"). All additive/nullable — no breaking change, and unassigned-office personnel keep working LGU-wide until assigned.

### Explicitly out of scope (scope guard, per "not too much")
No new mobile app (field-officer stays cut), no per-office branding/theme (offices share the LGU theme), notifications-to-office is a nice-to-have not a v1 requirement, and no cross-LGU office sharing.

## Files likely touched
- `supabase/` — seed offices; `users.office_id` migration; `internal_notes` table + RLS;
  category→office routing (trigger or app-side); sync `schema.sql`.
- `apps/admin/src/app/api/create-staff/route.ts` + the staff-creation UI (`lgu/settings`,
  super-admin wizard) — office picker for personnel.
- `apps/admin/src/app/lgu/reports/page.tsx` — Reassign writes real `assigned_office_id`
  (from the seeded offices, not the hardcoded list).
- `apps/admin/src/app/personnel/dashboard/page.tsx` + `personnel/reports/page.tsx` —
  office-scoped queues + notes + attach-proof.
- `apps/mobile/src/screens/TrackingDetailScreen.tsx` — show resolution proof to the citizen.

## Manuscript alignment
- Fig 34 (Personnel use cases) → assigned view ✓ notes ✓ attach ✓ become real.
- Adds a defensible "**least-privilege, office-scoped front-line staff**" story — which is
  the honest answer to "is Personnel just complexity?": no, it's separation of duties, and
  the office split is what proves it.

## Open decisions for you
- Per-office accounts (A, recommended) vs. one-personnel-with-office-filter (B)?
- Auto-route reports by category→office (recommended) vs. always manual admin assignment?
- Internal notes as a new table (recommended) vs. reusing `status_history`?
- Which office list to seed per LGU (the 6–7 standard ones, or the exact set the pilot LGU
  actually runs)?

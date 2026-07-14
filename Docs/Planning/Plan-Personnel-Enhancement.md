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

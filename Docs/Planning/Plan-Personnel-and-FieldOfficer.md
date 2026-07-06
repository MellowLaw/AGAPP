# Plan — LGU Personnel role + Field Officer app: what they should do (or not)

> **Status:** 🟠 DECIDED (2026-07-06): **field-officer app is CUT** — slated for
> deletion, do not use it as context or build anything for it. The personnel-web trio
> below is under consideration.
> **Updated:** 2026-07-06
> **Question being answered:** citizen mobile + LGU admin + super admin are in good
> shape — what should the *LGU Personnel* web role and the *field-officer* mobile app
> actually do? Build them out, keep them minimal, or cut them?

## ⚠️ Decision (2026-07-06)

- **Field-officer app: CUT.** User decision after weighing it: not in the manuscript
  (zero mentions — the four promised roles are Citizen/Super/Admin/Personnel, staff
  "via web browser"), not needed by the demo loop (personnel web resolves reports;
  admin web releases pickups), least-tested surface, and extra defense attack surface.
  **Slated for deletion; until then treat `apps/field-officer/` as non-existent —
  don't reference it, don't propose features for it, don't count it in architecture
  discussions.** Its QR-scan/offline ideas can live in the manuscript's Future Work.
- **Personnel (web): the real gap.** Figure 34 and the UAT test tables (Table 3)
  already commit AGAPP to: an *assigned* queue, internal notes, and attaching the
  released document / resolution photo. None exist yet. These are 3 modest features
  on pages that already exist, and the UAT plan will test for those exact buttons.
  Detailed breakdown given to the user 2026-07-06; awaiting go/no-go.

## Current state (verified in code 2026-07-06)

### Personnel web (`apps/admin/src/app/personnel/`)
| Page | What it really does |
|---|---|
| `dashboard` (My Queue) | Service requests for their LGU — incl. claim-code release flow |
| `reports` | LGU-wide reports, status tabs (All/Open/In Progress/Done), status updates, photo + AI badge (added 2026-07-06) |
| `settings` | Real profile/password/notification prefs |

**What's missing vs. what the manuscript promises (Fig. 34 + Table 3 UAT):**
| Promised | Exists? | Notes |
|---|---|---|
| View **assigned** reports/requests | ❌ | Queue is LGU-wide; `service_requests.assigned_personnel` exists in schema but **nothing writes it** (also blocks the TODO's personnel-workload chart). Reports only have `assigned_office`. |
| Update status | ✅ | Works on both pages |
| **Add internal note** (staff-only) | ❌ | No column, no UI |
| **Attach released document / resolution photo** | ❌ | No upload on either personnel page |
| Post status updates (citizen-visible) | 🟡 | Status changes notify citizens via triggers; there's no free-text update. `status_history jsonb` exists on both tables, default `[]`, never written |

### Field-officer app (`apps/field-officer/`) — minimal but real
- Role-gated login (rejects citizens) · Tasks list (Under Review/In Progress reports,
  LGU-wide) · Task detail + **Mark Resolved** through an AsyncStorage offline queue
  (30s auto-retry) · **QR pickup scanning** (`lookup_claim_code` → `release_service_request`,
  verified live 2026-07-03) · Profile + force-sync.
- Not in the manuscript at all. `.env` exists; typechecks clean; hasn't been run in a
  simulator recently.

## ~~Why keep the field app~~ (superseded by the CUT decision above)

The keep argument (already built, offline-demo wow factor, research-gap tie-in) was
outweighed by: the demo loop doesn't need it, it's the least-tested surface, it's
absent from the manuscript/UAT so it earns nothing while inviting defense questions,
and every polish hour comes out of the personnel features that ARE graded. Kept here
struck through for the decision trail.

## v1 scope (personnel web only — field-app items dropped)

1. **Assignment actually happens** — admin's existing "Reassign" writes
   `assigned_office` (reports); make admin services page write `assigned_personnel`
   (dropdown of the LGU's staff). Personnel queue gets an "Assigned to me / My office"
   filter — *now it's real* (the fake version was removed 2026-07-05 precisely because
   nothing wrote the column).
2. **Internal notes** — one `internal_notes jsonb` (or reuse `status_history`) on
   reports + service_requests; staff-only visibility via existing role RLS; simple
   note list + composer in both personnel detail panels. Citizens never see it.
3. **Attach resolution proof** — photo/document upload on personnel report detail
   (→ `report-photos` bucket) and released-document attach on My Queue
   (→ `service-attachments`). Show on the citizen tracking screen ("Resolved — see
   proof"). This is also the UAT table's literal button.
~~4. Field app: resolution photo~~ / ~~5. Field app: assigned filter~~ — dropped with
the CUT decision.

**Explicitly out:** everything field-app; per-officer GPS tracking (privacy + scope);
multi-office routing workflows; supervisor approval chains.

## Manuscript alignment checklist (do alongside v1)
- [ ] Fig. 34 use cases become checkable: assigned view ✓ notes ✓ attach ✓.
- [ ] UAT Table 3's "Add internal note" / "Attach document" rows become passable.
- [ ] (Optional) Future Work paragraph: offline-capable field-officer companion app —
      the honest way to mention the prototyped-then-cut idea, if at all.

## Open decisions for you
- Go/no-go on the trio itself (detailed breakdown delivered 2026-07-06).
- Assignment granularity: per-office (exists today) or per-person (`assigned_personnel`,
  enables workload chart)? **Recommend: offices for reports, person for requests — both
  columns already exist.**
- Internal notes: new table vs. reusing `status_history`? **Recommend a new
  `internal_notes` table — RLS can cleanly hide it from citizens, and it keeps
  citizen-visible history and staff notes separable.**

## Cleanup once deletion happens
- Remove `apps/field-officer/` workspace + root workspace entry; drop its `.env.example`
  note in CLAUDE.md; update Codebase-Audit's field-officer sections to "deleted";
  `lookup_claim_code`/`release_service_request` RPCs stay (admin web uses them).

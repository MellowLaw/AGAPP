# Plan — Admin Notification System

> **Status:** 🔵 Draft / strategy · not started in code · _living doc, can change._
> **Updated:** 2026-07-04
> **Scope:** Admin panel only (LGU admin, LGU personnel, super admin). The bell
> already exists in `apps/admin/src/components/layout/StatusRow.tsx` and currently
> just fires a "coming soon" toast — this plan makes it real.

## Why this is mostly wiring, not new infrastructure

Everything worth notifying about is **already an event in the DB**, and the
`supabase_realtime` publication we fixed on 2026-07-03 already carries the relevant
tables (`notifications`, `reports`, `service_requests`, `forum_posts`,
`forum_comments`). The `notifications` table already has the shape we need:
`user_id`, `lgu_id`, `type`, `title`, `body`, `payload jsonb`, `is_read`,
`created_at`. Today it's only used for **citizen** push (status changes). We extend
the same trigger pattern to also insert **staff-targeted** rows.

## What the bell should show (ranked by day-to-day value)

| # | Notification | Source event (already in DB) | v1? |
|---|---|---|---|
| 1 | **New citizen report** — "New Pothole / Road Damage report in Poblacion (REP-…)" | INSERT on `reports` for the LGU | ✅ v1 |
| 2 | **New service request** — "New Cedula request (SR-…)" | INSERT on `service_requests` | ✅ v1 |
| 3 | **New verification pending** — "Juan Dela Cruz submitted an ID for review" | INSERT on `verification_requests` | ✅ v1 |
| 4 | **Forum post/comment auto-flagged** — "A forum post was flagged by the filter" | INSERT/UPDATE where `flagged_keywords` non-empty | ✅ v1 |
| 5 | **SLA overdue** — "REP-… is past its due date" | computed: `reports.sla_due_date < now()` AND not Resolved/Rejected | 🔶 v2 (digest) |
| 6 | **Pickup aging** — "SR-… has been Ready for Pickup for 5+ days" | computed: `status='Ready for Pickup'` AND `updated_at` old | 🔶 v2 (digest) |
| 7 | **Citizen rating received** — "A resolved report was rated 4★" | UPDATE setting `reports.rating` | 🔶 v2 |

**Per role:**
- **LGU admin** — items 1–7, scoped to their `lgu_id`.
- **LGU personnel** — items 1, 2, 6 (their work queue); not verifications/forum (admin-only).
- **Super admin** — a light cross-LGU rollup of 1–2 only (monitoring, not action).

**Recommended v1 = items 1–4** (all are plain realtime INSERT events — cheapest to
build, highest signal). Items 5–6 are computed on panel-open (a query, no cron needed),
so they slot in without new infrastructure. **Confirm which set you want before the
build session.**

## DB design (reuse `notifications`, add a staff audience)

Citizen rows have `user_id = <citizen>`. For staff, we need "everyone with role X in
LGU Y". Two clean options — **recommend Option A** (least schema change):

- **Option A — audience convention on the existing table.** A staff row has
  `user_id = NULL` + `lgu_id = <lgu>` + a new `audience text` column
  (`'lgu_admin' | 'lgu_personnel' | 'super_admin'`). One migration adds `audience`
  (nullable; NULL = the existing per-citizen behavior, unchanged). Read-state is
  then per-admin — see below.
- **Option B — a dedicated `staff_notifications` table.** Cleaner separation, but
  duplicates realtime wiring and RLS. More work; only worth it if staff and citizen
  notifications diverge a lot later.

**Read/unread (the one genuinely fiddly part).** A staff row is seen by many admins,
so `is_read` on the row itself doesn't work. Options, simplest first:
1. **v1: "mark all as read" per admin** — store a single `notifications_seen_at`
   timestamp on the `users` row; unread count = staff rows newer than it. Trivial,
   good enough for a capstone.
2. **v2: per-admin read receipts** — a `notification_reads(notification_id, user_id)`
   table. Only build if per-item read state is actually needed.

**RLS:** add a SELECT policy — a staff row (`audience` set) is readable by a user whose
role+lgu match the audience+lgu. Mirror the same-LGU pattern already proven in
`verify_citizen` / the forum-comments fix.

**Triggers:** extend the existing `notify_report_status_change()` /
`notify_service_status_change()` pattern with new AFTER INSERT triggers that write the
staff row (audience-targeted) in addition to the citizen row. Reuse the human-readable
category labels already added to `notify_report_status_change()`.

## UI (admin) — the bell in `StatusRow`

- Bell subscribes via Supabase realtime to `notifications` filtered to its audience/lgu
  (publication already includes the table — no infra change).
- Unread badge = count from the `notifications_seen_at` model above.
- Click → dropdown panel (matte, same tokens as the redesign): list newest first,
  each row deep-links via `payload` (e.g. `payload.report_id` →
  `/lgu/reports?...&reportId=…`, reusing the links the dashboard table already builds).
- "Mark all read" sets `notifications_seen_at = now()`.
- Keep it a dropdown, not a full page (there's no `/notifications` route and we don't
  need one for v1).

## Build steps (when we start)
1. Migration: add `audience` to `notifications` (+ `users.notifications_seen_at`); RLS SELECT policy for staff audiences.
2. Extend the report/service/verification/forum triggers to insert staff-audience rows (items 1–4).
3. Bell dropdown in `StatusRow.tsx`: realtime subscription, unread count, panel, deep-links, mark-all-read.
4. Verify live per role in both themes: submit a citizen report → admin bell increments in realtime → click → lands on the report.
5. (v2) Add the computed SLA-overdue / pickup-aging digest queries on panel-open; per-item read receipts if wanted.

## Open decisions for you
- **Which notification items in v1?** (recommend 1–4.)
- **Read model:** simple "mark all read" (recommend v1) vs per-item receipts?
- Should personnel get a narrower set than admin (recommend yes — items 1, 2, 6)?

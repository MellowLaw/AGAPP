# Plan — Stray-Pets Reporting ("Last Seen" + AI validity)

> **Status:** 🔵 Draft for review · not started in code · _living doc._
> **Updated:** 2026-07-05
> **Scope:** How stray-animal reports are framed and shown (admin + mobile), and how the
> COCO dog/cat detector's result is surfaced. Purely presentational + one optional ML
> label — the underlying report data model is unchanged.

## The idea (user's, and it's sound)

Stray-animal reports are inherently **point-in-time sightings** — animals move, so the
location a citizen sends is "where it was last seen at [time]," not a live position.
Frame the UI to say exactly that: **"Last Seen: [barangay] · [relative time]"**, and use
the dog/cat detector purely as an **anti-troll validity check** ("the photo really does
contain a dog/cat," breed/identity irrelevant).

**Why it's good, and the one guardrail:** "Last Seen" is *more* honest than a plain
location label because it signals freshness/staleness, which is exactly what an animal-
control/vet office needs to triage (a sighting from this morning vs. 4 days ago changes
whether it's worth dispatching). The guardrail: keep wording neutral ("Last Seen" /
"Spotted") — it must **not** read like a lost-pet reunification/tracking service ("we're
locating this animal"). It's a sighting record, not a promise the animal is still there.

## What's already in place (so the core needs NO new infrastructure)

- Every report already stores `latitude`, `longitude`, `barangay`, `created_at`,
  `category`, `photo_url` — a stray report is already a geotagged, timestamped sighting.
- The admin report detail panel already renders LOCATION (barangay + coords), a SUBMITTED
  date, and an embedded location map (`apps/admin/src/app/lgu/reports/page.tsx`).
- The ML boundary + "AI Verified (X%)" badge already exist and light up automatically
  from `reports.ml_confidence`/`ml_verified` — the stray detector just needs to write
  those, no UI plumbing (`apps/mobile/src/utils/mlAnalysis.ts` / API `verify-image`).
- The 2026-07-04 notification system already surfaces **stale/abandoned reports** — so an
  un-actioned stray sighting already ages into the admin bell automatically. Freshness is
  half-solved for free.

## v1 — recommended (small, presentational)

1. **Relabel stray-report cards by category.** For `category === 'stray_animal'`, the
   detail panel's "LOCATION"/"SUBMITTED" pair reads **"Last Seen"** with a **relative
   time** ("2 hours ago", "3 days ago") next to the absolute date — relative time is what
   makes staleness obvious at a glance. Other categories keep the current labels
   unchanged. Admin detail panel first (staff triage benefits most); mirror the same
   relative-time line on the mobile tracking screen.
2. **Stray-specific AI badge wording.** Reuse the existing `ml_verified`/`ml_confidence`
   — for a stray report, the green badge reads **"AI Verified — animal detected in photo
   ({conf}%)"**; when `ml_verified === false` (a model ran and found no dog/cat), show a
   neutral amber **"No animal detected — review photo"** flag so staff can spot trolls/
   mis-files. (Pothole keeps "AI Verified (X%)".) This is the anti-troll payoff.
3. A tiny shared `timeAgo()` helper (the bell already has one in
   `NotificationBell.tsx`/`importantNotices.ts` — lift it to `lib/` and reuse).

No schema change, no new dependency. Ships independently of the ML training timeline
(the labels work today; the badge lights up whenever the detector starts writing values).

## Alternatives / how comparable systems do it (for you to consider)

- **A. Stray hotspot map filter (recommended add-on, cheap).** 311-style reporters and
  animal-control/TNR programs care less about one sighting than about **recurring
  locations** (feeding spots, colonies). The admin already has a Leaflet report map —
  add a category filter so the vet office can see stray-animal reports **clustered** and
  spot patterns a single "Last Seen" can't. Low cost (map exists), high real-world value
  for planning patrols/trap-neuter-return. **I'd suggest this as the natural v2.**
- **B. Citizen urgency flag (small, genuinely useful).** Real animal-control triage keys
  on condition — let the citizen optionally tag a stray report **"injured / aggressive"**
  so it jumps the queue. One optional field; maps cleanly onto the existing SLA/priority
  idea. Consider if you want richer triage.
- **C. Multi-sighting "cases" (NOT recommended here).** Lost-pet networks (PawBoost,
  Petco Love Lost, Nextdoor) cluster repeat sightings of *the same animal* into one case
  with a sightings timeline + owner contact. Powerful for reunification, but it's a much
  heavier data model (case entity, sighting-to-case linking, dedup) and pulls AGAPP
  toward being a pet-finder service — scope creep away from "LGU incident reporting."
  Mentioned so you can explicitly rule it out; I'd skip it for the capstone.
- **D. Freshness auto-aging (already mostly free).** Some 311 systems auto-close stale
  reports. AGAPP's notification "needs attention when abandoned/overdue" already covers
  this — a stray sighting nobody acts on surfaces on its own. Nothing to build; just know
  it's there and the "Last Seen … 3 days ago" label reinforces it visually.

## My recommendation
Ship **v1** (the "Last Seen" relabel + stray AI-badge wording) — it's small, honest, and
matches your intent exactly. Then seriously consider **A (hotspot filter)** as v2 since
the map already exists and it's what actual animal-control workflows lean on. Hold off on
C. B is a nice optional extra if you want citizen-driven urgency.

## Files likely touched (v1)
- `apps/admin/src/app/lgu/reports/page.tsx` — category-aware "Last Seen" labels + relative
  time + stray AI-badge wording (+ the amber "no animal detected" state).
- `apps/admin/src/app/personnel/reports/page.tsx` — same relative-time line (staff queue).
- `apps/mobile/src/screens/TrackingDetailScreen.tsx` — "Last Seen" line for stray reports.
- `apps/admin/src/lib/` — extract a shared `timeAgo()` (currently duplicated in the bell).
- (Later, at ML wiring) `mlAnalysis.ts` / API `verify-image` — write `ml_verified`/
  `ml_confidence` for `stray_animal`; if you ever want "Dog" vs "Cat" shown specifically,
  that's the only thing needing a new column (`ml_label text`) — v1 doesn't need it.

## Verification (v1)
- Seed/submit a `stray_animal` report → admin detail shows "Last Seen: [barangay] · N
  hours ago"; a `pothole` report still shows "Location/Submitted" unchanged.
- Force `ml_verified=true` on a stray row → badge reads "animal detected"; set `false` →
  amber "no animal detected" flag; NULL → no badge (unchanged).
- Relative time updates correctly (just now / Nh / Nd); mobile tracking mirrors it.

## Open decisions for you
- v1 only, or v1 + the hotspot map filter (A) together?
- Want the citizen "injured/aggressive" urgency flag (B), or keep it simple?
- Show "animal detected" generically, or "Dog/Cat detected" specifically (the only part
  that needs a small `ml_label` column)?

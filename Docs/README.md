# AGAPP — Project Docs Vault

Working notes for building AGAPP: audits, plans, and task lists.
Separate from the academic paper (those stay in `Manuscript/` and `CAPSTONE/`).

## Structure

| Folder | What lives here |
|---|---|
| `Audits/` | Point-in-time "state of the codebase" reports — what's done, stubbed, broken |
| `Planning/` | Roadmap, feature plans, ML strategy, feasibility analysis — *how we'll build* |
| `Tasks/` | To-do / task tracking — *what's next* |

## Index

**Audits**
- [Codebase-Audit](Audits/Codebase-Audit.md) — ground-truth state of every app/folder
- [Sweep-2026-07-06-Findings](Audits/Sweep-2026-07-06-Findings.md) — 3-agent security/bug sweep: prioritized action plan (§1 insert-forgery is the big one; create-staff regression already fixed)

**Planning**
- [Roadmap](Planning/Roadmap.md) — overall phased build plan + intended tech stack
- [Feasibility-Analysis](Planning/Feasibility-Analysis.md) — feature feasibility + stack rationale
- [Plan-Verification-Feature](Planning/Plan-Verification-Feature.md) — citizen ID verification (in progress)
- [Plan-ML-Pothole-Detection](Planning/Plan-ML-Pothole-Detection.md) — pothole + stray-pets ML: 🟢 both LIVE, verified end-to-end
- [ML-Dataset-Citations](Planning/ML-Dataset-Citations.md) — RSDD (CC BY 4.0) + New Pothole (CC0) + RDD2020 attribution/BibTeX for the manuscript
- [Plan-Admin-Notifications](Planning/Plan-Admin-Notifications.md) — admin notification bell + nav badges (built, v1 + v1.1)
- [Plan-StrayPets-Reporting](Planning/Plan-StrayPets-Reporting.md) — "Last Seen" sighting framing (open) + AI validity badge (shipped 2026-07-06, both ML categories)
- [Plan-eServices-QR-Pickup](Planning/Plan-eServices-QR-Pickup.md) — document requests + QR pickup (built)
- [Plan-Personnel-and-FieldOfficer](Planning/Plan-Personnel-and-FieldOfficer.md) — DECIDED: field-officer app CUT (deleted); personnel-web trio origin
- [Plan-Personnel-Enhancement](Planning/Plan-Personnel-Enhancement.md) — office-based Personnel accounts + scoped UI + front-line trio; ease-of-use for non-technical clerks (draft)
- [Plan-Reporting-Camera-GPS-Hardening](Planning/Plan-Reporting-Camera-GPS-Hardening.md) — mobile report flow: camera-only, auto-GPS, stamped photo (shipped 2026-07-06, not yet device-tested)
- [Plan-Phone-Login-SMS](Planning/Plan-Phone-Login-SMS.md) — 🔵 future: phone-number + SMS OTP login; Semaphore (PH) via Supabase SMS hook is the cost-efficient pick
- [Plan-Mobile-Push-Notifications](Planning/Plan-Mobile-Push-Notifications.md) — push-vs-in-app policy for citizen notifications; biggest gaps: no push on verification approve/reject, no tap-to-navigate (draft)
- [Plan-Mobile-Redesign](Planning/Plan-Mobile-Redesign.md) — citizen app reskin to Brand Kit v2 (self-contained, phased P0–P6; any agent/AI can execute or resume it)

**Tasks**
- [TODO](Tasks/TODO.md) — prioritized outstanding work

## Conventions

- Every plan has a **Status** line at the top. Plans are **living documents** — they
  change as we build. Nothing here is final until shipped.
- Keep entries short and scannable. Link between notes with `[[Note-Name]]` once
  Obsidian is set up.
- Dates are absolute (e.g. `2026-06-29`), not "last week".

_Last updated: 2026-07-06 (fixed the ML "not detected" result being invisible in both
admin report views — a false/null ml_verified rendered nothing, indistinguishable from
the feature not existing; now a tri-state badge for pothole + stray pets — see Codebase-Audit)_

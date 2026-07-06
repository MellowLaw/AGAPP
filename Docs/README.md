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

**Planning**
- [Roadmap](Planning/Roadmap.md) — overall phased build plan + intended tech stack
- [Feasibility-Analysis](Planning/Feasibility-Analysis.md) — feature feasibility + stack rationale
- [Plan-Verification-Feature](Planning/Plan-Verification-Feature.md) — citizen ID verification (in progress)
- [Plan-ML-Pothole-Detection](Planning/Plan-ML-Pothole-Detection.md) — pothole + stray-pets ML: 🟢 both LIVE, verified end-to-end
- [ML-Dataset-Citations](Planning/ML-Dataset-Citations.md) — RSDD (CC BY 4.0) + New Pothole (CC0) + RDD2020 attribution/BibTeX for the manuscript
- [Plan-Admin-Notifications](Planning/Plan-Admin-Notifications.md) — admin notification bell + nav badges (built, v1 + v1.1)
- [Plan-StrayPets-Reporting](Planning/Plan-StrayPets-Reporting.md) — "Last Seen" sighting framing + AI validity badge for stray reports (draft)
- [Plan-eServices-QR-Pickup](Planning/Plan-eServices-QR-Pickup.md) — document requests + QR pickup (built)

**Tasks**
- [TODO](Tasks/TODO.md) — prioritized outstanding work

## Conventions

- Every plan has a **Status** line at the top. Plans are **living documents** — they
  change as we build. Nothing here is final until shipped.
- Keep entries short and scannable. Link between notes with `[[Note-Name]]` once
  Obsidian is set up.
- Dates are absolute (e.g. `2026-06-29`), not "last week".

_Last updated: 2026-07-06 (BOTH ML detectors live — pothole + stray-pets deployed, wired, verified with real photos; admin "AI Verified" badge is real for both — see Codebase-Audit)_

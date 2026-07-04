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
- [Plan-ML-Pothole-Detection](Planning/Plan-ML-Pothole-Detection.md) — pothole + stray-pets ML: datasets, training, connection (draft)
- [Plan-Admin-Notifications](Planning/Plan-Admin-Notifications.md) — admin notification bell (draft)
- [Plan-eServices-QR-Pickup](Planning/Plan-eServices-QR-Pickup.md) — document requests + QR pickup (built)

**Tasks**
- [TODO](Tasks/TODO.md) — prioritized outstanding work

## Conventions

- Every plan has a **Status** line at the top. Plans are **living documents** — they
  change as we build. Nothing here is final until shipped.
- Keep entries short and scannable. Link between notes with `[[Note-Name]]` once
  Obsidian is set up.
- Dates are absolute (e.g. `2026-06-29`), not "last week".

_Last updated: 2026-07-04 (admin "Matte Swiss Brutalist" redesign finalized — header removed, hover-rail sidebar, all pages themed)_

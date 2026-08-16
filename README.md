# AGAPP — Automated Governance and Public Service Platform

A multi-LGU e-governance platform for Philippine LGUs (capstone/thesis project; pilot LGU: Liliw, Laguna). This is the top-level project folder — it holds the actual system plus everything around it (docs, the academic manuscript, design assets).

**If you just want to run the app, skip to [agapp-system/README.md](agapp-system/README.md) — that has the full setup + run instructions.** This file is a map of the repo so you don't go looking for code in the wrong folder.

## What's in this folder

| Path | What it is |
|---|---|
| **`agapp-system/`** | **The actual system.** An npm-workspaces monorepo: citizen mobile app, citizen web portal, LGU/super-admin dashboard, API, shared types, and Supabase schema. |
| `Docs/` | Working docs vault — audits (what's built/broken), plans (features being designed), and a task list. Start at `Docs/README.md`. |
| `Manuscript/`, `CAPSTONE/` | The academic paper. Not code — don't reorganize or treat as source of truth for how the system works (the code and `Docs/` are ground truth; the paper sometimes lags). |
| `Wireframes/`, `AGAPP - ASSETS/`, `MyNagaReference/` | Design references and raw notes, not part of the running system. |
| `CLAUDE.md` | Conventions and gotchas file written for AI coding assistants working in this repo — worth a skim even if you're not using one. |

## Quick orientation for a new co-dev

1. **Clone, then go straight to `agapp-system/`** — that's the repo root as far as running code goes: `cd agapp-system`.
2. Follow **[agapp-system/README.md](agapp-system/README.md)** for prerequisites, environment variables, install, and how to run each app (`dev:mobile` / `dev:citizen-web` / `dev:admin` / `dev:api`).
3. Check **[Docs/README.md](Docs/README.md)** for the current state of features — what's shipped, what's mid-build, what's intentionally deferred.
4. Ask the project lead for the shared `.env` values (Supabase project credentials, Mistral/Roboflow API keys) — these are never committed, and every app fails silently without them.

## The system at a glance

- **Citizen Mobile App (`apps/mobile`)** (Expo / React Native 0.81 / React 19) — report issues with camera + GPS + AI validity check, apply for LGU document services with instant Claim QR pass, browse a town map, use a chatbot, and post in a community forum. Requires 4-step identity verification before submitting.
- **Citizen Web Portal (`apps/citizen-web`)** (Next.js 14 / React 18 / Tailwind) — full desktop and mobile-browser PWA parity with the native app: e-services application with document uploader, community reporting, interactive town map, community forum, and AI assistant chatbot.
- **Admin Web Dashboard (`apps/admin`)** (Next.js 14 / React 18 / Tailwind) — three roles: Super Admin (onboards LGUs across the Philippines, cross-LGU analytics), LGU Admin (manages their town: reports, services, staff, forum moderation, citizen verification), LGU Personnel (front-line staff working the queue).
- **API (`apps/api`)** (NestJS 10) — intentionally thin: only the RAG chatbot endpoint (`POST /api/chatbot/ask`), push notification listener, and a guarded ML endpoint for photo verification. All client apps talk directly to Supabase; Postgres Row-Level Security is the actual multi-tenant security boundary.
- **Supabase Backend (`supabase/`)** (Postgres + PostGIS) — the shared database, storage buckets (`citizen-ids`, `reports`, `service-attachments`), and auth backend for all client apps.

For exact run commands, env var names, and known gotchas, see [agapp-system/README.md](agapp-system/README.md).

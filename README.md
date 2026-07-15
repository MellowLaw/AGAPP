# AGAPP — Automated Governance and Public Service Platform

A multi-tenant e-governance platform for Philippine LGUs (capstone/thesis project;
pilot LGU: Liliw, Laguna). This is the top-level project folder — it holds the actual
system plus everything around it (docs, the academic manuscript, design assets).

**If you just want to run the app, skip to [agapp-system/README.md](agapp-system/README.md)
— that has the full setup + run instructions.** This file is a map of the repo so you
don't go looking for code in the wrong folder.

## What's in this folder

| Path | What it is |
|---|---|
| **`agapp-system/`** | **The actual system.** An npm-workspaces monorepo: citizen mobile app, LGU/super-admin web dashboard, API, shared types, and the Supabase schema. Everything runnable lives here. |
| `Docs/` | Working docs vault — audits (what's actually built/broken), plans (features being designed), and a task list. Start at `Docs/README.md`. This is the most up-to-date source of "what state is the project in" — more current than this file. |
| `Manuscript/`, `CAPSTONE/` | The academic paper. Not code — don't reorganize or treat as source of truth for how the system works (the code and `Docs/` are ground truth; the paper sometimes lags). |
| `Wireframes/`, `AGAPP - ASSETS/`, `MyNagaReference/` | Design references and raw notes, not part of the running system. |
| `CLAUDE.md` | Conventions/gotchas file written for AI coding assistants working in this repo — worth a skim even if you're not using one, since it captures sharp edges. |

## Quick orientation for a new co-dev

1. **Clone, then go straight to `agapp-system/`** — that's the repo root as far as
   running code goes: `cd agapp-system`.
2. Follow **[agapp-system/README.md](agapp-system/README.md)** for prerequisites,
   environment variables, install, and how to run each app (mobile / admin / API).
3. Check **[Docs/README.md](Docs/README.md)** for the current state of features —
   what's shipped, what's mid-build, what's intentionally deferred. It's kept current;
   this root file and the manuscript are not the place to check for that.
4. Ask the project lead for the shared `.env` values (Supabase project credentials,
   Mistral/Roboflow API keys) — these are never committed, and every app fails
   silently without them.

## The system at a glance

- **Citizen mobile app** (Expo/React Native) — report issues (with photo + GPS + an
  on-device-adjacent AI validity check), apply for LGU document services, browse a
  town map, use a chatbot, and post in a community forum. Requires identity
  verification (ID photo + selfie, reviewed by LGU staff) before submitting anything.
- **Admin web dashboard** (Next.js) — three roles: Super Admin (onboards LGUs across
  the Philippines, cross-tenant analytics), LGU Admin (manages their town: reports,
  services, staff, forum moderation, citizen verification), LGU Personnel (front-line
  staff working the queue).
- **API** (NestJS) — intentionally thin: only the chatbot endpoint and a guarded
  ML endpoint for photo verification. Every client app talks to Supabase directly;
  Postgres Row-Level Security is the actual multi-tenant security boundary, not the API.
- **Supabase** (Postgres + PostGIS) — the shared backend for all three apps.

For anything more specific than this — exact run commands, env var names, known
gotchas — see `agapp-system/README.md`, which is kept accurate to the current code.

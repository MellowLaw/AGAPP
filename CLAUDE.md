# CLAUDE.md — AGAPP

Guidance for working in this repo. Keep it accurate; update when things change.

## What this is

**AGAPP** (Automated Governance and Public Service Platform) — a multi-tenant
e-governance platform for Philippine LGUs (capstone/thesis project; pilot LGU:
Liliw, Laguna). Multi-tenancy is by `lgu_id` with Postgres Row-Level Security.

## Repo layout

The **actual system is in `agapp-system/`**. Other top-level folders are docs:

| Path | What |
|---|---|
| `agapp-system/` | The system — npm-workspaces monorepo (see below) |
| `Docs/` | Working docs vault: audits, plans, tasks → start at `Audits/README.md` |
| `Manuscript/`, `CAPSTONE/` | Academic paper (do not treat as code; don't reorganize) |
| `Wireframes/`, `AGAPP-CLEANED/` | Design / raw notes |

### `agapp-system/` workspaces

| Workspace | Stack | Role |
|---|---|---|
| `apps/mobile` | Expo SDK 54, RN 0.81, **React 19**, TS | Citizen app (reports, services, forum, map, chatbot, ID verification) |
| `apps/admin` | Next.js 14 (App Router), **React 18**, Tailwind | LGU + super-admin dashboard |
| `apps/field-officer` | Expo SDK 54, RN 0.81 | Officer task app (minimal) |
| `apps/api` | NestJS 10 + Express | Chatbot, forum moderation, push |
| `packages/shared` | TS + Zod | Shared types (currently under-used) |
| `supabase/` | Postgres + PostGIS + pgvector | Schema, seed, RLS, storage, migrations |

## Running (from `agapp-system/`)

```bash
npm install --legacy-peer-deps   # React 19 + Expo 54 peer-dep mismatches
npm run build:shared             # build packages/shared first
npm run dev                      # API (:5000) + admin (:3000)
npm run dev:api | dev:admin | dev:mobile   # individually
cd apps/mobile && npx expo start --lan     # mobile on a phone (same Wi-Fi)
```

- Mobile deps: use `npx expo install <pkg>` (not `npm install`) for compatible versions.
- After editing `packages/shared`, re-run `npm run build:shared`.

## Architecture facts (important)

- **All three client apps talk directly to Supabase.** The NestJS API is mostly
  bypassed — only the chatbot, forum moderation, and push actually flow through it.
  Consequence: most actions don't create audit logs (logging lives in API controllers).
- Auth: Supabase Auth. Admin login is real (`signInWithPassword`); RLS depends on it.
- LGU ids are slugs like `liliw-laguna`. Map id↔name via `apps/admin/src/lib/lgu.ts`.

## Gotchas

- **`.env` files are required and not committed** (`apps/api/.env`, `apps/mobile/.env`,
  `apps/field-officer/.env`, `apps/admin/.env.local`). Apps fail silently / show no
  data without them.
- **Realtime needs tables in the `supabase_realtime` publication.** It shipped empty, so
  every `postgres_changes` subscriber (push service, forum, notifications, tracking) was
  silently dead until fixed 2026-07-03. If a new realtime feature gets no events, check
  `pg_publication_tables` first — and the poller can lag a minute after `ALTER PUBLICATION`.
- **Free-tier Supabase pauses when idle** — if everything "can't connect", check the
  project isn't INACTIVE and restore it.
- **`@supabase/supabase-js` version split**: mobile/field-officer `2.108`, admin/api
  `2.43`. Align before relying on newer client APIs.
- **React 18/19 split is held together by hoist-blockers** — mobile needs React 19
  (hoisted to root), admin needs React 18. npm ignores yarn's `nohoist`, so the root
  `package.json` pins `react`/`react-dom` 19.1.0 and maps `next`/`styled-jsx` to tiny
  `stubs/*` placeholder packages; that forces npm to nest the real `next`, `styled-jsx`,
  `react`, `react-dom`, and `@types/react*` (all React 18) inside `apps/admin/node_modules`
  so `next build` never mixes React instances. Admin's `tsconfig.json` additionally maps
  `react`/`react-dom` type imports to the nested `@types` and sets `"types": ["node"]`
  so hoisted packages type-check against React 18. Don't remove the stubs, the root
  react pins, or the tsconfig paths — and re-check `apps/admin/node_modules` placements
  after dependency changes.
- **Pothole ML is currently faked** — `ReportsScreen.tsx` hardcodes `ml_confidence`.
  See `Audits/Planning/Plan-ML-Pothole-Detection.md`.
- **No tests exist** anywhere; `any` types are common. Don't assume coverage.

## Conventions

- Match the surrounding file's style (inline presentational helpers, theme tokens `T.*`).
- Plans/tasks/audits live in `Docs/` — update them when state changes.
- Prefer fixes that don't introduce new bugs; keep ML inference behind one boundary
  so model/dataset/on-device-vs-server can be swapped easily.

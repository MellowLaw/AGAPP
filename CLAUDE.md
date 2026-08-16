# CLAUDE.md — AGAPP

Guidance for working in this repo. Keep it accurate; update when things change.

## What this is

**AGAPP** (Automated Governance and Public Service Platform) — a multi-LGU e-governance platform for Philippine LGUs (capstone/thesis project; pilot LGU: Liliw, Laguna). LGU data separation is by `lgu_id` with Postgres Row-Level Security.

## Repo layout

The **actual system is in `agapp-system/`**. Other top-level folders are docs:

| Path | What |
|---|---|
| `agapp-system/` | The system — npm-workspaces monorepo (see below) |
| `Docs/` | Working docs vault: audits, plans, tasks → start at `Docs/README.md` |
| `Manuscript/`, `CAPSTONE/` | Academic paper (do not treat as code; don't reorganize) |
| `Wireframes/`, `AGAPP - ASSETS/` | Design / raw notes |

### `agapp-system/` workspaces

| Workspace | Stack | Port | Role |
|---|---|---|---|
| `apps/mobile` | Expo SDK 54, RN 0.81, **React 19**, TS | :8081 | Citizen mobile app (reports, services, forum, map, chatbot, ID verification) |
| `apps/citizen-web` | Next.js 14 (App Router), **React 18**, Tailwind, TS | :3001 | Citizen Progressive Web Portal (mobile-parity web experience, full PWA) |
| `apps/admin` | Next.js 14 (App Router), **React 18**, Tailwind, TS | :3002 | LGU Admin, Super Admin, and Frontline Personnel command dashboard |
| `apps/api` | NestJS 10 + Express | :3000 | RAG Chatbot (`/api/chatbot/ask`) + push notifications + Roboflow ML verification |
| `packages/shared` | TS + Zod | — | Shared types & utilities (`reportCategoryLabel`, constants, schemas) |
| `supabase/` | Postgres + PostGIS | — | Schema, seed, RLS, storage buckets (`citizen-ids`, `reports`, etc.), RPCs |

## Running (from `agapp-system/`)

```bash
npm install --legacy-peer-deps        # React 19 + Expo 54 peer-dep mismatches
npm run build:shared                  # build packages/shared first
npm run dev                           # API (:3000) + citizen-web (:3001) + admin (:3002)
npm run dev:api                       # NestJS API only (:3000)
npm run dev:citizen-web               # Citizen Web portal only (:3001)
npm run dev:admin                     # Admin dashboard only (:3002)
npm run dev:mobile                    # Expo Metro bundler
cd apps/mobile && npx expo start --lan # mobile on a physical phone (same Wi-Fi)
```

- Mobile deps: use `npx expo install <pkg>` (not `npm install`) for compatible versions.
- After editing `packages/shared`, re-run `npm run build:shared`.

## Architecture facts (important)

- **All client apps talk directly to Supabase.** The NestJS API carries ONLY the chatbot (`POST /api/chatbot/ask`), the push service (realtime listener), and the guarded `POST /api/reports/verify-image` ML slot. Postgres Row-Level Security (RLS) is the actual multi-tenant security boundary.
- **Port Allocation**: API runs on `:3000`, Citizen Web on `:3001`, Admin on `:3002`, Metro on `:8081`.
- **Identity & Access Control Matrix (1:1 Parity on Mobile & Citizen Web)**:
  - **Guest (`!user`)**: Read-only access to Home, News, Map, Guides, Services Catalog, and Forum discussions. Attempting gated actions (Services apply, Report file, Forum post/like/comment, Profile, My Requests) triggers the animated `<AuthGate />` (`sign-up-animation.json`).
  - **Unverified Citizen (`user && !isVerified`)**: Services Apply form shows solid amber notice with `"Verify to Submit"` button routing to `/verify`. Report form requires verification. Forum post modal button shows `"Verify to Post"`. Profile and Home render the `"Unverified Citizen"` status card.
  - **Verified Citizen (`user && isVerified`)**: Unrestricted access to submit service applications, generate instant Claim QR tickets, file reports with GPS & photo evidence, and publish forum discussions.
  - **Restricted (`moderation_status === 'restricted'`)**: Full access to essential public safety & basic services; forum interactions (posting, liking, commenting) are locked in real-time.
  - **Banned (`moderation_status === 'banned'`)**: Immediate security lockout via real-time listener routing to the `/banned` countdown & appeal screen.
- **Identity Verification Flow**:
  - 4-step wizard: ID type selection + photo &rarr; Residency declaration + street address &rarr; Live facial selfie &rarr; Review & RA 10173 Data Privacy consent.
  - Photos are uploaded directly to the private `citizen-ids` Supabase storage bucket (`<lgu_id>/<user_id>/id_front_<timestamp>.jpg`).
  - Submits via `submit_verification_request` RPC, setting `users.verification_status = 'pending'`.
- **Lottie Mascot Assets**:
  - `ai-floating.json`: Floating assistant mascot above BottomNav (only rendered on Home `/`, hidden on `/chatbot`).
  - `chatbot-message.json`: Animated assistant avatar above bot messages and thinking state.
  - `sign-up-animation.json`: Animated sign-up companion on all `<AuthGate />` screens.

## Gotchas

- **`.env` files are required and not committed** (`apps/api/.env`, `apps/mobile/.env`, `apps/admin/.env.local`, `apps/citizen-web/.env.local`). Copy the corresponding `.example` files.
- **Realtime needs tables in the `supabase_realtime` publication.** Tables: `users`, `reports`, `service_requests`, `forum_posts`, `forum_comments`, `forum_post_likes`, `notifications`. If a realtime listener fails to fire, verify `pg_publication_tables`.
- **Free-tier Supabase pauses when idle** — if connection errors occur across apps, restore the project in the Supabase dashboard.
- **React 18/19 split is held together by hoist-blockers** — mobile needs React 19 (hoisted to root), while admin and citizen-web need React 18. Root `package.json` pins `react`/`react-dom` 19.1.0 and maps `next`/`styled-jsx` to `stubs/*` placeholder packages. Do not remove the stubs or tsconfig type mappings.
- **Pothole + stray-pets ML are live** (Roboflow Hosted). `verify-image` writes real `ml_confidence`/`ml_verified`. Admin report views render a tri-state badge (detected, not detected, not analyzed).
- **No tests exist** anywhere; `any` types are common.

## Conventions

- Match the surrounding file's style (design tokens `T.*`, theme classes `bg-surface`, `bg-card`, font classes `Octarine-Bold`, `Inter-Medium`).
- Keep docs and audits in `Docs/` synchronized with code changes.
- Never use emojis in municipal assistant suggestions or official status badges.

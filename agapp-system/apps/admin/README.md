# AGAPP — LGU & Super-Admin Command Dashboard

> **Workspace**: `apps/admin`  
> **Tech Stack**: Next.js 14 (App Router), React 18, Tailwind CSS, TypeScript, Supabase JS  
> **Default Port**: `3002` (`http://localhost:3002`)

The Admin Command Dashboard provides three role-based operational surfaces for multi-LGU governance:
1. **Super Admin**: Nationwide LGU onboarding, multi-tenant analytics, and global audit oversight.
2. **LGU Admin**: Municipal management across departments, staff assignment, citizen moderation, and service catalog configuration.
3. **LGU Personnel**: Front-line queue operations for document processing, QR claim validation, and incident triage.

---

## 🏛️ Key Capabilities

1. **Citizen Verification & Moderation Desk (`/lgu/citizens`)**:
   - Review uploaded government IDs and live facial selfies from `citizen-ids` storage bucket.
   - 1-click Approve (`verification_status = 'verified'`), Reject (with custom rejection note), Restrict (`moderation_status = 'restricted'`), or Ban (`moderation_status = 'banned'`) via `moderate_citizen` RPC.
   - Review submitted citizen appeals via `resolve_citizen_appeal` RPC.
2. **Incident Triage & Field Dispatch (`/lgu/reports`, `/personnel/reports`)**:
   - Live tri-state Roboflow ML verification badges (Detected, Not Detected, Not Analyzed).
   - Interactive map pinpointing, status updates (Pending &rarr; Acknowledged &rarr; In Progress &rarr; Resolved), and contractor resolution photo upload.
3. **E-Services Management & Document Inspector (`/lgu/services`)**:
   - Service request queues with attached document preview drawer for citizen-uploaded requirement files.
   - In-person QR code scanner & claim code lookup via `lookup_claim_code` and `release_service_request` RPCs.
4. **Community Moderation Desk (`/lgu/forum`)**:
   - Flagged content inspection, automated profanity filter review (`check_forum_profanity` trigger), and thread resolution.

---

## 🤖 Context for AI Agents & Developers

- **Role Routing Boundaries**:
  - `/super/*`: Strictly accessible only to `role === 'SUPER_ADMIN'`.
  - `/lgu/*`: Strictly accessible only to `role === 'LGU_ADMIN'` (scoped to their `profile.lgu_id`).
  - `/personnel/*`: Strictly accessible to `role === 'LGU_PERSONNEL'` (frontline queue triage).
  - Protected via `apps/admin/src/middleware.ts` with Supabase session cookie validation.
- **Direct Supabase Architecture**:
  - Admin does NOT make proxy calls through the NestJS API for database mutations; it talks directly to Supabase with PostgreSQL RLS enforcement.
  - Server-side actions that create staff accounts use `SUPABASE_SERVICE_ROLE_KEY` inside Next.js Server Actions / API routes.
- **React 18 / 19 Split**:
  - Admin requires **React 18** (Next.js 14). Root `package.json` uses `stubs/*` placeholders to force npm to nest React 18 in `apps/admin/node_modules`. Do NOT delete `stubs/` or remove tsconfig type mappings.

---

## 🛠️ Development & Environment

```bash
# From agapp-system/
npm run dev:admin
```

Create `.env.local` from `.env.local.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/public key>
NEXT_PUBLIC_API_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret-key>
PORT=3002

# Demo Quick Login (base64-encoded passwords)
DEMO_SUPERADMIN_PASSWORD_B64=
DEMO_LGUADMIN_PASSWORD_B64=
DEMO_PERSONNEL_PASSWORD_B64=
```

# Plan — Citizen ID Verification (end-to-end)

> **Status:** 🟡 In progress · code-side hardening done, DB migration + live test pending
> **Updated:** 2026-06-29 · _Living document — can change as we build._

## Goal

A citizen submits ID + selfie on mobile → it appears in the LGU admin's
verification queue → admin approves/rejects → the citizen's `verification_status`
updates and unlocks gated features (e.g. Services).

## Why this came up

The user's concern *"admin maybe works but isn't connected"* traced to this
feature. Investigation found:
- `.env` files exist for all apps — connectivity is fine.
- Admin login is real Supabase auth, so RLS works once logged in.
- **Root cause:** `supabase/verification_setup.sql` is a new file that was not yet
  applied to the live DB → the table/RPC/bucket didn't exist → queue looked empty.
- Separately: the live Supabase project was found **paused/INACTIVE** (free tier),
  which blocks all connections until restored.

## The pieces

| Layer | File |
|---|---|
| Mobile submit | `agapp-system/apps/mobile/src/screens/VerifyIdentityScreen.tsx` |
| DB schema/RPC | `agapp-system/supabase/verification_setup.sql` |
| Admin review | `agapp-system/apps/admin/src/app/lgu/verifications/page.tsx` |
| LGU id helper | `agapp-system/apps/admin/src/lib/lgu.ts` |

## Done (code) ✅

- Mobile submit: cleans up orphaned uploads on failure; friendly message when RLS
  rejects the insert (LGU mismatch).
- Admin: collapsed per-request user lookup into one `.in()` query (no N+1).
- Extracted `lib/lgu.ts` as the single source of truth for `lgu_id ↔ name`; used by
  both the login page and verifications page.
- Both apps typecheck clean (`tsc --noEmit`).
- Skipped rewriting the image upload — it already mirrors the proven `ReportsScreen`
  pattern, so changing it would add risk for no gain.

## Remaining (needs the live DB)

1. **Restore the Supabase project** (it was paused).
2. **Apply the migration** — paste `supabase/verification_setup.sql` into the
   Supabase SQL Editor and run (idempotent, no reset needed). Confirm it created
   `verification_requests`, `verify_citizen()`, and the private `citizen-ids` bucket.
3. **Test end-to-end** — citizen submits on mobile → row + 2 images land →
   admin Liliw sees it under Pending with images → approve → citizen becomes verified.

## Definition of done

- Submit creates a row + two non-empty files; forced failure leaves no orphans.
- Admin queue shows the request, renders both signed images, approve/reject updates
  both the request and the user row.
- A second submit while one is pending is cleanly blocked with a friendly message.

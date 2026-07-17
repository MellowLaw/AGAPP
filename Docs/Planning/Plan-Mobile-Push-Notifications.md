# Plan — Citizen mobile push notifications: what should push vs. stay in-app only

> **Status:** 🔵 Draft for review · not started in code · _living doc._
> **Updated:** 2026-07-06
> **Scope:** Citizen-facing mobile notifications only (staff already get their own
> in-app-only bell — unaffected by this plan). Decide push-vs-in-app policy, then a
> short list of real technical gaps to close.

## Current state (verified in code)

- **Delivery:** `apps/api/src/push/push.service.ts` listens to `notifications` INSERTs
  via Supabase realtime and pushes (Expo push SDK) to any row with a `user_id` set —
  i.e. **every citizen-targeted row currently triggers a push, with no type-based
  filtering and no user opt-out check.** Staff rows (`audience` set, `user_id` null)
  are correctly skipped — staff only ever see the in-app bell.
- **Only two citizen notification types exist today**, both DB triggers on status
  change: `report_status` (any `reports.status` transition) and `service_status` (any
  `service_requests.status` transition, with per-status body text).
- **Two real functional gaps, not a policy question:**
  1. **No notification at all when ID verification is approved/rejected** — `verify_citizen()`
     updates `users.verification_status` but never inserts into `notifications`. This is
     the single most consequential missing notification: it's the one event that unlocks
     (or blocks) a citizen's ability to use the app at all.
  2. **Tapping a push does nothing** — no `addNotificationResponseReceivedListener` exists
     anywhere in the mobile app. The server does send `data.notificationId`, so the hook
     point exists; the client never listens for a tap and never navigates anywhere.
- **No per-citizen push opt-out.** `users.notification_preferences` (`{push,sms,email}`)
  exists but is only read/written by the **staff** settings pages — nothing on the
  citizen side reads it, and `push.service.ts` doesn't check it before sending.
- Foreground handler (`NotificationsScreen.tsx`) shows alert/sound/banner identically
  for every notification — no distinction between "worth interrupting for" and "just log it."
- In-app: `NotificationsScreen.tsx` lists a citizen's own rows (RLS-scoped), with a
  one-time unread-count badge on the Home bell (not live-decremented).

## Recommended policy — what pushes vs. what stays in-app only

The guiding rule: **push = "this needs your attention or changes what you should do
next"; in-app-only = "here's an update, check whenever."** For a low-volume civic app
(a citizen has maybe a handful of active reports/requests at once), erring toward
pushing status changes is fine — the current behavior of pushing every status
transition is actually reasonable and shouldn't be throttled. The real work is filling
gaps and adding restraint only where a type is genuinely spammy or low-stakes.

| Event | Recommendation | Why |
|---|---|---|
| Report status → **Resolved** / **Rejected** | ✅ Push | Terminal outcome — the payoff/closure moment they're waiting for. |
| Report status → Under Review / In Progress | ✅ Push (keep as-is) | Low volume per citizen; each transition is meaningful reassurance ("someone's on it"). Not spammy at this scale — don't over-engineer a "quiet middle states" rule. |
| Service request → **Ready for Pickup** | ✅ Push, and make it the most prominent one | This is the highest-value push in the whole app — it's a real-world errand with an implicit deadline (uncollected docs age into the abandoned-request notice). |
| Service request → Released / Rejected | ✅ Push | Terminal outcome. |
| Service request → Under Review / In Progress | ✅ Push (keep as-is) | Same reasoning as reports. |
| **ID verification approved** | ✅ **Push — NEW, highest-priority gap to close** | Unlocks reporting/services/forum; a citizen has no other way to know except re-opening the app and checking. |
| **ID verification rejected** | ✅ **Push — NEW** | They need to know now, with the reason, so they can fix and resubmit. |
| Reply to **your own** forum post/comment | 🟡 In-app only for v1 (push is a nice-to-have later) | Social/lower-stakes; not currently implemented at all — don't build push for a feature that doesn't exist yet. Add the in-app notification first if forum engagement becomes a priority. |
| Routine LGU news/announcement | ❌ In-app / Home feed only, never push | Town news isn't urgent per-citizen and would be the most spam-prone category by far. |
| **Urgent/pinned** announcement (e.g. weather advisory, office closure) | 🟡 Push, but only if a LGU admin explicitly flags it urgent | Real civic value (safety-relevant), but must be an explicit opt-in flag per post, not automatic — otherwise it becomes the news case above. Treat as a v2 feature, not required now. |
| A citizen's own new report/request being received | ❌ No notification at all (keep as-is) | They just did it themselves; the in-app "Reference: REP-2026-xxxx" confirmation already tells them. Confirmed intentionally absent today — correct, don't add. |
| Chatbot "couldn't answer, contact office" | ❌ No notification | Not a real ticket system today; out of scope. |

## Technical gaps to close (the real work, in priority order)

1. **Verification approved/rejected notification (highest priority).** Add an
   `INSERT INTO notifications` inside `verify_citizen()` (or a trigger on
   `verification_requests`/`users` around the same transaction) — `type:
   'verification_approved'` / `'verification_rejected'`, `user_id` = the citizen,
   body includes the rejection reason when applicable.
2. **Tap-to-navigate.** Add `Notifications.addNotificationResponseReceivedListener`
   in the mobile app (alongside the existing foreground handler) that reads
   `data.notificationId`, looks up that notification's `type` + a subject id, and
   navigates: `report_status`/`service_status` → `TrackingDetail`; verification
   types → the Profile/verification status screen; anything unrecognized → the
   Notifications list as a safe fallback. This requires the server to include a
   `subject_id` (report/request/verification id) in the push `data` payload, not
   just `notificationId` — small addition to `push.service.ts`.
3. **Citizen push opt-out.** Add a simple "Push notifications" toggle to
   `ProfileScreen.tsx` (mirrors the pattern already built for staff settings) writing
   `users.notification_preferences.push`; `push.service.ts` checks that flag before
   sending (SMS/email flags stay unused — no SMS/email sender exists, don't build
   those paths, just don't block on the unused keys).
4. **Foreground display restraint (small, optional).** Since all current types are
   already "should push," this is low priority now — revisit only if/when a
   lower-stakes type (e.g. forum replies) is added, at which point the foreground
   handler should stay quiet (no sound/banner) for those specifically.

## Explicitly out of scope for this pass
- SMS/email notifications (no provider wired; `notification_preferences.sms/.email`
  stay decorative until that's built — see `Plan-Phone-Login-SMS.md` if SMS ever
  happens, that'd be the natural place to also wire notification SMS).
- Forum push notifications (only in-app, and only if/when forum engagement becomes
  a stated priority).
- Urgent-announcement push (v2 — needs an admin-facing "mark urgent" UI first).
- Rate limiting / quiet hours — current volume per citizen is low enough not to need it.

## Files likely touched
- `supabase/schema.sql` (or a migration) — `verify_citizen()` notification insert;
  richer `data` payload from the two existing status triggers if not already
  including a subject id (check `notify_report_status_change`/`notify_service_status_change`
  bodies — confirm whether `payload`/`data` already carries the report/request id
  before assuming it needs adding).
- `apps/api/src/push/push.service.ts` — include `subject_id`/`type` in the push
  `data`; check `notification_preferences.push` before sending.
- `apps/mobile/src/utils/push.ts` or `App.tsx` — register the tap-response listener.
- `apps/mobile/src/screens/ProfileScreen.tsx` — push toggle.
- `apps/mobile/src/navigation/AppNavigator.tsx` — confirm/adjust the navigation
  target used by the tap handler exists and is reachable from a cold start (app
  opened via tapping a push while fully closed, not just backgrounded).

## Verification
- Force a report/request status change → push arrives (physical device required;
  Expo Go pushes don't fully work in a simulator) → tapping it opens `TrackingDetail`
  for that exact item.
- Approve then reject a test verification → both produce a push with the right
  wording (including reason on reject) → tapping opens the right screen.
- Toggle the citizen's push preference off → force a status change → confirm no
  push arrives but the in-app notification + badge still update (in-app must never
  depend on the push toggle — they're independent).
- Cold-start tap: fully close the app, receive a push, tap it → app opens directly
  to the right screen, not just to Home.

## Open decisions for you
- Priority order: verification notification + tap-to-navigate first (recommended,
  they're real gaps), or the citizen push toggle first (privacy-nice but lower
  functional impact)?
- Is a forum-reply in-app notification worth adding in this pass, or deferred until
  forum engagement is actually a focus?
- Any other event you specifically want pushed that isn't listed above (e.g. a
  reminder if a "Ready for Pickup" item sits uncollected — ties into the existing
  abandoned-request aging logic in `importantNotices.ts`, could reuse that as a
  scheduled nudge later)?

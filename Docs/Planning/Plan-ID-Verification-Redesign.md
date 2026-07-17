# Plan — ID verification redesign: ID-first autofill, custom selfie UI

> **Status:** 🟢 Built (2026-07-06), device-test fixes (2026-07-17), simplified
> (2026-07-17) — back-of-ID capture and the two-shot "blink twice" liveness
> check were both dropped; single front-only ID photo + single selfie.
> DB, API, and mobile all implemented and typecheck clean.
> **Updated:** 2026-07-17
> **Scope:** Redesign the mobile citizen ID-verification flow (`VerifyIdentityScreen.tsx`).
> Companion note: the submission bug shown in the review-step screenshot
> ("municipality doesn't match your account") was a **separate, already-fixed**
> issue — the client did two racy, un-verified sequential requests instead of one
> atomic server call; see `submit_verification_request()` RPC, applied 2026-07-06.
> This plan is the forward-looking redesign the user asked for next.

## Simplified 2026-07-17

Dropped, per explicit request ("get rid of the back, and the blink selfie"):

- **Back-of-ID capture** — `requiresBack` removed from `ID_TYPES`; every ID
  type is now front-photo only. `id_back` step, its state/handlers, and the
  `id_document_back_path` column + RPC param are gone.
- **Two-shot "blink twice" liveness check** — single selfie capture only, no
  shot1→shot2 flow, no `liveness_passed`/`liveness_checked_at` columns, no
  `POST /api/verification/check-liveness` endpoint (deleted from
  `apps/api/src/app.controllers.ts` — it was never wired to a real vendor
  anyway, always returning "not analyzed").
- `submit_verification_request()` RPC is back to its original 5-arg signature
  (`p_lgu_id, p_id_type, p_id_document_path, p_selfie_path,
  p_declared_barangay`) — old 7-arg overload dropped live via migration
  `simplify_verification_drop_back_photo_and_liveness`, confirmed exactly one
  overload remains via `pg_proc`.
- **Photo retention after a decision:** citizen ID + selfie photos are now
  deleted from the `citizen-ids` storage bucket immediately after an LGU admin
  approves or rejects a request (`purgeVerificationPhotos()` in
  `apps/admin/src/app/lgu/verifications/page.tsx`, best-effort, never blocks
  the decision). This needed a new storage RLS policy — LGU_ADMIN/SUPER_ADMIN
  previously had no DELETE policy on `citizen-ids` at all (only the file
  owner did) — added via migration `add_staff_delete_policy_citizen_ids`.
  Rationale: RA 10173 (Data Privacy Act) data-minimization — once a human
  decision is recorded, there's no ongoing need to retain the actual ID scan;
  the verification record (status, verified barangay, dates, rejection
  reason) is what's retained for audit, not the source images. Tradeoff,
  stated plainly: if a decision is later disputed or a fraud pattern needs
  re-investigation, the original photos are gone — only the metadata trail
  remains. The admin review UI's image panels now show "Photo deleted after
  verification" (not an error) once a decision has been made.
  **Not retroactively applied** — one pre-existing test request (rejected,
  `nagcarlan-laguna`) still has live photos in storage from before this
  change; flagged to the user rather than deleted without asking.

## Device-test fixes (2026-07-17)

First real-phone test surfaced four issues, all root-caused and fixed in
`GuidedCapture.tsx` / `VerifyIdentityScreen.tsx` / `utils/verification.ts`:

1. **Guide box vs. captured photo misalignment** — flagged by the user as
   suspected but not yet isolated to a specific line; the crop-frame math in
   `getGuideFrame()`/the capture handler is the next place to instrument if a
   further device pass still shows drift. No code change made for this one
   yet — needs a repro (a captured photo alongside the guide overlay) to
   pin down before touching the transform math blind.
2. **Giant pink pill on "Grant camera access"** — `styles.reviewBtn` (has
   `flex: 1`, meant for a two-button row in the review footer) was reused
   inside a plain centered column, so `flex: 1` stretched it to fill all
   remaining vertical space. Fixed: new dedicated `styles.permissionBtn`
   (fixed height, no flex) used for that button instead.
3. **Selfie mirroring** — `expo-camera`'s `CameraView.mirror` already
   defaults to `false` (confirmed in the library's own type defs); made
   explicit (`mirror={false}`) for clarity. No mirroring bug was present in
   this prop specifically — if a flipped selfie still shows up on a real
   device, the cause is elsewhere (e.g. a front-camera preview illusion vs.
   the actual saved file) and needs a fresh repro.
4. **Capture doesn't work (second selfie shot)** — root cause: `<GuidedCapture>`
   in `VerifyIdentityScreen.tsx` had no `key` prop, so switching
   `activeCapture` from `'selfie1'` to `'selfie2'` re-rendered the *same*
   component instance instead of remounting it — the review screen from shot
   1 stayed on screen instead of returning to a live camera. Fixed by adding
   `key={activeCapture}`, forcing a fresh mount per capture stage. Also added
   `onCameraReady` gating (shutter disabled until the native camera session
   reports ready) and a visible error toast on capture/crop failure (previously
   a silent `console.warn`) — a likely secondary cause if the shutter was
   tapped before the camera was truly ready.
5. **"Add National ID"** — PhilSys ID / PhilID *is* the Philippine National ID
   (PhilSys = Philippine Identification System, the government's National ID
   program); adding a separate `ID_TYPES` entry would have created a
   confusing duplicate for the same physical card. Resolved by relabeling the
   existing entry to `"National ID (PhilSys / PhilID)"` instead — no new
   `value`, so no DB `CHECK` constraint change needed.

**Still open / needs another device pass:** the guide-box/output alignment
(#1) and any residual mirroring report (#3) — both need an actual captured
photo from a phone to diagnose further; nothing more can be verified from
static code reading alone.

## The three asks, and the one constraint that shapes all of them

1. **Reorder: ID document first, then residency — auto-filled from the ID scan.**
   Today the flow is Residency → ID → Selfie → Review, with the citizen typing
   their address by hand. Wanted: capture the ID first, extract text from it (OCR),
   and pre-fill the address fields — citizen reviews/corrects rather than typing
   from scratch.
2. **Selfie: a custom in-app camera UI, not the OS camera app — and no gallery upload.**
   Today `captureImage()`/`pickFromLibrary()` both launch `ImagePicker`'s native
   camera/library UI for the selfie, same as the ID photo. Wanted: a live camera
   preview rendered *inside* the app (with an on-screen face guide/instructions),
   camera-only (drop `pickFromLibrary` for the selfie — mirrors the camera-only
   decision already made for report photos in `ReportsScreen.tsx`).
3. **"Blink twice" liveness check** during the selfie step — proves a live person
   is present, not a photo of a photo.

**The deciding constraint:** this app has no `expo-dev-client` and no
`react-native-vision-camera` — it runs on **plain Expo Go**. True real-time blink
detection (continuously analyzing camera frames for eye-open/closed state) needs a
frame-processor library (`react-native-vision-camera` + a face-detector plugin),
which is a **native module Expo Go can't load** — adopting it means every
dev/co-dev has to switch from `npx expo start` to building/installing a custom dev
client (`eas build --profile development` or `expo prebuild`), a real workflow
change for the whole team, not just this screen. Given the project's own priority
("easy to use," "don't do unnecessary things that add complexity") and that no
other part of the app has made this jump yet, **recommend NOT doing that** for v1.

## Recommended approach per ask

### 1. Reorder + OCR autofill
- New step order: **ID document → Residency (autofilled) → Selfie → Review.**
- **OCR: a hosted API call through a guarded server endpoint — NOT an on-device
  ML Kit-style package.** This is a revision from an earlier draft of this plan
  (which suggested on-device text recognition): on-device OCR bindings are
  native modules, and adopting one would force the exact custom-dev-client
  migration this plan otherwise argues against for liveness — undermining that
  whole argument. Routing OCR through a hosted API keeps it JS/`fetch()`-only,
  Expo-Go-safe, and gives the redesign **one consistent architecture across all
  three CV features** (pothole/stray-pet ML, OCR, liveness): a guarded NestJS
  endpoint calling a hosted model, mirroring `verify-image` exactly.
  **Concrete pick: OCR.space** (real free tier, simple REST API — POST an
  image, get text back) as the starting point; Google Cloud Vision as the paid
  upgrade path if accuracy on PH IDs proves insufficient. Verify current
  pricing/limits at signup — rates change.
- **Realistic framing (important, put this in the manuscript too):** Philippine
  IDs have wildly inconsistent formats across types (PhilSys, UMID, Postal ID,
  Driver's License, etc.) — generic OCR extracts raw text lines, it doesn't
  "know" which line is the address. v1 scope: run OCR, then a small per-ID-type
  heuristic (keyword/regex matching — e.g. lines containing barangay/city
  keywords, or positional heuristics for that ID type) to **guess** the address
  and **pre-fill the existing editable fields** — never auto-submit un-reviewed.
  The current Residency step is already fully editable (cascading dropdowns +
  manual fallback + free-text street/zip) — that's the safety net: OCR failure
  degrades gracefully to "just type it," exactly like today, not a hard blocker.
- Don't chase perfect extraction — the honest goal is "saves typing when it
  works, never worse than today when it doesn't."

### 2. ID capture: camera-only + guided overlay + auto-crop review (decided)
- **Camera-only, no gallery** — matches the selfie decision and the existing
  `ReportsScreen.tsx` precedent. This matters more here than anywhere else in
  the app: a gallery-picked "ID" could be a screenshot, an old photo, or
  someone else's document entirely — exactly the fraud vector ID verification
  exists to prevent.
- **Guide overlay**: a semi-transparent mask with a cutout sized to the
  standard ID-1 card ratio (~1.586:1 — PhilSys/UMID/driver's license are all
  this size), corner brackets, and an instruction line ("Align your ID within
  the frame"). No new dependency — an absolutely-positioned overlay `View` on
  top of `expo-camera`'s `CameraView`.
- **Auto-crop, not manual drag-crop**: since the guide already told the citizen
  exactly where the ID sits, crop to that rectangle automatically right after
  capture via `expo-image-manipulator` (official Expo package — Expo-Go-safe,
  no dev-client needed), then show the result through the **same Retake / Use
  this photo review pattern already built for the stamped report photo** —
  reuse, don't invent a new interaction for this.
- **Build one reusable "guided capture" component**, parameterized by guide
  shape (oval for the face in step 3, rounded-rect for the card here), instead
  of two bespoke camera screens — the ID and selfie steps need the same
  underlying camera+overlay+crop+review mechanics.

### 3. Front/back — the app decides, not the citizen
> **SUPERSEDED 2026-07-17** — back-of-ID capture was dropped entirely (see
> "Simplified 2026-07-17" above). Kept below for history only.
- Today `ID_TYPES` (`apps/mobile/src/utils/verification.ts`) has no front/back
  concept at all. Add a `requiresBack: boolean` per entry.
- **Don't ask the citizen to pick "front or back" — remove the decision
  entirely.** After capturing the front (guide + auto-crop + review as above),
  if that ID type's `requiresBack` is true, the flow automatically continues
  straight into "Now capture the back" with the identical guide/crop/review
  treatment — no branching choice presented to the user.
- One short inline line the first time ("You'll capture the front, then the
  back") is enough orientation — not a separate tutorial screen.
- **Confirm which of the current `ID_TYPES` actually require a back photo
  against real current ID samples/official references before hardcoding** —
  don't guess from memory, formats and which fields print where can change.

### 4. Custom selfie camera UI, camera-only
- Same treatment as the ID step's guided capture (§2), reusing the shared
  component: full-screen `expo-camera` `CameraView`, an oval face-guide overlay
  instead of the rectangle, themed shutter button, on-screen instructions —
  replacing `ImagePicker.launchCameraAsync`'s OS camera chrome.
- Drop `pickFromLibrary` for the selfie step entirely (camera-only, per §2's
  reasoning — a gallery selfie could be an old photo of someone else).

### 5. Blink-twice liveness — recommended v1 approach (given the Expo Go constraint)
> **SUPERSEDED 2026-07-17** — the two-shot liveness check was dropped entirely
> (see "Simplified 2026-07-17" above); single selfie capture only. Kept below
> for history only.
**Two-still comparison, not continuous frame analysis:**
- The custom `CameraView` UI guides the citizen through two captures a couple
  seconds apart: "Look at the camera" (shot 1) → "Now blink" (shot 2) — a timed
  on-screen prompt, not real-time frame tracking.
- Detect eye state (open vs. closed) on each still via the **same hosted-ML
  pattern already used for pothole/stray-pet detection** — a face-landmark /
  eye-state model call through the existing `verify-image`-style API boundary
  (Roboflow hosts a face-landmark/eye-state model, or a general face-detection
  hosted API is used analogously). Compare: shot 1 eyes-open + shot 2 eyes-closed
  (or vice versa) ⇒ liveness pass; both identical ⇒ fail, ask to retry.
- **Why this over real-time frame liveness:** stays on plain Expo Go (matches
  every other part of this app — no dev-client migration for the whole team),
  reuses an architecture pattern that already exists and is well-understood in
  this codebase (server-side hosted inference behind one boundary, per
  CLAUDE.md's own convention), and is honestly framed in the manuscript as
  "two-frame liveness verification" rather than overclaiming production-grade
  continuous liveness detection.
- **Alternative (noted, not recommended for v1):** `react-native-vision-camera`
  + a face-detector frame processor for true continuous blink tracking — higher
  fidelity, but requires the dev-client migration above. Revisit only if the
  team is already planning that migration for other reasons.

## Files likely touched
- `apps/mobile/src/screens/VerifyIdentityScreen.tsx` — step reorder, a new shared
  guided-capture component (ID front/back + selfie, all reuse it), OCR-autofill
  wiring, two-shot liveness capture flow.
- `apps/mobile/src/utils/verification.ts` — add `requiresBack` to `ID_TYPES`.
- `apps/mobile/package.json` — `expo-image-manipulator` (auto-crop; official
  Expo package, Expo-Go-safe). No OCR/vision native package — OCR and liveness
  are both hosted API calls, not client dependencies.
- `apps/api/src/app.controllers.ts` (or new endpoints alongside `verify-image`) —
  two new guarded endpoints following the exact `verify-image` pattern
  (client-supplied photo URL validated as this project's own storage, server
  calls the hosted model, never fabricates a result): one for OCR text
  extraction, one for the eye-state/liveness comparison.
- `supabase/verification_setup.sql` — if liveness result should be recorded
  (e.g. `verification_requests.liveness_passed boolean`) for staff visibility/audit.

## Explicitly out of scope for v1
- Real-time continuous frame-by-frame blink tracking (needs the dev-client
  migration — a separate, larger decision for the whole app, not just this screen).
- Guaranteed-accurate OCR across every PH ID type — framed as best-effort autofill
  with full manual editability as the fallback, not a hard requirement.
- Face-matching the selfie against the ID photo's face (a *different*, harder CV
  problem than liveness) — not asked for here; note it as a possible future
  enhancement, not part of this pass.

## Verification (once built)
- Capture an ID first → OCR runs → residency fields show a pre-filled (editable)
  guess; a poor-quality/unsupported ID photo still lets the citizen type manually,
  exactly like today.
- Selfie step shows the custom in-app camera view (no OS camera launches, no
  gallery/library option present).
- Two-shot flow: keeping eyes open for both shots → liveness fails, clear retry
  prompt; blinking between shots → liveness passes → proceeds to Review.
- Full flow still ends at the (already-fixed) atomic `submit_verification_request`
  RPC — no regression there.
- No device/simulator in this environment — flag that visual/camera behavior
  needs a real phone to confirm, same caveat as prior camera work this session.

## Decided (2026-07-06, this conversation)
- **ID photo: camera-only**, matching the selfie — resolved, no longer open.
- **OCR: hosted API (OCR.space to start), not an on-device package** — resolved
  in favor of staying architecture-consistent and Expo-Go-safe (see §1).
- **Front/back: app-driven sequential capture via a `requiresBack` flag**, not a
  user-facing choice or a tutorial screen — resolved (see §3).

## Open decisions for you
**Moot as of 2026-07-17** — liveness and back-photo capture were both dropped
(see "Simplified 2026-07-17" above), so the three items originally listed here
(liveness vendor choice, whether a failed liveness check should block
submission, and which `ID_TYPES` need a back photo) no longer apply.

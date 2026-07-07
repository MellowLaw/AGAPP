# Plan — Mobile reporting: camera-only, auto-GPS, stamped photo

> **Status:** 🟢 SHIPPED (2026-07-06) — all three built in `ReportsScreen.tsx`,
> `tsc --noEmit` clean; not yet run on a physical device/simulator this session.
> **Updated:** 2026-07-06
> **Scope:** Three changes to the citizen report flow (`apps/mobile/src/screens/ReportsScreen.tsx`),
> all anti-fraud / usability hardening. No admin or schema changes needed for v1.

## The three asks (user's, all sound)

1. **Stamp the location onto the photo** — like a "GPS Map Camera" overlay: the captured
   pothole/stray photo carries a baked-in caption (place name, coordinates, timestamp)
   so the evidence is self-describing.
2. **Automatic GPS** — stop requiring a manual "tap to fetch location" press. The app
   should acquire the citizen's location on its own, and **block submission** if location
   is off/denied. (This is about the app's own location, not the camera's.)
3. **Camera-only, no gallery upload** — remove the "Photo Library" option. A citizen must
   take a *live* photo; letting them pick an existing image is exploitable (old, downloaded,
   or unrelated photos → fake reports).

## Current state (verified in code 2026-07-06)

- `takePhoto()` (camera) **and** `choosePhoto()` (gallery) both exist; `handleAttachPhotoPress()`
  shows an action sheet offering both. ← #3 removes the gallery path.
- `getLocation()` runs **only when the user taps** the "Pin your current location" card. ←
  #2 makes this automatic.
- There's already a **15 km geofence check** at submit (`getDistanceFromLatLonInKm` vs
  `selectedLgu` center) and location is already mandatory (`if (!location) …`). Good — #2
  builds on this, doesn't replace it.
- Photo is uploaded raw (`report-photos` bucket), no overlay. ← #1 adds the stamp before upload.
- Installed already: `expo-location`, `expo-image-picker`, `react-native-maps`, `expo-camera`.
  **Not** installed: `react-native-view-shot`, `expo-image-manipulator` (needed for #1).

## ⚠️ One honest framing point (matters for the manuscript + defense)

The photo stamp is **documentary/deterrent, not a security control.** The overlay text is
just pixels drawn from the device's own GPS — it can be wrong or, in principle, forged. The
reference screenshot the user shared is itself proof: it labels a Cape Canaveral shuttle
launch as *"West Hollywood, Florida"* — the overlay and the real place disagree. So:

- **The real anti-fraud chain is: camera-only capture (#3) + live device GPS + the existing
  15 km geofence + the ML photo-validity check.** The stamp (#1) makes a report *look*
  trustworthy and gives staff at-a-glance context; it is not what makes it trustworthy.
- In the paper, describe #1 as "contextual geotag watermark for reviewer convenience,"
  **not** as tamper-proofing. Overclaiming it is the kind of thing a panel probes.

## v1 — as built (2026-07-06)

### #3 Camera-only — done
- `choosePhoto()` and the "Photo Library" action-sheet branch are deleted;
  `handleAttachPhotoPress` is gone entirely — the photo card's `onPress` calls `takePhoto()`
  directly. Only `ImagePicker.launchCameraAsync` is reachable now.
- Copy updated: "PHOTO EVIDENCE (MANDATORY — LIVE CAMERA ONLY)" section label, "Live camera
  only — required to prevent false/troll reports" helper text.

### #2 Automatic GPS — done
- `useFocusEffect` (from `@react-navigation/native`, already a dependency) fetches location
  on first mount and every re-focus, keyed off `selectedLgu?.id` so a guest changing towns
  gets a fresh fix too. No more tap-to-fetch.
- Status card states: fetching (spinner, "Getting your location…") · locked (green icon,
  reverse-geocoded address, existing mini-map) · denied (red border/icon, "Location is off",
  inline **Settings** button calling `Linking.openSettings()`).
- Removed the old permission/error `Alert.alert`s from `getLocation()` — since it now runs
  automatically on every focus, alerting on every denial would spam the user; the inline
  card conveys the state instead. Submit-time validation still explains clearly via Alert
  when the citizen actually tries to submit (denied → Settings prompt; not-yet-fetched →
  "please wait" + a retry trigger).
- The location card stays tappable as the manual refresh path (plan's "keep a small manual
  refresh"), and a fresh fix is re-triggered automatically after a successful submission
  instead of leaving the field blank.
- `reverseGeocodeAsync()` wrapped in its own try/catch with a `selectedLgu?.name` fallback —
  confirmed correct field names (`street`, `subregion`, `city`, `region`, `name`) against the
  installed `expo-location` types.

### #1 Stamped photo — done, one deliberate design change from the original plan
- **Dropped `expo-image-manipulator` from the dep list.** It can only crop/resize/rotate/flip —
  it cannot draw text. `react-native-view-shot` (installed) is the only piece actually needed.
- **Built an on-screen "review" step instead of an off-screen/hidden composing view.** The
  original idea (compose off-screen, capture invisibly) is a well-known source of blank-image
  bugs in `react-native-view-shot` — a view that's never actually laid out/rendered doesn't
  reliably rasterize on all devices. Instead: after the camera returns a photo, it goes into
  `rawCaptureUri` and a **visible preview card** renders the exact composite (photo + caption
  bar: reverse-geocoded place, `Lat/Long`, timestamp) with **Retake** / **Use This Photo**
  buttons. Tapping "Use This Photo" calls `captureRef()` against that already-rendered,
  already-loaded view. This is more reliable *and* gives the citizen a natural confirm step
  before the photo is finalized — a small UX upgrade over the original hidden-capture idea.
- Guarded correctly: `takePhoto()` refuses to open the camera at all if `location` isn't
  locked yet (prompts "waiting for GPS" and triggers a fetch instead) — the stamp can never
  be created without real coordinates.
- Capture failure doesn't dead-end the citizen: falls back to the unstamped raw photo with a
  toast, rather than leaving `imageUri` unset and the submit button permanently blocked.

## Files touched
- `apps/mobile/src/screens/ReportsScreen.tsx` — all three changes.
- `apps/mobile/package.json` — one new dep, `react-native-view-shot` (via `expo install`).
- No `app.json` permission changes needed (camera + location were already declared).

## Verification done this session
- `tsc --noEmit` in `apps/mobile` — clean, exit 0, after each of the three changes and again
  at the end.
- Confirmed `captureRef`'s actual type signature in the installed package
  (`captureRef<T>(viewRef: number | ReactInstance | RefObject<T>, options?)`) accepts a
  `RefObject` directly — matches how it's called.
- Full read-through of the final file for dangling references (old `choosePhoto`/
  `handleAttachPhotoPress` calls — none found) and closure/stale-state risks (the
  `useFocusEffect` dependency array, the `takePhoto`/`retakePhoto`/`confirmStampedPhoto`
  interaction, the stamp-failure fallback).
- **Not done this session (no device/simulator available in this environment):** an actual
  on-device run. Have your co-dev pull and test the full flow — camera-only capture, the
  auto-GPS states (including denying permission and using the Settings button), the stamp
  preview/retake/confirm step, and a submitted report's photo showing the correct caption in
  admin (`lgu/reports`) with coordinates matching `reports.latitude/longitude`.
- Geofence (>15km rejection) is untouched and still applies.

## Out of scope / later
- Map thumbnail in the stamp (v1.1).
- EXIF-based tamper detection / server-side re-geocode verification (heavier; the camera-only
  + geofence chain already covers the realistic threat for a capstone).
- Continuous `watchPositionAsync` tracking — one-shot on focus + manual refresh is enough.

## Open decisions for you
- Stamp: text-only caption for v1 (recommended), or hold the feature until the mini-map
  thumbnail is in too?
- If location permission is permanently denied, hard-block reporting (recommended, matches
  "GPS required") or allow a degraded report flagged low-credibility? **Recommend hard-block —
  a report with no location isn't actionable for an LGU.**

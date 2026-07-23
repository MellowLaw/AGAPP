# Face verification — in-process Node (setup & how it works)

> **Status:** 🟢 Working, verified end-to-end (2026-07-23).
> **What this covers:** the AI face-match that compares a citizen's ID photo to
> their selfie during identity verification. It is an **advisory hint for the
> LGU admin** — the human still makes the approve/reject call; the AI never
> auto-decides and never blocks a submission.

## What changed (2026-07-23)

The face match used to run in a **separate Python service** (`apps/ai-sidecar/`,
FastAPI + InsightFace/ArcFace). That was the only part of the whole system that
wasn't Node/TypeScript — a second language, a second process, a ~30 MB model
download, and it needed native build tools to run.

It now runs **in-process inside the NestJS API** on the pure-JS
`@tensorflow/tfjs` CPU backend + `@vladmandic/face-api`. No Python, no separate
service, no native compilation. The Python `ai-sidecar/` directory was deleted.

Why pure-JS `@tensorflow/tfjs` and not the faster `@tensorflow/tfjs-node`:
tfjs-node needs a native binary that has no prebuilt for Node 22 and otherwise
requires Visual Studio C++ build tools — friction the whole point of this change
was to remove. The pure-JS backend installs with a plain `npm install` on any
OS/Node version. It's slower per comparison, but this runs async, off the
submission path, so speed doesn't matter here.

## How it works (end to end)

1. In the mobile app, after the citizen captures their **ID photo** and
   **selfie**, the app creates two short-lived signed URLs and POSTs them to
   `POST /api/verification/analyze`.
2. The NestJS API validates both URLs are this project's own `citizen-ids`
   storage, downloads both images, and runs — in-process —
   face detection + descriptor comparison, a blur check, and a
   duplicate-detection hash. It returns
   `{ faceScore, confidenceScore, phash, flags, processingMs }`.
3. The mobile app stores that result in the `verification_ai_results` table when
   the citizen submits.
4. When an LGU admin opens the verification to review, the admin page shows a
   **confidence bar + face score + any flags** (e.g. `FACE_MISMATCH`,
   `IMAGE_TOO_BLURRY_SELFIE`) as guidance. The admin still decides.
5. **It never blocks.** If the API is down, slow, or no face is detected, the
   endpoint returns nulls ("not analyzed") and verification proceeds normally.

Verified behaviour: same person → `faceScore ≈ 1.0`, no flags; two different
people → `faceScore ≈ 0.18` + `FACE_MISMATCH`. First call after the API starts
takes ~25–30 s (one-time model load, cached after); later calls are faster.

## Setup — what a developer needs after pulling

1. `git pull`
2. From `agapp-system/`: **`npm install --legacy-peer-deps`** — pulls the four
   new pure-JS deps (`@tensorflow/tfjs`, `@vladmandic/face-api`, `jpeg-js`,
   `pngjs`). No build tools, works on any OS.
3. **Make sure the model files came through the pull.** The three model nets
   (~12 MB total) live in `agapp-system/apps/api/models/` and MUST be committed
   to git — code without them makes the endpoint return `FACE_MODEL_NOT_LOADED`.
   Files: `ssd_mobilenetv1_model-*`, `face_landmark_68_model-*`,
   `face_recognition_model-*` (each a `-weights_manifest.json` + a `.bin`).
4. **No new environment variable is required.** Face analysis needs no API key,
   no URL, no secret. (Optional: `FACE_MODELS_DIR` only if you move the models
   folder somewhere else.)

## How to test

- Run the API (`npm run dev` or `npm run dev:api` from `agapp-system/`).
- In the mobile app, go through identity verification (capture ID + selfie,
  submit). On a physical phone, `EXPO_PUBLIC_API_URL` in the mobile `.env` must
  point at the API machine's **LAN IP**, not `localhost`.
- Open that request in the admin **Verifications** page → the AI confidence bar
  and any flags appear. That's the whole loop.

## Caveats / known issues

- **Speed:** ~25–30 s on the first comparison (model load), faster after. Fine
  for an advisory hint that runs off the critical path.
- **face-api version pin:** `@vladmandic/face-api`'s Node build hardcodes a
  `require("@tensorflow/tfjs-node")` internally, so the service uses a tightly
  scoped Node module-loader hook (`Module._load`, installed and restored around
  one `require`) to redirect that to the pure-JS `@tensorflow/tfjs`. It's
  documented in `face-analysis.service.ts`. If a future face-api **major**
  version breaks it, the endpoint just returns `FACE_MODEL_NOT_LOADED` (nothing
  else breaks) — so **pin `@vladmandic/face-api`** and re-check that shim before
  upgrading it.
- **Blur threshold** (`BLUR_VARIANCE_THRESHOLD` in the service) was set
  conservatively and hasn't been tuned against real submissions yet.
- **Privacy:** IDs and selfies never leave your infrastructure — the whole
  reason this stayed self-hosted rather than a hosted face API. Keep it that way
  for the manuscript's RA 10173 story.

## Files

- `agapp-system/apps/api/src/verification/face-analysis.service.ts` — the service.
- `agapp-system/apps/api/src/app.controllers.ts` — `VerificationController.analyzeVerification` endpoint.
- `agapp-system/apps/api/models/` — committed model weights (~12 MB).
- `agapp-system/supabase/patches/07_verification_ai_results.sql` — the results table + RLS.

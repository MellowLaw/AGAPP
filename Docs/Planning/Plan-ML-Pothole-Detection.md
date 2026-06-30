# Plan — Pothole Detection ML

> **Status:** 🔵 Draft / strategy · not started in code · _not final, can change as we build._
> **Updated:** 2026-06-29

## What the paper already commits to (Chapter 2 RRL)

- **On-device** YOLOv8n (nano), trained via transfer learning on **RDD2020**
  (Arya et al., 2021), fine-tuned with ~100–200 local Liliw pothole images.
- Exported to **TensorFlow Lite, INT8 quantized, <5MB**, runs on mid-range Android
  (as little as 3GB RAM). No extra server infra.
- Used **only for the Pothole category**, as a **confidence-assist warning** at
  capture time (warns if below threshold; does not hard-block).

This is a sound, defensible scope. Keep it.

## Current reality (the problem to fix)

The app **fakes** this: `apps/mobile/src/screens/ReportsScreen.tsx` hardcodes
`ml_confidence: 0.95, ml_verified: true` and the UI claims "YOLOv11". The paper says
YOLOv8n. **Top priority: make the on-device detector real** — thesis integrity
depends on it, and the code/paper model names must be reconciled.

## Dataset decision

- **RDD2020 / RDD2022** (`sekilab/RoadDamageDetector`) is the right base — it's the
  cited IEEE benchmark. ✅
- **Caveat:** RDD is crack-dominated; potholes (class D40) are a minority → weaker
  pothole recall if used alone.
- **Recommended:** RDD as backbone **+** a pothole-specific set (Roboflow Universe /
  Kaggle "Pothole-600") **+** local Liliw images. Aim for 300–500 local if possible.

## Core architectural principle

> **One tiny model on the phone. Everything heavier on the server.**

- The paper's design (1 nano model, INT8, single-image inference, pothole only) is
  already light — it will not lag the app.
- Do **not** add more on-device models (per-category detectors, NSFW scan, etc.) —
  each adds MB + RAM + battery + latency.
- Any *additional* ML (e.g. troll/legitimacy check for all report types) belongs
  **server-side in the NestJS API** (currently underused), run async after submit,
  writing a credibility flag for admins. Zero cost to the app bundle.

## Keep it swappable

Put the inference behind one boundary — the report screen asks *"is there a pothole
here, and how confident?"* and doesn't care if the answer comes from on-device TFLite
or a server API. Then changing model/dataset, or moving on-device → server, touches
one spot, not the whole feature.

## What's easy vs costly to change later

- **Easy:** dataset, model variant (any small TFLite-exportable detector), on-device
  vs server — if kept behind the boundary above.
- **Costly:** abandoning on-device pothole ML entirely → requires editing the
  manuscript (Chapter 2 commits to it in detail). Prefer keeping it; soften wording
  only if on-device integration can't be finished in time.

## Rough build steps (when we start)

1. Assemble dataset (RDD2020 pothole subset + pothole-specific + local).
2. Train/fine-tune YOLOv8n (Colab); evaluate precision/recall (needed for the paper).
3. Export → TFLite INT8; verify <5MB.
4. Integrate via `react-native-fast-tflite` (the finicky part — budget time).
5. Replace the hardcoded `ml_*` in `ReportsScreen.tsx` with real model output +
   the confidence-threshold warning flow (already described in the paper's Figure 14).

**Fallback if on-device is too hard before deadline:** server-side inference still
gives *real* ML; just adjust the "fully on-device" wording in the paper.

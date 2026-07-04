# Plan — ML Detection (Pothole + Stray Pets)

> **Status:** 🔵 Strategy + actionable dataset/training/connection guide · not started in code · _living doc._
> **Updated:** 2026-07-04
> **Scope:** Two detectors — **pothole** (road damage) and **stray pets** (dog/cat) —
> used to help the admin judge whether a citizen report's photo is **valid** (does the
> photo actually contain the thing being reported). Drives the existing admin
> "AI Verified" badge (`reports.ml_confidence` / `reports.ml_verified`).

---

## 0. Honest framing (read first)

- **Goal = photo-validity verification, NOT stray-vs-owned classification.** No
  legitimate dataset can teach a model "stray vs. pet" — that's context (collar, leash,
  owner nearby), not appearance. Promise only: *"the photo verifiably contains a
  pothole / a dog or cat."* That's exactly what the `verify-image` boundary + the
  "AI Verified" badge were built for, and it's defensible in the manuscript.
- **Drainage/canal and damaged-pole reports: no ML for now** (per your direction).
  Only pothole + stray-pets get a model. The boundary already no-ops the rest.
- **Train once, deploy either way.** Training a YOLOv8n model produces `best.pt`.
  From that one file you can go on-device (TFLite) *or* server-side (ONNX / Roboflow
  hosted). The training below is shared; only §4 (connection) differs.

---

## 1. Datasets — all verified downloadable + licensed (2026-07-04)

### Pothole
| Dataset | What / size | License | Download |
|---|---|---|---|
| **RDD2022** (backbone, cited benchmark) | 47,420 road images, 6 countries; **pothole = class D40**, 6,544 pothole instances in 3,674 images | **CC BY-SA 4.0** ✅ (verified) | figshare: https://figshare.com/articles/dataset/RDD2022_-_The_multi-national_Road_Damage_Dataset_released_through_CRDDC_2022/21431547 (click "Download all" — ~11 GB; the pothole subset is what you keep) |
| **Kaggle "Potholes-Detection-YOLOv8"** (easy, YOLO-ready) | Pothole images already in YOLOv8 label format | Kaggle open (check the dataset's stated license on the page) | https://www.kaggle.com/datasets/anggadwisunarto/potholes-detection-yolov8 |
| **Roboflow Universe pothole sets** (YOLO-ready, in-browser) | e.g. "RDD" ~9,888 pothole imgs; "Road Safety" ~3,319 | Per-dataset — **check each one's license before use** | https://universe.roboflow.com/search?q=class:pothole |
| **Local Liliw/Nagcarlan (self-collected)** — the accuracy booster | 200–400 phone photos of real local roads, annotated free in Roboflow | Yours | You capture; this is what makes it work on PH roads in the demo, and is a legit thesis contribution |

> **Why local matters:** PH asphalt, lighting, and pothole shape differ from
> Japan/Norway imagery. A Cebu YOLOv8 pothole study did exactly this (≈800 self-captured
> Cebu road photos + an online set) — https://www.joig.net/2024/JOIG-V12N4-417.pdf.
> There is **no public PH-specific pothole dataset with a clear license** (checked), so
> self-collection is the intended path, not a shortcut.

### Stray pets (dog / cat)
| Option | What | License | Download |
|---|---|---|---|
| **COCO-pretrained YOLOv8n (baseline, ZERO training)** | Ultralytics `yolov8n.pt` already detects `dog` + `cat` out of the box with high accuracy | AGPL-3.0 (model) | `pip install ultralytics` → `YOLO('yolov8n.pt')`. For "is there a dog/cat in this photo," this alone may be enough. |
| **Oxford-IIIT Pet** (fine-tuning) | ~7,390 images, 37 breeds (25 dog + 12 cat), head bounding boxes + trimaps | **CC BY-SA 4.0** ✅ (verified, commercial/research OK) | https://www.robots.ox.ac.uk/~vgg/data/pets/ → `images.tar.gz` + `annotations.tar.gz` (direct) |
| **Roboflow "Stray Animal Detection"** (YOLO-ready) | ~859 dog/cat street images + a pretrained model | Per-dataset — check license | https://universe.roboflow.com/rep-rxi6f/stray-animal-detection |

> **Recommendation for stray pets:** start with the **COCO-pretrained baseline** — it
> likely satisfies the validity goal with no training at all. Only fine-tune on Oxford
> Pet / Roboflow if the demo shows misses on PH street scenes (and to have a training
> methodology to write about).

---

## 2. Where to train (you can run your PC 24/7)

**Primary: Google Colab (free T4 GPU).** YOLOv8n on a few thousand images trains in
~1–3 hours — well inside Colab free's ~12h session cap. Your 24/7 PC keeps the browser
tab alive so it doesn't idle-disconnect. Use the official Roboflow notebook (handles
dataset download + training + export):
- https://colab.research.google.com/github/roboflow-ai/notebooks/blob/main/notebooks/train-yolov8-object-detection-on-custom-dataset.ipynb

**Dataset hosting/annotation: Roboflow (free workspace).** Upload RDD2022 pothole
subset + your local photos, annotate/merge, and **export in "YOLOv8" format** — it
generates the `data.yaml` the Colab notebook needs. This is where your self-collected
Liliw images get labeled.

**Roboflow Train (optional, one-click cloud):** trains on Roboflow's servers using
limited free "training credits" (~3). Fine for a first model, but Colab is unlimited and
free — prefer Colab for iteration, keep Roboflow for dataset + (optionally) deployment.

**Local PC training (only if your PC has an NVIDIA GPU):** `pip install ultralytics`
then `yolo detect train model=yolov8n.pt data=data.yaml epochs=100 imgsz=640`. Unlimited
time, fully offline — good if you're iterating a lot. CPU-only works for the nano model
but is slow; Colab's free GPU is easier.

**Standardize on YOLOv8n** (nano) — matches the manuscript, exports cleanly to
TFLite/ONNX, tiny. (Also resolves the stale "YOLOv11 vs YOLOv8n" mismatch — old code
comments say YOLOv11; the paper says YOLOv8n; **use YOLOv8n everywhere**.)

---

## 3. Training output → what you get

From Colab/local you get `runs/detect/train/weights/best.pt`. From that:
- **TFLite (on-device path):** `yolo export model=best.pt format=tflite int8=True` → a
  small (<5 MB target) quantized model.
- **ONNX (server path):** `yolo export model=best.pt format=onnx`.
- **Roboflow hosted (easiest server path):** upload `best.pt` to your Roboflow project
  (`project.version(N).deploy(model_type="yolov8", model_path="runs/detect/train/")`)
  and it's served at a URL instantly.

Capture **precision / recall / mAP** from training — the manuscript needs these numbers.

---

## 4. How to connect it to AGAPP (the "so we can use it" part)

AGAPP already has the wiring stubs in place. Two deployment paths — **you can train once
and do either or both.**

### Path A — Server-side (RECOMMENDED to get a working "AI Verified" badge fastest)
Runs after the citizen submits, on the photo already uploaded to Supabase Storage,
and writes the result back so the admin badge lights up. No app-bundle bloat, no native
module pain.

**Where it plugs in:** `apps/api` (NestJS) `POST /reports/verify-image` — the endpoint
already exists and currently returns nulls. The mobile app already uploads the report
photo to the `report-photos` bucket and gets a public URL.

**Flow:** mobile submits report → calls `verify-image` with `{ photoUrl, category }`
→ API runs the pothole model if `category==='pothole'`, the dog/cat model if
`category==='stray_animal'`, else no-op → API writes `ml_confidence` + `ml_verified`
onto the `reports` row → admin `lgu/reports` "AI Verified ({conf}%)" badge appears.

Two sub-options for the actual inference:
- **A1 — Roboflow Hosted Inference (simplest, no model hosting).** After deploying
  `best.pt` to Roboflow, call it from NestJS:
  `POST https://serverless.roboflow.com/<MODEL_ENDPOINT>/<VERSION>?api_key=<KEY>` with
  the image. Free tier is per-call (fine for a capstone demo). SDK/curl docs:
  https://docs.roboflow.com/inference/hosted-api · repo: https://github.com/roboflow/inference
  ⚠️ Needs internet + a Roboflow API key in `apps/api/.env` (server-only, never public).
- **A2 — Self-hosted ONNX in NestJS (no external calls, no per-call limit).** Bundle the
  exported `.onnx` and run it with `onnxruntime-node`. More setup, but fully in-house and
  offline-capable on the server. Better if you dislike depending on Roboflow's uptime/quota.

### Path B — On-device TFLite (matches the manuscript's Chapter 2 claim exactly)
Runs in the phone at capture time, offline, no server. This is what the paper currently
commits to ("on-device YOLOv8n, TFLite INT8, <5 MB").

**Where it plugs in:** `apps/mobile/src/utils/mlAnalysis.ts` — the boundary is already
there (`analyzeReportPhoto(category, imageUri)` returns `{confidence, verified}`; today
it returns nulls). Load the TFLite model via **`react-native-fast-tflite`** and return
real values for `pothole` / `stray_animal`.
⚠️ **Requires a custom Expo dev client** — Expo Go can't load native TFLite modules.
This is the finicky, time-boxed part; budget for it.

### Recommendation
Train once in Colab. **Do Path A1 first** (Roboflow hosted → NestJS → badge) — fastest
route to a real, demoable "AI Verified" result across the admin panel. If time allows and
you want the paper's on-device claim intact, add **Path B**. Whatever actually ships,
state it accurately in the manuscript (don't claim on-device if only the server runs).

---

## 5. Manuscript reconciliation (thesis integrity)
- **Model name:** paper says YOLOv8n; old code comments say "YOLOv11". Use **YOLOv8n**
  everywhere.
- **Dataset:** paper cites RDD2020; **RDD2022 is the licensed successor/superset** — cite
  RDD2022 (Arya et al., 2024, *Geoscience Data Journal*,
  https://rmets.onlinelibrary.wiley.com/doi/10.1002/gdj3.260). CC BY-SA 4.0 requires
  attribution + share-alike — cite it and you're compliant.
- **Deployment wording:** if you ship server-side (Path A) instead of on-device (Path B),
  soften the "fully on-device" wording. Server-side is still *real* ML — only the
  location changes.
- **Stray pets:** frame as *photo-validity verification via a COCO-pretrained (optionally
  Oxford-Pet-fine-tuned) YOLOv8n dog/cat detector*, not stray classification.

---

## 6. Build steps (when we start)
1. Roboflow workspace: upload RDD2022 pothole subset + local Liliw photos; annotate; export YOLOv8 format.
2. Colab: train YOLOv8n (pothole). Capture precision/recall/mAP. Repeat for dog/cat only if the COCO baseline underperforms.
3. Export `best.pt` → (A1) deploy to Roboflow hosted, or (A2) ONNX, or (B) TFLite INT8.
4. Path A: implement inference call in `apps/api` `verify-image`; write `ml_confidence`/`ml_verified` to the report; trigger it after submit. Verify the admin "AI Verified" badge lights up on a real pothole photo and stays absent on a random photo.
5. (Optional) Path B: integrate TFLite in `mlAnalysis.ts` via `react-native-fast-tflite` + custom dev client.

## Sources
- RDD2022 dataset — https://figshare.com/articles/dataset/RDD2022_-_The_multi-national_Road_Damage_Dataset_released_through_CRDDC_2022/21431547 · license via https://datasetninja.com/road-damage-detector · paper https://rmets.onlinelibrary.wiley.com/doi/10.1002/gdj3.260
- Oxford-IIIT Pet — https://www.robots.ox.ac.uk/~vgg/data/pets/
- Roboflow stray animal — https://universe.roboflow.com/rep-rxi6f/stray-animal-detection · pothole sets https://universe.roboflow.com/search?q=class:pothole
- Kaggle pothole YOLOv8 — https://www.kaggle.com/datasets/anggadwisunarto/potholes-detection-yolov8
- Colab notebook — https://colab.research.google.com/github/roboflow-ai/notebooks/blob/main/notebooks/train-yolov8-object-detection-on-custom-dataset.ipynb
- Roboflow hosted inference — https://docs.roboflow.com/inference/hosted-api · https://github.com/roboflow/inference
- Cebu PH YOLOv8 pothole study — https://www.joig.net/2024/JOIG-V12N4-417.pdf

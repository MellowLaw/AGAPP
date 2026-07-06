# Plan — ML Detection (Pothole + Stray Pets) — Step-by-Step Execution Guide

> **Status:** 🟢 BOTH detectors LIVE (2026-07-06) — pothole (fine-tuned) and stray pets
> (stock COCO dog/cat, filtered) both deployed to Roboflow Hosted, wired into
> `verify-image`, and verified end-to-end with real photos.
> **Updated:** 2026-07-06
> **Scope:** Two detectors — **pothole** (train a model) and **stray pets** (dog/cat —
> start with a pretrained model, zero training). Both feed the existing admin
> "AI Verified" badge via `reports.ml_confidence` / `ml_verified`.

## ✅ Pothole — LIVE, verified end-to-end with a real test image (2026-07-06)

- **Model trained on Kaggle** (RSDD CC BY 4.0 + New Pothole Detection CC0, ~15.4k
  images merged, YOLOv8n, `patience=20` early stop). `best.pt` verified as a genuine,
  correctly-labeled checkpoint (`DetectionModel` architecture, `names={0:'pothole'}`).
- **Deployed to Roboflow Hosted**: project `mrlaws-workspace/agapp-y5jbd`, model
  selected as the active deployment. Confirmed inference URL:
  `https://serverless.roboflow.com/agapp-y5jbd/1`.
- **Code wiring done, typechecks/boots clean, verified live:**
  - `apps/api/src/app.controllers.ts` `ReportController.verifyImage` — real Roboflow
    call for `category === 'pothole'`, guarded (`@UseGuards(SupabaseAuthGuard)`,
    confirmed: unauthenticated call → `401`). Missing env config → nulls, never
    fabricates a value. Native Node 22 `fetch`, no new dep. Confidence sent as a
    **0–1 fraction** (not 0–100 — an initial `confidence=40` was wrong).
  - `apps/mobile/src/utils/mlAnalysis.ts` — `analyzeReportPhoto()` calls
    `POST /reports/verify-image` for real (was a local stub). Same
    `Authorization: Bearer <access_token>` pattern as `ChatbotScreen.tsx`.
  - `apps/mobile/src/screens/ReportsScreen.tsx` — **bug fixed in passing**: was
    passing the photo's local device URI to the ML boundary instead of the
    uploaded Supabase public URL — would've silently broken once inference needed
    a fetchable URL. Fixed.
- **End-to-end test result:** fed the deployed model a real pothole photo from the
  training set — correctly detected **two potholes at 0.63/0.61 confidence**,
  response shape matches the NestJS parsing logic exactly. Nothing left to build.

### 🪲 Real bugs hit during deploy — useful if you ever retrain/redeploy
1. Roboflow's `deploy()` requires the exact pinned `ultralytics==8.0.196` — a fresh
   `pip install ultralytics` grabs a newer version and gets rejected with a
   version-mismatch prompt (say **n**, reinstall the pinned version, **restart the
   kernel** so the old import doesn't linger, then retry).
2. `deploy()` defaults to expecting weights at `<model_path>/weights/best.pt`
   (Ultralytics' standard run-folder shape) — if your checkpoint doesn't have that
   `weights/` wrapper, pass `filename="best.pt"` explicitly instead of restructuring
   folders.
3. Roboflow's export **writes** a `model_artifacts.json` sidecar next to the
   weights — this fails with a read-only filesystem error if `model_path` points
   into Kaggle's `/kaggle/input/` (always read-only). Copy the checkpoint into
   `/kaggle/working/` first, deploy from there.
4. **The actual blocker on first live test:** a freshly created Roboflow project's
   deployment has **no "selected model" by default**, even after a model
   successfully finishes training/uploading — the Deployments page shows
   "Current Model: None" until you explicitly pick one. Fixable via the Roboflow
   MCP's `project_deployment_set_model`, or manually via the dashboard's Models tab.
5. Double-check `.env` isn't still holding the literal `.env.example` **placeholder
   text** (`your-project-slug`) — this, not a bad API key, caused the first live
   test to 404 with "resource not found."

## ✅ Stray pets — LIVE (2026-07-06)
Stock COCO-pretrained `yolov8n.pt` (detects `dog`=16 / `cat`=15 out of the box, zero
training) deployed to Roboflow Hosted as vessel project `mrlaws-workspace/agapp-stray-pets`
version 2. `verify-image` now handles `stray_animal` via the `ML_MODELS` category map,
**filtering predictions to dog/cat only** — a photo is "verified" iff it verifiably
contains a dog or cat (breed/identity irrelevant; the anti-troll validity check from
`Plan-StrayPets-Reporting.md`). New env var `ROBOFLOW_STRAYPETS_MODEL_URL`. Verified live:
dog photo → `dog` @0.49 → `mlVerified:true`; a people/bus photo → filtered to zero
dog/cat → `mlVerified:false`. §3 below is the original recipe (kept for reference).
**Deploy gotcha:** don't `YOLO()`-load the stock weights in your own Kaggle cell just to
re-save them — the pinned `ultralytics==8.0.196` + modern PyTorch `weights_only` default
throws unpickling errors, and monkey-patching `torch.load` recurses on cell re-runs. The
file is already a finished artifact: `urllib.request.urlretrieve` the official
`yolov8n.pt` and hand the folder straight to Roboflow's `deploy()`, which loads it right.

---

## ▶️ YOU ARE HERE (2026-07-05) — datasets downloaded, go straight to Colab

The user has already chosen + downloaded **two** pothole datasets (in `Datasets/`, YOLOv8
format). §2 below (search-and-pick) is DONE — these are the concrete picks:

| Dataset | Folder | Images (train/val/test) | Classes | Pothole idx | License |
|---|---|---|---|---|---|
| **RSDD** | `RSDD.v6i.yolov8` | 4299 / 1227 / 614 | 4 (crocodile/lateral/longitudinal crack, pothole) | **3** | **CC BY 4.0** ⚠️ attribution required |
| **New Pothole Detection** (Smartathon) | `New pothole detection.v2i.yolov8` | 6091 / 2094 / 1055 | 1 (Pothole) | **0** | Public Domain / CC0 |

Combined ≈ **15,400 images** — solid for YOLOv8n.
Citations/licenses saved in **[ML-Dataset-Citations.md](ML-Dataset-Citations.md)** — copy
into the paper (RSDD's CC BY 4.0 legally requires the attribution).

**⚠️ Critical: do NOT naively merge the folders.** RSDD is 4-class (pothole = index 3);
the Smartathon set is 1-class (pothole = index 0). Dumping them together makes RSDD's
index-0 "crocodile crack" masquerade as "pothole." You must **keep only RSDD's pothole
class and remap it to 0**, then merge. The script below does exactly that.

**You do NOT need to re-upload to Roboflow, and you do NOT need Roboflow's augmentation.**
(There's no Roboflow MCP connected on my side anyway.) Since you already picked the data,
the leanest path is: **download both fresh inside Colab via the Roboflow SDK** (Google's
fast network — skips uploading 3.7 GB from home), merge with the script, train. YOLOv8's
built-in augmentation covers the domain-gap mitigation; bump the HSV/brightness args if
you want more.

### Colab cells (run in order, T4 runtime)

```python
# 1. Setup
!pip -q install ultralytics roboflow pyyaml
from roboflow import Roboflow
from google.colab import drive; drive.mount('/content/drive')   # so weights survive
rf = Roboflow(api_key="YOUR_ROBOFLOW_KEY")   # app.roboflow.com → Settings → API key
# Download the SAME two public datasets straight into Colab (workspace/project/version
# come from each data.yaml — verified 2026-07-05):
rf.workspace("rdd").project("rsdd").version(6).download("yolov8", location="/content/RSDD")
rf.workspace("smartathon").project("new-pothole-detection").version(2).download("yolov8", location="/content/NPD")
```

```python
# 2. Merge → single class "pothole" (RSDD pothole idx 3 → 0; NPD already 0)
import os, glob, shutil, yaml
RSDD, NPD, OUT = "/content/RSDD", "/content/NPD", "/content/pothole_merged"
RSDD_POTHOLE_IDX = 3
KEEP_RSDD_NEGATIVES = True   # crack-only images become backgrounds (helps avoid false positives)

for s in ["train","valid","test"]:
    os.makedirs(f"{OUT}/{s}/images", exist_ok=True); os.makedirs(f"{OUT}/{s}/labels", exist_ok=True)

def ingest(src, split, prefix, keep_idx):
    idir, ldir = f"{src}/{split}/images", f"{src}/{split}/labels"
    if not os.path.isdir(idir): return 0
    n = 0
    for img in glob.glob(f"{idir}/*"):
        stem, ext = os.path.splitext(os.path.basename(img))
        lbl, out = f"{ldir}/{stem}.txt", []
        if os.path.exists(lbl):
            for line in open(lbl):
                p = line.split()
                if not p: continue
                if keep_idx is None or int(p[0]) == keep_idx:   # None = already pothole-only
                    out.append("0 " + " ".join(p[1:]))
        if keep_idx is not None and not out and not KEEP_RSDD_NEGATIVES:
            continue
        shutil.copy(img, f"{OUT}/{split}/images/{prefix}_{stem}{ext}")
        open(f"{OUT}/{split}/labels/{prefix}_{stem}.txt","w").write("\n".join(out))
        n += 1
    return n

for s in ["train","valid","test"]:
    a = ingest(NPD,  s, "npd",  None)              # NPD: single-class, keep all as pothole
    b = ingest(RSDD, s, "rsdd", RSDD_POTHOLE_IDX)  # RSDD: keep only class 3, remap to 0
    print(s, "NPD:", a, "RSDD:", b)

yaml.dump({"train": f"{OUT}/train/images", "val": f"{OUT}/valid/images",
           "test": f"{OUT}/test/images", "nc": 1, "names": ["pothole"]},
          open(f"{OUT}/data.yaml","w"))
print("merged ->", OUT)
```

```python
# 3. Train (saves to Drive so it survives a VM reset)
!yolo detect train model=yolov8n.pt data=/content/pothole_merged/data.yaml \
     epochs=100 imgsz=640 patience=20 \
     project=/content/drive/MyDrive/agapp-runs name=pothole
# optional domain-gap boost: add  hsv_v=0.5 hsv_s=0.7 degrees=5
```

```python
# 4. Metrics for the manuscript (screenshot these — the VM disappears)
!yolo detect val model=/content/drive/MyDrive/agapp-runs/pothole/weights/best.pt \
     data=/content/pothole_merged/data.yaml
# grab: mAP50, mAP50-95, precision, recall + runs .../pothole/ (confusion_matrix.png, results.png)
```

```python
# 5. Sanity predict — hits on potholes, silence on clean roads
!yolo detect predict model=/content/drive/MyDrive/agapp-runs/pothole/weights/best.pt \
     source="A_TEST_IMAGE_URL_OR_FOLDER" conf=0.4
```

**Then:** hand me `best.pt` (or deploy it to Roboflow hosted and give me the endpoint+key)
→ I wire Step 7 (`verify-image` → badge). Stray pets = the 10-min §3 baseline, no training.
Everything below is the original reference guide.

---

## 0. Honest framing (read first, matters for the manuscript)

- **Goal = photo-validity verification, NOT stray-vs-owned classification.** The model
  answers "does this photo actually contain a pothole / a dog or cat" — that's what the
  `verify-image` boundary and the admin badge were built for, and it's defensible.
- **No local data ⇒ state it as a limitation, not a secret.** Foreign road imagery
  (Japan/India/Norway…) differs from PH roads. Mitigation used here: (1) prefer the
  **India + China subsets** of RDD2022 (visually closest to PH road conditions),
  (2) merge 2+ independent pothole datasets for diversity, (3) heavy augmentation
  (brightness/blur/noise) in Roboflow. In the manuscript, write: *"trained on publicly
  licensed multi-country road-damage datasets; generalization to Philippine roads is
  evaluated qualitatively and noted as a limitation / future work (local data collection)."*
  That sentence turns a weakness into a documented research decision.
- **Drainage/canal + damaged poles: no ML** (per your direction). The boundary already
  no-ops those categories.

---

## 1. The decision tree (what you actually build)

| Detector | Approach | Training needed? |
|---|---|---|
| **Stray pets (dog/cat)** | COCO-pretrained YOLOv8n out of the box — it already detects `dog` (class 16) and `cat` (class 15) | **None.** Do this first — it's a 10-minute win. |
| **Pothole** | Fine-tune YOLOv8n on free pothole datasets | Yes — the guide below (~1 afternoon + 1–3 h GPU time). |

---

## 2. STEP-BY-STEP — Pothole model

### Step 1 — Create free accounts (10 min)
1. **Roboflow** (dataset hosting/merging/augmentation/deploy): https://app.roboflow.com → sign up → create a **Public workspace** (free tier requires public; fine for a capstone) → create project: type **Object Detection**, name e.g. `agapp-pothole`, single class `pothole`.
2. **Google account** for Colab (you have one).
3. *(Optional but recommended)* **Kaggle**: https://www.kaggle.com — one dataset lives there, and Kaggle Notebooks are the backup GPU (Step 4 alternative).

### Step 2 — Get the datasets (what to download & what to search)

**2a. Primary (easiest, YOLO-ready): Roboflow Universe.**
- Go to **https://universe.roboflow.com/search?q=class%3Apothole** (that exact search =
  "datasets containing a `pothole` class").
- What to look for on each result page: **image count** (prefer > 3,000), **license**
  (shown on the dataset page — use CC BY 4.0 / CC BY-SA / Public Domain; skip
  "unknown"), and preview images that look like real streets (not only close-ups).
- Known-good picks verified 2026-07-04: the **"RDD"-derived sets (~9,888 pothole
  images)** and **"Road Safety" (~3,319)** from that search.
- On a chosen dataset: **Download Dataset → Format: YOLOv8** → either download the zip
  or (better) click **"Fork/Clone to workspace"** so it lands directly in your Roboflow
  project for merging.

**2b. Add a second source for diversity (pick ONE of these):**
- **Kaggle "Potholes Detection YOLOv8"** — already in YOLOv8 label format:
  https://www.kaggle.com/datasets/anggadwisunarto/potholes-detection-yolov8
  → `Download` button (needs free login) → you get `images/` + `labels/` + `data.yaml`.
- **RDD2022 (the citable academic benchmark)** — 47,420 images, 6 countries; potholes
  are **class `D40`** (6,544 instances). License **CC BY-SA 4.0** ✅.
  Download: https://figshare.com/articles/dataset/RDD2022_-_The_multi-national_Road_Damage_Dataset_released_through_CRDDC_2022/21431547
  → download only the **India** and **China (MotorBike)** country zips (~2–4 GB, not the
  full 11 GB) — closest visual match to PH roads. ⚠️ Labels are Pascal-VOC XML, and you
  only want `D40` — Roboflow handles this: upload the images+XML to your project and it
  converts automatically; then in the project's class management **remap/keep only
  `D40` → `pothole`** and delete the other damage classes.
  *If the XML conversion feels like too much work, skip RDD2022 for training and just
  **cite it** in the manuscript as the benchmark family your Universe datasets derive
  from (many of them are RDD-derived anyway — check the dataset description).*

**2c. Merge in Roboflow:** with 2 sources uploaded/forked into the one `agapp-pothole`
project, make sure every annotation maps to the single class `pothole`
(Classes tab → rename/merge). Target: **5,000–12,000 images total.** More ≠ better past
that point on a nano model.

### Step 3 — Generate the training version (Roboflow, 15 min)
1. Project → **Versions → Create New Version**.
2. Train/valid/test split: **70/20/10**.
3. Preprocessing: Resize → **640×640** (fit within).
4. Augmentations (this is the no-local-data mitigation — be generous):
   **Brightness ±25%**, **Exposure ±15%**, **Blur up to 1.5px**, **Noise up to 3%**.
   Skip rotation beyond ±10° (roads are horizontal) and skip mosaic (YOLO adds it itself).
5. **Generate** → on the version page click **Export Dataset → YOLOv8 → "show download
   code"** → copy the ~4-line Python snippet (contains your API key). You'll paste it
   into Colab.

### Step 4 — Train (Google Colab free, ~1–3 h on a T4)
1. Open the official notebook: https://colab.research.google.com/github/roboflow-ai/notebooks/blob/main/notebooks/train-yolov8-object-detection-on-custom-dataset.ipynb
   → **File → Save a copy in Drive**.
2. **Runtime → Change runtime type → T4 GPU.**
3. Run the cells in order; where the notebook downloads its demo dataset, **replace with
   your Step-3 snippet**. The core cells boil down to:
   ```python
   !pip install ultralytics roboflow
   from roboflow import Roboflow
   rf = Roboflow(api_key="PASTE_FROM_STEP_3")
   dataset = rf.workspace("YOUR_WS").project("agapp-pothole").version(1).download("yolov8")
   ```
   ```python
   !yolo detect train model=yolov8n.pt data={dataset.location}/data.yaml \
        epochs=100 imgsz=640 patience=20
   ```
4. **Free-tier survival tips:** your 24/7 PC keeps the tab alive (prevents idle
   disconnect); sessions can still die (~up to 12 h cap, sometimes less) — if it dies,
   re-run with `resume=True`, or mount Drive first and set `project=/content/drive/MyDrive/agapp-runs`
   so weights survive the VM. YOLOv8**n** at this dataset size finishes well inside one session.
5. **Record for the manuscript** (from the final output + `runs/detect/train/`):
   **mAP50, mAP50-95, precision, recall**, the confusion matrix image, and
   `results.png` training curves. Screenshot/save them NOW — the VM disappears.
6. Your model = `runs/detect/train/weights/best.pt`. Download it / copy to Drive.

> **Alternative GPU (if Colab throttles you): Kaggle Notebooks.** Free ~30 GPU-hours/week
> (T4/P100), same `!yolo detect train ...` commands, and the Kaggle pothole dataset from
> Step 2b attaches natively (**+ Add Input** on the notebook). Colab is primary because the
> Roboflow snippet workflow is smoothest; Kaggle is the better fallback quota-wise.
> **Roboflow Train** (one-click, in-browser) also works but burns your ~3 free training
> credits — keep those for emergencies.

### Step 5 — Sanity-check before deploying (30 min)
In the same Colab:
```python
!yolo predict model=runs/detect/train/weights/best.pt source="SOME_TEST_IMAGE_URLS" conf=0.4
```
Eyeball ~10 images: a few obvious potholes from the test split, plus a few street photos
WITHOUT potholes (predictions on arbitrary internet images for qualitative evaluation is
fine — the no-self-capture rule was about training data). You want: hits on real potholes,
silence on clean roads. If it fires on every road crack, raise `conf` to 0.5–0.6 — that
threshold choice goes in the manuscript too.

### Step 6 — Deploy (Path A1: Roboflow Hosted — fastest to a working badge)
1. Back in Colab: upload your weights to the Roboflow project version:
   ```python
   project.version(1).deploy(model_type="yolov8", model_path="runs/detect/train/")
   ```
2. Roboflow serves it at a URL instantly. Test with curl/Python:
   `POST https://serverless.roboflow.com/agapp-pothole/1?api_key=KEY&image=IMAGE_URL`
   Docs: https://docs.roboflow.com/inference/hosted-api
3. ⚠️ The API key goes in **`apps/api/.env`** (server-only) when we wire it — never in
   mobile/admin code.

### Step 7 — Hand off to me (the AGAPP wiring)
When you have (a) the hosted endpoint + key, or (b) a `best.pt`/`.onnx` file, say so —
I wire it into the existing stub: **`apps/api` `POST /reports/verify-image`**
(mobile already calls it with `{photoUrl, category}` after submit) → API calls the
model for `pothole` / `stray_animal` categories → writes `ml_confidence`/`ml_verified`
on the report → the admin "AI Verified (…%)" badge lights up with zero UI changes.
(Self-hosted ONNX in NestJS = Path A2 if you'd rather not depend on Roboflow's uptime;
on-device TFLite = Path B, matches the manuscript's on-device claim but needs a custom
Expo dev client — time-box it, do A1 first.)

---

## 3. STEP-BY-STEP — Stray pets (dog/cat) — the 10-minute one

**Do this before/while the pothole model trains.** No dataset, no training:

1. In any Colab cell:
   ```python
   !pip install ultralytics
   from ultralytics import YOLO
   model = YOLO("yolov8n.pt")            # COCO-pretrained, downloads automatically
   results = model.predict("TEST_IMAGE", classes=[15, 16], conf=0.4)  # 15=cat, 16=dog
   ```
2. Test on ~10 street-dog/cat photos from the web. COCO's dog/cat detection is strong —
   for "does this photo contain a dog or cat" it will very likely pass as-is.
3. **Only if** it visibly misses street animals: fine-tune on
   **Oxford-IIIT Pet** (CC BY-SA 4.0 ✅, ~7,390 images: https://www.robots.ox.ac.uk/~vgg/data/pets/)
   or the Roboflow "Stray Animal Detection" set (~859 street images:
   https://universe.roboflow.com/rep-rxi6f/stray-animal-detection — check its license on
   the page) using the exact same Steps 3–6 as the pothole guide.
4. Deploy: same Roboflow flow — or simplest of all, the API can run `yolov8n.pt`
   directly with `classes=[15,16]` filtering (no second hosted model needed). Decide at
   wiring time.
5. **Manuscript framing:** *photo-validity via COCO-pretrained YOLOv8n dog/cat
   detection* — never claim stray-vs-owned classification.

---

## 4. Manuscript reconciliation (unchanged essentials)
- Model name: **YOLOv8n everywhere** (paper said YOLOv8n; stale code comments said
  YOLOv11 — those are already gone).
- Cite **RDD2022** (Arya et al., 2024, *Geoscience Data Journal*,
  https://rmets.onlinelibrary.wiley.com/doi/10.1002/gdj3.260) — CC BY-SA 4.0 requires
  attribution; citing it satisfies that. Cite Roboflow Universe datasets per their pages.
- If you ship server-side (A1/A2), soften the paper's "fully on-device" wording.
- Add the **no-local-data limitation sentence** from §0 — examiners respect a stated
  limitation far more than a discovered one.

---

## 5. Checklist (print this)
- [ ] Roboflow account + `agapp-pothole` project (class: `pothole`)
- [ ] Fork 1 Universe pothole dataset (>3k imgs, clear license) + 1 second source (Kaggle or RDD2022 India/China `D40`)
- [ ] Merge classes → single `pothole`; 5–12k images
- [ ] Version: 70/20/10, 640×640, brightness/exposure/blur/noise augs → Export YOLOv8 snippet
- [ ] Colab T4: train yolov8n 100 epochs → save `best.pt` + metrics to Drive
- [ ] Record mAP50 / mAP50-95 / precision / recall / confusion matrix (manuscript!)
- [ ] Sanity predict: hits on potholes, silence on clean roads
- [ ] Deploy to Roboflow hosted → test the URL
- [ ] Stray pets: verify COCO `yolov8n.pt` classes 15/16 on street photos (no training)
- [ ] Tell me → I wire `verify-image` + env key → badge goes live

## Sources (all verified 2026-07-04)
- RDD2022 — figshare download: https://figshare.com/articles/dataset/RDD2022_-_The_multi-national_Road_Damage_Dataset_released_through_CRDDC_2022/21431547 · paper: https://rmets.onlinelibrary.wiley.com/doi/10.1002/gdj3.260 · license CC BY-SA 4.0
- Roboflow Universe pothole search: https://universe.roboflow.com/search?q=class%3Apothole
- Kaggle YOLOv8 pothole set: https://www.kaggle.com/datasets/anggadwisunarto/potholes-detection-yolov8
- Oxford-IIIT Pet (CC BY-SA 4.0): https://www.robots.ox.ac.uk/~vgg/data/pets/
- Roboflow stray-animal set: https://universe.roboflow.com/rep-rxi6f/stray-animal-detection
- Official training notebook: https://colab.research.google.com/github/roboflow-ai/notebooks/blob/main/notebooks/train-yolov8-object-detection-on-custom-dataset.ipynb
- Roboflow hosted inference docs: https://docs.roboflow.com/inference/hosted-api
- PH precedent (Cebu YOLOv8 pothole study, for the manuscript's related-work section): https://www.joig.net/2024/JOIG-V12N4-417.pdf

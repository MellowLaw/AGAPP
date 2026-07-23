# AGAPP AI Verification Sidecar

FastAPI microservice that performs face comparison between a citizen's government-issued ID photo and their selfie. Called internally by the AGAPP NestJS API — **never exposed to the public internet.**

## Requirements

- Python 3.10+
- pip

## Setup

```bash
cd apps/ai-sidecar

# Create a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS / Linux

# Install dependencies
pip install -r requirements.txt
```

> **Note:** DeepFace will automatically download the ArcFace model (~100 MB) on the first `/analyze` request. This takes 20–60 seconds. Subsequent requests are much faster (~1–3 s on CPU).

## Running

```bash
uvicorn main:app --host 127.0.0.1 --port 8001
```

The sidecar listens on `http://127.0.0.1:8001` by default. Make sure the NestJS API is configured with:

```
AI_SIDECAR_URL=http://localhost:8001
```

in `apps/api/.env`.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/analyze` | Face comparison |

### POST /analyze

**Request:**
```json
{
  "id_photo_url": "https://...supabase.co/storage/v1/object/sign/citizen-ids/...",
  "selfie_url":   "https://...supabase.co/storage/v1/object/sign/citizen-ids/..."
}
```

Both URLs must be **short-lived signed URLs** from the private `citizen-ids` Supabase bucket. The sidecar downloads the images directly; it never stores them beyond the request lifetime.

**Response:**
```json
{
  "face_score": 0.8712,
  "confidence_score": 0.8905,
  "phash": "f8e0f8e0f8e0f8e0",
  "flags": [],
  "processing_ms": 1843
}
```

| Field | Type | Description |
|---|---|---|
| `face_score` | `number \| null` | ArcFace cosine similarity (0–1). `null` if detection failed. |
| `confidence_score` | `number \| null` | Weighted composite (face 85% + quality 15%). |
| `phash` | `string \| null` | Perceptual hash of the ID photo for duplicate detection. |
| `flags` | `string[]` | Quality warnings: `FACE_MISMATCH`, `IMAGE_TOO_BLURRY_SELFIE`, etc. |
| `processing_ms` | `number` | Wall-clock inference time in milliseconds. |

## Confidence Score Thresholds

| Score | Admin Guidance |
|---|---|
| ≥ 0.80 | 🟢 High confidence — quick review |
| 0.60–0.79 | 🟡 Medium — review carefully |
| 0.40–0.59 | 🟠 Low — scrutinize closely |
| < 0.40 | 🔴 Very low — likely mismatch or bad photo |

> The score **never auto-approves or auto-rejects** a submission. It is a decision-support tool for the LGU administrator.

## Thesis / Limitations

See `Docs/Planning/identity_verification_design.md` §10 for the full limitations section.

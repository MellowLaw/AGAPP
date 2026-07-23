"""
AGAPP AI Verification Sidecar — FastAPI
Performs face comparison between a citizen's government-issued ID photo
and their selfie using InsightFace ArcFace via ONNX Runtime (no TensorFlow).

Setup:
  pip install -r requirements.txt

Run:
  uvicorn main:app --host 127.0.0.1 --port 8001

Notes:
  - InsightFace downloads the buffalo_sc model (~30 MB) on first /analyze request.
  - First inference is slower (~5-15 s for model download).
    Subsequent requests run in ~0.5–2 s on CPU.
  - Never expose port 8001 to the public internet.
    It is called only by the NestJS API on localhost.
"""

import hashlib
import os
import tempfile
import time
from functools import lru_cache
from typing import Optional

import httpx
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AGAPP AI Sidecar", version="2.0.0")

# Only allow calls from the local NestJS API process.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class AnalyzeRequest(BaseModel):
    id_photo_url: str
    selfie_url: str


# ---------------------------------------------------------------------------
# InsightFace singleton — initialized once, reused across requests.
# @lru_cache ensures the model is loaded only once per process.
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_face_app():
    """Load InsightFace FaceAnalysis with buffalo_sc model (CPU).

    buffalo_sc = small+compact ArcFace model (~30 MB).
    Trades a small amount of accuracy for much faster CPU inference.
    Use buffalo_l (~300 MB) for higher accuracy if GPU is available.
    """
    try:
        from insightface.app import FaceAnalysis
        fa = FaceAnalysis(
            name="buffalo_sc",
            providers=["CPUExecutionProvider"],
        )
        fa.prepare(ctx_id=-1, det_size=(640, 640))
        print("[AI Sidecar] InsightFace buffalo_sc model loaded successfully.")
        return fa
    except Exception as exc:
        print(f"[AI Sidecar] Failed to load InsightFace: {exc}")
        return None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_face_embedding(img_path: str, fa) -> Optional[np.ndarray]:
    """Return the ArcFace embedding of the largest detected face, or None."""
    try:
        import cv2
        img = cv2.imread(img_path)
        if img is None:
            print(f"[AI Sidecar] cv2 could not read image path: {img_path}")
            return None
        faces = fa.get(img)
        print(f"[AI Sidecar] Image {os.path.basename(img_path)}: detected {len(faces) if faces else 0} faces")
        if not faces:
            return None
        # Use the face with the largest bounding-box area
        best = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        return best.embedding
    except Exception as exc:
        import traceback
        print(f"[AI Sidecar] Face embedding error for {img_path}: {exc}")
        traceback.print_exc()
        return None


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two vectors, clamped to [0, 1]."""
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    raw = float(np.dot(a, b) / denom)
    # InsightFace ArcFace: same person usually scores 0.3–0.8.
    # Map -1..1 → 0..1 for a friendlier percentage in the admin UI.
    return max(0.0, min(1.0, (raw + 1.0) / 2.0))


def _phash(image_path: str) -> Optional[str]:
    """Perceptual hash for duplicate-photo detection. Falls back to MD5."""
    try:
        import imagehash
        from PIL import Image
        return str(imagehash.phash(Image.open(image_path)))
    except Exception:
        pass
    try:
        with open(image_path, "rb") as fh:
            return hashlib.md5(fh.read()).hexdigest()
    except Exception:
        return None


def _blur_score(image_path: str) -> Optional[float]:
    """Laplacian variance as blur indicator (< 80 → blurry)."""
    try:
        import cv2
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return None
        return float(cv2.Laplacian(img, cv2.CV_64F).var())
    except ImportError:
        return None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    """Liveness probe used by the NestJS API."""
    fa = _get_face_app()
    return {
        "status": "ok",
        "service": "agapp-ai-sidecar",
        "model_loaded": fa is not None,
    }


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Download both images from signed Supabase URLs, run face comparison,
    and return a confidence score.

    Response fields:
      face_score       – 0.0–1.0 ArcFace cosine similarity (None on failure)
      confidence_score – weighted composite (face 85 % + quality 15 %)
      phash            – perceptual hash of ID photo
      flags            – list of warning strings
      processing_ms    – wall-clock time in milliseconds
    """
    start = time.time()
    flags: list[str] = []

    # ── 1. Download images ──────────────────────────────────────────────────
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            id_resp = await client.get(req.id_photo_url)
            id_resp.raise_for_status()
            id_bytes = id_resp.content
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not download ID photo: {exc}")

        try:
            selfie_resp = await client.get(req.selfie_url)
            selfie_resp.raise_for_status()
            selfie_bytes = selfie_resp.content
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not download selfie: {exc}")

    with tempfile.TemporaryDirectory() as tmp:
        id_path     = os.path.join(tmp, "id_photo.jpg")
        selfie_path = os.path.join(tmp, "selfie.jpg")

        with open(id_path, "wb")     as fh: fh.write(id_bytes)
        with open(selfie_path, "wb") as fh: fh.write(selfie_bytes)

        # ── 2. Image quality checks ─────────────────────────────────────────
        for label, path in [("ID_PHOTO", id_path), ("SELFIE", selfie_path)]:
            blur = _blur_score(path)
            if blur is not None and blur < 80:
                flags.append(f"IMAGE_TOO_BLURRY_{label}")

        # ── 3. Face comparison (InsightFace ArcFace via ONNX) ───────────────
        face_score: Optional[float] = None
        fa = _get_face_app()

        if fa is None:
            flags.append("FACE_MODEL_NOT_LOADED")
        else:
            emb_id     = _get_face_embedding(id_path, fa)
            emb_selfie = _get_face_embedding(selfie_path, fa)

            if emb_id is None:
                flags.append("FACE_NOT_DETECTED_ID_PHOTO")
            if emb_selfie is None:
                flags.append("FACE_NOT_DETECTED_SELFIE")

            if emb_id is not None and emb_selfie is not None:
                sim = _cosine_similarity(emb_id, emb_selfie)
                face_score = round(sim, 4)
                # ArcFace raw score < 0.3 ≈ different people (maps to ~0.65 in our 0-1 scale)
                # Our scale: raw 0.3 → displayed 0.65; raw 0.0 → 0.50; raw -1.0 → 0.0
                # A conservative mismatch threshold in our 0-1 scale is ~0.62
                if face_score < 0.62:
                    flags.append("FACE_MISMATCH")

        # ── 4. Perceptual hash of ID photo ───────────────────────────────────
        id_phash = _phash(id_path)

        # ── 5. Composite confidence score ─────────────────────────────────────
        quality_ok = not any(
            kw in f for f in flags
            for kw in ("BLURRY", "NOT_LOADED", "DETECTION_FAILED")
        )
        quality_score = 1.0 if quality_ok else 0.3

        if face_score is not None:
            confidence_score = round(face_score * 0.85 + quality_score * 0.15, 4)
        else:
            confidence_score = None

        processing_ms = int((time.time() - start) * 1000)

        return {
            "face_score":       face_score,
            "confidence_score": confidence_score,
            "phash":            id_phash,
            "flags":            flags,
            "processing_ms":    processing_ms,
        }

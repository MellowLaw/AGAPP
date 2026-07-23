// ─────────────────────────────────────────────────────────────────────────────
// In-process face verification (replaces the old Python/FastAPI + InsightFace
// sidecar, deleted 2026-07-23 — see apps/api/src/app.controllers.ts,
// VerificationController.analyzeVerification).
//
// Runs entirely inside the NestJS process on @vladmandic/face-api +
// @tensorflow/tfjs (pure JS, CPU backend — no native binary, no external
// service). Models are loaded ONCE (lazily, on first call) from a local
// directory and cached for the lifetime of the process — the model files are
// NOT downloaded at runtime, they must exist on disk beforehand (see
// apps/api/models/ or CLAUDE.md; FACE_MODELS_DIR overrides the path).
//
// Keeps the exact response contract and scoring formula the old sidecar used
// so the admin review page's colour thresholds and flag rendering keep
// meaning the same thing:
//   - flags: FACE_NOT_DETECTED_ID_PHOTO | FACE_NOT_DETECTED_SELFIE |
//            FACE_MISMATCH | IMAGE_TOO_BLURRY_ID_PHOTO |
//            IMAGE_TOO_BLURRY_SELFIE | FACE_MODEL_NOT_LOADED
//   - confidenceScore = round(faceScore * 0.85 + qualityScore * 0.15, 4)
//     where qualityScore = 1.0 if no BLURRY/NOT_LOADED flags else 0.3
//   - faceScore/confidenceScore are null when no face was detected in either
//     image.
// ─────────────────────────────────────────────────────────────────────────────

import * as path from 'path';
// Deliberately `require()`d, not `import * as` — TS's esModuleInterop shim
// (__importStar) copies the built-in module's properties onto a fresh object
// via getter-only descriptors, so `Module._load = ...` below would throw
// ("Cannot set property _load of # which has only a getter"). A plain
// require() returns the real, mutable `module` core-module object.
/* eslint-disable @typescript-eslint/no-var-requires */
const NodeModule: any = require('module');

// face-api's typings are written against browser TS lib DOM types that don't
// always line up cleanly with tfjs's Tensor types — `any` casts below are
// intentional and match this codebase's existing style (see
// app.controllers.ts's liberal use of `any` on third-party response shapes).
//
// IMPORTANT: `require(...)` for these packages is deliberately done LAZILY
// (inside loadModels(), not at module top-level). A missing/broken model
// directory or dependency load failure must stay scoped to "this endpoint
// returns FACE_MODEL_NOT_LOADED", never crash NestJS while it's wiring up
// controllers (chatbot, OCR, ML report verification — everything else would
// go down with it). Lazy + try/caught inside loadModels() keeps that
// contract.
let tf: any = null;
let faceapi: any = null;

// ── face-api ↔ tf backend wiring ──────────────────────────────────────────
// @vladmandic/face-api's package.json "main" always resolves to
// dist/face-api.node.js, which internally does a plain
// `require("@tensorflow/tfjs-node")` and uses THAT as its tf instance/engine
// — there's no config flag to swap it, and no alternate dist build shares an
// externally-registered pure-JS backend cleanly (face-api.esm.js/.js are
// fully self-contained bundles with their OWN embedded tfjs-core copy —
// technically loadable, but a second, disconnected tf engine instance from
// the one this file uses for tensor3d/conv2d/dispose; face-api.node-wasm.js
// and .esm-nobundle.js both statically require @tensorflow/tfjs-backend-wasm,
// which isn't installed and pulls in a wasm binary we don't want).
//
// Fix: temporarily hook Node's module loader so that the ONE nested
// `require("@tensorflow/tfjs-node")` inside face-api.node.js resolves to our
// already-loaded `@tensorflow/tfjs` module object instead. Because Node's
// require cache is keyed by resolved path, this makes face-api use the exact
// same tf engine/backend-registry instance as this file — no dual-instance
// tensor mismatches, no native/wasm dependency. The hook is installed only
// around the require('@vladmandic/face-api') call and removed immediately
// after (verified empirically: this resolves cleanly and the resulting
// faceapi.tf version block reports the @tensorflow/tfjs 4.22.0 build, not a
// tfjs-node one).
function requireFaceApiWithTfjsBackend(tfInstance: any): any {
  const originalLoad = NodeModule._load;
  NodeModule._load = function (request: string, parent: any, isMain: boolean) {
    if (request === '@tensorflow/tfjs-node') {
      return tfInstance;
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require('@vladmandic/face-api');
  } finally {
    NodeModule._load = originalLoad;
  }
}

export interface FaceAnalysisResult {
  faceScore: number | null;
  confidenceScore: number | null;
  phash: string | null;
  flags: string[];
  processingMs: number | null;
}

const MODELS_DIR = process.env.FACE_MODELS_DIR || path.join(__dirname, '..', '..', 'models');

// Same-person threshold used by face-api's own examples/docs for the
// FaceRecognitionNet descriptor (euclidean distance in 128-D space).
const MISMATCH_DISTANCE_THRESHOLD = 0.6;
// Distance at which similarity bottoms out at 0 (keeps the 0..1 mapping
// smooth instead of clamping hard right at the mismatch threshold).
const DISTANCE_FLOOR = 1.2;

// Laplacian-variance sharpness threshold. There's no first-party tfjs
// equivalent of OpenCV's `cv2.Laplacian(...).var()` to calibrate directly
// against the old sidecar's `< 80` cutoff (different normalization — tfjs
// operates on 0..1 floats here, not 0..255 int8), so this is a judgment call:
// chosen conservatively low so only genuinely, visibly blurry photos (e.g.
// heavy motion blur / totally out of focus) get flagged, minimizing false
// positives on ordinary phone-camera ID/selfie photos. Tune empirically once
// real submissions are observed.
const BLUR_VARIANCE_THRESHOLD = 0.0015;

let modelsLoadPromise: Promise<boolean> | null = null;

/**
 * Lazily requires @tensorflow/tfjs and @vladmandic/face-api, selects the CPU
 * backend, then loads the three face-api nets from disk. Runs exactly once
 * per process (cached promise) — a failure at any step (require, backend
 * init, or model-load) is caught here and reported as a normal `false`
 * return, never a thrown exception.
 */
function loadModels(): Promise<boolean> {
  if (!modelsLoadPromise) {
    modelsLoadPromise = (async () => {
      try {
        if (!tf) tf = require('@tensorflow/tfjs');
        await tf.setBackend('cpu');
        await tf.ready();
        if (!faceapi) faceapi = requireFaceApiWithTfjsBackend(tf);

        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR);
        return true;
      } catch (err) {
        console.error('[FaceAnalysisService] Failed to load face-api models from', MODELS_DIR, (err as any).message);
        return false;
      }
    })();
  }
  return modelsLoadPromise;
}

/** Magic-byte sniff: JPEG starts FF D8, PNG starts 89 50 4E 47. */
function detectImageFormat(buf: Buffer): 'jpeg' | 'png' | null {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  return null;
}

async function fetchImageTensor(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: HTTP ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuf);

  const format = detectImageFormat(buf);
  let width: number;
  let height: number;
  let rgba: Uint8Array | Uint8ClampedArray;

  if (format === 'jpeg') {
    const jpegDecode = require('jpeg-js').decode;
    const decoded = jpegDecode(buf, { useTArray: true });
    width = decoded.width;
    height = decoded.height;
    rgba = decoded.data;
  } else if (format === 'png') {
    const { PNG } = require('pngjs');
    const decoded = PNG.sync.read(buf);
    width = decoded.width;
    height = decoded.height;
    rgba = decoded.data;
  } else {
    throw new Error('Unsupported image format (expected JPEG or PNG)');
  }

  // Drop the alpha channel: RGBA -> RGB, into a fresh Uint8Array.
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }

  // channels=3 (RGB) — face-api expects a 3-channel tensor.
  return tf.tensor3d(rgb, [height, width, 3], 'int32');
}

/** Euclidean-distance-based similarity in [0,1]; lower distance -> higher score. */
function distanceToSimilarity(distance: number): number {
  const sim = 1 - distance / DISTANCE_FLOOR;
  return Math.max(0, Math.min(1, sim));
}

/**
 * Best-effort Laplacian-variance sharpness estimate computed with tfjs ops.
 * Returns null (never throws) if anything about the calc fails — blur
 * flagging is best-effort per the spec, never worth blocking on.
 */
function computeBlurVariance(image: any): number | null {
  try {
    return tf.tidy(() => {
      const float = image.toFloat();
      // Grayscale via standard luma weights, add batch dim: [1,H,W,1].
      const gray = float.mean(2, true).expandDims(0).div(255);
      const laplacianKernel = tf.tensor4d(
        [0, 1, 0, 1, -4, 1, 0, 1, 0],
        [3, 3, 1, 1],
      );
      const edges = tf.conv2d(gray, laplacianKernel, 1, 'valid');
      const { variance } = tf.moments(edges);
      return variance.dataSync()[0] as number;
    });
  } catch (err) {
    console.warn('[FaceAnalysisService] Blur variance calc failed, skipping:', (err as any).message);
    return null;
  }
}

/**
 * Simple 64-bit average-hash (aHash) of the given image tensor, for
 * duplicate-ID-photo detection. Not a perceptual-hash (phash/DCT) but serves
 * the same "near-duplicate detection" purpose without pulling in a dependency.
 */
function computeAverageHash(image: any): string | null {
  try {
    return tf.tidy(() => {
      const float = image.toFloat();
      const gray = float.mean(2, true).expandDims(0); // [1,H,W,1]
      const resized = tf.image.resizeBilinear(gray, [8, 8]);
      const values = Array.from(resized.dataSync() as Float32Array);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      let bits = '';
      for (const v of values) bits += v >= mean ? '1' : '0';
      // Pack the 64 bits into 16 hex chars.
      let hex = '';
      for (let i = 0; i < 64; i += 4) {
        hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
      }
      return hex;
    });
  } catch (err) {
    console.warn('[FaceAnalysisService] Average-hash calc failed:', (err as any).message);
    return null;
  }
}

async function detectFace(image: any): Promise<any | null> {
  const result = await faceapi
    .detectSingleFace(image)
    .withFaceLandmarks()
    .withFaceDescriptor();
  return result || null;
}

export async function analyzeFaces(idPhotoUrl: string, selfieUrl: string): Promise<FaceAnalysisResult> {
  const start = Date.now();
  const NULL_RESULT: FaceAnalysisResult = {
    faceScore: null,
    confidenceScore: null,
    phash: null,
    flags: [],
    processingMs: null,
  };

  const flags: string[] = [];
  let idImage: any = null;
  let selfieImage: any = null;

  try {
    const modelsLoaded = await loadModels();
    if (!modelsLoaded) {
      return { ...NULL_RESULT, flags: ['FACE_MODEL_NOT_LOADED'], processingMs: Date.now() - start };
    }

    [idImage, selfieImage] = await Promise.all([fetchImageTensor(idPhotoUrl), fetchImageTensor(selfieUrl)]);

    // ── Blur checks (best-effort, never throws) ──────────────────────────
    const idBlurVariance = computeBlurVariance(idImage);
    if (idBlurVariance !== null && idBlurVariance < BLUR_VARIANCE_THRESHOLD) {
      flags.push('IMAGE_TOO_BLURRY_ID_PHOTO');
    }
    const selfieBlurVariance = computeBlurVariance(selfieImage);
    if (selfieBlurVariance !== null && selfieBlurVariance < BLUR_VARIANCE_THRESHOLD) {
      flags.push('IMAGE_TOO_BLURRY_SELFIE');
    }

    // ── phash of the ID photo (average-hash, for duplicate detection) ────
    const phash = computeAverageHash(idImage);

    // ── Face detection + comparison ───────────────────────────────────────
    const [idDetection, selfieDetection] = await Promise.all([detectFace(idImage), detectFace(selfieImage)]);

    if (!idDetection) flags.push('FACE_NOT_DETECTED_ID_PHOTO');
    if (!selfieDetection) flags.push('FACE_NOT_DETECTED_SELFIE');

    let faceScore: number | null = null;
    let confidenceScore: number | null = null;

    if (idDetection && selfieDetection) {
      const distance = faceapi.euclideanDistance(idDetection.descriptor, selfieDetection.descriptor);
      faceScore = Math.round(distanceToSimilarity(distance) * 10000) / 10000;
      if (distance > MISMATCH_DISTANCE_THRESHOLD) flags.push('FACE_MISMATCH');

      const qualityOk = !flags.some((f) => f.includes('BLURRY') || f.includes('NOT_LOADED'));
      const qualityScore = qualityOk ? 1.0 : 0.3;
      confidenceScore = Math.round((faceScore * 0.85 + qualityScore * 0.15) * 10000) / 10000;
    }

    return {
      faceScore,
      confidenceScore,
      phash,
      flags,
      processingMs: Date.now() - start,
    };
  } catch (err) {
    console.error('[FaceAnalysisService] analyzeFaces failed:', (err as any).message);
    return { ...NULL_RESULT, processingMs: Date.now() - start };
  } finally {
    // Dispose tensors to avoid leaking GPU/CPU memory across requests.
    try { if (idImage) tf.dispose(idImage); } catch { /* noop */ }
    try { if (selfieImage) tf.dispose(selfieImage); } catch { /* noop */ }
  }
}

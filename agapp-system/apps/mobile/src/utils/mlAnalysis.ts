// Single boundary for report-photo ML checks (see CLAUDE.md: keep ML inference
// behind one boundary so model/dataset/on-device-vs-server can be swapped).
//
// Server-side inference (2026-07-06): calls the API's guarded
// POST /reports/verify-image, which runs the deployed Roboflow-hosted models.
// 'pothole' (fine-tuned) and 'stray_animal' (stock COCO dog/cat) have models;
// every other category returns NOT_ANALYZED without a network call. Any failure
// (network, API, missing config) also returns NOT_ANALYZED — a photo ML check
// must never block or delay report submission.

export interface MlAnalysis {
  /** 0..1 model confidence, or null when no model ran. */
  confidence: number | null;
  /** true/false once a model actually classified the photo, null otherwise. */
  verified: boolean | null;
}

const NOT_ANALYZED: MlAnalysis = { confidence: null, verified: null };

const CATEGORIES_WITH_A_MODEL = new Set(['pothole', 'stray_animal']);

export async function analyzeReportPhoto(
  category: string,
  photoUrl: string | null | undefined,
  accessToken: string | null | undefined,
): Promise<MlAnalysis> {
  if (!CATEGORIES_WITH_A_MODEL.has(category) || !photoUrl) return NOT_ANALYZED;

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) return NOT_ANALYZED;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const response = await fetch(`${apiUrl}/reports/verify-image`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ photoUrl, category }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return NOT_ANALYZED;

    const data = await response.json();
    return {
      confidence: typeof data?.mlConfidence === 'number' ? data.mlConfidence : null,
      verified: typeof data?.mlVerified === 'boolean' ? data.mlVerified : null,
    };
  } catch {
    return NOT_ANALYZED;
  }
}

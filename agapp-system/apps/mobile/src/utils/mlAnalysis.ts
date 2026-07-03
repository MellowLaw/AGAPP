// Single boundary for report-photo ML checks (see CLAUDE.md: keep ML inference
// behind one boundary so model/dataset/on-device-vs-server can be swapped).
//
// Not implemented yet. The plan (Docs/Planning/Plan-ML-Pothole-Detection.md) is
// a pothole-detection model that helps admins judge whether a report is valid;
// other categories may follow if a usable model/dataset exists for them.
// Until then every report is submitted as "not analyzed" (NULL ml fields) —
// never fake a confidence value here.

export interface MlAnalysis {
  /** 0..1 model confidence, or null when no model ran. */
  confidence: number | null;
  /** true/false once a model actually classified the photo, null otherwise. */
  verified: boolean | null;
}

const NOT_ANALYZED: MlAnalysis = { confidence: null, verified: null };

export async function analyzeReportPhoto(
  category: string,
  _imageUri: string,
): Promise<MlAnalysis> {
  switch (category) {
    case 'pothole':
      // Pothole model plugs in here (on-device or via the API — TBD).
      return NOT_ANALYZED;
    default:
      return NOT_ANALYZED;
  }
}

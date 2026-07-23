-- ============================================================
--  AGAPP — Verification AI Results
--  Stores face comparison scores from the Python AI sidecar.
--  Run AFTER verification_setup.sql. Safe to re-run (idempotent).
-- ============================================================

CREATE TABLE IF NOT EXISTS verification_ai_results (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id       uuid REFERENCES verification_requests(id) ON DELETE CASCADE NOT NULL,
  face_score       numeric(5,4),       -- 0.0000–1.0000 ArcFace cosine similarity
  confidence_score numeric(5,4),       -- 0.0000–1.0000 weighted composite
  phash            text,               -- perceptual hash of ID photo (for duplicate detection)
  flags            text[],             -- ['FACE_MISMATCH', 'IMAGE_TOO_BLURRY_SELFIE', ...]
  processing_ms    integer,            -- sidecar wall-clock time
  raw_json         jsonb,              -- full sidecar response for debugging
  created_at       timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS verification_ai_results_request_idx
  ON verification_ai_results(request_id);

ALTER TABLE verification_ai_results ENABLE ROW LEVEL SECURITY;

-- Citizens can insert their own AI result (associated with their own pending request)
DROP POLICY IF EXISTS "Citizens can insert own ai results" ON verification_ai_results;
CREATE POLICY "Citizens can insert own ai results" ON verification_ai_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM verification_requests vr
      WHERE vr.id = request_id
        AND vr.user_id = auth.uid()
    )
  );

-- Citizens can read their own AI results
DROP POLICY IF EXISTS "Citizens can read own ai results" ON verification_ai_results;
CREATE POLICY "Citizens can read own ai results" ON verification_ai_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM verification_requests vr
      WHERE vr.id = request_id
        AND vr.user_id = auth.uid()
    )
  );

-- LGU admins can read AI results for requests in their LGU
DROP POLICY IF EXISTS "LGU admins can read ai results in their LGU" ON verification_ai_results;
CREATE POLICY "LGU admins can read ai results in their LGU" ON verification_ai_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM verification_requests vr
      JOIN users u ON u.id = auth.uid()
      WHERE vr.id = request_id
        AND u.role = 'LGU_ADMIN'
        AND u.lgu_id = vr.lgu_id
    )
  );

-- Super admins can read all AI results
DROP POLICY IF EXISTS "Super admins can read all ai results" ON verification_ai_results;
CREATE POLICY "Super admins can read all ai results" ON verification_ai_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN')
  );

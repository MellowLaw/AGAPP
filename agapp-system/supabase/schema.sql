-- AGAPP Database Schema for Supabase
-- Core Multi-Tenant LGU, Citizen, Reporting, and Chatbot Schema

-- Enable spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop existing tables to start fresh (if executing sequentially)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS chatbot_faqs CASCADE;
DROP TABLE IF EXISTS news_announcements CASCADE;
DROP TABLE IF EXISTS forum_posts CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS lgu_services CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS offices CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS lgu_facilities CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS lgus CASCADE;

-- 1. LGU TENANTS TABLE
CREATE TABLE lgus (
    id text PRIMARY KEY, -- e.g. 'liliw-laguna'
    name text NOT NULL,
    region text, -- PSGC region, set by the super-admin onboarding wizard (2026-07-06)
    province text, -- PSGC province (or 'Metro Manila' for NCR)
    logo text NOT NULL,
    banner_url text,
    primary_color text NOT NULL, -- hex value (e.g. '#A2B59F')
    secondary_color text NOT NULL, -- hex value
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    boundary_geojson jsonb, -- optional GeoJSON Polygon/MultiPolygon for full LGU/town boundary
    is_active boolean DEFAULT true,
    onboarding_fee_paid boolean DEFAULT false,
    feature_flags jsonb DEFAULT '{"chatbot": true, "potholeDetection": true, "forum": true}'::jsonb,
    facebook_url text,
    youtube_url text,
    twitter_url text,
    website_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USERS TABLE (Linked to Supabase Auth.users if using Auth)
CREATE TABLE users (
    id uuid PRIMARY KEY, -- Syncs with auth.uid()
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('SUPER_ADMIN', 'LGU_ADMIN', 'LGU_PERSONNEL', 'CITIZEN')),
    lgu_id text REFERENCES lgus(id) ON DELETE SET NULL,
    barangay text,
    notification_preferences jsonb DEFAULT '{"push": true, "sms": true, "email": true}'::jsonb,
    is_active boolean DEFAULT true,
    -- Staff notification bell "mark all read" model (v1) — a single per-admin
    -- timestamp; unread count = staff-audience notifications newer than this.
    notifications_seen_at timestamp with time zone,
    -- Nav "new since last visit" badges — per-section last-seen timestamps,
    -- e.g. {"reports": "<iso>", "services": "<iso>", "forum": "<iso>", "verifications": "<iso>"}.
    -- A badge count = rows newer than nav_seen[section]; opening that section
    -- writes now() and the badge clears.
    nav_seen jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. OFFICES (per-LGU offices that can be assigned reports/service requests)
CREATE TABLE offices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    type text, -- e.g. 'Engineering', 'Civil Registry'
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX offices_lgu_slug_idx ON offices(lgu_id, slug);

-- 3.5 LGU SERVICES CATALOG (admin-editable per-LGU document catalog, eServices)
CREATE TABLE lgu_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    office_name text NOT NULL,
    name text NOT NULL,
    description text,
    requirements jsonb DEFAULT '[]'::jsonb NOT NULL,
    fee_note text DEFAULT 'Pay at the Municipal Hall' NOT NULL,
    processing_time text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CITIZEN CONCERN REPORTS TABLE
CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number text UNIQUE NOT NULL,
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
    citizen_name text NOT NULL,
    -- Final category set (client direction): stray pets, drainage/canal,
    -- pothole/road damage, damaged poles.
    category text NOT NULL CHECK (category IN ('pothole', 'clogged_drainage', 'stray_animal', 'damaged_pole')),
    description text,
    photo_url text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    barangay text NOT NULL,
    status text DEFAULT 'Submitted' NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected', 'Cancelled')),
    assigned_office text, -- legacy label for quick queries
    assigned_office_id uuid REFERENCES offices(id) ON DELETE SET NULL,
    sla_tier text CHECK (sla_tier IN ('simple', 'complex', 'highly_technical')),
    sla_due_date timestamp with time zone,
    -- NULL = not analyzed. ML is not implemented yet; the pothole model will
    -- write real values later through one boundary (mobile utils/mlAnalysis.ts).
    -- Never default these to truthy values — that fakes an AI verification.
    ml_confidence double precision,
    ml_verified boolean,
    is_low_credibility boolean DEFAULT false,
    rating integer CHECK (rating BETWEEN 1 AND 5),
    feedback text,
    status_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CITIZEN DOCUMENT SERVICE REQUESTS
CREATE TABLE service_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number text UNIQUE NOT NULL,
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
    citizen_name text NOT NULL,
    service_type text NOT NULL, -- e.g. "Birth Certificate Request"
    office_name text NOT NULL, -- e.g. "Civil Registrar"
    office_id uuid REFERENCES offices(id) ON DELETE SET NULL,
    lgu_service_id uuid REFERENCES lgu_services(id) ON DELETE SET NULL,
    status text DEFAULT 'Submitted' NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'In Progress', 'Ready for Pickup', 'Released', 'Rejected', 'Cancelled')),
    form_details jsonb NOT NULL,
    qr_code_url text, -- deprecated: QR is now rendered client-side from claim_code, not a stored URL
    attachment_url text,
    assigned_personnel text,
    reject_reason text,
    claim_code text UNIQUE, -- opaque single-use pickup code (e.g. 'ABC-1234'), set by mark_service_ready()
    claim_code_used_at timestamp with time zone,
    released_at timestamp with time zone,
    released_by uuid REFERENCES users(id) ON DELETE SET NULL,
    status_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── updated_at auto-tracking ────────────────────────────────────────────────
-- Auto-stamped on every UPDATE so real turnaround time (updated_at -
-- created_at, for Resolved/Released rows) can be computed instead of a fake
-- static number.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_reports_touch_updated_at
  BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE TRIGGER trg_service_requests_touch_updated_at
  BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE TRIGGER trg_lgu_services_touch_updated_at
  BEFORE UPDATE ON lgu_services FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
-- ──────────────────────────────────────────────────────────────────────────

-- ── Citizen status-change notifications ───────────────────────────────────
-- Fires on every status transition and inserts a row into `notifications`,
-- which Realtime + apps/api/src/push/push.service.ts turn into an Expo push.
-- NOTE: `notifications.type` is NOT NULL with no default — both functions
-- below must always set it, or the insert fails with 23502 (this was a
-- real, previously-silent bug fixed on 2026-07-02: every citizen status
-- notification had been failing since these triggers were first created).
-- NOTE 2 (2026-07-05): every notify_* trigger function is SECURITY DEFINER so
-- the insert bypasses RLS — that's what allowed removing the wide-open
-- "System can insert notifications" WITH CHECK (true) policy (any logged-in
-- user could forge notifications for anyone). Keep new notification triggers
-- SECURITY DEFINER + pinned search_path, and never re-add a client INSERT policy.
CREATE OR REPLACE FUNCTION notify_report_status_change()
RETURNS trigger AS $$
DECLARE
  v_label text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_label := CASE NEW.category
      WHEN 'pothole'          THEN 'Pothole / Road Damage'
      WHEN 'clogged_drainage' THEN 'Drainage / Canal'
      WHEN 'stray_animal'     THEN 'Stray Pets'
      WHEN 'damaged_pole'     THEN 'Damaged Pole'
      ELSE NEW.category
    END;

    INSERT INTO notifications (user_id, type, title, body, payload, is_read, lgu_id)
    VALUES (
      NEW.citizen_id,
      'report_status',
      'Report Status Updated',
      'Your ' || v_label || ' report ' || NEW.reference_number || ' is now ' || NEW.status || '.',
      jsonb_build_object('report_id', NEW.id, 'reference_number', NEW.reference_number),
      false,
      NEW.lgu_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION notify_service_status_change()
RETURNS trigger AS $$
DECLARE
  v_body text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_body := CASE NEW.status
      WHEN 'Under Review'     THEN 'Your ' || NEW.service_type || ' request ' || NEW.reference_number || ' is now under review.'
      WHEN 'In Progress'      THEN NEW.service_type || ' ' || NEW.reference_number || ' is being prepared.'
      WHEN 'Ready for Pickup' THEN NEW.service_type || ' ' || NEW.reference_number || ' is ready! Pay the fee and show your QR code at ' || NEW.office_name || '.'
      WHEN 'Released'         THEN NEW.service_type || ' ' || NEW.reference_number || ' has been released. Thank you!'
      WHEN 'Rejected'         THEN NEW.service_type || ' ' || NEW.reference_number || ' was rejected' || COALESCE(': ' || NEW.reject_reason, '.')
      ELSE 'Your request for ' || NEW.service_type || ' is now ' || NEW.status || '.'
    END;

    INSERT INTO notifications (user_id, type, title, body, payload, is_read, lgu_id)
    VALUES (
      NEW.citizen_id,
      'service_status',
      'Service Request Updated',
      v_body,
      jsonb_build_object('request_id', NEW.id, 'reference_number', NEW.reference_number),
      false,
      NEW.lgu_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER trigger_notify_report_status
  AFTER UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION notify_report_status_change();

CREATE OR REPLACE TRIGGER trigger_notify_service_status
  AFTER UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION notify_service_status_change();

-- ── Staff notification bell (admin panel) ─────────────────────────────────
-- Same `notifications` table, staff-audience rows (user_id NULL, audience
-- set). See Docs/Planning/Plan-Admin-Notifications.md for the v1 scope.
-- NOTE: routine "new report" / "new service request" volume does NOT live
-- here — the bell is important-notices-only (verifications, forum flags,
-- computed overdue/abandoned via apps/admin/src/lib/importantNotices.ts).
-- Routine new-item counts are nav badges instead (users.nav_seen above).
-- notify_staff_new_verification() lives in verification_setup.sql, since
-- verification_requests is created there (run after this file).
-- notify_staff_forum_post_flagged() / notify_staff_forum_comment_flagged()
-- are defined further below, after the forum_posts/forum_comments tables
-- exist (they reference those tables and must run after CREATE TABLE).

-- Realtime: postgres_changes only delivers events for tables in this
-- publication. Without these, EVERY realtime subscriber is silently dead —
-- the API push service (notifications INSERT), mobile NotificationsScreen,
-- ForumScreen, and TrackingDetailScreen. (Found empty on 2026-07-03; that
-- plus the notifications.type bug meant push never worked end-to-end.)
ALTER PUBLICATION supabase_realtime ADD TABLE
  notifications,
  reports,
  service_requests,
  forum_posts,
  forum_comments;
-- ──────────────────────────────────────────────────────────────────────────

-- ── eServices QR pickup RPCs ───────────────────────────────────────────────
-- Trust model: the QR only ever encodes this opaque claim_code, never the
-- reference_number. Scanning is NOT the security boundary — these RPCs are.
-- Each is SECURITY DEFINER + search_path pinned + internally re-verifies the
-- caller's role/LGU (mirrors verify_citizen in verification_setup.sql).
-- KNOWN GOTCHA: `REVOKE ... FROM PUBLIC` alone leaves an implicit grant to
-- `anon` that Supabase sets by default — always revoke from anon explicitly too.
CREATE OR REPLACE FUNCTION mark_service_ready(p_request_id uuid)
RETURNS text AS $$
DECLARE
  v_caller users%ROWTYPE;
  v_request service_requests%ROWTYPE;
  v_code text;
BEGIN
  SELECT * INTO v_caller FROM users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller not found.';
  END IF;

  SELECT * INTO v_request FROM service_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found.';
  END IF;

  IF NOT (v_caller.role IN ('LGU_ADMIN', 'LGU_PERSONNEL') AND v_caller.lgu_id = v_request.lgu_id) THEN
    RAISE EXCEPTION 'Not authorized to update this request.';
  END IF;

  IF v_request.status NOT IN ('Under Review', 'In Progress') THEN
    RAISE EXCEPTION 'Request must be Under Review or In Progress to mark ready.';
  END IF;

  -- floor(random()*32)::int + 1 (NOT ::int alone, which rounds and can hit 33 out of range)
  v_code :=
    (SELECT string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', floor(random() * 32)::int + 1, 1), '')
     FROM generate_series(1, 3)) || '-' ||
    (SELECT string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', floor(random() * 32)::int + 1, 1), '')
     FROM generate_series(1, 4));

  UPDATE service_requests
    SET status = 'Ready for Pickup', claim_code = v_code
    WHERE id = p_request_id;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION lookup_claim_code(p_code text)
RETURNS TABLE(request_id uuid, reference_number text, citizen_name text, service_type text, office_name text, status text, released_at timestamptz) AS $$
DECLARE
  v_caller users%ROWTYPE;
  v_norm text;
BEGIN
  SELECT * INTO v_caller FROM users WHERE id = auth.uid();
  IF NOT FOUND OR v_caller.role NOT IN ('LGU_ADMIN', 'LGU_PERSONNEL') THEN
    RAISE EXCEPTION 'Not authorized.';
  END IF;

  v_norm := upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g'));

  RETURN QUERY
    SELECT sr.id, sr.reference_number, sr.citizen_name, sr.service_type, sr.office_name, sr.status, sr.released_at
    FROM service_requests sr
    WHERE upper(regexp_replace(sr.claim_code, '[^A-Za-z0-9]', '', 'g')) = v_norm
      AND sr.lgu_id = v_caller.lgu_id; -- wrong-LGU codes fall through to NOT FOUND below, never leaking cross-LGU existence

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code not found.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION release_service_request(p_code text)
RETURNS void AS $$
DECLARE
  v_caller users%ROWTYPE;
  v_norm text;
  v_updated_id uuid;
BEGIN
  SELECT * INTO v_caller FROM users WHERE id = auth.uid();
  IF NOT FOUND OR v_caller.role NOT IN ('LGU_ADMIN', 'LGU_PERSONNEL') THEN
    RAISE EXCEPTION 'Not authorized.';
  END IF;

  v_norm := upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g'));

  -- Atomic conditional UPDATE makes release single-use by construction:
  -- a second call finds status already 'Released' and matches zero rows.
  UPDATE service_requests
    SET status = 'Released', released_at = now(), released_by = v_caller.id, claim_code_used_at = now()
    WHERE upper(regexp_replace(claim_code, '[^A-Za-z0-9]', '', 'g')) = v_norm
      AND lgu_id = v_caller.lgu_id
      AND status = 'Ready for Pickup'
    RETURNING id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'Code not found or already released.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION mark_service_ready(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION lookup_claim_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION release_service_request(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION mark_service_ready(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION lookup_claim_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION release_service_request(text) TO authenticated;
-- ──────────────────────────────────────────────────────────────────────────

-- ── Reference number auto-generation ──────────────────────────────────────
-- Sequences produce sequential numbers that survive server restarts and
-- concurrent inserts. The BEFORE INSERT trigger sets reference_number
-- automatically, so clients never need to generate it client-side.
CREATE SEQUENCE IF NOT EXISTS reports_ref_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS service_requests_ref_seq START 1000;

CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'reports' AND (NEW.reference_number IS NULL OR NEW.reference_number = '') THEN
    NEW.reference_number := 'REP-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('reports_ref_seq')::TEXT, 4, '0');
  ELSIF TG_TABLE_NAME = 'service_requests' AND (NEW.reference_number IS NULL OR NEW.reference_number = '') THEN
    NEW.reference_number := 'REQ-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('service_requests_ref_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_reports_ref
  BEFORE INSERT ON reports FOR EACH ROW EXECUTE FUNCTION generate_reference_number();

CREATE OR REPLACE TRIGGER trg_service_requests_ref
  BEFORE INSERT ON service_requests FOR EACH ROW EXECUTE FUNCTION generate_reference_number();
-- ──────────────────────────────────────────────────────────────────────────

-- 5. COMMUNITY FORUM POSTS
CREATE TABLE forum_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
    citizen_name text NOT NULL,
    title text,
    content text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    photo_url text,
    is_approved boolean DEFAULT true,
    flagged_keywords text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. COMMUNITY FORUM COMMENTS
CREATE TABLE forum_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id uuid REFERENCES forum_comments(id) ON DELETE CASCADE,
    citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
    citizen_name text NOT NULL,
    content text NOT NULL,
    is_approved boolean DEFAULT true,
    flagged_keywords text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6.5 COMMUNITY FORUM POST LIKES
CREATE TABLE forum_post_likes (
    post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- Staff notification bell: forum content flagged by check_forum_profanity()
-- (see trg_moderate_forum / trg_moderate_forum_comment below, which run
-- BEFORE these AFTER triggers and set flagged_keywords on the same row).
CREATE OR REPLACE FUNCTION notify_staff_forum_post_flagged()
RETURNS trigger AS $$
BEGIN
  IF NEW.flagged_keywords IS NOT NULL AND array_length(NEW.flagged_keywords, 1) > 0
     AND (TG_OP = 'INSERT' OR OLD.flagged_keywords IS DISTINCT FROM NEW.flagged_keywords) THEN
    INSERT INTO notifications (lgu_id, user_id, audience, type, title, body, payload, is_read)
    VALUES (
      NEW.lgu_id, NULL, 'lgu_admin', 'forum_flagged',
      'Forum Post Flagged',
      'A forum post by ' || COALESCE(NEW.citizen_name, 'a citizen') || ' was flagged by the filter.',
      jsonb_build_object('post_id', NEW.id),
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER trigger_notify_staff_forum_post_flagged
  AFTER INSERT OR UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION notify_staff_forum_post_flagged();

CREATE OR REPLACE FUNCTION notify_staff_forum_comment_flagged()
RETURNS trigger AS $$
DECLARE
  v_lgu_id text;
BEGIN
  IF NEW.flagged_keywords IS NOT NULL AND array_length(NEW.flagged_keywords, 1) > 0
     AND (TG_OP = 'INSERT' OR OLD.flagged_keywords IS DISTINCT FROM NEW.flagged_keywords) THEN
    SELECT lgu_id INTO v_lgu_id FROM forum_posts WHERE id = NEW.post_id;

    INSERT INTO notifications (lgu_id, user_id, audience, type, title, body, payload, is_read)
    VALUES (
      v_lgu_id, NULL, 'lgu_admin', 'forum_flagged',
      'Forum Comment Flagged',
      'A forum comment by ' || COALESCE(NEW.citizen_name, 'a citizen') || ' was flagged by the filter.',
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id),
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER trigger_notify_staff_forum_comment_flagged
  AFTER INSERT OR UPDATE ON forum_comments FOR EACH ROW EXECUTE FUNCTION notify_staff_forum_comment_flagged();

-- 7. AUDIT LOGS
CREATE TABLE audit_logs (
    id bigserial PRIMARY KEY,
    lgu_id text REFERENCES lgus(id) ON DELETE SET NULL,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    user_email text NOT NULL,
    user_role text NOT NULL,
    action text NOT NULL,
    ip_address text NOT NULL,
    details text NOT NULL,
    timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. NEWS & ANNOUNCEMENTS (LGU Admin-controlled)
CREATE TABLE news_announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    title text NOT NULL,
    content text NOT NULL,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
    scheduled_for timestamp with time zone,
    published_at timestamp with time zone,
    attachments jsonb DEFAULT '[]'::jsonb NOT NULL,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    type text DEFAULT 'news' NOT NULL CONSTRAINT news_announcements_type_check CHECK (type IN ('news', 'announcement', 'advisory')),
    duration_hours integer,
    expires_at timestamp with time zone
);

CREATE INDEX news_announcements_lgu_status_idx ON news_announcements(lgu_id, status);

-- 12. NOTIFICATIONS (per-user in-app notifications, plus staff-audience rows)
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text,
    body text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_read boolean DEFAULT false,
    -- Staff-targeted rows (admin notification bell): user_id is NULL, lgu_id +
    -- audience identify who should see it ('lgu_admin' | 'lgu_personnel' |
    -- 'super_admin'). NULL = the original per-citizen behavior, unchanged.
    audience text CHECK (audience IN ('lgu_admin', 'lgu_personnel', 'super_admin')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX notifications_user_idx ON notifications(user_id, is_read);

-- 13. CHATBOT FAQS (non-embedding, keyword/structured fallback)
CREATE TABLE chatbot_faqs (
    id bigserial PRIMARY KEY,
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE,
    question text NOT NULL,
    answer text NOT NULL,
    source text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX chatbot_faqs_lgu_idx ON chatbot_faqs(lgu_id);

-- 13.5 LGU FACILITIES (Points of Interest for Map Explorer)
CREATE TABLE lgu_facilities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    category text NOT NULL CHECK (category IN ('municipal', 'police', 'fire', 'hospital', 'other')),
    address text NOT NULL,
    description text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    phone text,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOTE: The chatbot uses keyword-matched FAQs (chatbot_faqs) + Gemini API fallback
-- by design. The original RAG plan (pgvector `faq_embeddings` table + `match_faqs`
-- semantic-search RPC) was deliberately NOT adopted and was dropped from the live DB
-- on 2026-06-30. Do not re-add pgvector unless the chatbot architecture changes.

-- CREATE SPATIAL INDEXES FOR LOCATION-BASED QUERIES
CREATE INDEX idx_reports_location ON reports USING gist (st_geographyfromtext('SRID=4326;POINT(' || longitude || ' ' || latitude || ')'));

-- --- DATABASE HELPER FUNCTIONS ---

-- Used by lgu_services RLS policies (avoids repeating the users-table EXISTS
-- subquery pattern used elsewhere in this file).
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_current_user_lgu()
RETURNS text AS $$
BEGIN
  RETURN (SELECT lgu_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Geofencing Check Function: Verifies that coordinate coordinates fall within 20km of LGU municipal hall
CREATE OR REPLACE FUNCTION verify_geofence(
  p_latitude double precision, 
  p_longitude double precision, 
  p_lgu_id text
) RETURNS boolean AS $$
DECLARE
  v_lgu_lat double precision;
  v_lgu_lng double precision;
  v_distance_meters double precision;
BEGIN
  SELECT latitude, longitude INTO v_lgu_lat, v_lgu_lng FROM lgus WHERE id = p_lgu_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Calculate geodetic distance in meters using PostGIS geography points
  v_distance_meters := ST_Distance(
    ST_MakePoint(p_longitude, p_latitude)::geography,
    ST_MakePoint(v_lgu_lng, v_lgu_lat)::geography
  );
  
  RETURN v_distance_meters <= 20000; -- True if within 20km
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profanity checker trigger routine for Forum moderation
CREATE OR REPLACE FUNCTION check_forum_profanity() 
RETURNS trigger AS $$
DECLARE
  v_word text;
  v_bad_words text[] := ARRAY['putang ina', 'gago', 'tarantado', 'pota', 'ulol', 'shet', 'bwisit'];
  v_flagged text[] := coalesce(NEW.flagged_keywords, '{}'::text[]);
BEGIN
  FOREACH v_word IN ARRAY v_bad_words LOOP
    IF position(v_word in lower(NEW.content)) > 0 THEN
      IF NOT (v_word = ANY(v_flagged)) THEN
        v_flagged := array_append(v_flagged, v_word);
      END IF;
    END IF;
  END LOOP;
  
  IF array_length(v_flagged, 1) > 0 THEN
    NEW.is_approved := false;
    NEW.flagged_keywords := v_flagged;
  ELSIF NEW.is_approved IS NOT FALSE THEN
    NEW.is_approved := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_moderate_forum
  BEFORE INSERT OR UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION check_forum_profanity();

-- --- ROW-LEVEL SECURITY (RLS) POLICIES ---

-- Enable RLS across all citizen-accessible tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgu_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;

-- 1. Policies for Users Table
-- NOTE: We use a simple auth.uid() IS NOT NULL check to avoid infinite recursion.
-- Recursive policies (e.g., SELECT FROM users WHERE uid = auth.uid() AND role = ...)
-- cause PostgREST 500 errors. Role-based access is enforced at the app layer.
-- Deliberately narrow: a citizen can only read their own row. LGU admins read
-- their own LGU's users and super admins read everyone via the ALL-command
-- management policies below. (Replaced the old blanket "authenticated can read
-- all users" policy on 2026-07-01 — it leaked every user's PII to any login.)
CREATE POLICY "Users can read their own record" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Citizen signup profile creation (2026-07-06): a SECURITY DEFINER trigger on
-- auth.users, not a client-side insert. The mobile app used to insert this
-- row itself right after auth.signUp() — if there was any gap before a
-- session existed (email confirmation enabled, or just propagation lag), that
-- insert ran as anon and violated the INSERT policy above (auth.uid() = id is
-- null for anon). This trigger is atomic with the auth row and bypasses
-- RLS/timing entirely.
--
-- IMPORTANT (regression fix 2026-07-06): this trigger fires on EVERY auth.users
-- insert, including admin.createUser() from the /api/create-staff route. That
-- route inserts its own users row with the real staff role; if this trigger
-- raced a role='CITIZEN' row in first, the route's insert hit a duplicate-key
-- error and every staff creation 500'd. So it MUST skip whenever the auth
-- user was created with a 'role' in user_metadata (the staff path always sets
-- one; citizen self-signup sets only 'full_name'). Do not remove that guard.
CREATE OR REPLACE FUNCTION public.handle_new_citizen_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Staff signup path (create-staff route) sets 'role' in user_metadata and
  -- inserts its own users row — don't race a CITIZEN row in ahead of it.
  IF NEW.raw_user_meta_data ? 'role' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
    'CITIZEN'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_citizen_signup();

-- 2. Policies for Reports Table
-- SELECT split (2026-07-06, sweep §2): the old single "read any report in my
-- LGU" policy let ANY citizen read EVERY report in their LGU (name, exact GPS,
-- photo) — a PII leak. Split into own-rows (citizens) + LGU-scoped (staff), so
-- the admin/personnel pages still read their LGU's reports but citizens see only
-- their own.
CREATE POLICY "Citizens read their own reports" ON reports FOR SELECT USING (
  auth.uid() = citizen_id
);
CREATE POLICY "Staff read reports in their LGU" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()
            AND u.role IN ('LGU_ADMIN', 'LGU_PERSONNEL') AND u.lgu_id = reports.lgu_id)
);
CREATE POLICY "Allow Super Admin to read all reports" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN')
);
CREATE POLICY "Allow Citizens to insert reports" ON reports FOR INSERT WITH CHECK (
  auth.uid() = citizen_id
);
CREATE POLICY "Allow LGU personnel to update reports under their LGU" ON reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.role = 'LGU_PERSONNEL' OR u.role = 'LGU_ADMIN') AND u.lgu_id = reports.lgu_id)
);

-- 3. Policies for Service Requests
CREATE POLICY "Allow citizens to query their own requests" ON service_requests FOR SELECT USING (
  auth.uid() = citizen_id
);
CREATE POLICY "Allow Super Admin to read all service requests" ON service_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN')
);
CREATE POLICY "Allow citizens to apply for documents" ON service_requests FOR INSERT WITH CHECK (
  auth.uid() = citizen_id
);
CREATE POLICY "Allow LGU admins/personnel to view and modify service requests" ON service_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.role = 'LGU_ADMIN' OR u.role = 'LGU_PERSONNEL') AND u.lgu_id = service_requests.lgu_id)
);

-- ── Insert-forgery guards (2026-07-06, sweep §1) ──────────────────────────
-- The citizen INSERT policies above only check `auth.uid() = citizen_id`, so a
-- hand-rolled REST insert (bypassing the app) could forge status, tenant
-- (lgu_id), identity (citizen_name), and lifecycle columns (Resolved status;
-- claim_code / released_* on requests). These BEFORE INSERT triggers FORCE
-- those fields to safe values on real client inserts. Forcing (not rejecting)
-- is deliberate — for the legitimate app the forced values equal what it
-- already sends, so it's a pure no-op that cannot break reporting; only a
-- forger's tampered values get overwritten. Gated on `auth.uid() IS NOT NULL`
-- so service-role/seed inserts (null auth.uid()) pass through untouched.
-- ml_confidence / ml_verified are intentionally NOT forced (the app still
-- writes them client-side) — locking those needs ML writes to move server-side
-- first; tracked as a follow-up in Docs/Audits/Sweep-2026-07-06-Findings.md §1.
-- NOTE (2026-07-06): both guards also ENFORCE citizen verification server-side
-- (the app gated it client-side only — a raw REST insert could bypass) and a
-- 90s submission-cooldown backstop (client cooldown is 120s + bypassable). They
-- RAISE for an unverified caller or a too-soon repeat; seed/service-role inserts
-- (auth.uid() null) skip the whole block.
CREATE OR REPLACE FUNCTION public.guard_citizen_report_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lgu text; v_name text; v_status text; v_mod_status text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT lgu_id, name, verification_status, moderation_status
      INTO v_lgu, v_name, v_status, v_mod_status
      FROM users WHERE id = auth.uid();

    IF v_mod_status = 'banned' THEN
      RAISE EXCEPTION 'Your account has been suspended for rule violations.';
    END IF;
    IF v_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Your account must be verified before submitting a report.';
    END IF;
    IF EXISTS (SELECT 1 FROM reports WHERE citizen_id = auth.uid() AND created_at > now() - interval '90 seconds') THEN
      RAISE EXCEPTION 'Please wait a moment before submitting another report.';
    END IF;
    NEW.citizen_id := auth.uid();
    IF v_lgu  IS NOT NULL THEN NEW.lgu_id       := v_lgu;  END IF;
    IF v_name IS NOT NULL THEN NEW.citizen_name := v_name; END IF;
    NEW.status := 'Submitted';
    NEW.is_low_credibility := false;
    NEW.assigned_office := NULL; NEW.assigned_office_id := NULL;
    NEW.sla_tier := NULL; NEW.sla_due_date := NULL;
    NEW.rating := NULL; NEW.feedback := NULL;
    NEW.status_history := '[]'::jsonb;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS reports_guard_citizen_insert ON reports;
CREATE TRIGGER reports_guard_citizen_insert BEFORE INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION public.guard_citizen_report_insert();

CREATE OR REPLACE FUNCTION public.guard_citizen_request_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lgu text; v_name text; v_status text; v_mod_status text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT lgu_id, name, verification_status, moderation_status
      INTO v_lgu, v_name, v_status, v_mod_status
      FROM users WHERE id = auth.uid();

    IF v_mod_status = 'banned' THEN
      RAISE EXCEPTION 'Your account has been suspended for rule violations.';
    END IF;
    IF v_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Your account must be verified before applying for a service.';
    END IF;
    IF EXISTS (SELECT 1 FROM service_requests WHERE citizen_id = auth.uid() AND created_at > now() - interval '90 seconds') THEN
      RAISE EXCEPTION 'Please wait a moment before submitting another application.';
    END IF;
    NEW.citizen_id := auth.uid();
    IF v_lgu  IS NOT NULL THEN NEW.lgu_id       := v_lgu;  END IF;
    IF v_name IS NOT NULL THEN NEW.citizen_name := v_name; END IF;
    NEW.status := 'Submitted';
    NEW.office_id := NULL; NEW.qr_code_url := NULL;
    NEW.claim_code := NULL; NEW.claim_code_used_at := NULL;
    NEW.released_at := NULL; NEW.released_by := NULL;
    NEW.assigned_personnel := NULL; NEW.reject_reason := NULL;
    NEW.status_history := '[]'::jsonb;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS service_requests_guard_citizen_insert ON service_requests;
CREATE TRIGGER service_requests_guard_citizen_insert BEFORE INSERT ON service_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_citizen_request_insert();

CREATE OR REPLACE FUNCTION public.guard_citizen_forum_post_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lgu text; v_name text; v_status text; v_mod_status text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT lgu_id, name, verification_status, moderation_status
      INTO v_lgu, v_name, v_status, v_mod_status
      FROM users WHERE id = auth.uid();

    IF v_mod_status = 'banned' THEN
      RAISE EXCEPTION 'Your account has been suspended for rule violations.';
    END IF;
    IF v_mod_status = 'restricted' THEN
      RAISE EXCEPTION 'Your account is restricted from posting in the forum.';
    END IF;
    IF v_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Your account must be verified before posting in the forum.';
    END IF;
    NEW.citizen_id := auth.uid();
    IF v_lgu  IS NOT NULL THEN NEW.lgu_id       := v_lgu;  END IF;
    IF v_name IS NOT NULL THEN NEW.citizen_name := v_name; END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS forum_posts_guard_citizen_insert ON forum_posts;
CREATE TRIGGER forum_posts_guard_citizen_insert BEFORE INSERT ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.guard_citizen_forum_post_insert();

CREATE OR REPLACE FUNCTION public.guard_citizen_forum_comment_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_status text; v_mod_status text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT name, verification_status, moderation_status
      INTO v_name, v_status, v_mod_status
      FROM users WHERE id = auth.uid();

    IF v_mod_status = 'banned' THEN
      RAISE EXCEPTION 'Your account has been suspended for rule violations.';
    END IF;
    IF v_mod_status = 'restricted' THEN
      RAISE EXCEPTION 'Your account is restricted from commenting in the forum.';
    END IF;
    IF v_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Your account must be verified before commenting in the forum.';
    END IF;
    NEW.citizen_id := auth.uid();
    IF v_name IS NOT NULL THEN NEW.citizen_name := v_name; END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS forum_comments_guard_citizen_insert ON forum_comments;
CREATE TRIGGER forum_comments_guard_citizen_insert BEFORE INSERT ON forum_comments
  FOR EACH ROW EXECUTE FUNCTION public.guard_citizen_forum_comment_insert();

-- Citizen self-withdraw RPCs (2026-07-06): cancel your OWN still-Submitted
-- report/request (sets status 'Cancelled'); SECURITY DEFINER so it bypasses the
-- staff-only UPDATE policy but only for the owner + only while Submitted.
CREATE OR REPLACE FUNCTION public.cancel_report(p_report_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE reports SET status = 'Cancelled'
   WHERE id = p_report_id AND citizen_id = auth.uid() AND status = 'Submitted';
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found, not yours, or already being processed.'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.cancel_report(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_report(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_request(p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE service_requests SET status = 'Cancelled'
   WHERE id = p_request_id AND citizen_id = auth.uid() AND status = 'Submitted';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found, not yours, or already being processed.'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.cancel_request(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_request(uuid) TO authenticated;

-- Citizen rating RPC (2026-07-06, sweep §3): there is no citizen UPDATE policy on
-- reports (a blanket one would re-open the insert-forgery the guards above close),
-- so rating goes through this scoped SECURITY DEFINER function — it can only set
-- rating/feedback on the caller's OWN Resolved report. Mobile TrackingDetailScreen
-- calls supabase.rpc('rate_report', ...) instead of a direct .update().
CREATE OR REPLACE FUNCTION public.rate_report(p_report_id uuid, p_rating int, p_feedback text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5.';
  END IF;
  UPDATE reports
     SET rating = p_rating, feedback = NULLIF(TRIM(COALESCE(p_feedback, '')), '')
   WHERE id = p_report_id AND citizen_id = auth.uid() AND status = 'Resolved';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found, not yours, or not yet resolved.';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.rate_report(uuid, int, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rate_report(uuid, int, text) TO authenticated;

-- Audit logging (2026-07-06): DB-trigger audit trail (RA 10173) — the old
-- app-layer writer was dead code (clients hit Supabase directly). Logs staff
-- status changes on reports + service_requests: actor (auth.uid() -> users),
-- from->to status, row, timestamp. SECURITY DEFINER + an EXCEPTION handler that
-- swallows failures so audit logging can NEVER roll back the real update.
-- ip_address = 'db-trigger' (a trigger can't see the client IP — honest, unlike
-- the old hardcoded 127.0.0.1).
CREATE OR REPLACE FUNCTION public.audit_report_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text; v_role text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    BEGIN
      SELECT email, role INTO v_email, v_role FROM users WHERE id = auth.uid();
      INSERT INTO audit_logs (lgu_id, user_id, user_email, user_role, action, ip_address, details, "timestamp")
      VALUES (NEW.lgu_id, auth.uid(), COALESCE(v_email, 'system'), COALESCE(v_role, 'system'),
              'report.status_change', 'db-trigger',
              json_build_object('report_id', NEW.id, 'reference_number', NEW.reference_number,
                                'from', OLD.status, 'to', NEW.status)::text, now());
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS reports_audit_status ON reports;
CREATE TRIGGER reports_audit_status AFTER UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION public.audit_report_status_change();

CREATE OR REPLACE FUNCTION public.audit_request_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text; v_role text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    BEGIN
      SELECT email, role INTO v_email, v_role FROM users WHERE id = auth.uid();
      INSERT INTO audit_logs (lgu_id, user_id, user_email, user_role, action, ip_address, details, "timestamp")
      VALUES (NEW.lgu_id, auth.uid(), COALESCE(v_email, 'system'), COALESCE(v_role, 'system'),
              'service_request.status_change', 'db-trigger',
              json_build_object('request_id', NEW.id, 'reference_number', NEW.reference_number,
                                'from', OLD.status, 'to', NEW.status)::text, now());
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS service_requests_audit_status ON service_requests;
CREATE TRIGGER service_requests_audit_status AFTER UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_request_status_change();

-- 3.5 Policies for LGU Services Catalog (admin-editable, citizens browse active rows only)
-- (2026-07-06, sweep §2): active rows stay public (the citizen catalog), but the
-- staff-reads-everything branch (incl. inactive drafts) is scoped to the caller's
-- own LGU so staff can't read other LGUs' draft catalogs.
CREATE POLICY "Read active services or own-LGU staff" ON lgu_services FOR SELECT USING (
  is_active = true
  OR (get_current_user_role() IN ('LGU_ADMIN', 'LGU_PERSONNEL') AND lgu_id = get_current_user_lgu())
  OR get_current_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "Allow LGU_ADMIN to manage own LGU services" ON lgu_services FOR ALL USING (
  get_current_user_role() = 'LGU_ADMIN' AND lgu_id = get_current_user_lgu()
) WITH CHECK (
  get_current_user_role() = 'LGU_ADMIN' AND lgu_id = get_current_user_lgu()
);

CREATE POLICY "Allow SUPER_ADMIN to manage all services" ON lgu_services FOR ALL USING (
  get_current_user_role() = 'SUPER_ADMIN'
) WITH CHECK (
  get_current_user_role() = 'SUPER_ADMIN'
);

-- 4. Policies for Forum Posts
-- (2026-07-06, sweep §2): approved-post reads scoped to the caller's LGU (was
-- unscoped — any authenticated user could read any LGU's posts), plus an
-- explicit own-posts policy so a citizen can see their own pending/unapproved
-- post (the old policy set never allowed that).
CREATE POLICY "Read approved posts in my LGU" ON forum_posts FOR SELECT USING (
  is_approved = true
  AND lgu_id = (SELECT u.lgu_id FROM users u WHERE u.id = auth.uid())
);
CREATE POLICY "Citizens read their own posts" ON forum_posts FOR SELECT USING (
  auth.uid() = citizen_id
);
CREATE POLICY "Allow LGU Admins to review unapproved posts" ON forum_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'LGU_ADMIN' AND u.lgu_id = forum_posts.lgu_id)
);
CREATE POLICY "Allow Citizens to insert posts" ON forum_posts FOR INSERT WITH CHECK (
  auth.uid() = citizen_id
);
CREATE POLICY "Allow LGU Admins to moderate posts" ON forum_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'LGU_ADMIN' AND u.lgu_id = forum_posts.lgu_id)
);

-- 5. Policies for Offices
CREATE POLICY "Allow LGU staff to manage offices" ON offices FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
      AND (u.role = 'LGU_ADMIN' OR u.role = 'LGU_PERSONNEL') 
      AND u.lgu_id = offices.lgu_id
  )
);

CREATE POLICY "Allow Super Admins to read all offices" ON offices FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN')
);

-- 6. Policies for Report Assignments
-- 6. Policies for News Announcements
CREATE POLICY "Allow public read of published announcements" ON news_announcements FOR SELECT USING (
  status = 'published'
);

CREATE POLICY "Allow LGU staff to manage announcements" ON news_announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.lgu_id = news_announcements.lgu_id AND (u.role = 'LGU_ADMIN' OR u.role = 'LGU_PERSONNEL'))
);

-- 7. Policies for Notifications
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT USING (
  auth.uid() = user_id
);

-- NO client INSERT policy on purpose (the old `WITH CHECK (true)` one let any
-- logged-in user forge notifications for anyone, incl. fake staff notices —
-- removed 2026-07-05). The only writers are the notify_* triggers (SECURITY
-- DEFINER, bypass RLS) and the API push service (service key, bypasses RLS).

-- Citizens mark their own notifications read (mobile NotificationsScreen).
-- Without this UPDATE policy, mark-as-read silently updated 0 rows.
CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Staff notification bell: a staff row is visible to a user whose role (+ lgu,
-- except the cross-LGU super admin rollup) matches the row's audience.
CREATE POLICY "Staff can read audience notifications" ON notifications FOR SELECT USING (
  audience IS NOT NULL AND (
    (get_current_user_role() = 'SUPER_ADMIN' AND audience = 'super_admin')
    OR (lgu_id = get_current_user_lgu() AND get_current_user_role() = 'LGU_ADMIN' AND audience IN ('lgu_admin', 'lgu_personnel'))
    OR (lgu_id = get_current_user_lgu() AND get_current_user_role() = 'LGU_PERSONNEL' AND audience = 'lgu_personnel')
  )
);

-- 8. Policies for Chatbot FAQs
CREATE POLICY "Allow all users to read chatbot FAQs" ON chatbot_faqs FOR SELECT USING (true);

CREATE POLICY "Allow LGU Admins to manage chatbot FAQs" ON chatbot_faqs FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'LGU_ADMIN' AND u.lgu_id = chatbot_faqs.lgu_id)
);

-- 8.5 Policies for LGU Facilities
ALTER TABLE lgu_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to read LGU facilities" ON lgu_facilities
  FOR SELECT USING (true);

CREATE POLICY "Allow LGU admins to manage facilities" ON lgu_facilities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'LGU_ADMIN' AND u.lgu_id = lgu_facilities.lgu_id)
  );

-- 9. Policies for Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read all audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN')
);

CREATE POLICY "LGU admins can read their LGU audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.role = 'LGU_ADMIN' OR u.role = 'LGU_PERSONNEL') AND u.lgu_id = audit_logs.lgu_id)
);

-- 10. Policies and Triggers for Forum Comments
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

-- forum_comments has no lgu_id column — scope admin access via a join to
-- forum_posts.lgu_id, matching the admin's own lgu_id. (Was previously
-- unscoped: any LGU_ADMIN could read/moderate every LGU's comments — fixed
-- 2026-07-03, same bug class as the users-table PII leak fixed 2026-07-01.)
-- (2026-07-06, sweep §2): approved-comment reads scoped to the caller's LGU
-- (was `is_approved = true` unscoped). Citizens' own comments + admin moderation
-- are covered by the own-comments policy below and the moderate-comments FOR ALL
-- policy further down, so this SELECT policy no longer needs those OR branches.
CREATE POLICY "Read approved comments in my LGU" ON forum_comments FOR SELECT USING (
  is_approved = true
  AND EXISTS (SELECT 1 FROM forum_posts p
              WHERE p.id = forum_comments.post_id
                AND p.lgu_id = (SELECT u.lgu_id FROM users u WHERE u.id = auth.uid()))
);
CREATE POLICY "Citizens read their own comments" ON forum_comments FOR SELECT USING (
  auth.uid() = citizen_id
);

CREATE POLICY "Allow Citizens to insert comments" ON forum_comments FOR INSERT WITH CHECK (
  auth.uid() = citizen_id
);

CREATE POLICY "Allow LGU Admins to moderate comments" ON forum_comments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN forum_posts p ON p.id = forum_comments.post_id
    WHERE u.id = auth.uid() AND u.role = 'LGU_ADMIN' AND u.lgu_id = p.lgu_id
  )
);

CREATE TRIGGER trg_moderate_forum_comment
  BEFORE INSERT OR UPDATE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION check_forum_profanity();

-- 14. CITIZEN GUIDES (for directory of local offices and resources)
CREATE TABLE public.citizen_guides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES public.lgus(id) ON DELETE CASCADE NOT NULL,
    section text NOT NULL,
    title text NOT NULL,
    address text,
    schedule text,
    website text,
    phone text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.citizen_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to citizen_guides"
  ON public.citizen_guides FOR SELECT
  USING (true);

CREATE POLICY "Allow staff to insert citizen_guides"
  ON public.citizen_guides FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (u.role = 'LGU_ADMIN' OR u.role = 'LGU_PERSONNEL')
        AND u.lgu_id = citizen_guides.lgu_id
    )
  );

CREATE POLICY "Allow staff to update citizen_guides"
  ON public.citizen_guides FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (u.role = 'LGU_ADMIN' OR u.role = 'LGU_PERSONNEL')
        AND u.lgu_id = citizen_guides.lgu_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (u.role = 'LGU_ADMIN' OR u.role = 'LGU_PERSONNEL')
        AND u.lgu_id = citizen_guides.lgu_id
    )
  );

CREATE POLICY "Allow staff to delete citizen_guides"
  ON public.citizen_guides FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (u.role = 'LGU_ADMIN' OR u.role = 'LGU_PERSONNEL')
        AND u.lgu_id = citizen_guides.lgu_id
    )
  );

CREATE POLICY "Allow super admin full control to citizen_guides"
  ON public.citizen_guides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN'
    )
  );

-- 10.2 Policies for Guests (unauthenticated users)
CREATE POLICY "Allow guests to read approved posts" ON forum_posts FOR SELECT USING (
  is_approved = true AND auth.uid() IS NULL
);
CREATE POLICY "Allow guests to read approved comments" ON forum_comments FOR SELECT USING (
  is_approved = true AND auth.uid() IS NULL
);

-- Guests need a forum author's avatar (the author's NAME is already public via
-- forum_posts.citizen_name). Row-level policy "Guests can read forum author profiles"
-- restricts anon to ONLY reading rows of users who are published forum authors —
-- but a bare `GRANT SELECT ON users TO anon` grants every column on those rows
-- (email, expo_push_token, moderation_reason, role, etc.), not just avatar_url.
-- Column-level grant instead. NOTE: this alone does not fix the mobile app's
-- embedded join (`citizen:users!citizen_id(avatar_url)`) — Postgres requires
-- table-level SELECT for any query that JOINs an RLS-protected table, even for
-- already-granted columns, and (confirmed empirically) a view over `users`
-- does not help either: PostgreSQL re-checks RLS/privileges against the
-- INVOKING role, not the view owner, whenever the view is used inside a JOIN
-- — by design, to prevent using views to bypass row-level security. The
-- embedded-avatar feature needs a non-join fix (client-side lookup query, or
-- a synced public-columns table) — tracked as a follow-up, not yet done.
REVOKE SELECT ON users FROM anon;
GRANT SELECT (id, name, avatar_url) ON users TO anon;

CREATE OR REPLACE FUNCTION is_public_forum_author(p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM forum_posts    fp WHERE fp.citizen_id = p_user_id AND fp.is_approved)
      OR EXISTS (SELECT 1 FROM forum_comments fc WHERE fc.citizen_id = p_user_id AND fc.is_approved);
$$;
REVOKE EXECUTE ON FUNCTION is_public_forum_author(uuid) FROM public;
GRANT EXECUTE ON FUNCTION is_public_forum_author(uuid) TO anon, authenticated;

CREATE POLICY "Guests can read forum author profiles" ON users
  FOR SELECT TO anon
  USING ( is_public_forum_author(users.id) );

-- 10.3 Policies for Forum Post Likes
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of likes" ON forum_post_likes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to toggle likes" ON forum_post_likes FOR ALL USING (auth.uid() = user_id);

-- 15. REALTIME PUBLICATION SETUP
-- Realtime needs tables in the supabase_realtime publication to broadcast changes.
-- Note: If running locally or on a fresh project, the publication is auto-created.
ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- The API push service's advisory-broadcast channel listens to
-- news_announcements changes to push published advisories to all LGU citizens.
-- REPLICA IDENTITY FULL is required so the realtime payload.old carries the
-- previous `status` — the broadcast guard fires only on the transition INTO
-- 'published', so without the old status it would re-broadcast on every update
-- to a published advisory (e.g. the views-counter increment on each article open).
ALTER PUBLICATION supabase_realtime ADD TABLE news_announcements;
ALTER TABLE news_announcements REPLICA IDENTITY FULL;

-- 16. CITIZEN USER MANAGEMENT & MODERATION
-- Originally introduced via patch 05_citizen_moderation.sql; fully mirrored
-- here so schema.sql remains a complete, standalone rebuild script. The
-- guard_citizen_*_insert functions above (reports/requests/forum posts &
-- comments) already carry their moderation_status checks in place.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'active' NOT NULL
    CHECK (moderation_status IN ('active', 'restricted', 'banned'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS moderation_reason text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS citizen_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'denied')),
  admin_response text,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS citizen_appeals_lgu_status_idx ON citizen_appeals(lgu_id, status);
CREATE INDEX IF NOT EXISTS citizen_appeals_user_idx ON citizen_appeals(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS citizen_appeals_one_pending_per_user ON citizen_appeals(user_id) WHERE status = 'pending';

ALTER TABLE citizen_appeals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Citizens can read own appeals" ON citizen_appeals;
CREATE POLICY "Citizens can read own appeals" ON citizen_appeals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Citizens can insert own appeals" ON citizen_appeals;
CREATE POLICY "Citizens can insert own appeals" ON citizen_appeals FOR INSERT WITH CHECK (
  auth.uid() = user_id AND status = 'pending' AND lgu_id = (SELECT lgu_id FROM users WHERE id = auth.uid())
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND moderation_status IN ('restricted', 'banned'))
);

DROP POLICY IF EXISTS "LGU admins can read appeals in their LGU" ON citizen_appeals;
CREATE POLICY "LGU admins can read appeals in their LGU" ON citizen_appeals FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'LGU_ADMIN' AND u.lgu_id = citizen_appeals.lgu_id)
);

DROP POLICY IF EXISTS "Super admins can read all appeals" ON citizen_appeals;
CREATE POLICY "Super admins can read all appeals" ON citizen_appeals FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN')
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'citizen_appeals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE citizen_appeals;
  END IF;
END $$;

-- Write-guard on the moderation columns above: a citizen updating their own
-- row (allowed by the existing "update own profile" policy) must not be able
-- to un-ban/un-restrict themselves or forge a reason/moderator/timestamp.
-- Authorized RPCs bypass this via the app.skip_moderation_guard GUC.
CREATE OR REPLACE FUNCTION guard_moderation_columns()
RETURNS trigger AS $$
BEGIN
  IF current_setting('app.skip_moderation_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
       OR NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason
       OR NEW.moderated_by     IS DISTINCT FROM OLD.moderated_by
       OR NEW.moderated_at     IS DISTINCT FROM OLD.moderated_at
    THEN
      RAISE EXCEPTION 'Moderation fields can only be changed by an authorized administrator.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS users_guard_moderation ON users;
CREATE TRIGGER users_guard_moderation
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION guard_moderation_columns();

-- Moderation RPCs: the only sanctioned way to change moderation_status.
CREATE OR REPLACE FUNCTION moderate_citizen(
  p_user_id uuid,
  p_action text, -- 'ban' | 'restrict' | 'reactivate'
  p_reason text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_target users%ROWTYPE;
  v_caller users%ROWTYPE;
BEGIN
  PERFORM set_config('app.skip_moderation_guard', 'on', true);

  IF p_action NOT IN ('ban', 'restrict', 'reactivate') THEN
    RAISE EXCEPTION 'Invalid action. Must be ban, restrict, or reactivate.';
  END IF;

  IF p_action IN ('ban', 'restrict') AND (p_reason IS NULL OR trim(p_reason) = '') THEN
    RAISE EXCEPTION 'A reason is required when banning or restricting a citizen.';
  END IF;

  SELECT * INTO v_target FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Citizen account not found.';
  END IF;

  IF v_target.role <> 'CITIZEN' THEN
    RAISE EXCEPTION 'Staff and admin accounts cannot be moderated through citizen moderation.';
  END IF;

  SELECT * INTO v_caller FROM users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller account not found.';
  END IF;

  IF NOT (v_caller.role = 'SUPER_ADMIN'
          OR (v_caller.role = 'LGU_ADMIN' AND v_caller.lgu_id = v_target.lgu_id)) THEN
    RAISE EXCEPTION 'Not authorized to moderate citizens of this LGU.';
  END IF;

  IF p_action = 'ban' THEN
    UPDATE users
      SET moderation_status = 'banned',
          moderation_reason = p_reason,
          moderated_by = v_caller.id,
          moderated_at = now()
      WHERE id = p_user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (
      p_user_id, v_target.lgu_id, 'account_banned',
      'Account Suspended',
      'Your account has been suspended for rule violations. You can view the reason or appeal in the app.',
      jsonb_build_object('reason', p_reason),
      false
    );

  ELSIF p_action = 'restrict' THEN
    UPDATE users
      SET moderation_status = 'restricted',
          moderation_reason = p_reason,
          moderated_by = v_caller.id,
          moderated_at = now()
      WHERE id = p_user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (
      p_user_id, v_target.lgu_id, 'account_restricted',
      'Account Restricted',
      'Your account has been restricted from posting in the forum.',
      jsonb_build_object('reason', p_reason),
      false
    );

  ELSIF p_action = 'reactivate' THEN
    UPDATE users
      SET moderation_status = 'active',
          moderation_reason = NULL,
          moderated_by = v_caller.id,
          moderated_at = now()
      WHERE id = p_user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (
      p_user_id, v_target.lgu_id, 'account_reactivated',
      'Account Reactivated',
      'Your account restrictions have been lifted.',
      '{}'::jsonb,
      false
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION moderate_citizen(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION moderate_citizen(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION submit_citizen_appeal(
  p_message text
) RETURNS uuid AS $$
DECLARE
  v_user users%ROWTYPE;
  v_appeal_id uuid;
BEGIN
  IF p_message IS NULL OR trim(p_message) = '' THEN
    RAISE EXCEPTION 'Appeal message cannot be empty.';
  END IF;

  SELECT * INTO v_user FROM users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User account not found.';
  END IF;

  IF v_user.moderation_status NOT IN ('restricted', 'banned') THEN
    RAISE EXCEPTION 'Your account is not restricted or banned.';
  END IF;

  IF EXISTS (SELECT 1 FROM citizen_appeals WHERE user_id = auth.uid() AND status = 'pending') THEN
    RAISE EXCEPTION 'You already have an appeal pending review.';
  END IF;

  -- Appeal-spam cooldown: after a denial, block a new appeal for 3 days so a
  -- troll can't flood the admin queue. The in-person municipal-hall path stays open.
  IF EXISTS (
    SELECT 1 FROM citizen_appeals
    WHERE user_id = auth.uid() AND status = 'denied' AND reviewed_at > now() - interval '3 days'
  ) THEN
    RAISE EXCEPTION 'Your recent appeal was denied. You can submit a new appeal after 3 days, or appeal in person at your municipal hall.';
  END IF;

  INSERT INTO citizen_appeals (user_id, lgu_id, message, status)
  VALUES (auth.uid(), v_user.lgu_id, trim(p_message), 'pending')
  RETURNING id INTO v_appeal_id;

  INSERT INTO notifications (lgu_id, user_id, audience, type, title, body, payload, is_read)
  VALUES (
    v_user.lgu_id, NULL, 'lgu_admin', 'new_appeal',
    'New Appeal Submitted',
    COALESCE(v_user.name, 'A citizen') || ' submitted a moderation appeal.',
    jsonb_build_object('appeal_id', v_appeal_id, 'user_id', auth.uid()),
    false
  );

  RETURN v_appeal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION submit_citizen_appeal(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION submit_citizen_appeal(text) TO authenticated;

CREATE OR REPLACE FUNCTION resolve_citizen_appeal(
  p_appeal_id uuid,
  p_action text, -- 'approve' | 'deny'
  p_response text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_appeal citizen_appeals%ROWTYPE;
  v_caller users%ROWTYPE;
BEGIN
  IF p_action NOT IN ('approve', 'deny') THEN
    RAISE EXCEPTION 'Invalid action. Must be approve or deny.';
  END IF;

  IF p_action = 'deny' AND (p_response IS NULL OR trim(p_response) = '') THEN
    RAISE EXCEPTION 'A response note is required when denying an appeal.';
  END IF;

  SELECT * INTO v_appeal FROM citizen_appeals WHERE id = p_appeal_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appeal not found.';
  END IF;

  SELECT * INTO v_caller FROM users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller account not found.';
  END IF;

  IF NOT (v_caller.role = 'SUPER_ADMIN'
          OR (v_caller.role = 'LGU_ADMIN' AND v_caller.lgu_id = v_appeal.lgu_id)) THEN
    RAISE EXCEPTION 'Not authorized to resolve appeals for this LGU.';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE citizen_appeals
      SET status = 'approved',
          admin_response = p_response,
          reviewed_by = v_caller.id,
          reviewed_at = now()
      WHERE id = p_appeal_id;

    PERFORM set_config('app.skip_moderation_guard', 'on', true);

    UPDATE users
      SET moderation_status = 'active',
          moderation_reason = NULL,
          moderated_by = v_caller.id,
          moderated_at = now()
      WHERE id = v_appeal.user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (
      v_appeal.user_id, v_appeal.lgu_id, 'appeal_approved',
      'Appeal Approved',
      'Your moderation appeal was approved and your account restrictions have been lifted.',
      jsonb_build_object('appeal_id', p_appeal_id),
      false
    );

  ELSIF p_action = 'deny' THEN
    UPDATE citizen_appeals
      SET status = 'denied',
          admin_response = p_response,
          reviewed_by = v_caller.id,
          reviewed_at = now()
      WHERE id = p_appeal_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (
      v_appeal.user_id, v_appeal.lgu_id, 'appeal_denied',
      'Appeal Update',
      'Your moderation appeal was reviewed: ' || trim(p_response),
      jsonb_build_object('appeal_id', p_appeal_id, 'response', p_response),
      false
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION resolve_citizen_appeal(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION resolve_citizen_appeal(uuid, text, text) TO authenticated;

-- forum_post_likes has no insert-guard elsewhere; without this a banned or
-- restricted citizen could still spam like/unlike via a direct API call.
CREATE OR REPLACE FUNCTION public.guard_forum_like_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_mod text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT moderation_status INTO v_mod FROM users WHERE id = auth.uid();
    IF v_mod = 'banned' THEN RAISE EXCEPTION 'Your account has been suspended for rule violations.'; END IF;
    IF v_mod = 'restricted' THEN RAISE EXCEPTION 'Your account is restricted from interacting in the forum.'; END IF;
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS forum_post_likes_guard ON forum_post_likes;
CREATE TRIGGER forum_post_likes_guard
  BEFORE INSERT ON forum_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.guard_forum_like_insert();


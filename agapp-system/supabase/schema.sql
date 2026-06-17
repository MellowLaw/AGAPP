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

-- 4. CITIZEN CONCERN REPORTS TABLE
CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number text UNIQUE NOT NULL,
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
    citizen_name text NOT NULL,
    -- MVP: limit to 3 core categories; extend via offices/config tables if needed
    category text NOT NULL CHECK (category IN ('pothole', 'clogged_drainage', 'stray_animal')),
    description text,
    photo_url text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    barangay text NOT NULL,
    status text DEFAULT 'Submitted' NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected')),
    assigned_office text, -- legacy label for quick queries
    assigned_office_id uuid REFERENCES offices(id) ON DELETE SET NULL,
    sla_tier text CHECK (sla_tier IN ('simple', 'complex', 'highly_technical')),
    sla_due_date timestamp with time zone,
    ml_confidence double precision DEFAULT 1.0,
    ml_verified boolean DEFAULT true,
    is_low_credibility boolean DEFAULT false,
    rating integer CHECK (rating BETWEEN 1 AND 5),
    feedback text,
    status_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
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
    status text DEFAULT 'Submitted' NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'In Progress', 'Released', 'Rejected')),
    form_details jsonb NOT NULL,
    qr_code_url text NOT NULL,
    attachment_url text,
    assigned_personnel text,
    reject_reason text,
    status_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX news_announcements_lgu_status_idx ON news_announcements(lgu_id, status);

-- 12. NOTIFICATIONS (per-user in-app notifications)
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text,
    body text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_read boolean DEFAULT false,
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
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    phone text,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. FAQ EMBEDDINGS (pgvector semantic chatbot, requires vector extension)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE faq_embeddings (
    id bigserial PRIMARY KEY,
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE,
    question text NOT NULL,
    answer text NOT NULL,
    source text NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE faq_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read faq embeddings" ON faq_embeddings FOR SELECT USING (true);
CREATE POLICY "Allow LGU Admins to manage faq embeddings" ON faq_embeddings FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'LGU_ADMIN' AND u.lgu_id = faq_embeddings.lgu_id)
);

-- CREATE SPATIAL INDEXES FOR LOCATION-BASED QUERIES
CREATE INDEX idx_reports_location ON reports USING gist (st_geographyfromtext('SRID=4326;POINT(' || longitude || ' ' || latitude || ')'));

-- --- DATABASE HELPER FUNCTIONS ---

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
ALTER TABLE news_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;

-- 1. Policies for Users Table
-- NOTE: We use a simple auth.uid() IS NOT NULL check to avoid infinite recursion.
-- Recursive policies (e.g., SELECT FROM users WHERE uid = auth.uid() AND role = ...)
-- cause PostgREST 500 errors. Role-based access is enforced at the app layer.
CREATE POLICY "Authenticated users can read all users" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Policies for Reports Table
CREATE POLICY "Allow Citizens to read reports in their LGU" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.lgu_id = reports.lgu_id)
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

-- 4. Policies for Forum Posts
CREATE POLICY "Allow viewing approved forum posts" ON forum_posts FOR SELECT USING (
  is_approved = true
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

CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

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

CREATE POLICY "Allow viewing approved forum comments" ON forum_comments FOR SELECT USING (
  is_approved = true OR citizen_id = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'LGU_ADMIN')
);

CREATE POLICY "Allow Citizens to insert comments" ON forum_comments FOR INSERT WITH CHECK (
  auth.uid() = citizen_id OR auth.uid() IS NOT NULL
);

CREATE POLICY "Allow LGU Admins to moderate comments" ON forum_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'LGU_ADMIN')
);

CREATE TRIGGER trg_moderate_forum_comment
  BEFORE INSERT OR UPDATE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION check_forum_profanity();

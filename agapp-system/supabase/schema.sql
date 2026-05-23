-- AGAPP Database Schema for Supabase
-- Core Multi-Tenant LGU, Citizen, Reporting, and Chatbot Schema

-- Enable spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop existing tables to start fresh (if executing sequentially)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS forum_posts CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
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

-- 3. CITIZEN CONCERN REPORTS TABLE
CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number text UNIQUE NOT NULL,
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
    citizen_name text NOT NULL,
    category text NOT NULL CHECK (category IN ('pothole', 'damaged_pole', 'clogged_drainage', 'stray_animal', 'missing_pet', 'lost_found')),
    description text,
    photo_url text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    barangay text NOT NULL,
    status text DEFAULT 'Submitted' NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected')),
    assigned_office text,
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

-- 4. CITIZEN DOCUMENT SERVICE REQUESTS
CREATE TABLE service_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number text UNIQUE NOT NULL,
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
    citizen_name text NOT NULL,
    service_type text NOT NULL, -- e.g. "Birth Certificate Request"
    office_name text NOT NULL, -- e.g. "Civil Registrar"
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

-- Chatbot Similarity Matching Function
CREATE OR REPLACE FUNCTION match_faqs (
  query_embedding vector(768),
  similarity_threshold float,
  match_count int,
  p_lgu_id text
) RETURNS TABLE (
  id bigint,
  question text,
  answer text,
  source text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    f.source,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM faq_embeddings f
  WHERE f.lgu_id = p_lgu_id
    AND 1 - (f.embedding <=> query_embedding) > similarity_threshold
  ORDER BY f.embedding <=> query_embedding LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profanity checker trigger routine for Forum moderation
CREATE OR REPLACE FUNCTION check_forum_profanity() 
RETURNS trigger AS $$
DECLARE
  v_word text;
  v_bad_words text[] := ARRAY['putang ina', 'gago', 'tarantado', 'pota', 'ulol', 'shet', 'bwisit'];
  v_flagged text[] := '{}'::text[];
BEGIN
  FOREACH v_word IN ARRAY v_bad_words LOOP
    IF position(v_word in lower(NEW.content)) > 0 THEN
      v_flagged := array_append(v_flagged, v_word);
    END IF;
  END LOOP;
  
  IF array_length(v_flagged, 1) > 0 THEN
    NEW.is_approved := false;
    NEW.flagged_keywords := v_flagged;
  ELSE
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
ALTER TABLE faq_embeddings ENABLE ROW LEVEL SECURITY;

-- 1. Policies for Users Table
CREATE POLICY "Allow users to read LGU profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Allow users to read their own user record" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow LGU Admins to view users in their LGU" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'LGU_ADMIN' AND u.lgu_id = users.lgu_id)
);
CREATE POLICY "Allow Super Admins full select access" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN')
);

-- 2. Policies for Reports Table
CREATE POLICY "Allow Citizens to read reports in their LGU" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.lgu_id = reports.lgu_id)
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

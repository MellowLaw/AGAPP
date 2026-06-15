-- ============================================================
--  AGAPP Supabase Seed Data
--  Run this AFTER schema.sql and AFTER creating Auth users
--  in the Supabase Dashboard → Authentication → Users.
--
--  Auth Accounts
--  ┌───────────────────────────────────────────────────────────────────────┐
--  │ Email                      Role           LGU       Password          │
--  ├───────────────────────────────────────────────────────────────────────┤
--  │ superadmin@agapp.gov.ph    SUPER_ADMIN    —         24z8Dmm;{E<l     │
--  │ admin@liliw.gov.ph         LGU_ADMIN      liliw     hQt00bB5[1$C     │
--  │ personnel@liliw.gov.ph     LGU_PERSONNEL  liliw     password123      │
--  │ citizen.demo@gmail.com     CITIZEN        liliw     password123      │
--  │ dayolawrence754@gmail.com  CITIZEN        liliw     (your own)       │
--  └───────────────────────────────────────────────────────────────────────┘
-- ============================================================

-- 1. SEED LGU DATA
INSERT INTO lgus (id, name, logo, banner_url, primary_color, secondary_color, latitude, longitude, is_active, onboarding_fee_paid, feature_flags)
VALUES
  (
    'liliw-laguna',
    'Municipality of Liliw',
    'https://placehold.co/100x100/A2B59F/1A1A1A?text=LILIW',
    'https://placehold.co/800x200/A2B59F/1A1A1A?text=Welcome+to+Liliw',
    '#A2B59F',
    '#D9CDB8',
    13.9297,
    121.4644,
    true,
    true,
    '{"chatbot": true, "potholeDetection": true, "forum": true}'::jsonb
  ),
  (
    'nagcarlan-laguna',
    'Municipality of Nagcarlan',
    'https://placehold.co/100x100/9FADB5/1A1A1A?text=NAGC',
    'https://placehold.co/800x200/9FADB5/1A1A1A?text=Welcome+to+Nagcarlan',
    '#9FADB5',
    '#CAD3D9',
    13.9214,
    121.4157,
    true,
    false,
    '{"chatbot": false, "potholeDetection": true, "forum": false}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- 2. SEED USER PROFILES
-- UUIDs must match the auth.users IDs from Supabase Dashboard → Authentication → Users
-- These are the real UUIDs from the live AGAPP project (jrureblhypfdljwflout)
INSERT INTO users (id, email, name, role, lgu_id, barangay, is_active)
VALUES
  (
    '42fe0700-7c7c-4e20-bff0-d40adf329a84',
    'superadmin@agapp.gov.ph',
    'AGAPP Super Admin',
    'SUPER_ADMIN',
    NULL,
    NULL,
    true
  ),
  (
    '8ff8bce8-38ae-4e2f-bf42-fd9b7acb71f1',
    'admin@liliw.gov.ph',
    'LGU Liliw Administrator',
    'LGU_ADMIN',
    'liliw-laguna',
    NULL,
    true
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'personnel@liliw.gov.ph',
    'LGU Liliw Personnel',
    'LGU_PERSONNEL',
    'liliw-laguna',
    NULL,
    true
  ),
  (
    'f0e69549-aa6b-4448-a133-e70c75d87f7f',
    'citizen.demo@gmail.com',
    'Juan Dela Cruz',
    'CITIZEN',
    'liliw-laguna',
    'Poblacion',
    true
  ),
  (
    '96f56b5a-3f27-480c-b0c2-04de405804e9',
    'dayolawrence754@gmail.com',
    'Law Dayo',
    'CITIZEN',
    'liliw-laguna',
    'Poblacion',
    true
  )
ON CONFLICT (id) DO NOTHING;


-- 3. SAMPLE REPORT (for dashboard testing)
INSERT INTO reports (
  reference_number, lgu_id, citizen_id, citizen_name,
  category, description, photo_url,
  latitude, longitude, barangay,
  status, assigned_office, sla_tier, sla_due_date,
  ml_confidence, ml_verified, is_low_credibility,
  status_history
)
VALUES (
  'REP-2026-0001',
  'liliw-laguna',
  NULL,
  'Maria Santos',
  'pothole',
  'Large pothole near the municipal hall entrance causing traffic hazard.',
  'https://placehold.co/400x300/57534e/ffffff?text=Pothole+Detected',
  13.9297,
  121.4644,
  'Poblacion',
  'Under Review',
  'Engineering Office',
  'simple',
  (NOW() + INTERVAL '3 days'),
  0.93,
  true,
  false,
  '[{"status":"Submitted","updatedBy":"citizen","notes":"Report submitted","timestamp":"2026-05-23T10:00:00Z"},{"status":"Under Review","updatedBy":"admin@liliw.gov.ph","notes":"Assigned to Engineering Office","timestamp":"2026-05-23T11:00:00Z"}]'::jsonb
)
ON CONFLICT (reference_number) DO NOTHING;


-- 4. SAMPLE SERVICE REQUEST (for dashboard testing)
INSERT INTO service_requests (
  reference_number, lgu_id, citizen_id, citizen_name,
  service_type, office_name, status,
  form_details, qr_code_url, status_history
)
VALUES (
  'REQ-2026-0001',
  'liliw-laguna',
  NULL,
  'Pedro Reyes',
  'Birth Certificate Request',
  'Civil Registrar',
  'Submitted',
  '{"fullName": "Pedro Reyes", "dateOfBirth": "2000-01-15", "placeOfBirth": "Liliw, Laguna", "purpose": "Employment"}'::jsonb,
  'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REQ-2026-0001',
  '[{"status":"Submitted","updatedBy":"citizen","notes":"Document application submitted","timestamp":"2026-05-23T10:00:00Z"}]'::jsonb
)
ON CONFLICT (reference_number) DO NOTHING;

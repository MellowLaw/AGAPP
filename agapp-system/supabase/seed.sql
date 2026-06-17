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
INSERT INTO lgus (id, name, logo, banner_url, primary_color, secondary_color, latitude, longitude, boundary_geojson, is_active, onboarding_fee_paid, feature_flags)
VALUES
  (
    'liliw-laguna',
    'Municipality of Liliw',
    'https://placehold.co/100x100/A2B59F/1A1A1A?text=LILIW',
    'https://placehold.co/800x200/A2B59F/1A1A1A?text=Welcome+to+Liliw',
    '#A2B59F',
    '#D9CDB8',
    14.1350,
    121.4363,
    '{"type": "Polygon", "coordinates": [[[121.408, 14.219], [121.425, 14.215], [121.445, 14.195], [121.468, 14.165], [121.492, 14.115], [121.488, 14.075], [121.465, 14.059], [121.450, 14.062], [121.438, 14.085], [121.428, 14.110], [121.405, 14.135], [121.385, 14.160], [121.370, 14.188], [121.375, 14.205], [121.392, 14.215], [121.408, 14.219]]]}'::jsonb,
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
    14.1360,
    121.4150,
    '{"type": "Polygon", "coordinates": [[[121.385, 14.210], [121.405, 14.205], [121.428, 14.175], [121.438, 14.135], [121.450, 14.095], [121.438, 14.060], [121.422, 14.062], [121.410, 14.085], [121.395, 14.115], [121.370, 14.145], [121.350, 14.178], [121.362, 14.200], [121.385, 14.210]]]}'::jsonb,
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

-- 5. SEED LGU FACILITIES
INSERT INTO lgu_facilities (lgu_id, name, category, address, latitude, longitude, phone, image_url)
VALUES
  ('liliw-laguna', 'Liliw Municipal Hall', 'municipal', 'Brgy. Poblacion, Liliw, Laguna', 14.1350, 121.4363, '+63 49 563 1234', 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&w=400&q=80'),
  ('liliw-laguna', 'Liliw Police Station', 'police', 'Brgy. Poblacion, Liliw, Laguna', 14.1345, 121.4358, '+63 998 598 5678', 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=400&q=80'),
  ('liliw-laguna', 'Liliw Fire Station', 'fire', 'Brgy. Poblacion, Liliw, Laguna', 14.1355, 121.4370, '+63 917 123 4567', 'https://images.unsplash.com/photo-1616239121966-fd90cfdcf2d1?auto=format&fit=crop&w=400&q=80'),
  ('liliw-laguna', 'Liliw Municipal Infirmary', 'hospital', 'Brgy. Kanluran Bukal, Liliw, Laguna', 14.1375, 121.4350, '+63 49 563 5678', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&w=400&q=80'),
  ('liliw-laguna', 'Liliw Post Office', 'other', 'Brgy. Poblacion, Liliw, Laguna', 14.1338, 121.4352, '+63 49 563 1111', 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80'),
  ('liliw-laguna', 'Liliw Public Market', 'other', 'Brgy. San Roque, Liliw, Laguna', 14.1320, 121.4380, NULL, 'https://images.unsplash.com/photo-1488459718432-36af50b6d6fa?auto=format&fit=crop&w=400&q=80'),

  ('nagcarlan-laguna', 'Nagcarlan Municipal Hall', 'municipal', 'Rizal Ave, Brgy. Poblacion, Nagcarlan, Laguna', 14.1360, 121.4150, '+63 49 563 2222', 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&w=400&q=80'),
  ('nagcarlan-laguna', 'Nagcarlan Police Station', 'police', 'Brgy. Poblacion, Nagcarlan, Laguna', 14.1355, 121.4140, '+63 998 598 9999', 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=400&q=80'),
  ('nagcarlan-laguna', 'Nagcarlan Fire Station', 'fire', 'Brgy. Poblacion, Nagcarlan, Laguna', 14.1365, 121.4160, '+63 917 999 8888', 'https://images.unsplash.com/photo-1616239121966-fd90cfdcf2d1?auto=format&fit=crop&w=400&q=80'),
  ('nagcarlan-laguna', 'Nagcarlan District Hospital', 'hospital', 'Brgy. Calihan, Nagcarlan, Laguna', 14.1400, 121.4120, '+63 49 563 3333', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&w=400&q=80')
ON CONFLICT DO NOTHING;

-- 6. SEED CHATBOT FAQS
INSERT INTO chatbot_faqs (lgu_id, question, answer, source, tags)
VALUES
  ('liliw-laguna', 'How do I renew my business permit in Liliw?', 'To renew a business permit in Liliw, Laguna: (1) Go to the BPLO counter at the Liliw Municipal Hall. (2) Submit your barangay clearance, sanitary permit, and fire safety certificate. (3) Pay local taxes at the Municipal Treasurer. (4) Collect your physical permit plate. Processing is 1–3 working days.', 'BPLO Citizen Charter', ARRAY['business', 'permit', 'renew', 'renewal', 'bplo']),
  ('liliw-laguna', 'How do I request a birth certificate?', 'To request a birth certificate in Liliw: (1) Present a valid ID. (2) Pay the ₱150 processing fee at the Municipal Treasurer. (3) Submit a request on AGAPP and present the generated QR at the Civil Registrar counter for priority release. Processing takes 1–2 days.', 'Civil Registrar Citizen Charter', ARRAY['birth', 'certificate', 'civil', 'registrar']),
  ('liliw-laguna', 'How do I report a pothole or road damage?', 'To report a pothole in Liliw: (1) Go to the AGAPP Report screen. (2) Snap a photo (AI will verify the damage). (3) Confirm your GPS location and submit. The Engineering Office processes reports within a 3-day SLA.', 'Engineering Office Charter', ARRAY['pothole', 'road', 'damage', 'report']),
  
  ('nagcarlan-laguna', 'How do I renew my business permit in Nagcarlan?', 'To renew a business permit in Nagcarlan, Laguna: (1) Go to the BPLO counter at the Nagcarlan Municipal Hall. (2) Submit your barangay clearance, sanitary permit, and fire safety certificate. (3) Pay local taxes at the Municipal Treasurer. (4) Collect your physical permit plate. Processing is 1–3 working days.', 'BPLO Citizen Charter', ARRAY['business', 'permit', 'renew', 'renewal', 'bplo']),
  ('nagcarlan-laguna', 'How do I request a birth certificate?', 'To request a birth certificate in Nagcarlan: (1) Present a valid ID. (2) Pay the ₱150 processing fee at the Municipal Treasurer. (3) Submit a request on AGAPP and present the generated QR at the Civil Registrar counter for priority release. Processing takes 1–2 days.', 'Civil Registrar Citizen Charter', ARRAY['birth', 'certificate', 'civil', 'registrar']),
  ('nagcarlan-laguna', 'How do I report a pothole or road damage?', 'To report a pothole in Nagcarlan: (1) Go to the AGAPP Report screen. (2) Snap a photo (AI will verify the damage). (3) Confirm your GPS location and submit. The Engineering Office processes reports within a 3-day SLA.', 'Engineering Office Charter', ARRAY['pothole', 'road', 'damage', 'report'])
ON CONFLICT DO NOTHING;

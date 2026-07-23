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
INSERT INTO lgus (id, name, region, province, barangays, logo, banner_url, primary_color, secondary_color, latitude, longitude, boundary_geojson, is_active, onboarding_fee_paid, feature_flags)
VALUES
  (
    'liliw-laguna',
    'Municipality of Liliw',
    'Region IV-A - CALABARZON',
    'Laguna',
    ARRAY['Bagong Anyo (Pob.)', 'Bayate', 'Bongkol', 'Bubukal', 'Cabuyew', 'Calumpang', 'Culoy', 'Dagatan', 'Daniw', 'Dita', 'Ibabang Palina', 'Ibabang San Roque', 'Ibabang Sungi', 'Ibabang Taykin', 'Ilayang Palina', 'Ilayang San Roque', 'Ilayang Sungi', 'Ilayang Taykin', 'Kanlurang Bukal', 'Laguan', 'Luquin', 'Malabo-Kalantukan', 'Masikap (Pob.)', 'Maslun (Pob.)', 'Mojon', 'Novaliches', 'Oples', 'Pag-Asa (Pob.)', 'Palayan', 'Rizal (Pob.)', 'San Isidro', 'Silangang Bukal', 'Tuy-Baanan'],
    'https://placehold.co/100x100/A2B59F/1A1A1A?text=LILIW',
    'https://placehold.co/800x200/A2B59F/1A1A1A?text=Welcome+to+Liliw',
    '#F2E863',
    '#D9CDB8',
    14.1310,
    121.4365,
    '{"type": "Polygon", "coordinates": [[[121.408, 14.219], [121.425, 14.215], [121.445, 14.195], [121.468, 14.165], [121.492, 14.115], [121.488, 14.075], [121.465, 14.059], [121.450, 14.062], [121.438, 14.085], [121.428, 14.110], [121.405, 14.135], [121.385, 14.160], [121.370, 14.188], [121.375, 14.205], [121.392, 14.215], [121.408, 14.219]]]}'::jsonb,
    true,
    true,
    '{"chatbot": true, "potholeDetection": true, "forum": true}'::jsonb
  ),
  (
    'nagcarlan-laguna',
    'Municipality of Nagcarlan',
    'Region IV-A - CALABARZON',
    'Laguna',
    ARRAY['Abo', 'Alibungbungan', 'Alumbrado', 'Balayong', 'Balimbing', 'Balinacon', 'Bambang', 'Banago', 'Banca-banca', 'Bangcuro', 'Banilad', 'Bayaquitos', 'Buboy', 'Buenavista', 'Buhanginan', 'Bukal', 'Bunga', 'Cabuyew', 'Calumpang', 'Kanluran Kabubuhayan', 'Kanluran Lazaan', 'Labangan', 'Lagulo', 'Lawaguin', 'Maiit', 'Malaya', 'Malinao', 'Manaol', 'Maravilla', 'Nagcalbang', 'Oples', 'Palayan', 'Palina', 'Poblacion I (Pob.)', 'Poblacion II (Pob.)', 'Poblacion III (Pob.)', 'Sabang', 'San Francisco', 'Santa Lucia', 'Sibulan', 'Silangan Ilaya', 'Silangan Kabubuhayan', 'Silangan Lazaan', 'Silangan Napapatid', 'Sinipian', 'Sulsuguin', 'Talahib', 'Talangan', 'Taytay', 'Tipacan', 'Wakat', 'Yukos'],
    'https://placehold.co/100x100/9FADB5/1A1A1A?text=NAGC',
    'https://placehold.co/800x200/9FADB5/1A1A1A?text=Welcome+to+Nagcarlan',
    '#9FADB5',
    '#CAD3D9',
    14.1360,
    121.4165,
    '{"type": "Polygon", "coordinates": [[[121.385, 14.210], [121.405, 14.205], [121.428, 14.175], [121.438, 14.135], [121.450, 14.095], [121.438, 14.060], [121.422, 14.062], [121.410, 14.085], [121.395, 14.115], [121.370, 14.145], [121.350, 14.178], [121.362, 14.200], [121.385, 14.210]]]}'::jsonb,
    true,
    false,
    '{"chatbot": false, "potholeDetection": true, "forum": false}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- 2. SEED USER PROFILES
-- UUIDs must match the auth.users IDs from Supabase Dashboard → Authentication → Users
-- These are the real UUIDs from the live AGAPP project (jrureblhypfdljwflout)
-- Staff & demo citizens are pre-verified so the demo flow works end-to-end
-- without manual review. New sign-ups start as 'unverified'.
INSERT INTO users (id, email, name, role, lgu_id, barangay, is_active,
                   verification_status, verified_barangay, verified_at, verified_by)
VALUES
  (
    '42fe0700-7c7c-4e20-bff0-d40adf329a84',
    'superadmin@agapp.gov.ph',
    'AGAPP Super Admin',
    'SUPER_ADMIN',
    NULL,
    NULL,
    true,
    'verified', NULL, now(), NULL
  ),
  (
    '8ff8bce8-38ae-4e2f-bf42-fd9b7acb71f1',
    'admin@liliw.gov.ph',
    'LGU Liliw Administrator',
    'LGU_ADMIN',
    'liliw-laguna',
    NULL,
    true,
    'verified', NULL, now(), NULL
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'personnel@liliw.gov.ph',
    'LGU Liliw Personnel',
    'LGU_PERSONNEL',
    'liliw-laguna',
    NULL,
    true,
    'verified', NULL, now(), NULL
  ),
  (
    'f0e69549-aa6b-4448-a133-e70c75d87f7f',
    'citizen.demo@gmail.com',
    'Juan Dela Cruz',
    'CITIZEN',
    'liliw-laguna',
    'Poblacion',
    true,
    'verified', 'Poblacion', now(), '8ff8bce8-38ae-4e2f-bf42-fd9b7acb71f1'
  ),
  (
    '96f56b5a-3f27-480c-b0c2-04de405804e9',
    'dayolawrence754@gmail.com',
    'Law Dayo',
    'CITIZEN',
    'liliw-laguna',
    'Poblacion',
    true,
    'verified', 'Poblacion', now(), '8ff8bce8-38ae-4e2f-bf42-fd9b7acb71f1'
  )
ON CONFLICT (id) DO UPDATE SET
  verification_status = COALESCE(users.verification_status, EXCLUDED.verification_status, 'verified'),
  verified_barangay   = COALESCE(users.verified_barangay,   EXCLUDED.verified_barangay),
  verified_at         = COALESCE(users.verified_at,         EXCLUDED.verified_at);


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
  14.1307,
  121.4362,
  'Poblacion',
  'Under Review',
  'Engineering Office',
  'simple',
  (NOW() + INTERVAL '3 days'),
  NULL, -- ml_confidence: NULL = not analyzed (ML not implemented yet)
  NULL, -- ml_verified
  false,
  '[{"status":"Submitted","updatedBy":"citizen","notes":"Report submitted","timestamp":"2026-05-23T10:00:00Z"},{"status":"Under Review","updatedBy":"admin@liliw.gov.ph","notes":"Assigned to Engineering Office","timestamp":"2026-05-23T11:00:00Z"}]'::jsonb
)
ON CONFLICT (reference_number) DO NOTHING;


-- 4. SAMPLE SERVICE REQUEST (for dashboard testing)
INSERT INTO service_requests (
  reference_number, lgu_id, citizen_id, citizen_name,
  service_type, office_name, status,
  form_details, status_history
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
  '[{"status":"Submitted","updatedBy":"citizen","notes":"Document application submitted","timestamp":"2026-05-23T10:00:00Z"}]'::jsonb
)
ON CONFLICT (reference_number) DO NOTHING;

-- 5. SEED LGU FACILITIES
INSERT INTO lgu_facilities (lgu_id, name, category, address, latitude, longitude, phone, image_url)
VALUES
  -- Coordinates centered on the real Liliw poblacion (~14.131, 121.4365 per
  -- PhilAtlas); fine-tune exact spots with the admin Facilities Map drag tool.
  ('liliw-laguna', 'Liliw Municipal Hall', 'municipal', 'Brgy. Poblacion, Liliw, Laguna', 14.1308, 121.4363, '+63 49 563 1234', 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&w=400&q=80'),
  ('liliw-laguna', 'Liliw Police Station', 'police', 'Brgy. Poblacion, Liliw, Laguna', 14.1312, 121.4358, '+63 998 598 5678', 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=400&q=80'),
  ('liliw-laguna', 'Liliw Fire Station', 'fire', 'Brgy. Poblacion, Liliw, Laguna', 14.1315, 121.4370, '+63 917 123 4567', 'https://images.unsplash.com/photo-1616239121966-fd90cfdcf2d1?auto=format&fit=crop&w=400&q=80'),
  ('liliw-laguna', 'Liliw Municipal Infirmary', 'hospital', 'Brgy. Kanluran Bukal, Liliw, Laguna', 14.1330, 121.4345, '+63 49 563 5678', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&w=400&q=80'),
  ('liliw-laguna', 'Liliw Post Office', 'other', 'Brgy. Poblacion, Liliw, Laguna', 14.1305, 121.4371, '+63 49 563 1111', 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80'),
  ('liliw-laguna', 'Liliw Public Market', 'other', 'Brgy. San Roque, Liliw, Laguna', 14.1321, 121.4373, NULL, 'https://images.unsplash.com/photo-1488459718432-36af50b6d6fa?auto=format&fit=crop&w=400&q=80'),

  -- Coordinates centered on the real Nagcarlan poblacion (~14.136, 121.4165
  -- per PhilAtlas barangay data).
  ('nagcarlan-laguna', 'Nagcarlan Municipal Hall', 'municipal', 'Rizal Ave, Brgy. Poblacion, Nagcarlan, Laguna', 14.1362, 121.4166, '+63 49 563 2222', 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&w=400&q=80'),
  ('nagcarlan-laguna', 'Nagcarlan Police Station', 'police', 'Brgy. Poblacion, Nagcarlan, Laguna', 14.1358, 121.4160, '+63 998 598 9999', 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=400&q=80'),
  ('nagcarlan-laguna', 'Nagcarlan Fire Station', 'fire', 'Brgy. Poblacion, Nagcarlan, Laguna', 14.1366, 121.4172, '+63 917 999 8888', 'https://images.unsplash.com/photo-1616239121966-fd90cfdcf2d1?auto=format&fit=crop&w=400&q=80'),
  ('nagcarlan-laguna', 'Nagcarlan District Hospital', 'hospital', 'Brgy. Calihan, Nagcarlan, Laguna', 14.1345, 121.4186, '+63 49 563 3333', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&w=400&q=80')
ON CONFLICT DO NOTHING;

-- 5.5 SEED ESERVICES CATALOG (admin-editable; placeholder-truth until the
-- municipal-hall interview confirms real requirements/fees/processing times)
INSERT INTO lgu_services (lgu_id, office_name, name, description, requirements, fee_note, processing_time, sort_order)
VALUES
  ('liliw-laguna', 'BPLO', 'New Business Permit', 'Apply for a new Mayor''s/Business Permit to legally operate in Liliw.', '["Valid ID","Barangay Business Clearance","DTI/SEC Registration","Lease Contract or Land Title","Sketch/Location Plan"]'::jsonb, 'Fee assessed at BPLO — pay at the Municipal Hall', '3-5 working days', 1),
  ('liliw-laguna', 'BPLO', 'Business Permit Renewal', 'Renew an existing Mayor''s/Business Permit.', '["Valid ID","Previous Year Business Permit","Barangay Business Clearance","Proof of Gross Sales/Receipts"]'::jsonb, 'Fee assessed at BPLO — pay at the Municipal Hall', '2-3 working days', 2),
  ('liliw-laguna', 'Treasurer''s Office', 'Community Tax Certificate (Cedula)', 'Annual community tax certificate required for many transactions.', '["Valid ID"]'::jsonb, 'Based on income/property — pay at the Treasurer''s Office', 'Same day', 3),
  ('liliw-laguna', 'Civil Registrar', 'Birth Certificate (Certified Copy)', 'Certified true copy of a registered birth certificate.', '["Valid ID","Full name and date of birth of the registrant"]'::jsonb, 'Pay at the Civil Registrar', '1-3 working days', 4),
  ('liliw-laguna', 'Civil Registrar', 'Marriage Certificate (Certified Copy)', 'Certified true copy of a registered marriage certificate.', '["Valid ID","Names of both parties and date of marriage"]'::jsonb, 'Pay at the Civil Registrar', '1-3 working days', 5),
  ('liliw-laguna', 'Civil Registrar', 'Marriage License Application', 'Apply for a marriage license (required before the ceremony).', '["Valid IDs of both parties","PSA Birth Certificates","Certificate of No Marriage (CENOMAR)","Community Tax Certificate"]'::jsonb, 'Pay at the Civil Registrar', '10 working days (posting period)', 6),
  ('liliw-laguna', 'Civil Registrar', 'Death Certificate (Certified Copy)', 'Certified true copy of a registered death certificate.', '["Valid ID","Name of the deceased and date of death"]'::jsonb, 'Pay at the Civil Registrar', '1-3 working days', 7),
  ('liliw-laguna', 'MSWDO', 'Certificate of Indigency', 'Certification for residents who qualify as indigent, often used for financial/medical assistance.', '["Valid ID","Barangay Certificate of Residency"]'::jsonb, 'Free', '1-2 working days', 8),
  ('liliw-laguna', 'Mayor''s Office', 'Mayor''s Clearance', 'General clearance signed by the Mayor''s Office, often required for employment or other transactions.', '["Valid ID","Barangay Clearance"]'::jsonb, 'Pay at the Mayor''s Office', '1-2 working days', 9),
  ('liliw-laguna', 'Health Office', 'Sanitary Permit', 'Required for food establishments and businesses handling food/health-related operations.', '["Valid ID","Business Permit (if applicable)","Health Certificates of Employees"]'::jsonb, 'Pay at the Health Office', '3-5 working days', 10),
  ('liliw-laguna', 'Health Office', 'Health Certificate', 'Individual health certificate, commonly required for food handlers and workers.', '["Valid ID","Recent medical/laboratory exam results"]'::jsonb, 'Pay at the Health Office', 'Same day (after exam)', 11),
  ('liliw-laguna', 'Municipal Planning and Development Office', 'Zoning/Locational Clearance', 'Confirms that a proposed structure or business location complies with zoning ordinances.', '["Valid ID","Site/Location Plan","Land Title or Proof of Ownership"]'::jsonb, 'Pay at the MPDO', '3-5 working days', 12),
  ('liliw-laguna', 'Mayor''s Office', 'Occupational/Work Permit', 'Permit for individuals engaged in certain occupations within the municipality.', '["Valid ID","Health Certificate"]'::jsonb, 'Pay at the Mayor''s Office', '1-2 working days', 13),

  ('nagcarlan-laguna', 'BPLO', 'New Business Permit', 'Apply for a new Mayor''s/Business Permit to legally operate in Nagcarlan.', '["Valid ID","Barangay Business Clearance","DTI/SEC Registration","Lease Contract or Land Title","Sketch/Location Plan"]'::jsonb, 'Fee assessed at BPLO — pay at the Municipal Hall', '3-5 working days', 1),
  ('nagcarlan-laguna', 'BPLO', 'Business Permit Renewal', 'Renew an existing Mayor''s/Business Permit.', '["Valid ID","Previous Year Business Permit","Barangay Business Clearance","Proof of Gross Sales/Receipts"]'::jsonb, 'Fee assessed at BPLO — pay at the Municipal Hall', '2-3 working days', 2),
  ('nagcarlan-laguna', 'Treasurer''s Office', 'Community Tax Certificate (Cedula)', 'Annual community tax certificate required for many transactions.', '["Valid ID"]'::jsonb, 'Based on income/property — pay at the Treasurer''s Office', 'Same day', 3),
  ('nagcarlan-laguna', 'Civil Registrar', 'Birth Certificate (Certified Copy)', 'Certified true copy of a registered birth certificate.', '["Valid ID","Full name and date of birth of the registrant"]'::jsonb, 'Pay at the Civil Registrar', '1-3 working days', 4),
  ('nagcarlan-laguna', 'Civil Registrar', 'Marriage Certificate (Certified Copy)', 'Certified true copy of a registered marriage certificate.', '["Valid ID","Names of both parties and date of marriage"]'::jsonb, 'Pay at the Civil Registrar', '1-3 working days', 5),
  ('nagcarlan-laguna', 'Civil Registrar', 'Marriage License Application', 'Apply for a marriage license (required before the ceremony).', '["Valid IDs of both parties","PSA Birth Certificates","Certificate of No Marriage (CENOMAR)","Community Tax Certificate"]'::jsonb, 'Pay at the Civil Registrar', '10 working days (posting period)', 6),
  ('nagcarlan-laguna', 'Civil Registrar', 'Death Certificate (Certified Copy)', 'Certified true copy of a registered death certificate.', '["Valid ID","Name of the deceased and date of death"]'::jsonb, 'Pay at the Civil Registrar', '1-3 working days', 7),
  ('nagcarlan-laguna', 'MSWDO', 'Certificate of Indigency', 'Certification for residents who qualify as indigent, often used for financial/medical assistance.', '["Valid ID","Barangay Certificate of Residency"]'::jsonb, 'Free', '1-2 working days', 8),
  ('nagcarlan-laguna', 'Mayor''s Office', 'Mayor''s Clearance', 'General clearance signed by the Mayor''s Office, often required for employment or other transactions.', '["Valid ID","Barangay Clearance"]'::jsonb, 'Pay at the Mayor''s Office', '1-2 working days', 9),
  ('nagcarlan-laguna', 'Health Office', 'Sanitary Permit', 'Required for food establishments and businesses handling food/health-related operations.', '["Valid ID","Business Permit (if applicable)","Health Certificates of Employees"]'::jsonb, 'Pay at the Health Office', '3-5 working days', 10),
  ('nagcarlan-laguna', 'Health Office', 'Health Certificate', 'Individual health certificate, commonly required for food handlers and workers.', '["Valid ID","Recent medical/laboratory exam results"]'::jsonb, 'Pay at the Health Office', 'Same day (after exam)', 11),
  ('nagcarlan-laguna', 'Municipal Planning and Development Office', 'Zoning/Locational Clearance', 'Confirms that a proposed structure or business location complies with zoning ordinances.', '["Valid ID","Site/Location Plan","Land Title or Proof of Ownership"]'::jsonb, 'Pay at the MPDO', '3-5 working days', 12),
  ('nagcarlan-laguna', 'Mayor''s Office', 'Occupational/Work Permit', 'Permit for individuals engaged in certain occupations within the municipality.', '["Valid ID","Health Certificate"]'::jsonb, 'Pay at the Mayor''s Office', '1-2 working days', 13)
ON CONFLICT DO NOTHING;

-- 6. SEED CHATBOT FAQS
-- Simple, everyday questions a resident actually asks at the municipal hall.
-- The chatbot keyword-matches on `tags`; keep tags to the plain words people type.
INSERT INTO chatbot_faqs (lgu_id, question, answer, source, tags)
VALUES
  -- ===== LILIW =====
  ('liliw-laguna', 'How do I get a barangay clearance?', 'Go to the barangay hall where you live in Liliw, bring a valid ID, and pay the small barangay fee (usually around ₱50–₱100). It is normally released on the same day.', 'Barangay Citizen Charter', ARRAY['barangay', 'clearance']),
  ('liliw-laguna', 'How much is a cedula and where do I get it?', 'You can get your cedula (Community Tax Certificate) at the Municipal Treasurer''s Office in Liliw. The basic fee starts at ₱5 plus a little more depending on your income. Just bring a valid ID.', 'Municipal Treasurer', ARRAY['cedula', 'community tax', 'ctc']),
  ('liliw-laguna', 'How do I apply for a new business permit?', 'Visit the Business Permits and Licensing Office (BPLO) at the Liliw Municipal Hall. Bring your DTI or SEC registration, barangay clearance, and lease or land title. After assessment, pay at the Treasurer to release your permit.', 'BPLO Citizen Charter', ARRAY['business', 'permit', 'new', 'apply', 'bplo']),
  ('liliw-laguna', 'How do I renew my business permit?', 'Go to the BPLO counter at the Liliw Municipal Hall and submit your barangay clearance, sanitary permit, and fire safety certificate. Pay the local taxes at the Municipal Treasurer, then claim your permit. Processing is usually 1–3 working days.', 'BPLO Citizen Charter', ARRAY['business', 'permit', 'renew', 'renewal', 'bplo']),
  ('liliw-laguna', 'How do I get a birth certificate?', 'Go to the Civil Registrar at the Liliw Municipal Hall, present a valid ID, and pay the processing fee at the Treasurer. You may also request it on AGAPP and show the QR at the counter. Processing usually takes 1–2 days.', 'Civil Registrar Citizen Charter', ARRAY['birth', 'certificate', 'civil', 'registrar', 'document']),
  ('liliw-laguna', 'How do I get a marriage certificate or license?', 'For a copy of a marriage certificate, go to the Civil Registrar in Liliw with a valid ID and pay the fee. For a marriage license, both partners must apply in person and attend the required pre-marriage seminar.', 'Civil Registrar Citizen Charter', ARRAY['marriage', 'certificate', 'license', 'document']),
  ('liliw-laguna', 'How do I request a death certificate?', 'Request it at the Civil Registrar in Liliw. Bring a valid ID of the requesting family member and pay the processing fee. It usually takes 1–2 days.', 'Civil Registrar Citizen Charter', ARRAY['death', 'certificate', 'civil', 'registrar', 'document']),
  ('liliw-laguna', 'How do I get a certificate of indigency?', 'You can ask for a Certificate of Indigency from your barangay or the Liliw MSWDO. Bring a valid ID. It is usually given for free for medical, school, or financial assistance.', 'MSWDO', ARRAY['indigency', 'indigent', 'mswdo', 'assistance']),
  ('liliw-laguna', 'How do I apply for a senior citizen ID?', 'Apply at the OSCA (Office for Senior Citizens Affairs) in the Liliw Municipal Hall. Bring a valid ID and proof that you are 60 years old or above, such as your birth certificate. The ID is free.', 'OSCA', ARRAY['senior', 'citizen', 'id', 'osca']),
  ('liliw-laguna', 'How do I report a pothole or road damage?', 'Open the AGAPP Report screen, take a photo of the damage, confirm your location, and submit. The Engineering Office reviews reports within about 3 working days.', 'Engineering Office Charter', ARRAY['pothole', 'road', 'damage', 'report']),
  ('liliw-laguna', 'How do I check the status of my report or application?', 'Open the Reports tab in AGAPP and tap your report to see its latest status and updates. For document applications, you may also follow up at the office concerned in the Liliw Municipal Hall.', 'AGAPP', ARRAY['track', 'status', 'follow up', 'check', 'report']),
  ('liliw-laguna', 'What are the office hours of the Municipal Hall?', 'The Liliw Municipal Hall is open Monday to Friday, 8:00 AM to 5:00 PM, and is closed on weekends and holidays. Some offices take a lunch break from 12:00 NN to 1:00 PM.', 'Liliw LGU', ARRAY['hours', 'open', 'time', 'schedule']),
  ('liliw-laguna', 'Where is the Municipal Hall located?', 'The Liliw Municipal Hall is at the town center (poblacion). You can use the AGAPP Map Explorer to get directions to the hall and other public offices.', 'Liliw LGU', ARRAY['where', 'location', 'address', 'map']),

  -- ===== NAGCARLAN =====
  ('nagcarlan-laguna', 'How do I get a barangay clearance?', 'Go to the barangay hall where you live in Nagcarlan, bring a valid ID, and pay the small barangay fee (usually around ₱50–₱100). It is normally released on the same day.', 'Barangay Citizen Charter', ARRAY['barangay', 'clearance']),
  ('nagcarlan-laguna', 'How much is a cedula and where do I get it?', 'You can get your cedula (Community Tax Certificate) at the Municipal Treasurer''s Office in Nagcarlan. The basic fee starts at ₱5 plus a little more depending on your income. Just bring a valid ID.', 'Municipal Treasurer', ARRAY['cedula', 'community tax', 'ctc']),
  ('nagcarlan-laguna', 'How do I apply for a new business permit?', 'Visit the Business Permits and Licensing Office (BPLO) at the Nagcarlan Municipal Hall. Bring your DTI or SEC registration, barangay clearance, and lease or land title. After assessment, pay at the Treasurer to release your permit.', 'BPLO Citizen Charter', ARRAY['business', 'permit', 'new', 'apply', 'bplo']),
  ('nagcarlan-laguna', 'How do I renew my business permit?', 'Go to the BPLO counter at the Nagcarlan Municipal Hall and submit your barangay clearance, sanitary permit, and fire safety certificate. Pay the local taxes at the Municipal Treasurer, then claim your permit. Processing is usually 1–3 working days.', 'BPLO Citizen Charter', ARRAY['business', 'permit', 'renew', 'renewal', 'bplo']),
  ('nagcarlan-laguna', 'How do I get a birth certificate?', 'Go to the Civil Registrar at the Nagcarlan Municipal Hall, present a valid ID, and pay the processing fee at the Treasurer. You may also request it on AGAPP and show the QR at the counter. Processing usually takes 1–2 days.', 'Civil Registrar Citizen Charter', ARRAY['birth', 'certificate', 'civil', 'registrar', 'document']),
  ('nagcarlan-laguna', 'How do I get a marriage certificate or license?', 'For a copy of a marriage certificate, go to the Civil Registrar in Nagcarlan with a valid ID and pay the fee. For a marriage license, both partners must apply in person and attend the required pre-marriage seminar.', 'Civil Registrar Citizen Charter', ARRAY['marriage', 'certificate', 'license', 'document']),
  ('nagcarlan-laguna', 'How do I request a death certificate?', 'Request it at the Civil Registrar in Nagcarlan. Bring a valid ID of the requesting family member and pay the processing fee. It usually takes 1–2 days.', 'Civil Registrar Citizen Charter', ARRAY['death', 'certificate', 'civil', 'registrar', 'document']),
  ('nagcarlan-laguna', 'How do I get a certificate of indigency?', 'You can ask for a Certificate of Indigency from your barangay or the Nagcarlan MSWDO. Bring a valid ID. It is usually given for free for medical, school, or financial assistance.', 'MSWDO', ARRAY['indigency', 'indigent', 'mswdo', 'assistance']),
  ('nagcarlan-laguna', 'How do I apply for a senior citizen ID?', 'Apply at the OSCA (Office for Senior Citizens Affairs) in the Nagcarlan Municipal Hall. Bring a valid ID and proof that you are 60 years old or above, such as your birth certificate. The ID is free.', 'OSCA', ARRAY['senior', 'citizen', 'id', 'osca']),
  ('nagcarlan-laguna', 'How do I report a pothole or road damage?', 'Open the AGAPP Report screen, take a photo of the damage, confirm your location, and submit. The Engineering Office reviews reports within about 3 working days.', 'Engineering Office Charter', ARRAY['pothole', 'road', 'damage', 'report']),
  ('nagcarlan-laguna', 'How do I check the status of my report or application?', 'Open the Reports tab in AGAPP and tap your report to see its latest status and updates. For document applications, you may also follow up at the office concerned in the Nagcarlan Municipal Hall.', 'AGAPP', ARRAY['track', 'status', 'follow up', 'check', 'report']),
  ('nagcarlan-laguna', 'What are the office hours of the Municipal Hall?', 'The Nagcarlan Municipal Hall is open Monday to Friday, 8:00 AM to 5:00 PM, and is closed on weekends and holidays. Some offices take a lunch break from 12:00 NN to 1:00 PM.', 'Nagcarlan LGU', ARRAY['hours', 'open', 'time', 'schedule']),
  ('nagcarlan-laguna', 'Where is the Municipal Hall located?', 'The Nagcarlan Municipal Hall is at the town center (poblacion). You can use the AGAPP Map Explorer to get directions to the hall and other public offices.', 'Nagcarlan LGU', ARRAY['where', 'location', 'address', 'map'])
ON CONFLICT DO NOTHING;

-- 7. SEED CITIZEN GUIDES
INSERT INTO citizen_guides (lgu_id, section, title, address, schedule, website, phone)
VALUES
  ('nagcarlan-laguna', 'ID Registration and Licenses', 'NBI - National Bureau of Investigation', 'Maria Cristina St, Naga City', 'Weekdays, 8:00 AM - 5:00 PM', 'https://clearance.nbi.gov.ph/', '(054) 473 3346'),
  ('nagcarlan-laguna', 'Benefits & Contributions', 'SSS - Social Security System', 'SSS Bldg., Concepcion, Pequeña, Naga City', 'Weekdays, 7:00 AM - 5:00 PM', 'https://www.sss.gov.ph/', '(054) 472 3880'),
  ('nagcarlan-laguna', 'Specialized Assistance', 'PDAO - Persons with Disability Affairs Office', 'Room 107, Ground Floor, Naga City Hall Building, Juan Q. Miranda Avenue, Naga City', NULL, 'https://www.facebook.com/pdaonagacity/', NULL),
  ('nagcarlan-laguna', 'Other Local Government Offices', 'Naga City Post Office', 'Yorktown St, Naga City', 'Weekdays, 8:00 AM - 5:00 PM', 'https://phlpost.gov.ph/', NULL),
  
  ('liliw-laguna', 'ID Registration and Licenses', 'NBI - National Bureau of Investigation', 'Maria Cristina St, Naga City', 'Weekdays, 8:00 AM - 5:00 PM', 'https://clearance.nbi.gov.ph/', '(054) 473 3346'),
  ('liliw-laguna', 'Benefits & Contributions', 'SSS - Social Security System', 'SSS Bldg., Concepcion, Pequeña, Naga City', 'Weekdays, 7:00 AM - 5:00 PM', 'https://www.sss.gov.ph/', '(054) 472 3880'),
  ('liliw-laguna', 'Specialized Assistance', 'PDAO - Persons with Disability Affairs Office', 'Room 107, Ground Floor, Naga City Hall Building, Juan Q. Miranda Avenue, Naga City', NULL, 'https://www.facebook.com/pdaonagacity/', NULL),
  ('liliw-laguna', 'Other Local Government Offices', 'Naga City Post Office', 'Yorktown St, Naga City', 'Weekdays, 8:00 AM - 5:00 PM', 'https://phlpost.gov.ph/', NULL)
ON CONFLICT DO NOTHING;


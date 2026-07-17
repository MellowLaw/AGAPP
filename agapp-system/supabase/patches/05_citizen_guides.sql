-- ============================================================================
-- Patch 05 — Citizen Guides Directory Table — 2026-07-17
-- ============================================================================

-- Create citizen_guides table
CREATE TABLE IF NOT EXISTS public.citizen_guides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES public.lgus(id) ON DELETE CASCADE NOT NULL,
    section text NOT NULL, -- e.g., 'ID Registration and Licenses', 'Benefits & Contributions'
    title text NOT NULL,
    address text,
    schedule text,
    website text,
    phone text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.citizen_guides ENABLE ROW LEVEL SECURITY;

-- Allow public read access to everyone
CREATE POLICY "Allow public read access to citizen_guides"
  ON public.citizen_guides FOR SELECT
  USING (true);

-- Allow LGU admins and LGU personnel to manage guides for their LGU
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

-- Allow super admin full control
CREATE POLICY "Allow super admin full control to citizen_guides"
  ON public.citizen_guides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN'
    )
  );

-- Seed guides for Nagcarlan and Liliw
INSERT INTO public.citizen_guides (lgu_id, section, title, address, schedule, website, phone)
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

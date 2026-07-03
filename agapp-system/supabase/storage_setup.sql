-- Supabase Storage Setup for AGAPP
-- Run this in Supabase SQL Editor to enable file uploads

-- Enable Storage extension (if not already enabled)
-- Note: Storage is enabled by default in Supabase

-- Create bucket for citizen report photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-photos',
  'report-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for service request attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-attachments',
  'service-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload to report-photos
CREATE POLICY "Allow authenticated uploads to report-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-photos'
  AND (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png')
);

-- Policy: Allow public to view report photos
CREATE POLICY "Allow public to view report photos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'report-photos');

-- Policy: Allow authenticated users to upload to service-attachments
CREATE POLICY "Allow authenticated uploads to service-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-attachments');

-- Policy: Allow public to view service attachments
CREATE POLICY "Allow public to view service attachments"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'service-attachments');

-- Policy: Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('report-photos', 'service-attachments')
  AND owner = auth.uid()
);

-- Create bucket for LGU facility images (Facilities Manager in admin)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'facility-images',
  'facility-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Only LGU admins / super admins may upload facility images
CREATE POLICY "Allow admin uploads to facility-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'facility-images'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('LGU_ADMIN', 'SUPER_ADMIN')
  )
);

-- Policy: Facility images are publicly viewable (mobile map shows them)
CREATE POLICY "Allow public to view facility images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'facility-images');

-- Policy: Admins can delete facility images (cleanup when a facility is removed)
CREATE POLICY "Allow admin deletes on facility-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'facility-images'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('LGU_ADMIN', 'SUPER_ADMIN')
  )
);

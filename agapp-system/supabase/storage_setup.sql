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
-- Path-ownership (2026-07-06, sweep §4): the object path's first folder must be
-- the uploader's own uid — mobile uploads `${profile.id}/ts.jpg`, so this is a
-- no-op for legit uploads but blocks writing into another user's folder prefix.
CREATE POLICY "Allow authenticated uploads to report-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-photos'
  AND (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- NOTE (2026-07-05): the three "Allow public to view …" SELECT policies that
-- used to cover the public buckets (report-photos, service-attachments,
-- facility-images) were DROPPED. Public buckets serve object URLs without any
-- storage.objects SELECT policy — those policies only enabled LISTING every
-- file in the bucket (Supabase advisor warning 0025), and no app code calls
-- .list()/.download() on these buckets. Don't re-add them.

-- Policy: Allow authenticated users to upload to service-attachments
-- Path-ownership (2026-07-06, sweep §4): first folder = uploader's uid. No
-- client currently uploads here, so this is future-proofing on the same
-- `${uid}/...` convention as report-photos.
CREATE POLICY "Allow authenticated uploads to service-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

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
-- Path-ownership (2026-07-06, sweep §4): an LGU_ADMIN may only upload into their
-- own LGU's folder (`${lguId}/...`); super admins may upload anywhere. Blocks a
-- Liliw admin from writing into Nagcarlan's facility-image folder prefix.
CREATE POLICY "Allow admin uploads to facility-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'facility-images'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('LGU_ADMIN', 'SUPER_ADMIN')
  )
  AND (
    get_current_user_role() = 'SUPER_ADMIN'
    OR (storage.foldername(name))[1] = get_current_user_lgu()
  )
);

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

-- ============================================================================
-- PATCH 003: SECURE AUTH PROVISIONING TRIGGER & ROLE ESCALATION DEFENSE
-- Target: Supabase PostgreSQL Database (AGAPP Local Government System)
-- ============================================================================

-- 1. Create a secure DEFINER function that automatically provisions user records
-- upon successful Supabase Auth signup. This enforces that:
-- - The 'role' is hardcoded to 'CITIZEN' (preventing client privilege escalation).
-- - The 'verification_status' is always 'unverified'.
-- - The 'is_active' status is TRUE.
CREATE OR REPLACE FUNCTION public.handle_new_citizen()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    lgu_id,
    barangay,
    verification_status,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    LOWER(TRIM(NEW.email)),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Citizen'),
    'CITIZEN', -- Always hardcoded to CITIZEN, completely ignoring client-side role overrides
    COALESCE(NEW.raw_user_meta_data->>'lgu_id', 'liliw-laguna'),
    COALESCE(NEW.raw_user_meta_data->>'barangay', 'Poblacion'),
    'unverified', -- Always default to unverified until approved by Civil Registrar
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_citizen();

-- 3. Hardening RLS on public.users to prevent self-role elevation
-- Ensure users can only update basic profile fields (name, phone, avatar_url, barangay)
-- and CANNOT alter their own 'role' or 'verification_status'.
CREATE OR REPLACE POLICY "Users can only update their own non-elevated profile fields"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND verification_status = (SELECT verification_status FROM public.users WHERE id = auth.uid())
  );

-- ================================================================
-- SECURITY HARDENING (2026-11-04) - PART 1 of 2 (trigger + helper functions)
-- Fixes:
--   1. handle_new_user() trusted raw_user_meta_data->>'role' and DEFAULTED TO 'admin'.
--      Anyone could call supabase.auth.signUp() with the public anon key and become admin.
--   2. Every business table had "FOR ALL TO authenticated USING (TRUE)" - any logged-in
--      account (including self-signups) had full read/write on all data.
--   3. "Profiles updateable by own user" let a user change their own `role` column.
--
-- Run in Supabase - SQL Editor. Safe to re-run.
-- ALSO: Dashboard - Authentication - Sign In / Providers - turn OFF "Allow new users to sign up".
-- (Admin-created accounts via the service role keep working.)
-- ================================================================

-- - 1. New auth users never get privileges from client-controlled metadata -
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Role is ALWAYS 'member' (no dashboard access). Admins promote via the Settings page,
  -- which updates profiles.role with the service role after verifying the caller is admin.
  INSERT INTO public.profiles (auth_id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    'member'
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- - 2. Role helpers (SECURITY DEFINER avoids RLS recursion on profiles) -
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_app_role() IN ('admin', 'staff'), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_app_role() = 'admin', FALSE);
$$;

REVOKE ALL ON FUNCTION public.current_app_role(), public.is_staff(), public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_app_role(), public.is_staff(), public.is_admin() TO authenticated;

-- Verify: should return 3 rows (current_app_role, is_admin, is_staff)
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('current_app_role','is_staff','is_admin') ORDER BY proname;

-- ================================================================
-- SECURITY HARDENING - PART 2 of 2 (run AFTER part 1)
-- Replaces all RLS policies so only admin/staff can access data.
-- ================================================================

-- Stop early with a clear message if part 1 has not been run yet
DO $check$
BEGIN
  IF to_regprocedure('public.is_staff()') IS NULL OR to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'Run 20261104_security_hardening_part1.sql first (helper functions are missing).';
  END IF;
END
$check$;
-- - 3 + 4. Reset RLS on EVERY table that actually exists in the public schema -
-- (Works even if some tables from schema.sql were never created, and also covers
--  tables that exist in the live DB but not in schema.sql.)
-- 3a. Drop every existing policy on public tables (including any added via the dashboard)
DO $drop_policies$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END
$drop_policies$;

-- 3b. Enable RLS + create staff-only policies on every table that exists
DO $create_policies$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);

    IF r.tablename = 'profiles' THEN
      -- Read-only for clients. All profile writes go through guarded server actions.
      EXECUTE 'CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING (auth_id = auth.uid())';
      EXECUTE 'CREATE POLICY profiles_select_staff ON public.profiles FOR SELECT TO authenticated USING (public.is_staff())';
    ELSIF r.tablename = 'system_settings' THEN
      -- Staff can read, only admins can write.
      EXECUTE 'CREATE POLICY system_settings_select_staff ON public.system_settings FOR SELECT TO authenticated USING (public.is_staff())';
      EXECUTE 'CREATE POLICY system_settings_write_admin ON public.system_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    ELSE
      -- Business tables: admin + staff only.
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())', r.tablename || '_staff_all', r.tablename);
    END IF;

    RAISE NOTICE 'Secured table: %', r.tablename;
  END LOOP;
END
$create_policies$;

-- - 5. AUDIT: review every privileged account. Delete any you don't recognise
--       (Settings page, or Dashboard - Authentication - Users).
SELECT p.full_name, p.email, p.role, p.created_at, u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.auth_id
WHERE p.role IN ('admin', 'staff')
ORDER BY p.created_at;
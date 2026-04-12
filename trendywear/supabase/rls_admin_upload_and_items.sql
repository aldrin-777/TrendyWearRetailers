-- Run in Supabase → SQL Editor (as postgres / owner).
-- Fixes persistent "new row violates row-level security policy" when adding products.
--
-- Why the previous version could still fail:
-- INSERT policies used EXISTS (SELECT ... FROM public.users). Any RLS / casts /
-- visibility issue on public.users makes that subquery return false. A
-- SECURITY DEFINER function reads public.users with the definer's rights so the
-- admin check is reliable.

-- ─── Helper: admin check (bypasses RLS on public.users for this read only) ───

CREATE OR REPLACE FUNCTION public.app_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT u.is_admin
      FROM public.users u
      WHERE u.id = auth.uid()
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.app_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_user_is_admin() TO authenticated;

-- Optional: if id types ever mismatch, try instead:
-- WHERE u.id::text = auth.uid()::text

-- ─── public.users: each user can read their own row (for the rest of your app) ─

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ─── Storage: bucket `images` (must match Storage → bucket id exactly) ─────
-- Upload hits INSERT on storage.objects. Some clients also need SELECT on the
-- same rows. Policies use WITH CHECK (auth.uid() IS NOT NULL) so anonymous
-- requests cannot insert; no "TO authenticated" so any role with a JWT uid works.

DROP POLICY IF EXISTS "images_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_images_insert_logged_in" ON storage.objects;
CREATE POLICY "storage_images_insert_logged_in"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'images'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "storage_images_select_authenticated" ON storage.objects;
CREATE POLICY "storage_images_select_authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'images');

-- If uploads still fail, run this in SQL Editor to see the real bucket id:
--   select id from storage.buckets;
-- Then replace 'images' above with that id (keep quotes).

-- ─── items / prices: admins only (uses function, not EXISTS subquery) ───────

DROP POLICY IF EXISTS "items_insert_admin" ON public.items;
CREATE POLICY "items_insert_admin"
ON public.items
FOR INSERT
TO authenticated
WITH CHECK (public.app_user_is_admin() IS TRUE);

DROP POLICY IF EXISTS "prices_insert_admin" ON public.prices;
CREATE POLICY "prices_insert_admin"
ON public.prices
FOR INSERT
TO authenticated
WITH CHECK (public.app_user_is_admin() IS TRUE);

-- ─── Checklist ────────────────────────────────────────────────────────────────
-- • Table public.users: row with id = your Auth user UUID, is_admin = true
-- • Bucket id exactly: images
-- • You must be logged in (session) when using /admin — anon cannot use these policies

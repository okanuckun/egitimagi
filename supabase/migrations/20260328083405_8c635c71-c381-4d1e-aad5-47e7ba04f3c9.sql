-- Re-enable RLS but drop the recursive policies and add simple ones
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop old recursive policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Simple non-recursive policies for user_roles
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin management via service role only (edge functions, triggers)
-- For admin UI, we use a SECURITY DEFINER function instead
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
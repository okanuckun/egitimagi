
CREATE OR REPLACE FUNCTION public.admin_list_all_roles()
RETURNS TABLE(user_id uuid, role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can list all roles';
  END IF;
  
  RETURN QUERY SELECT ur.user_id AS user_id, ur.role AS role FROM public.user_roles ur;
END;
$$;

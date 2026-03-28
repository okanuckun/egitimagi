-- Create a SECURITY DEFINER function for admins to update roles
CREATE OR REPLACE FUNCTION public.admin_update_user_role(_target_user_id uuid, _new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can update roles';
  END IF;
  
  -- Upsert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Delete old roles for this user (keep only the new one)
  DELETE FROM public.user_roles WHERE user_id = _target_user_id AND role != _new_role;
END;
$$;

-- Create a SECURITY DEFINER function for admins to list all roles
CREATE OR REPLACE FUNCTION public.admin_list_all_roles()
RETURNS TABLE(user_id uuid, role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can list all roles';
  END IF;
  
  RETURN QUERY SELECT ur.user_id, ur.role FROM public.user_roles ur;
END;
$$;
-- Add approval status to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Update existing admin users to be approved
UPDATE public.user_roles SET is_approved = TRUE WHERE role = 'admin';

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    FALSE
  )
$$;

-- Create function to approve user
CREATE OR REPLACE FUNCTION public.approve_user(_user_id uuid, _approved_by uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles 
  SET is_approved = TRUE, 
      approved_at = now(), 
      approved_by = _approved_by
  WHERE user_id = _user_id;
END;
$$;

-- Update handle_new_user_role to set is_approved for first user (admin)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
  should_approve BOOLEAN;
BEGIN
  -- Count existing users (excluding the new one)
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE id != NEW.id;
  
  -- If this is the first user, make them admin and auto-approve
  IF user_count = 0 THEN
    assigned_role := 'admin';
    should_approve := TRUE;
  ELSE
    assigned_role := 'user';
    should_approve := FALSE;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role, is_approved)
  VALUES (NEW.id, assigned_role, should_approve);
  
  RETURN NEW;
END;
$function$;
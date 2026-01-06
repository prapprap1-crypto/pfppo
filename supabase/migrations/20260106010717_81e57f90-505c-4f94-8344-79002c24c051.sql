-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own activity logs
CREATE POLICY "Users can insert their own activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
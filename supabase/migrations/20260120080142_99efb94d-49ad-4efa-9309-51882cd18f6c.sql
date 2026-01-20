-- Create table for PO action logs (history)
CREATE TABLE public.po_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.po_action_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view action logs for their POs"
ON public.po_action_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM po_headers
  WHERE po_headers.id = po_action_logs.po_id
  AND po_headers.user_id = auth.uid()
));

CREATE POLICY "Users can insert action logs for their POs"
ON public.po_action_logs
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM po_headers
  WHERE po_headers.id = po_action_logs.po_id
  AND po_headers.user_id = auth.uid()
));

-- Create index for faster queries
CREATE INDEX idx_po_action_logs_po_id ON public.po_action_logs(po_id);
CREATE INDEX idx_po_action_logs_created_at ON public.po_action_logs(created_at DESC);
-- Create table for tracking name edit history
CREATE TABLE public.po_edit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES public.po_headers(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- 'customer_name' or 'branch'
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  edited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.po_edit_history ENABLE ROW LEVEL SECURITY;

-- Users can view edit history for their own POs
CREATE POLICY "Users can view edit history for their POs"
ON public.po_edit_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM po_headers
    WHERE po_headers.id = po_edit_history.po_id
    AND po_headers.user_id = auth.uid()
  )
);

-- Users can insert edit history for their own POs
CREATE POLICY "Users can insert edit history for their POs"
ON public.po_edit_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM po_headers
    WHERE po_headers.id = po_edit_history.po_id
    AND po_headers.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_po_edit_history_po_id ON public.po_edit_history(po_id);
CREATE INDEX idx_po_edit_history_created_at ON public.po_edit_history(created_at DESC);
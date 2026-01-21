-- Drop existing restrictive policies for po_headers
DROP POLICY IF EXISTS "Users can view their own POs" ON public.po_headers;
DROP POLICY IF EXISTS "Users can create their own POs" ON public.po_headers;
DROP POLICY IF EXISTS "Users can update their own POs" ON public.po_headers;
DROP POLICY IF EXISTS "Users can delete their own POs" ON public.po_headers;

-- Create new policies allowing all authenticated users to see all POs
CREATE POLICY "Authenticated users can view all POs"
ON public.po_headers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create POs"
ON public.po_headers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update any PO"
ON public.po_headers
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete any PO"
ON public.po_headers
FOR DELETE
TO authenticated
USING (true);

-- Also update po_items policies to match
DROP POLICY IF EXISTS "Users can view their PO items" ON public.po_items;
DROP POLICY IF EXISTS "Users can insert their PO items" ON public.po_items;
DROP POLICY IF EXISTS "Users can update their PO items" ON public.po_items;
DROP POLICY IF EXISTS "Users can delete their PO items" ON public.po_items;

CREATE POLICY "Authenticated users can view all PO items"
ON public.po_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert PO items"
ON public.po_items
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM po_headers WHERE id = po_items.po_id AND user_id = auth.uid()
));

CREATE POLICY "Authenticated users can update any PO items"
ON public.po_items
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete any PO items"
ON public.po_items
FOR DELETE
TO authenticated
USING (true);

-- Update po_edit_history policies
DROP POLICY IF EXISTS "Users can view edit history for their POs" ON public.po_edit_history;
DROP POLICY IF EXISTS "Users can insert edit history for their POs" ON public.po_edit_history;

CREATE POLICY "Authenticated users can view all edit history"
ON public.po_edit_history
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert edit history"
ON public.po_edit_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update po_action_logs policies
DROP POLICY IF EXISTS "Users can view action logs for their POs" ON public.po_action_logs;
DROP POLICY IF EXISTS "Users can insert action logs for their POs" ON public.po_action_logs;

CREATE POLICY "Authenticated users can view all action logs"
ON public.po_action_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert action logs"
ON public.po_action_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
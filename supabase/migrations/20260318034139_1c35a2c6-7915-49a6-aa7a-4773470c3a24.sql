
-- Fix po_headers: restrict DELETE and UPDATE to admin/moderator only
DROP POLICY "Authenticated users can delete any PO" ON public.po_headers;
CREATE POLICY "Admins and moderators can delete POs" ON public.po_headers
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY "Authenticated users can update any PO" ON public.po_headers;
CREATE POLICY "Admins and moderators can update POs" ON public.po_headers
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Fix po_items: restrict DELETE and UPDATE to admin/moderator only
DROP POLICY "Authenticated users can delete any PO items" ON public.po_items;
CREATE POLICY "Admins and moderators can delete PO items" ON public.po_items
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY "Authenticated users can update any PO items" ON public.po_items;
CREATE POLICY "Admins and moderators can update PO items" ON public.po_items
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

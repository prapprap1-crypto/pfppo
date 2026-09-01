CREATE TABLE public.email_import_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder text NOT NULL DEFAULT 'inbox',
  sender_filter text,
  subject_filter text,
  is_enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_import_settings TO authenticated;
GRANT ALL ON public.email_import_settings TO service_role;
ALTER TABLE public.email_import_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view email settings" ON public.email_import_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage email settings insert" ON public.email_import_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins manage email settings update" ON public.email_import_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins manage email settings delete" ON public.email_import_settings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_email_import_settings_updated_at
  BEFORE UPDATE ON public.email_import_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL,
  attachment_id text NOT NULL,
  subject text,
  sender_email text,
  sender_name text,
  received_at timestamptz,
  file_name text NOT NULL,
  file_size integer,
  file_path text,
  status text NOT NULL DEFAULT 'FETCHED',
  error_message text,
  po_id uuid REFERENCES public.po_headers(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, attachment_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_imports TO authenticated;
GRANT ALL ON public.email_imports TO service_role;
ALTER TABLE public.email_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view email imports" ON public.email_imports
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert email imports" ON public.email_imports
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update email imports" ON public.email_imports
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete email imports" ON public.email_imports
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_email_imports_updated_at
  BEFORE UPDATE ON public.email_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_email_imports_status ON public.email_imports(status);
CREATE INDEX idx_email_imports_received_at ON public.email_imports(received_at DESC);

INSERT INTO public.email_import_settings (folder) VALUES ('inbox');
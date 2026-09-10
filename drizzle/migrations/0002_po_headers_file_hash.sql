ALTER TABLE public.po_headers ADD COLUMN IF NOT EXISTS file_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS po_headers_file_hash_uidx ON public.po_headers (file_hash) WHERE file_hash IS NOT NULL;
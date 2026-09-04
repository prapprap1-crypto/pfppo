-- Remove existing duplicates (keep newest)
DELETE FROM public.email_imports a
USING public.email_imports b
WHERE a.message_id = b.message_id
  AND a.attachment_id = b.attachment_id
  AND a.ctid < b.ctid;

ALTER TABLE public.email_imports ADD COLUMN IF NOT EXISTS file_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS email_imports_message_attachment_key
  ON public.email_imports (message_id, attachment_id);

CREATE UNIQUE INDEX IF NOT EXISTS email_imports_file_hash_key
  ON public.email_imports (file_hash) WHERE file_hash IS NOT NULL;
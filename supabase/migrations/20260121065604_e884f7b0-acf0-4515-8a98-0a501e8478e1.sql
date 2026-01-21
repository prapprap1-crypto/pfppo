-- Add storage policy to allow all authenticated users to view PO files
CREATE POLICY "Authenticated users can view all PO files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'po-files' AND auth.role() = 'authenticated');

-- Keep the existing upload policy (only owner can upload to their folder)
-- But ensure it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload PO files'
  ) THEN
    CREATE POLICY "Users can upload PO files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'po-files' AND auth.role() = 'authenticated');
  END IF;
END $$;
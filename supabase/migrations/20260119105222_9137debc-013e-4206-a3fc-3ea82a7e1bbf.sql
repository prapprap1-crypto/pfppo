-- Add vendor_branch_code and vendor_branch_name columns to po_headers table
ALTER TABLE public.po_headers 
ADD COLUMN IF NOT EXISTS vendor_branch_code TEXT,
ADD COLUMN IF NOT EXISTS vendor_branch_name TEXT;
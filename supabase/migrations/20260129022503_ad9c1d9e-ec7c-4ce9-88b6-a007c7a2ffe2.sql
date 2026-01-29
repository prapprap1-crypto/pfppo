-- Drop existing constraint and add new one to allow 0, 1, 2
ALTER TABLE public.customer_mappings DROP CONSTRAINT customer_mappings_vat_type_check;
ALTER TABLE public.customer_mappings ADD CONSTRAINT customer_mappings_vat_type_check CHECK (vat_type = ANY (ARRAY[0, 1, 2]));
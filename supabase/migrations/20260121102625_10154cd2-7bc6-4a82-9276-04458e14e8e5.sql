-- Add warehouse, vehicle position, and transport code to branch mappings
ALTER TABLE public.customer_branch_mappings
ADD COLUMN warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
ADD COLUMN vehicle_position_id uuid REFERENCES public.vehicle_positions(id) ON DELETE SET NULL,
ADD COLUMN transport_code_id uuid REFERENCES public.transport_codes(id) ON DELETE SET NULL;

-- Migrate existing data from customer_mappings to their branches
UPDATE public.customer_branch_mappings cbm
SET 
  warehouse_id = cm.warehouse_id,
  vehicle_position_id = cm.vehicle_position_id,
  transport_code_id = cm.transport_code_id
FROM public.customer_mappings cm
WHERE cbm.customer_mapping_id = cm.id;

-- Remove columns from customer_mappings (keeping only VAT and salesperson)
ALTER TABLE public.customer_mappings
DROP COLUMN IF EXISTS warehouse_id,
DROP COLUMN IF EXISTS vehicle_position_id,
DROP COLUMN IF EXISTS transport_code_id;
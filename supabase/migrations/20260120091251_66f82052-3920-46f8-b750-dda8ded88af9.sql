-- =============================================
-- Improve RLS policies for better security
-- =============================================

-- 1. PROFILES TABLE
-- Add policy for admins to view all profiles (needed for user management)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- 2. CUSTOMER_MAPPINGS TABLE
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can delete customer mappings" ON public.customer_mappings;
DROP POLICY IF EXISTS "Authenticated users can insert customer mappings" ON public.customer_mappings;
DROP POLICY IF EXISTS "Authenticated users can update customer mappings" ON public.customer_mappings;

-- Create restrictive policies for admin/moderator only
CREATE POLICY "Admin or moderator can insert customer mappings" 
ON public.customer_mappings 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can update customer mappings" 
ON public.customer_mappings 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can delete customer mappings" 
ON public.customer_mappings 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

-- 3. CUSTOMER_BRANCH_MAPPINGS TABLE
DROP POLICY IF EXISTS "Authenticated users can delete customer branch mappings" ON public.customer_branch_mappings;
DROP POLICY IF EXISTS "Authenticated users can insert customer branch mappings" ON public.customer_branch_mappings;
DROP POLICY IF EXISTS "Authenticated users can update customer branch mappings" ON public.customer_branch_mappings;

CREATE POLICY "Admin or moderator can insert customer branch mappings" 
ON public.customer_branch_mappings 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can update customer branch mappings" 
ON public.customer_branch_mappings 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can delete customer branch mappings" 
ON public.customer_branch_mappings 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

-- 4. PRODUCT_MAPPINGS TABLE
DROP POLICY IF EXISTS "Authenticated users can delete mappings" ON public.product_mappings;
DROP POLICY IF EXISTS "Authenticated users can insert mappings" ON public.product_mappings;
DROP POLICY IF EXISTS "Authenticated users can update mappings" ON public.product_mappings;

CREATE POLICY "Admin or moderator can insert product mappings" 
ON public.product_mappings 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can update product mappings" 
ON public.product_mappings 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can delete product mappings" 
ON public.product_mappings 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

-- 5. WAREHOUSES TABLE
DROP POLICY IF EXISTS "Authenticated users can delete warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can insert warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can update warehouses" ON public.warehouses;

CREATE POLICY "Admin or moderator can insert warehouses" 
ON public.warehouses 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can update warehouses" 
ON public.warehouses 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can delete warehouses" 
ON public.warehouses 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

-- 6. VEHICLE_POSITIONS TABLE
DROP POLICY IF EXISTS "Authenticated users can delete vehicle_positions" ON public.vehicle_positions;
DROP POLICY IF EXISTS "Authenticated users can insert vehicle_positions" ON public.vehicle_positions;
DROP POLICY IF EXISTS "Authenticated users can update vehicle_positions" ON public.vehicle_positions;

CREATE POLICY "Admin or moderator can insert vehicle_positions" 
ON public.vehicle_positions 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can update vehicle_positions" 
ON public.vehicle_positions 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can delete vehicle_positions" 
ON public.vehicle_positions 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

-- 7. TRANSPORT_CODES TABLE
DROP POLICY IF EXISTS "Authenticated users can delete transport_codes" ON public.transport_codes;
DROP POLICY IF EXISTS "Authenticated users can insert transport_codes" ON public.transport_codes;
DROP POLICY IF EXISTS "Authenticated users can update transport_codes" ON public.transport_codes;

CREATE POLICY "Admin or moderator can insert transport_codes" 
ON public.transport_codes 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can update transport_codes" 
ON public.transport_codes 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can delete transport_codes" 
ON public.transport_codes 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

-- 8. SALESPERSONS TABLE
DROP POLICY IF EXISTS "Authenticated users can delete salespersons" ON public.salespersons;
DROP POLICY IF EXISTS "Authenticated users can insert salespersons" ON public.salespersons;
DROP POLICY IF EXISTS "Authenticated users can update salespersons" ON public.salespersons;

CREATE POLICY "Admin or moderator can insert salespersons" 
ON public.salespersons 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can update salespersons" 
ON public.salespersons 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admin or moderator can delete salespersons" 
ON public.salespersons 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);
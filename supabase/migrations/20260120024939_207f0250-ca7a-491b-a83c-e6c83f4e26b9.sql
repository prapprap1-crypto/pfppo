
-- Create warehouses table (คลังสินค้า)
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for warehouses
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view warehouses" ON public.warehouses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert warehouses" ON public.warehouses FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update warehouses" ON public.warehouses FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete warehouses" ON public.warehouses FOR DELETE USING (true);

-- Create vehicle_positions table (ตำแหน่งจัดรถ)
CREATE TABLE public.vehicle_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for vehicle_positions
ALTER TABLE public.vehicle_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicle_positions" ON public.vehicle_positions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert vehicle_positions" ON public.vehicle_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update vehicle_positions" ON public.vehicle_positions FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete vehicle_positions" ON public.vehicle_positions FOR DELETE USING (true);

-- Create transport_codes table (รหัสขนส่ง)
CREATE TABLE public.transport_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for transport_codes
ALTER TABLE public.transport_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transport_codes" ON public.transport_codes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert transport_codes" ON public.transport_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update transport_codes" ON public.transport_codes FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete transport_codes" ON public.transport_codes FOR DELETE USING (true);

-- Add new columns to customer_mappings table
ALTER TABLE public.customer_mappings 
  ADD COLUMN warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  ADD COLUMN vehicle_position_id UUID REFERENCES public.vehicle_positions(id) ON DELETE SET NULL,
  ADD COLUMN vat_type INTEGER DEFAULT 1 CHECK (vat_type IN (0, 1)),
  ADD COLUMN transport_code_id UUID REFERENCES public.transport_codes(id) ON DELETE SET NULL;

-- Create update trigger for warehouses
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create update trigger for vehicle_positions
CREATE TRIGGER update_vehicle_positions_updated_at
  BEFORE UPDATE ON public.vehicle_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create update trigger for transport_codes
CREATE TRIGGER update_transport_codes_updated_at
  BEFORE UPDATE ON public.transport_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

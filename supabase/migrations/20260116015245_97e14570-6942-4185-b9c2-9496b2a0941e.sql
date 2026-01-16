-- Add customer_name column to po_headers
ALTER TABLE public.po_headers 
ADD COLUMN customer_name text;

-- Add vendor_customer_code and vendor_customer_name for mapped values
ALTER TABLE public.po_headers 
ADD COLUMN vendor_customer_code character varying,
ADD COLUMN vendor_customer_name text,
ADD COLUMN is_customer_mapped boolean DEFAULT false;

-- Create customer_mappings table (similar to product_mappings)
CREATE TABLE public.customer_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text NOT NULL,
  vendor_customer_code character varying NOT NULL,
  vendor_customer_name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique constraint on customer_name
ALTER TABLE public.customer_mappings ADD CONSTRAINT customer_mappings_customer_name_key UNIQUE (customer_name);

-- Enable RLS
ALTER TABLE public.customer_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (same as product_mappings)
CREATE POLICY "Anyone can view customer mappings" 
ON public.customer_mappings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert customer mappings" 
ON public.customer_mappings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update customer mappings" 
ON public.customer_mappings 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete customer mappings" 
ON public.customer_mappings 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customer_mappings_updated_at
BEFORE UPDATE ON public.customer_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
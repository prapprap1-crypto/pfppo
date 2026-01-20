-- Add remark field to po_headers
ALTER TABLE public.po_headers
ADD COLUMN remark text DEFAULT NULL;

-- Add salesperson_id to customer_mappings
ALTER TABLE public.customer_mappings
ADD COLUMN salesperson_id uuid DEFAULT NULL;

-- Create salespersons table
CREATE TABLE public.salespersons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code character varying NOT NULL,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint on code
ALTER TABLE public.salespersons ADD CONSTRAINT salespersons_code_unique UNIQUE (code);

-- Add foreign key constraint
ALTER TABLE public.customer_mappings
ADD CONSTRAINT customer_mappings_salesperson_id_fkey 
FOREIGN KEY (salesperson_id) REFERENCES public.salespersons(id);

-- Enable RLS on salespersons
ALTER TABLE public.salespersons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for salespersons
CREATE POLICY "Anyone can view salespersons" 
ON public.salespersons 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert salespersons" 
ON public.salespersons 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update salespersons" 
ON public.salespersons 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete salespersons" 
ON public.salespersons 
FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_salespersons_updated_at
BEFORE UPDATE ON public.salespersons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
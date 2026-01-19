-- Create customer_branch_mappings table
CREATE TABLE public.customer_branch_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_mapping_id UUID NOT NULL REFERENCES public.customer_mappings(id) ON DELETE CASCADE,
  branch TEXT NOT NULL,
  vendor_branch_code VARCHAR(100),
  vendor_branch_name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_mapping_id, branch)
);

-- Enable RLS
ALTER TABLE public.customer_branch_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view customer branch mappings" 
  ON public.customer_branch_mappings FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert customer branch mappings" 
  ON public.customer_branch_mappings FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customer branch mappings" 
  ON public.customer_branch_mappings FOR UPDATE 
  USING (true);

CREATE POLICY "Authenticated users can delete customer branch mappings" 
  ON public.customer_branch_mappings FOR DELETE 
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_customer_branch_mappings_updated_at
  BEFORE UPDATE ON public.customer_branch_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
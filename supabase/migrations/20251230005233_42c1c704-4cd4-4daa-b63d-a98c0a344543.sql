-- Create product_mapping table
CREATE TABLE public.product_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_code VARCHAR(50) NOT NULL,
  customer_desc TEXT NOT NULL,
  vendor_code VARCHAR(50) NOT NULL,
  vendor_desc TEXT NOT NULL,
  unit VARCHAR(20) DEFAULT 'ลัง',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create po_headers table
CREATE TABLE public.po_headers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_code VARCHAR(50) NOT NULL,
  supplier_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  document_date DATE NOT NULL,
  due_date DATE NOT NULL,
  net_total DECIMAL(12,2) DEFAULT 0,
  vat DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'IMPORTED', 'NEED_REVIEW', 'VERIFIED', 'EXPORTED', 'ERROR')),
  source_file TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create po_items table
CREATE TABLE public.po_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES public.po_headers(id) ON DELETE CASCADE,
  customer_product_code VARCHAR(50) NOT NULL,
  customer_description TEXT,
  vendor_product_code VARCHAR(50),
  vendor_description TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'ลัง',
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_date DATE,
  is_mapped BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create export_history table
CREATE TABLE public.export_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  exported_pos UUID[] NOT NULL,
  file_name TEXT NOT NULL,
  exported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_mappings (shared across users, only authenticated can modify)
CREATE POLICY "Anyone can view product mappings"
ON public.product_mappings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert mappings"
ON public.product_mappings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update mappings"
ON public.product_mappings FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete mappings"
ON public.product_mappings FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for po_headers (users see their own POs)
CREATE POLICY "Users can view their own POs"
ON public.po_headers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own POs"
ON public.po_headers FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own POs"
ON public.po_headers FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own POs"
ON public.po_headers FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for po_items (based on parent PO ownership)
CREATE POLICY "Users can view their PO items"
ON public.po_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.po_headers
  WHERE po_headers.id = po_items.po_id
  AND po_headers.user_id = auth.uid()
));

CREATE POLICY "Users can insert their PO items"
ON public.po_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.po_headers
  WHERE po_headers.id = po_items.po_id
  AND po_headers.user_id = auth.uid()
));

CREATE POLICY "Users can update their PO items"
ON public.po_items FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.po_headers
  WHERE po_headers.id = po_items.po_id
  AND po_headers.user_id = auth.uid()
));

CREATE POLICY "Users can delete their PO items"
ON public.po_items FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.po_headers
  WHERE po_headers.id = po_items.po_id
  AND po_headers.user_id = auth.uid()
));

-- RLS Policies for export_history
CREATE POLICY "Users can view their export history"
ON public.export_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create export records"
ON public.export_history FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_product_mappings_updated_at
BEFORE UPDATE ON public.product_mappings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_po_headers_updated_at
BEFORE UPDATE ON public.po_headers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for PO PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('po-files', 'po-files', false);

-- Storage policies for po-files bucket
CREATE POLICY "Users can upload their own PO files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'po-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own PO files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'po-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own PO files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'po-files' AND auth.uid()::text = (storage.foldername(name))[1]);
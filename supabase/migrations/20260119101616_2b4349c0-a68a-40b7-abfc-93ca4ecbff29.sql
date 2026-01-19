-- Create table for export templates
CREATE TABLE public.export_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  columns JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.export_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own templates" 
ON public.export_templates 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own templates" 
ON public.export_templates 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates" 
ON public.export_templates 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates" 
ON public.export_templates 
FOR DELETE 
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_export_templates_updated_at
BEFORE UPDATE ON public.export_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
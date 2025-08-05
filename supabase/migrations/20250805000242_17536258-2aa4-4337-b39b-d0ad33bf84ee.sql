-- Create custom payment types table
CREATE TABLE public.custom_payment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  base_payment_method TEXT NOT NULL CHECK (base_payment_method IN ('cash', 'card', 'דהרי')),
  commission_rate NUMERIC DEFAULT 0 CHECK (commission_rate >= -1 AND commission_rate <= 1),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.custom_payment_types ENABLE ROW LEVEL SECURITY;

-- Create policies for custom payment types
CREATE POLICY "Users can view their own custom payment types" 
ON public.custom_payment_types 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom payment types" 
ON public.custom_payment_types 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom payment types" 
ON public.custom_payment_types 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom payment types" 
ON public.custom_payment_types 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_payment_types_updated_at
BEFORE UPDATE ON public.custom_payment_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Update daily_expenses table to remove fuel column
ALTER TABLE public.daily_expenses DROP COLUMN IF EXISTS fuel;

-- Create new table for shift-specific expenses
CREATE TABLE IF NOT EXISTS public.shift_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  work_day_id UUID NOT NULL,
  payment_method TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for shift_expenses
ALTER TABLE public.shift_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for shift_expenses
CREATE POLICY "Users can view their own shift expenses" 
ON public.shift_expenses 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own shift expenses" 
ON public.shift_expenses 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own shift expenses" 
ON public.shift_expenses 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own shift expenses" 
ON public.shift_expenses 
FOR DELETE 
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_shift_expenses_updated_at
BEFORE UPDATE ON public.shift_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update daily_goals to support both daily and shift-based goals
ALTER TABLE public.daily_goals 
ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS weekly_income_goal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_income_goal NUMERIC DEFAULT 0;
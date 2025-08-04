-- Drop the existing constraint
ALTER TABLE public.trips DROP CONSTRAINT trips_payment_method_check;

-- Add the updated constraint with all payment methods including Hebrew ones
ALTER TABLE public.trips ADD CONSTRAINT trips_payment_method_check 
CHECK (payment_method = ANY (ARRAY['cash'::text, 'card'::text, 'app'::text, 'מזומן'::text, 'ביט'::text, 'אשראי'::text, 'GetTaxi'::text, 'דהרי'::text]));
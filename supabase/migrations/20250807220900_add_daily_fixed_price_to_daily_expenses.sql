-- Add daily_fixed_price column to daily_expenses table

-- This migration introduces a new column, `daily_fixed_price`, to the
-- `daily_expenses` table. The column stores a fixed daily cost that
-- contributes to the driver's overall expenses.  This value is
-- multiplied by the number of days in the current month to estimate
-- monthly expenses.  The column defaults to 0 for existing rows to
-- preserve backwards compatibility.

ALTER TABLE public.daily_expenses
  ADD COLUMN IF NOT EXISTS daily_fixed_price NUMERIC NOT NULL DEFAULT 0;

-- Ensure that any future inserts into daily_expenses include the
-- daily_fixed_price with a default of 0 when unspecified.  No
-- additional policies are required because row-level security and
-- triggers defined on daily_expenses remain unchanged.
-- Step 1: Remove commission system from custom_payment_types
ALTER TABLE custom_payment_types DROP COLUMN IF EXISTS commission_rate;

-- Step 2: Rename table to custom_order_sources for clarity
ALTER TABLE custom_payment_types RENAME TO custom_order_sources;

-- Step 3: Rename base_payment_method to default_payment_method
ALTER TABLE custom_order_sources RENAME COLUMN base_payment_method TO default_payment_method;

-- Step 4: Add order_source column to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS order_source TEXT;

-- Step 5: Migrate existing data
-- Move Get/Dahari/etc from payment_method to order_source
UPDATE trips 
SET order_source = CASE
  WHEN payment_method IN ('GetTaxi', 'app', 'גט', 'אפליקציה') THEN 'גט'
  WHEN payment_method = 'דהרי' THEN 'דהרי'
  ELSE 'מזדמן'
END,
payment_method = CASE
  WHEN payment_method IN ('GetTaxi', 'app', 'גט', 'אפליקציה', 'דהרי', 'מזומן', 'cash') THEN 'מזומן'
  WHEN payment_method IN ('card', 'כרטיס', 'אשראי') THEN 'אשראי'
  WHEN payment_method IN ('ביט', 'bit') THEN 'ביט'
  ELSE 'מזומן'
END
WHERE order_source IS NULL;

-- Step 6: Set default value for order_source
ALTER TABLE trips ALTER COLUMN order_source SET DEFAULT 'מזדמן';

-- Step 7: Make order_source NOT NULL (after migration)
UPDATE trips SET order_source = 'מזדמן' WHERE order_source IS NULL;
ALTER TABLE trips ALTER COLUMN order_source SET NOT NULL;
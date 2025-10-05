-- תיקון constraint לאמצעי תשלום - הוספת מזומן ואשראי
ALTER TABLE trips 
  DROP CONSTRAINT IF EXISTS valid_payment_method;

ALTER TABLE trips 
  ADD CONSTRAINT valid_payment_method 
  CHECK (payment_method IN ('cash', 'card', 'app', 'דהרי', 'GetTaxi', 'ביט', 'מזומן', 'אשראי'));
-- Change all trips from מזדמן to גט
UPDATE trips
SET order_source = 'גט'
WHERE order_source = 'מזדמן';
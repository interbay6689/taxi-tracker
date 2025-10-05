-- מחיקת custom order source שגוי (דהרי עם payment_method לא תקין)
DELETE FROM custom_order_sources 
WHERE id = '20f86812-91aa-4ba9-a8f7-fb1317546a18' 
  AND name = 'דהרי' 
  AND default_payment_method = 'דהרי';

-- הוספת constraint לוודא ש-default_payment_method הוא תקין
ALTER TABLE custom_order_sources 
ADD CONSTRAINT valid_default_payment_method 
CHECK (default_payment_method IN ('מזומן', 'אשראי', 'ביט'));

-- הוספת index ייחודי למניעת כפילויות בשמות לכל משתמש
CREATE UNIQUE INDEX IF NOT EXISTS custom_order_sources_user_name_unique 
ON custom_order_sources(user_id, LOWER(TRIM(name)));
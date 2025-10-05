-- שלב 3: מניעת בעיות עתידיות

-- 3.1 הוספת אינדקסים לביצועים
-- אינדקס לטעינת נסיעות של משתמש לפי תאריך
CREATE INDEX IF NOT EXISTS idx_trips_user_timestamp 
  ON trips(user_id, timestamp DESC);

-- אינדקס לסינון לפי אמצעי תשלום
CREATE INDEX IF NOT EXISTS idx_trips_payment_method 
  ON trips(payment_method);

-- אינדקס למציאת משמרת פעילה של משתמש
CREATE INDEX IF NOT EXISTS idx_workdays_user_active 
  ON work_days(user_id, is_active) WHERE is_active = true;

-- אינדקס להוצאות משמרת
CREATE INDEX IF NOT EXISTS idx_shift_expenses_workday 
  ON shift_expenses(work_day_id, created_at DESC);

-- 3.2 הוספת constraints למניעת כפילויות
-- ודא שרק רשומה אחת של מטרות לכל משתמש
ALTER TABLE daily_goals 
  DROP CONSTRAINT IF EXISTS unique_user_goals;
ALTER TABLE daily_goals 
  ADD CONSTRAINT unique_user_goals UNIQUE (user_id);

-- ודא שרק רשומה אחת של הוצאות לכל משתמש
ALTER TABLE daily_expenses 
  DROP CONSTRAINT IF EXISTS unique_user_expenses;
ALTER TABLE daily_expenses 
  ADD CONSTRAINT unique_user_expenses UNIQUE (user_id);

-- 3.3 הוספת validation לאמצעי תשלום
-- הגבלת ערכים מותרים באמצעי תשלום
ALTER TABLE trips 
  DROP CONSTRAINT IF EXISTS valid_payment_method;
ALTER TABLE trips 
  ADD CONSTRAINT valid_payment_method 
  CHECK (payment_method IN ('cash', 'card', 'app', 'דהרי', 'GetTaxi', 'ביט'));

-- 3.4 הוספת constraint למניעת משמרות פעילות מרובות
-- ודא שרק משמרת אחת פעילה לכל משתמש
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_workday 
  ON work_days(user_id) WHERE is_active = true;
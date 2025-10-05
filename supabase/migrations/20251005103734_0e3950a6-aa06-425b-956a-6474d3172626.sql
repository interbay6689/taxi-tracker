-- שלב 2: תיקון נתונים קיימים במסד הנתונים

-- 2.1 תיקון נתוני work_days - חישוב מחדש של כל המשמרות
UPDATE work_days wd
SET 
  total_income = COALESCE((
    SELECT SUM(t.amount)
    FROM trips t
    WHERE t.user_id = wd.user_id
      AND t.timestamp >= wd.start_time
      AND (wd.end_time IS NULL OR t.timestamp <= wd.end_time)
  ), 0),
  total_trips = COALESCE((
    SELECT COUNT(*)
    FROM trips t
    WHERE t.user_id = wd.user_id
      AND t.timestamp >= wd.start_time
      AND (wd.end_time IS NULL OR t.timestamp <= wd.end_time)
  ), 0)
WHERE wd.end_time IS NOT NULL;

-- 2.2 איחוד שמות אמצעי תשלום
-- איחוד cash ו-מזומן
UPDATE trips SET payment_method = 'cash' WHERE payment_method = 'מזומן';

-- איחוד card ו-אשראי
UPDATE trips SET payment_method = 'card' WHERE payment_method = 'אשראי';

-- 2.3 ניקוי כפילויות ב-daily_goals - שמירת הרשומה האחרונה בלבד
WITH ranked_goals AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
  FROM daily_goals
)
DELETE FROM daily_goals
WHERE id IN (
  SELECT id FROM ranked_goals WHERE rn > 1
);

-- 2.4 ניקוי כפילויות ב-daily_expenses - שמירת הרשומה האחרונה בלבד
WITH ranked_expenses AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
  FROM daily_expenses
)
DELETE FROM daily_expenses
WHERE id IN (
  SELECT id FROM ranked_expenses WHERE rn > 1
);
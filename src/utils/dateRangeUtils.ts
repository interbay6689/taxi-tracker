import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateRangeResult {
  start: Date;
  end: Date;
  label: string;
  isValid: boolean;
}

/**
 * חישוב טווח תאריכים מנורמל לפי סוג התקופה
 * מחזיר תאריכי התחלה וסוף מנורמלים עם שעות מדויקות
 */
export const getDateRangeForPeriod = (
  period: PeriodType,
  customRange?: { from: Date; to: Date }
): DateRangeResult => {
  const now = new Date();

  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return {
        start,
        end,
        label: 'היום',
        isValid: true
      };
    }

    case 'week': {
      // שבוע מתחיל ביום ראשון (Israeli standard)
      const start = startOfWeek(now, { weekStartsOn: 0 });
      start.setHours(0, 0, 0, 0);
      const end = endOfWeek(now, { weekStartsOn: 0 });
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        label: 'השבוע',
        isValid: true
      };
    }

    case 'month': {
      const start = startOfMonth(now);
      start.setHours(0, 0, 0, 0);
      const end = endOfMonth(now);
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        label: 'החודש',
        isValid: true
      };
    }

    case 'year': {
      const start = startOfYear(now);
      start.setHours(0, 0, 0, 0);
      const end = endOfYear(now);
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        label: 'השנה',
        isValid: true
      };
    }

    case 'custom': {
      if (customRange?.from && customRange?.to) {
        const start = new Date(customRange.from);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customRange.to);
        end.setHours(23, 59, 59, 999);
        
        // בדיקת תקינות - תאריך סיום חייב להיות אחרי תאריך התחלה
        if (end < start) {
          console.warn('Custom date range invalid: end date is before start date');
          return {
            start,
            end: start, // אם לא תקין, החזר טווח של יום אחד
            label: 'תקופה לא תקינה',
            isValid: false
          };
        }

        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return {
          start,
          end,
          label: `תקופה מותאמת (${daysDiff + 1} ימים)`,
          isValid: true
        };
      }
      
      // אם לא נבחר טווח מותאם, ברירת מחדל - חודש נוכחי
      console.warn('Custom period selected but no date range provided, falling back to current month');
      const start = startOfMonth(now);
      start.setHours(0, 0, 0, 0);
      const end = endOfMonth(now);
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        label: 'החודש (ברירת מחדל)',
        isValid: false
      };
    }

    default: {
      // ברירת מחדל - היום
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return {
        start,
        end,
        label: 'היום',
        isValid: true
      };
    }
  }
};

/**
 * בדיקה אם תאריך נמצא בטווח
 */
export const isDateInRange = (date: Date | string, range: DateRangeResult): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj >= range.start && dateObj <= range.end;
  } catch (error) {
    console.error('Error checking if date is in range:', error);
    return false;
  }
};

/**
 * פורמט תצוגה של טווח תאריכים
 */
export const formatDateRange = (range: DateRangeResult): string => {
  const formatOptions: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  };
  
  const startStr = range.start.toLocaleDateString('he-IL', formatOptions);
  const endStr = range.end.toLocaleDateString('he-IL', formatOptions);
  
  return `${startStr} - ${endStr}`;
};

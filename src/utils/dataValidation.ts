import { Trip, ShiftExpense } from "@/hooks/useDatabase";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AnomalyDetection {
  type: 'high_amount' | 'high_commission' | 'unusual_count' | 'negative_value' | 'missing_data';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedItem?: Trip | ShiftExpense;
}

/**
 * בדיקת תקינות נסיעה
 */
export function validateTrip(trip: Partial<Trip>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // בדיקת שדות חובה
  if (!trip.amount || trip.amount <= 0) {
    errors.push("סכום הנסיעה חייב להיות חיובי");
  }

  if (!trip.payment_method || trip.payment_method.trim() === '') {
    errors.push("חובה לבחור אמצעי תשלום");
  }

  if (!trip.timestamp) {
    errors.push("תאריך הנסיעה חסר");
  }

  // בדיקות אזהרה
  if (trip.amount && trip.amount > 200) {
    warnings.push(`סכום גבוה מהרגיל: ₪${trip.amount}`);
  }

  if (trip.amount && trip.amount < 10) {
    warnings.push(`סכום נמוך מהרגיל: ₪${trip.amount}`);
  }

  // בדיקת תאריך עתידי
  if (trip.timestamp && new Date(trip.timestamp) > new Date()) {
    warnings.push("תאריך הנסיעה הוא בעתיד");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * בדיקת תקינות הוצאה
 */
export function validateExpense(expense: Partial<ShiftExpense>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!expense.amount || expense.amount <= 0) {
    errors.push("סכום ההוצאה חייב להיות חיובי");
  }

  if (!expense.created_at) {
    errors.push("תאריך ההוצאה חסר");
  }

  // אזהרה על דלק יקר
  if (expense.amount && expense.amount > 300) {
    warnings.push(`תדלוק יקר מהרגיל: ₪${expense.amount}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * זיהוי חריגות בנתונים
 */
export function detectAnomalies(
  trips: Trip[],
  expenses: ShiftExpense[] = [],
  options?: {
    highAmountThreshold?: number;
    highCommissionThreshold?: number;
    unusualCountThreshold?: number;
  }
): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];
  const highAmountThreshold = options?.highAmountThreshold || 200;
  const highCommissionThreshold = options?.highCommissionThreshold || 0.2; // 20%
  const unusualCountThreshold = options?.unusualCountThreshold || 40;

  // זיהוי נסיעות בסכום גבוה
  trips.forEach(trip => {
    if (trip.amount > highAmountThreshold) {
      anomalies.push({
        type: 'high_amount',
        severity: trip.amount > 500 ? 'high' : 'medium',
        message: `נסיעה בסכום גבוה: ₪${trip.amount}`,
        affectedItem: trip
      });
    }

    // בדיקת סכומים שליליים (לא אמור לקרות אבל...)
    if (trip.amount < 0) {
      anomalies.push({
        type: 'negative_value',
        severity: 'high',
        message: `נסיעה עם סכום שלילי: ₪${trip.amount}`,
        affectedItem: trip
      });
    }

    // בדיקת נתונים חסרים
    if (!trip.payment_method) {
      anomalies.push({
        type: 'missing_data',
        severity: 'medium',
        message: 'נסיעה ללא אמצעי תשלום',
        affectedItem: trip
      });
    }
  });

  // בדיקת מספר נסיעות חריג ליום
  const today = new Date().toDateString();
  const todayTrips = trips.filter(
    trip => new Date(trip.timestamp).toDateString() === today
  );
  
  if (todayTrips.length > unusualCountThreshold) {
    anomalies.push({
      type: 'unusual_count',
      severity: 'medium',
      message: `מספר נסיעות חריג היום: ${todayTrips.length} נסיעות`
    });
  }

  // בדיקת הוצאות חריגות
  expenses.forEach(expense => {
    if (expense.amount > 300) {
      anomalies.push({
        type: 'high_amount',
        severity: 'medium',
        message: `תדלוק בסכום גבוה: ₪${expense.amount}`,
        affectedItem: expense
      });
    }

    if (expense.amount < 0) {
      anomalies.push({
        type: 'negative_value',
        severity: 'high',
        message: `הוצאה עם סכום שלילי: ₪${expense.amount}`,
        affectedItem: expense
      });
    }
  });

  return anomalies;
}

/**
 * חישוב סטטיסטיקות לזיהוי חריגות
 */
export function calculateTripStatistics(trips: Trip[]) {
  if (trips.length === 0) {
    return {
      average: 0,
      median: 0,
      stdDeviation: 0,
      min: 0,
      max: 0
    };
  }

  const amounts = trips.map(t => t.amount).sort((a, b) => a - b);
  const sum = amounts.reduce((acc, val) => acc + val, 0);
  const average = sum / amounts.length;

  const median = amounts.length % 2 === 0
    ? (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2
    : amounts[Math.floor(amounts.length / 2)];

  const variance = amounts.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / amounts.length;
  const stdDeviation = Math.sqrt(variance);

  return {
    average,
    median,
    stdDeviation,
    min: amounts[0],
    max: amounts[amounts.length - 1]
  };
}

/**
 * בדיקת עקביות נתונים בין דשבורד לאנליטיקה
 */
export function validateDataConsistency(
  dashboardIncome: number,
  dashboardTrips: number,
  analyticsIncome: number,
  analyticsTrips: number,
  tolerance: number = 0.01 // 1% tolerance
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // השוואת הכנסות
  const incomeDiff = Math.abs(dashboardIncome - analyticsIncome);
  const incomePercentDiff = dashboardIncome > 0 ? incomeDiff / dashboardIncome : 0;
  
  if (incomePercentDiff > tolerance) {
    errors.push(
      `אי-התאמה בהכנסות: דשבורד ₪${dashboardIncome.toFixed(2)} vs. אנליטיקה ₪${analyticsIncome.toFixed(2)}`
    );
  }

  // השוואת מספר נסיעות
  if (dashboardTrips !== analyticsTrips) {
    errors.push(
      `אי-התאמה במספר נסיעות: דשבורד ${dashboardTrips} vs. אנליטיקה ${analyticsTrips}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

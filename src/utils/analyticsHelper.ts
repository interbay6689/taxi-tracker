import { Trip, ShiftExpense } from "@/hooks/database/types";
import { groupTripsByOrderSource } from './orderSourceHelper';
import { groupTripsByPaymentMethod } from './paymentMethodsHelper';

/**
 * ממשק לסטטיסטיקות מפורטות
 */
export interface DetailedStats {
  method: string;
  income: number;
  count: number;
  percentage: number;
  paymentMethodBreakdown?: {
    'מזומן': number;
    'אשראי': number;
    'ביט': number;
  };
}

/**
 * חישוב סטטיסטיקות מפורטות לפי מקור הזמנה
 */
export function calculateOrderSourceStats(trips: Trip[]): DetailedStats[] {
  const groupedBySource = groupTripsByOrderSource(trips);
  const totalIncome = trips.reduce((sum, trip) => sum + trip.amount, 0);
  
  const stats: DetailedStats[] = [];
  
  groupedBySource.forEach((sourceTrips, source) => {
    const income = sourceTrips.reduce((sum, trip) => sum + trip.amount, 0);
    
    // חישוב פילוח אמצעי תשלום
    const paymentMethodBreakdown = {
      'מזומן': sourceTrips.filter(t => t.payment_method === 'מזומן').reduce((sum, t) => sum + t.amount, 0),
      'אשראי': sourceTrips.filter(t => t.payment_method === 'אשראי').reduce((sum, t) => sum + t.amount, 0),
      'ביט': sourceTrips.filter(t => t.payment_method === 'ביט').reduce((sum, t) => sum + t.amount, 0),
    };
    
    stats.push({
      method: source,
      income,
      count: sourceTrips.length,
      percentage: totalIncome > 0 ? (income / totalIncome) * 100 : 0,
      paymentMethodBreakdown
    });
  });
  
  return stats.sort((a, b) => b.income - a.income);
}

/**
 * חישוב סטטיסטיקות מפורטות לפי אמצעי תשלום
 */
export function calculatePaymentMethodStats(trips: Trip[]): DetailedStats[] {
  const groupedByPayment = groupTripsByPaymentMethod(trips);
  const totalIncome = trips.reduce((sum, trip) => sum + trip.amount, 0);
  
  const stats: DetailedStats[] = [];
  
  groupedByPayment.forEach((paymentTrips, method) => {
    const income = paymentTrips.reduce((sum, trip) => sum + trip.amount, 0);
    
    stats.push({
      method,
      income,
      count: paymentTrips.length,
      percentage: totalIncome > 0 ? (income / totalIncome) * 100 : 0
    });
  });
  
  return stats.sort((a, b) => b.income - a.income);
}

/**
 * חישוב נתונים לטבלת Cross-Tab (מקור הזמנה X אמצעי תשלום)
 */
export interface CrossTabData {
  orderSource: string;
  totalIncome: number;
  totalTrips: number;
  cash: { amount: number; count: number };
  credit: { amount: number; count: number };
  bit: { amount: number; count: number };
}

export function calculateCrossTabData(trips: Trip[]): CrossTabData[] {
  const groupedBySource = groupTripsByOrderSource(trips);
  
  const crossTabData: CrossTabData[] = [];
  
  groupedBySource.forEach((sourceTrips, source) => {
    const cashTrips = sourceTrips.filter(t => t.payment_method === 'מזומן');
    const creditTrips = sourceTrips.filter(t => t.payment_method === 'אשראי');
    const bitTrips = sourceTrips.filter(t => t.payment_method === 'ביט');
    
    crossTabData.push({
      orderSource: source,
      totalIncome: sourceTrips.reduce((sum, t) => sum + t.amount, 0),
      totalTrips: sourceTrips.length,
      cash: {
        amount: cashTrips.reduce((sum, t) => sum + t.amount, 0),
        count: cashTrips.length
      },
      credit: {
        amount: creditTrips.reduce((sum, t) => sum + t.amount, 0),
        count: creditTrips.length
      },
      bit: {
        amount: bitTrips.reduce((sum, t) => sum + t.amount, 0),
        count: bitTrips.length
      }
    });
  });
  
  return crossTabData.sort((a, b) => b.totalIncome - a.totalIncome);
}

/**
 * חישוב ממוצעים ותובנות
 */
export interface AnalyticsInsights {
  averageTripAmount: number;
  averageTripsPerDay: number;
  topOrderSource: string;
  topPaymentMethod: string;
  profitMargin: number;
  bestPerformingDay?: string;
}

export function calculateInsights(
  trips: Trip[], 
  expenses: ShiftExpense[], 
  dateRangeDays: number
): AnalyticsInsights {
  const totalIncome = trips.reduce((sum, trip) => sum + trip.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const orderSourceStats = calculateOrderSourceStats(trips);
  const paymentMethodStats = calculatePaymentMethodStats(trips);
  
  return {
    averageTripAmount: trips.length > 0 ? totalIncome / trips.length : 0,
    averageTripsPerDay: dateRangeDays > 0 ? trips.length / dateRangeDays : 0,
    topOrderSource: orderSourceStats[0]?.method || 'לא זמין',
    topPaymentMethod: paymentMethodStats[0]?.method || 'לא זמין',
    profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
  };
}

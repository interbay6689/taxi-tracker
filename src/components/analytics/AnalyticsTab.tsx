import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, TrendingUp, Fuel } from "lucide-react";
import { Trip, ShiftExpense } from "@/hooks/useDatabase";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";
import { PeriodSelector, TimePeriod } from "./PeriodSelector";

interface AnalyticsTabProps {
  trips: Trip[];
  shiftExpenses?: ShiftExpense[];
}

export const AnalyticsTab = ({ trips, shiftExpenses = [] }: AnalyticsTabProps) => {
  const { getPaymentMethodDetails, allPaymentOptions } = useCustomPaymentTypes();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  
  // Debug logging
  console.log('AnalyticsTab - trips:', trips?.length || 0);
  console.log('AnalyticsTab - shiftExpenses:', shiftExpenses?.length || 0);
  
  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of current week (Sunday - Israeli standard)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday is day 0
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayTrips = trips.filter(trip => new Date(trip.timestamp) >= today);
    const weekTrips = trips.filter(trip => new Date(trip.timestamp) >= startOfWeek);
    const monthTrips = trips.filter(trip => new Date(trip.timestamp) >= startOfMonth);

    // Filter fuel expenses by time periods
    const todayFuelExpenses = shiftExpenses?.filter(expense => {
      try {
        return new Date(expense.created_at) >= today;
      } catch (error) {
        console.error('Error filtering fuel expense by date:', error, expense);
        return false;
      }
    }) || [];
    const weekFuelExpenses = shiftExpenses?.filter(expense => {
      try {
        return new Date(expense.created_at) >= startOfWeek;
      } catch (error) {
        console.error('Error filtering fuel expense by date:', error, expense);
        return false;
      }
    }) || [];
    const monthFuelExpenses = shiftExpenses?.filter(expense => {
      try {
        return new Date(expense.created_at) >= startOfMonth;
      } catch (error) {
        console.error('Error filtering fuel expense by date:', error, expense);
        return false;
      }
    }) || [];

    console.log('Analytics filters - today fuel:', todayFuelExpenses.length, 'week fuel:', weekFuelExpenses.length, 'month fuel:', monthFuelExpenses.length);

    const todayIncome = todayTrips.reduce((sum, trip) => {
      const paymentDetails = getPaymentMethodDetails(trip.payment_method);
      return sum + (trip.amount * (1 - paymentDetails.commissionRate));
    }, 0);
    const weekIncome = weekTrips.reduce((sum, trip) => {
      const paymentDetails = getPaymentMethodDetails(trip.payment_method);
      return sum + (trip.amount * (1 - paymentDetails.commissionRate));
    }, 0);
    const monthIncome = monthTrips.reduce((sum, trip) => {
      const paymentDetails = getPaymentMethodDetails(trip.payment_method);
      return sum + (trip.amount * (1 - paymentDetails.commissionRate));
    }, 0);

    // Calculate fuel expenses totals
    const todayFuelTotal = todayFuelExpenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0);
    const weekFuelTotal = weekFuelExpenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0);
    const monthFuelTotal = monthFuelExpenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0);

    console.log('Fuel totals - today:', todayFuelTotal, 'week:', weekFuelTotal, 'month:', monthFuelTotal);

    // Get current period data based on selection
    const getCurrentPeriodData = () => {
      switch (selectedPeriod) {
        case 'week':
          return { trips: weekTrips, fuelExpenses: weekFuelExpenses, label: 'השבוע' };
        case 'month':
          return { trips: monthTrips, fuelExpenses: monthFuelExpenses, label: 'החודש' };
        default:
          return { trips: todayTrips, fuelExpenses: todayFuelExpenses, label: 'היום' };
      }
    };

    const currentPeriodData = getCurrentPeriodData();

    // ניתוח תשלומים מתקדם - כולל כל התיוגים עבור התקופה הנבחרת
    const paymentStats = allPaymentOptions.map(option => {
      const methodTrips = currentPeriodData.trips.filter(trip => trip.payment_method === option.value);
      const income = methodTrips.reduce((sum, trip) => {
        const paymentDetails = getPaymentMethodDetails(trip.payment_method);
        return sum + (trip.amount * (1 - paymentDetails.commissionRate));
      }, 0);
      const rawIncome = methodTrips.reduce((sum, trip) => sum + trip.amount, 0);
      const paymentDetails = getPaymentMethodDetails(option.value);
      return {
        method: option.label,
        income,
        rawIncome,
        count: methodTrips.length,
        commissionRate: paymentDetails.commissionRate,
        isCustom: option.isCustom
      };
    }).filter(stat => stat.count > 0); // הצג רק תשלומים שיש בהם נסיעות

    return {
      todayIncome,
      weekIncome,
      monthIncome,
      todayFuelTotal,
      weekFuelTotal,
      monthFuelTotal,
      paymentStats,
      todayTrips: todayTrips.length,
      weekTrips: weekTrips.length,
      monthTrips: monthTrips.length,
      currentPeriodData
    };
  }, [trips, shiftExpenses, getPaymentMethodDetails, allPaymentOptions, selectedPeriod]);

  return (
    <div className="space-y-6">
      {/* ניתוח תיוגי תשלומים */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            התפלגות תיוגי תשלומים {analytics.currentPeriodData.label}
          </CardTitle>
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.paymentStats.length === 0 && analytics.currentPeriodData.fuelExpenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">אין נסיעות או הוצאות {analytics.currentPeriodData.label}</p>
            ) : (
              <>
                {/* תיוגי תשלומים */}
                {analytics.paymentStats.map((stat, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${stat.isCustom ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${stat.isCustom ? 'text-primary' : ''}`}>
                            {stat.method}
                          </span>
                          {stat.isCustom && <Tag className="h-3 w-3 text-primary" />}
                        </div>
                        {stat.commissionRate !== 0 && (
                          <div className="text-xs mt-1">
                            {stat.commissionRate > 0 ? (
                              <span className="text-destructive">עמלה: {(stat.commissionRate * 100).toFixed(1)}%</span>
                            ) : (
                              <span className="text-green-600">בונוס: +{Math.abs(stat.commissionRate * 100).toFixed(1)}%</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₪{stat.income.toLocaleString()}</div>
                        {stat.commissionRate !== 0 && (
                          <div className="text-xs text-muted-foreground line-through">₪{stat.rawIncome.toLocaleString()}</div>
                        )}
                        <div className="text-sm text-muted-foreground">{stat.count} נסיעות</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* הוצאות דלק */}
                {analytics.currentPeriodData.fuelExpenses && analytics.currentPeriodData.fuelExpenses.length > 0 && (
                  <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-700">הוצאות דלק</span>
                          <Fuel className="h-3 w-3 text-red-600" />
                        </div>
                        <div className="text-xs mt-1 text-red-600">
                          הוצאות תפעוליות
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          -₪{analytics.currentPeriodData.fuelExpenses.reduce((sum, exp) => sum + (exp?.amount || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {analytics.currentPeriodData.fuelExpenses.length} תדלוקים
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>



      {/* סיכום תקופות */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            סיכום תקופות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`text-center p-4 rounded-lg ${selectedPeriod === 'today' ? 'bg-primary/10 border-2 border-primary/20' : 'bg-muted/50'}`}>
              <div className="text-lg font-bold">היום</div>
              <div className="text-2xl font-bold text-primary">₪{analytics.todayIncome.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{analytics.todayTrips} נסיעות</div>
              {analytics.todayFuelTotal > 0 && (
                <div className="text-sm text-red-600 mt-1">
                  דלק: -₪{analytics.todayFuelTotal.toLocaleString()}
                </div>
              )}
              {analytics.todayFuelTotal > 0 && (
                <div className="text-xs font-medium text-green-700 mt-1">
                  נטו: ₪{(analytics.todayIncome - analytics.todayFuelTotal).toLocaleString()}
                </div>
              )}
            </div>
            <div className={`text-center p-4 rounded-lg ${selectedPeriod === 'week' ? 'bg-primary/10 border-2 border-primary/20' : 'bg-muted/50'}`}>
              <div className="text-lg font-bold">השבוע</div>
              <div className="text-2xl font-bold text-primary">₪{analytics.weekIncome.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{analytics.weekTrips} נסיעות</div>
              {analytics.weekFuelTotal > 0 && (
                <div className="text-sm text-red-600 mt-1">
                  דלק: -₪{analytics.weekFuelTotal.toLocaleString()}
                </div>
              )}
              {analytics.weekFuelTotal > 0 && (
                <div className="text-xs font-medium text-green-700 mt-1">
                  נטו: ₪{(analytics.weekIncome - analytics.weekFuelTotal).toLocaleString()}
                </div>
              )}
            </div>
            <div className={`text-center p-4 rounded-lg ${selectedPeriod === 'month' ? 'bg-primary/10 border-2 border-primary/20' : 'bg-muted/50'}`}>
              <div className="text-lg font-bold">החודש</div>
              <div className="text-2xl font-bold text-primary">₪{analytics.monthIncome.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{analytics.monthTrips} נסיעות</div>
              {analytics.monthFuelTotal > 0 && (
                <div className="text-sm text-red-600 mt-1">
                  דלק: -₪{analytics.monthFuelTotal.toLocaleString()}
                </div>
              )}
              {analytics.monthFuelTotal > 0 && (
                <div className="text-xs font-medium text-green-700 mt-1">
                  נטו: ₪{(analytics.monthIncome - analytics.monthFuelTotal).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
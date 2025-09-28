import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, TrendingUp, Fuel } from "lucide-react";
import { Trip, ShiftExpense } from "@/hooks/useDatabase";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";

interface AnalyticsTabProps {
  trips: Trip[];
  shiftExpenses?: ShiftExpense[];
  selectedPeriod?: 'today' | 'week' | 'month' | 'year' | 'custom';
  customDateRange?: DateRange | undefined;
  onPeriodChange?: (period: 'today' | 'week' | 'month' | 'year' | 'custom') => void;
  onCustomDateRangeChange?: (dateRange: DateRange | undefined) => void;
}

export const AnalyticsTab = ({ 
  trips, 
  shiftExpenses = [],
  selectedPeriod = 'today',
  customDateRange,
  onPeriodChange = () => {},
  onCustomDateRangeChange = () => {}
}: AnalyticsTabProps) => {
  const { getPaymentMethodDetails, allPaymentOptions } = useCustomPaymentTypes();
  
  // Debug logging
  console.log('AnalyticsTab - trips:', trips?.length || 0);
  console.log('AnalyticsTab - shiftExpenses:', shiftExpenses?.length || 0);
  
  const analytics = useMemo(() => {
    const now = new Date();
    
    // Calculate date ranges based on selected period
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case 'week':
        // Start of current week (Sunday - Israeli standard)
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
        endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        if (customDateRange?.from && customDateRange?.to) {
          startDate = new Date(customDateRange.from);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customDateRange.to);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Fallback to today if no custom range selected
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }

    console.log('Filtering data - Total trips:', trips.length, 'Total shift expenses:', shiftExpenses.length);
    console.log('Date range:', { 
      start: startDate, 
      end: endDate, 
      selectedPeriod 
    });

    // Filter trips and expenses by the calculated date range
    const filteredTrips = trips.filter(trip => {
      try {
        const tripDate = new Date(trip.timestamp);
        return tripDate >= startDate && tripDate <= endDate;
      } catch (error) {
        console.error('Error filtering trip by date:', error, trip);
        return false;
      }
    });

    const filteredExpenses = shiftExpenses.filter(expense => {
      try {
        const expenseDate = new Date(expense.created_at);
        return expenseDate >= startDate && expenseDate <= endDate;
      } catch (error) {
        console.error('Error filtering expense by date:', error, expense);
        return false;
      }
    });

    console.log('Filtered results:', {
      tripsInRange: filteredTrips.length,
      expensesInRange: filteredExpenses.length
    });

    const totalIncome = filteredTrips.reduce((sum, trip) => {
      const paymentDetails = getPaymentMethodDetails(trip.payment_method);
      return sum + (trip.amount * (1 - paymentDetails.commissionRate));
    }, 0);

    const totalFuelExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0);

    // ניתוח תשלומים מתקדם - כולל כל התיוגים עבור התקופה הנבחרת
    const paymentStats = allPaymentOptions.map(option => {
      const methodTrips = filteredTrips.filter(trip => trip.payment_method === option.value);
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
      totalIncome,
      totalFuelExpenses,
      paymentStats,
      totalTrips: filteredTrips.length,
      filteredTrips,
      filteredExpenses,
      dateRange: { startDate, endDate }
    };
  }, [trips, shiftExpenses, selectedPeriod, customDateRange, getPaymentMethodDetails, allPaymentOptions]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'השבוע';
      case 'month': return 'החודש';
      case 'year': return 'השנה';
      case 'custom': return customDateRange?.from && customDateRange?.to ? 'תקופה מותאמת' : 'היום';
      default: return 'היום';
    }
  };

  return (
    <div className="space-y-6">
      {/* בחירת תקופה */}
      <Card>
        <CardHeader>
          <CardTitle>בחירת תקופה לאנליטיקה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
              <Button
                variant={selectedPeriod === 'today' ? 'default' : 'outline'}
                onClick={() => onPeriodChange('today')}
              >
                היום
              </Button>
              <Button
                variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                onClick={() => onPeriodChange('week')}
              >
                השבוע
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                onClick={() => onPeriodChange('month')}
              >
                החודש
              </Button>
              <Button
                variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                onClick={() => onPeriodChange('year')}
              >
                השנה
              </Button>
              <Button
                variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
                onClick={() => onPeriodChange('custom')}
              >
                תקופה מותאמת
              </Button>
            </div>
            
            {/* Custom Date Range Picker */}
            {selectedPeriod === 'custom' && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="text-sm font-medium mb-3">בחר טווח תאריכים:</h4>
                <DateRangePicker
                  date={customDateRange}
                  onDateChange={onCustomDateRangeChange}
                  placeholder="בחר טווח תאריכים"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ניתוח תיוגי תשלומים */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            התפלגות תיוגי תשלומים {getPeriodLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.paymentStats.length === 0 && analytics.filteredExpenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">אין נסיעות או הוצאות {getPeriodLabel()}</p>
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
                {analytics.filteredExpenses && analytics.filteredExpenses.length > 0 && (
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
                          -₪{analytics.filteredExpenses.reduce((sum, exp) => sum + (exp?.amount || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {analytics.filteredExpenses.length} תדלוקים
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

      {/* סיכום כללי */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            סיכום {getPeriodLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-lg font-bold mb-2">סה"כ הכנסות</div>
              <div className="text-3xl font-bold text-primary mb-2">₪{analytics.totalIncome.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{analytics.totalTrips} נסיעות</div>
              {analytics.totalFuelExpenses > 0 && (
                <>
                  <div className="text-sm text-red-600 mt-2">
                    דלק: -₪{analytics.totalFuelExpenses.toLocaleString()}
                  </div>
                  <div className="text-lg font-bold text-green-700 mt-2 pt-2 border-t border-primary/20">
                    נטו: ₪{(analytics.totalIncome - analytics.totalFuelExpenses).toLocaleString()}
                  </div>
                </>
              )}
            </div>
            
            <div className="text-center p-6 rounded-lg bg-muted/50 border">
              <div className="text-lg font-bold mb-2">ממוצע לנסיעה</div>
              <div className="text-3xl font-bold text-secondary-foreground mb-2">
                ₪{analytics.totalTrips > 0 ? Math.round(analytics.totalIncome / analytics.totalTrips) : 0}
              </div>
              <div className="text-sm text-muted-foreground">
                {analytics.dateRange && (
                  <>
                    {analytics.dateRange.startDate.toLocaleDateString('he-IL')} - {analytics.dateRange.endDate.toLocaleDateString('he-IL')}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
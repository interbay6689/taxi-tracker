
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, TrendingUp, Car, Clock, DollarSign } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Trip, WorkDay } from "@/hooks/useDatabase";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker";

interface ReportsExportProps {
  trips: Trip[];
  workDays: WorkDay[];
  selectedPeriod: 'today' | 'week' | 'month' | 'year' | 'custom';
  customDateRange?: { from: Date; to: Date };
  onPeriodChange?: (period: 'today' | 'week' | 'month' | 'year' | 'custom') => void;
  onCustomDateRangeChange?: (dateRange: { from: Date; to: Date } | undefined) => void;
}

export const ReportsExport: React.FC<ReportsExportProps> = ({
  trips = [],
  workDays = [],
  selectedPeriod,
  customDateRange,
  onPeriodChange,
  onCustomDateRangeChange
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { getPaymentMethodDetails } = useCustomPaymentTypes();

  // Helper function to get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        return { start: today, end: endOfToday };
      
      case 'week':
        return { 
          start: startOfWeek(now, { weekStartsOn: 0 }), 
          end: endOfWeek(now, { weekStartsOn: 0 }) 
        };
      
      case 'month':
        return { 
          start: startOfMonth(now), 
          end: endOfMonth(now) 
        };
      
      case 'year':
        return { 
          start: startOfYear(now), 
          end: endOfYear(now) 
        };
      
      case 'custom':
        if (customDateRange?.from && customDateRange?.to) {
          return { 
            start: customDateRange.from, 
            end: customDateRange.to 
          };
        }
        // Fallback to current year if custom range is invalid
        return { 
          start: startOfYear(now), 
          end: endOfYear(now) 
        };
      
      default:
        // Default to all time (current year)
        return { 
          start: startOfYear(now), 
          end: endOfYear(now) 
        };
    }
  };

  // Filter data based on selected period
  const { filteredTrips, filteredWorkDays } = useMemo(() => {
    console.log('Filtering data - Total trips:', trips.length, 'Total work days:', workDays.length);
    
    const { start, end } = getDateRange();
    console.log('Date range:', { start, end, selectedPeriod });
    
    const tripsInRange = trips.filter(trip => {
      try {
        const tripDate = parseISO(trip.timestamp);
        const isInRange = isWithinInterval(tripDate, { start, end });
        return isInRange;
      } catch (error) {
        console.error('Error parsing trip date:', trip.timestamp, error);
        return false;
      }
    });

    const workDaysInRange = workDays.filter(workDay => {
      try {
        const workDayDate = parseISO(workDay.start_time);
        const isInRange = isWithinInterval(workDayDate, { start, end });
        return isInRange;
      } catch (error) {
        console.error('Error parsing work day date:', workDay.start_time, error);
        return false;
      }
    });

    console.log('Filtered results:', {
      tripsInRange: tripsInRange.length,
      workDaysInRange: workDaysInRange.length
    });

    return {
      filteredTrips: tripsInRange,
      filteredWorkDays: workDaysInRange
    };
  }, [trips, workDays, selectedPeriod, customDateRange]);

  // Calculate summary statistics with commission deductions
  const summaryStats = useMemo(() => {
    // Calculate total income after commissions
    const totalIncome = filteredTrips.reduce((sum, trip) => {
      const paymentDetails = getPaymentMethodDetails(trip.payment_method);
      const netAmount = trip.amount * (1 - paymentDetails.commissionRate);
      return sum + netAmount;
    }, 0);
    
    const totalRawIncome = filteredTrips.reduce((sum, trip) => sum + trip.amount, 0);
    const totalCommission = totalRawIncome - totalIncome;
    
    const totalTrips = filteredTrips.length;
    const totalWorkDays = filteredWorkDays.length;
    const completedShifts = filteredWorkDays.filter(wd => !wd.is_active).length;
    const activeShifts = filteredWorkDays.filter(wd => wd.is_active).length;
    
    // Calculate average income per trip and per work day
    const avgIncomePerTrip = totalTrips > 0 ? totalIncome / totalTrips : 0;
    const avgIncomePerWorkDay = totalWorkDays > 0 ? totalIncome / totalWorkDays : 0;

    // Calculate payment method breakdown with commission
    const paymentMethodBreakdown = filteredTrips.reduce((acc, trip) => {
      const method = trip.payment_method;
      const paymentDetails = getPaymentMethodDetails(trip.payment_method);
      const netAmount = trip.amount * (1 - paymentDetails.commissionRate);
      
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0, rawAmount: 0, commission: 0 };
      }
      acc[method].count += 1;
      acc[method].amount += netAmount;
      acc[method].rawAmount += trip.amount;
      acc[method].commission += (trip.amount - netAmount);
      return acc;
    }, {} as Record<string, { count: number; amount: number; rawAmount: number; commission: number }>);

    return {
      totalIncome,
      totalRawIncome,
      totalCommission,
      totalTrips,
      totalWorkDays,
      completedShifts,
      activeShifts,
      avgIncomePerTrip,
      avgIncomePerWorkDay,
      paymentMethodBreakdown
    };
  }, [filteredTrips, filteredWorkDays, getPaymentMethodDetails]);

  const exportToCSV = async () => {
    setIsExporting(true);
    
    try {
      // Create CSV content with commission calculations
      const csvContent = [
        // Header
        ['תאריך', 'שעה', 'סכום גולמי', 'עמלה', 'סכום נטו', 'אמצעי תשלום', 'תיוג', 'עיר התחלה', 'עיר סיום'].join(','),
        // Data rows
        ...filteredTrips.map(trip => {
          const paymentDetails = getPaymentMethodDetails(trip.payment_method);
          const netAmount = trip.amount * (1 - paymentDetails.commissionRate);
          const commission = trip.amount - netAmount;
          
          return [
            format(parseISO(trip.timestamp), 'dd/MM/yyyy', { locale: he }),
            format(parseISO(trip.timestamp), 'HH:mm', { locale: he }),
            trip.amount.toFixed(2),
            commission.toFixed(2),
            netAmount.toFixed(2),
            trip.payment_method,
            trip.trip_status || '',
            trip.start_location_city || '',
            trip.end_location_city || ''
          ].join(',');
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `דוח_נסיעות_${format(new Date(), 'dd-MM-yyyy')}.csv`;
      link.click();

      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getPeriodDisplayName = () => {
    switch (selectedPeriod) {
      case 'today': return 'היום';
      case 'week': return 'השבוע';
      case 'month': return 'החודש';
      case 'year': return 'השנה';
      case 'custom': return 'תקופה מותאמת אישית';
      default: return 'כל הזמן';
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      {onPeriodChange && onCustomDateRangeChange && (
        <Card>
          <CardHeader>
            <CardTitle>תקופת זמן</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 grid-cols-3 md:grid-cols-5">
            <Button
              variant={selectedPeriod === 'today' ? 'default' : 'outline'}
              onClick={() => onPeriodChange('today')}
              size="sm"
            >
              היום
            </Button>
            <Button
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              onClick={() => onPeriodChange('week')}
              size="sm"
            >
              השבוע
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              onClick={() => onPeriodChange('month')}
              size="sm"
            >
              החודש
            </Button>
            <Button
              variant={selectedPeriod === 'year' ? 'default' : 'outline'}
              onClick={() => onPeriodChange('year')}
              size="sm"
            >
              השנה
            </Button>
            <Button
              variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
              onClick={() => onPeriodChange('custom')}
              size="sm"
            >
              תקופה מותאמת
            </Button>
          </CardContent>
          
          {selectedPeriod === 'custom' && (
            <CardContent className="pt-0">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="text-sm font-medium mb-3">בחר טווח תאריכים:</h4>
                <DateRangePicker
                  date={customDateRange ? { from: customDateRange.from, to: customDateRange.to } : undefined}
                  onDateChange={(range) => {
                    if (range?.from && range?.to) {
                      onCustomDateRangeChange({ from: range.from, to: range.to });
                    } else {
                      onCustomDateRangeChange(undefined);
                    }
                  }}
                  placeholder="בחר טווח תאריכים"
                />
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות נטו</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₪{summaryStats.totalIncome.toLocaleString()}</div>
            {summaryStats.totalCommission > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                <span className="line-through">₪{summaryStats.totalRawIncome.toLocaleString()}</span>
                <span className="text-destructive mr-2">(-₪{summaryStats.totalCommission.toFixed(0)})</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{getPeriodDisplayName()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מספר נסיעות</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalTrips}</div>
            <p className="text-xs text-muted-foreground">ממוצע ₪{summaryStats.avgIncomePerTrip.toFixed(0)} לנסיעה</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ימי עבודה</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalWorkDays}</div>
            <p className="text-xs text-muted-foreground">ממוצע ₪{summaryStats.avgIncomePerWorkDay.toFixed(0)} ליום</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משמרות</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.completedShifts}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.activeShifts > 0 && `+ ${summaryStats.activeShifts} פעילות`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      {Object.keys(summaryStats.paymentMethodBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              פירוט לפי אמצעי תשלום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summaryStats.paymentMethodBreakdown).map(([method, data]) => (
                <div key={method} className="flex justify-between items-center p-3 rounded-lg border bg-muted/30">
                  <div className="flex-1">
                    <span className="font-medium">{method}</span>
                    {data.commission > 0 && (
                      <div className="text-xs text-destructive mt-1">
                        עמלה: -₪{data.commission.toFixed(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-primary">₪{data.amount.toLocaleString()}</div>
                    {data.commission > 0 && (
                      <div className="text-xs text-muted-foreground line-through">
                        ₪{data.rawAmount.toLocaleString()}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">{data.count} נסיעות</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <Card>
        <CardHeader>
          <CardTitle>יצוא נתונים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              יצא את כל הנתונים עבור {getPeriodDisplayName()} לקובץ CSV
            </p>
            <Button 
              onClick={exportToCSV} 
              disabled={isExporting || filteredTrips.length === 0}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'מייצא...' : `יצא ${filteredTrips.length} נסיעות`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">מידע דיבוג</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-700">
            <div>סה"כ נסיעות במערכת: {trips.length}</div>
            <div>סה"כ ימי עבודה במערכת: {workDays.length}</div>
            <div>נסיעות מסוננות: {filteredTrips.length}</div>
            <div>ימי עבודה מסוננים: {filteredWorkDays.length}</div>
            <div>תקופה נבחרת: {selectedPeriod}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

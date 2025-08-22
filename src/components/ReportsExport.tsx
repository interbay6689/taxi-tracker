
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, TrendingUp, Car, Clock, DollarSign } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Trip, WorkDay } from "@/hooks/useDatabase";

interface ReportsExportProps {
  trips: Trip[];
  workDays: WorkDay[];
  selectedPeriod: 'today' | 'week' | 'month' | 'year' | 'custom';
  customDateRange?: { from: Date; to: Date };
}

export const ReportsExport: React.FC<ReportsExportProps> = ({
  trips = [],
  workDays = [],
  selectedPeriod,
  customDateRange
}) => {
  const [isExporting, setIsExporting] = useState(false);

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

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalIncome = filteredTrips.reduce((sum, trip) => sum + trip.amount, 0);
    const totalTrips = filteredTrips.length;
    const totalWorkDays = filteredWorkDays.length;
    const completedShifts = filteredWorkDays.filter(wd => !wd.is_active).length;
    const activeShifts = filteredWorkDays.filter(wd => wd.is_active).length;
    
    // Calculate average income per trip and per work day
    const avgIncomePerTrip = totalTrips > 0 ? totalIncome / totalTrips : 0;
    const avgIncomePerWorkDay = totalWorkDays > 0 ? totalIncome / totalWorkDays : 0;

    // Calculate payment method breakdown
    const paymentMethodBreakdown = filteredTrips.reduce((acc, trip) => {
      const method = trip.payment_method;
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count += 1;
      acc[method].amount += trip.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return {
      totalIncome,
      totalTrips,
      totalWorkDays,
      completedShifts,
      activeShifts,
      avgIncomePerTrip,
      avgIncomePerWorkDay,
      paymentMethodBreakdown
    };
  }, [filteredTrips, filteredWorkDays]);

  const exportToCSV = async () => {
    setIsExporting(true);
    
    try {
      // Create CSV content
      const csvContent = [
        // Header
        ['תאריך', 'שעה', 'סכום', 'אמצעי תשלום', 'תיוג', 'עיר התחלה', 'עיר סיום'].join(','),
        // Data rows
        ...filteredTrips.map(trip => [
          format(parseISO(trip.timestamp), 'dd/MM/yyyy', { locale: he }),
          format(parseISO(trip.timestamp), 'HH:mm', { locale: he }),
          trip.amount.toString(),
          trip.payment_method,
          trip.trip_status || '',
          trip.start_location_city || '',
          trip.end_location_city || ''
        ].join(','))
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות כוללות</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{summaryStats.totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{getPeriodDisplayName()}</p>
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
                <div key={method} className="flex justify-between items-center">
                  <span className="font-medium">{method}</span>
                  <div className="text-left">
                    <div className="font-bold">₪{data.amount.toLocaleString()}</div>
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

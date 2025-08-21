import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, TrendingUp } from "lucide-react";
import { Trip, WorkDay } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";

interface ReportsExportProps {
  trips: Trip[];
  workDays: WorkDay[];
}

export const ReportsExport = ({ trips, workDays }: ReportsExportProps) => {
  const [reportType, setReportType] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const { toast } = useToast();
  const { getPaymentMethodDetails } = useCustomPaymentTypes();

  const generateReport = () => {
    if (!reportType || !period) {
      toast({
        title: "שגיאה",
        description: "אנא בחר סוג דוח ותקופה",
        variant: "destructive"
      });
      return;
    }

    const filteredTrips = getFilteredTrips();
    const reportData = generateReportData(filteredTrips, reportType);
    downloadReport(reportData, reportType, period);
  };

  const getFilteredTrips = (): Trip[] => {
    const now = new Date();
    
    switch (period) {
      case "today":
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        return trips.filter(trip => {
          const tripDate = new Date(trip.timestamp);
          return tripDate >= today && tripDate < tomorrow;
        });
      
      case "week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // תחילת השבוע (יום ראשון)
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7); // סוף השבוע (מוצאי שבת 00:00)
        return trips.filter(trip => {
          const tripDate = new Date(trip.timestamp);
          return tripDate >= startOfWeek && tripDate < endOfWeek;
        });
      
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return trips.filter(trip => new Date(trip.timestamp) >= monthStart);
      
      case "year":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return trips.filter(trip => new Date(trip.timestamp) >= yearStart);
      
      default:
        return trips;
    }
  };

  const getFilteredWorkDays = (): WorkDay[] => {
    const now = new Date();
    
    switch (period) {
      case "today":
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        return workDays.filter(workDay => {
          const workDate = new Date(workDay.start_time);
          return workDate >= today && workDate < tomorrow;
        });
      
      case "week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return workDays.filter(workDay => {
          const workDate = new Date(workDay.start_time);
          return workDate >= startOfWeek && workDate < endOfWeek;
        });
      
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return workDays.filter(workDay => new Date(workDay.start_time) >= monthStart);
      
      case "year":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return workDays.filter(workDay => new Date(workDay.start_time) >= yearStart);
      
      default:
        return workDays;
    }
  };

  const generateReportData = (trips: Trip[], type: string) => {
    const totalIncome = trips.reduce((sum, trip) => {
      const details = getPaymentMethodDetails(trip.payment_method);
      return sum + (trip.amount * (1 - details.commissionRate));
    }, 0);
    const totalTrips = trips.length;
    const avgTripValue = totalTrips > 0 ? totalIncome / totalTrips : 0;

    // Header with BOM for proper Hebrew encoding
    const header = [
      `דוח נסיעות מונית - ${getPeriodText(period)}`,
      `תאריך יצירה: ${new Date().toLocaleDateString('he-IL')}`,
      "",
      "סיכום כללי:",
      `סה״כ הכנסות: ₪${totalIncome.toFixed(2)}`,
      `מספר נסיעות: ${totalTrips}`,
      `ממוצע לנסיעה: ₪${avgTripValue.toFixed(2)}`,
      "",
    ];

    if (type === "detailed") {
      const csvHeader = "תאריך,שעת התחלה,שעת סיום,תיוג תשלום,סכום נטו,סכום גולמי,עמלה";
      const csvRows = trips.map(trip => {
        const tripDate = new Date(trip.timestamp);
        const details = getPaymentMethodDetails(trip.payment_method);
        const grossAmount = trip.amount;
        const netAmount = grossAmount * (1 - details.commissionRate);
        const commission = grossAmount - netAmount;
        
        return [
          tripDate.toLocaleDateString('he-IL'),
          trip.trip_start_time ? new Date(trip.trip_start_time).toLocaleTimeString('he-IL') : tripDate.toLocaleTimeString('he-IL'),
          trip.trip_end_time ? new Date(trip.trip_end_time).toLocaleTimeString('he-IL') : "",
          details.displayName,
          netAmount.toFixed(2),
          grossAmount.toFixed(2),
          commission.toFixed(2)
        ].join(',');
      });

      return [
        ...header,
        csvHeader,
        ...csvRows
      ];
    }

    if (type === "summary") {
      const paymentBreakdown: Record<string, { count: number; total: number; commission: number }> = {};
      trips.forEach(trip => {
        const details = getPaymentMethodDetails(trip.payment_method);
        const key = details.displayName;
        if (!paymentBreakdown[key]) {
          paymentBreakdown[key] = { count: 0, total: 0, commission: 0 };
        }
        paymentBreakdown[key].count++;
        paymentBreakdown[key].total += trip.amount;
        paymentBreakdown[key].commission += trip.amount * details.commissionRate;
      });

      const breakdown = Object.entries(paymentBreakdown).map(([method, data]) => 
        `${method}: ₪${data.total.toFixed(2)} (${data.count} נסיעות, עמלה: ₪${data.commission.toFixed(2)})`
      );

      return [
        ...header,
        "פירוט לפי אמצעי תשלום:",
        ...breakdown,
      ];
    }

    // Default tax report
    const csvHeader = "תאריך,שעה,סכום,אמצעי תשלום";
    const csvRows = trips.map(trip => {
      const tripDate = new Date(trip.timestamp);
      const details = getPaymentMethodDetails(trip.payment_method);
      return [
        tripDate.toLocaleDateString('he-IL'),
        tripDate.toLocaleTimeString('he-IL'),
        trip.amount.toFixed(2),
        details.displayName
      ].join(',');
    });

    return [
      ...header,
      "דוח לרשויות המס:",
      csvHeader,
      ...csvRows
    ];
  };

  const downloadReport = (data: string[], type: string, period: string) => {
    const content = data.join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `דוח_נסיעות_${getReportTypeText(type)}_${getPeriodText(period)}_${new Date().toLocaleDateString('he-IL').replace(/\//g, '_')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "הצלחה",
      description: `הדוח הורד בהצלחה: ${fileName}`,
    });
  };

  const getPeriodText = (period: string) => {
    const texts = {
      'today': 'היום',
      'week': 'השבוע_הנוכחי',
      'month': 'חודש_נוכחי',
      'year': 'שנה_נוכחית',
      'all': 'כל_התקופות'
    };
    return texts[period] || period;
  };

  const getReportTypeText = (type: string) => {
    const texts = {
      'detailed': 'מפורט',
      'summary': 'סיכום',
      'tax': 'מס'
    };
    return texts[type] || type;
  };

  const filteredTrips = getFilteredTrips();
  const filteredWorkDays = getFilteredWorkDays();
  
  // חישובי תקופות נכונים
  const todayTrips = trips.filter(trip => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tripDate = new Date(trip.timestamp);
    return tripDate >= today && tripDate < tomorrow;
  });
  
  const weeklyTrips = trips.filter(trip => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // יום ראשון
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7); // מוצאי שבת 00:00
    const tripDate = new Date(trip.timestamp);
    return tripDate >= startOfWeek && tripDate < endOfWeek;
  });
  
  const monthlyTrips = trips.filter(trip => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return new Date(trip.timestamp) >= startOfMonth;
  });
  
  const todayIncome = todayTrips.reduce((sum, trip) => {
    const details = getPaymentMethodDetails(trip.payment_method);
    return sum + (trip.amount * (1 - details.commissionRate));
  }, 0);
  
  const weeklyIncome = weeklyTrips.reduce((sum, trip) => {
    const details = getPaymentMethodDetails(trip.payment_method);
    return sum + (trip.amount * (1 - details.commissionRate));
  }, 0);
  
  const monthlyIncome = monthlyTrips.reduce((sum, trip) => {
    const details = getPaymentMethodDetails(trip.payment_method);
    return sum + (trip.amount * (1 - details.commissionRate));
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ייצא דוחות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">סוג דוח</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג דוח" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detailed">דוח מפורט</SelectItem>
                <SelectItem value="summary">דוח סיכום</SelectItem>
                <SelectItem value="tax">דוח לרשויות המס</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">תקופה</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="בחר תקופה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">היום</SelectItem>
                <SelectItem value="week">השבוע הנוכחי (ראשון-שבת)</SelectItem>
                <SelectItem value="month">החודש הנוכחי</SelectItem>
                <SelectItem value="year">השנה הנוכחית</SelectItem>
                <SelectItem value="all">כל התקופות</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={generateReport} 
          disabled={!reportType || !period}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          הורד דוח ({filteredTrips.length} נסיעות)
        </Button>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {period === 'today' ? todayTrips.length : 
               period === 'week' ? weeklyTrips.length :
               period === 'month' ? monthlyTrips.length : filteredTrips.length}
            </div>
            <div className="text-sm text-muted-foreground">
              נסיעות {period === 'today' ? 'היום' : 
                      period === 'week' ? 'השבוע' :
                      period === 'month' ? 'החודש' : 'בתקופה'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              ₪{Math.round(period === 'today' ? todayIncome : 
                          period === 'week' ? weeklyIncome :
                          period === 'month' ? monthlyIncome : 
                          filteredTrips.reduce((sum, trip) => {
                            const details = getPaymentMethodDetails(trip.payment_method);
                            return sum + (trip.amount * (1 - details.commissionRate));
                          }, 0)).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              הכנסות {period === 'today' ? 'היום' : 
                      period === 'week' ? 'השבוع' :
                      period === 'month' ? 'החודש' : 'בתקופה'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">
              {filteredWorkDays.length}
            </div>
            <div className="text-sm text-muted-foreground">
              ימי עבודה {period === 'today' ? 'היום' : 
                        period === 'week' ? 'השבוע' :
                        period === 'month' ? 'החודש' : 'בתקופה'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">
              {filteredWorkDays.filter(workDay => workDay.end_time).length}
            </div>
            <div className="text-sm text-muted-foreground">
              משמרות הושלמו {period === 'today' ? 'היום' : 
                           period === 'week' ? 'השבוע' :
                           period === 'month' ? 'החודש' : 'בתקופה'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
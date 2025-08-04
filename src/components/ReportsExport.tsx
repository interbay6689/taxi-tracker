import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, TrendingUp } from "lucide-react";
import { Trip } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";

interface ReportsExportProps {
  trips: Trip[];
}

export const ReportsExport = ({ trips }: ReportsExportProps) => {
  const [reportType, setReportType] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const { toast } = useToast();

  const generateReport = () => {
    if (!reportType || !period) {
      toast({
        title: "שגיאה",
        description: "אנא בחר סוג דוח ותקופה",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    let filteredTrips: Trip[] = [];

    // סינון לפי תקופה
    switch (period) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredTrips = trips.filter(trip => new Date(trip.timestamp) >= weekAgo);
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredTrips = trips.filter(trip => new Date(trip.timestamp) >= monthAgo);
        break;
      case "year":
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filteredTrips = trips.filter(trip => new Date(trip.timestamp) >= yearAgo);
        break;
      default:
        filteredTrips = trips;
    }

    // יצירת הדוח
    const reportData = generateReportData(filteredTrips, reportType);
    downloadReport(reportData, reportType, period);
  };

  const generateReportData = (trips: Trip[], type: string) => {
    const totalIncome = trips.reduce((sum, trip) => sum + trip.amount, 0);
    const totalTrips = trips.length;
    const avgTripValue = totalTrips > 0 ? totalIncome / totalTrips : 0;

    const header = [
      "דוח נסיעות מונית",
      `תקופה: ${getPeriodText(period)}`,
      `תאריך יצירה: ${new Date().toLocaleDateString('he-IL')}`,
      "",
      "סיכום כללי:",
      `סה״כ הכנסות: ₪${totalIncome}`,
      `מספר נסיעות: ${totalTrips}`,
      `ממוצע לנסיעה: ₪${avgTripValue.toFixed(2)}`,
      "",
    ];

    if (type === "tax") {
      return [
        ...header,
        "דוח לרשויות המס:",
        "תאריך,שעה,סכום,אמצעי תשלום",
        ...trips.map(trip => 
          `${new Date(trip.timestamp).toLocaleDateString('he-IL')},${new Date(trip.timestamp).toLocaleTimeString('he-IL')},${trip.amount},${getPaymentMethodText(trip.payment_method)}`
        )
      ];
    }

    if (type === "detailed") {
      const paymentBreakdown = ['cash', 'card', 'app'].map(method => {
        const methodTrips = trips.filter(trip => trip.payment_method === method);
        const methodIncome = methodTrips.reduce((sum, trip) => sum + trip.amount, 0);
        return `${getPaymentMethodText(method)}: ₪${methodIncome} (${methodTrips.length} נסיעות)`;
      });

      return [
        ...header,
        "פירוט לפי אמצעי תשלום:",
        ...paymentBreakdown,
        "",
        "רשימת נסיעות:",
        "תאריך,שעה,סכום,אמצעי תשלום",
        ...trips.map(trip => 
          `${new Date(trip.timestamp).toLocaleDateString('he-IL')},${new Date(trip.timestamp).toLocaleTimeString('he-IL')},${trip.amount},${getPaymentMethodText(trip.payment_method)}`
        )
      ];
    }

    return header;
  };

  const downloadReport = (data: string[], type: string, period: string) => {
    const content = data.join('\n');
    // הוספת BOM (Byte Order Mark) לתמיכה נכונה בעברית באקסל
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `דוח_נסיעות_${type}_${period}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "הדוח נוצר בהצלחה!",
      description: "הקובץ הורד למכשיר שלך",
    });
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case "week": return "שבוע אחרון";
      case "month": return "חודש אחרון";
      case "year": return "שנה אחרונה";
      default: return "כל הנתונים";
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash": return "מזומן";
      case "card": return "כרטיס";
      case "app": return "אפליקציה";
      default: return method;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ייצוא דוחות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">סוג דוח</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג דוח" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">סיכום כללי</SelectItem>
                <SelectItem value="detailed">דוח מפורט</SelectItem>
                <SelectItem value="tax">דוח לרשויות מס</SelectItem>
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
                <SelectItem value="week">שבוע אחרון</SelectItem>
                <SelectItem value="month">חודש אחרון</SelectItem>
                <SelectItem value="year">שנה אחרונה</SelectItem>
                <SelectItem value="all">כל הנתונים</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={generateReport}
          className="w-full"
          disabled={!reportType || !period}
        >
          <Download className="mr-2 h-4 w-4" />
          הורד דוח
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">נסיעות השבוע</div>
              <div className="text-2xl font-bold">
                {trips.filter(trip => 
                  new Date(trip.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">הכנסות השבוע</div>
              <div className="text-2xl font-bold">
                ₪{trips
                  .filter(trip => 
                    new Date(trip.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  )
                  .reduce((sum, trip) => sum + trip.amount, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">סה״כ נסיעות</div>
              <div className="text-2xl font-bold">{trips.length}</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Trip } from "./TaxiDashboard";

interface ReportsExportProps {
  trips: Trip[];
}

export const ReportsExport = ({ trips }: ReportsExportProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const { toast } = useToast();

  const paymentMethods = ["all", "מזומן", "ביט", "אשראי", "GetTaxi"];

  const filterTripsByPeriod = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case "daily":
        return trips.filter(trip => trip.date === today.toDateString());
      case "weekly":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return trips.filter(trip => {
          const tripDate = new Date(trip.timestamp);
          return tripDate >= weekStart;
        });
      case "monthly":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return trips.filter(trip => {
          const tripDate = new Date(trip.timestamp);
          return tripDate >= monthStart;
        });
      default:
        return trips;
    }
  };

  const filterTripsByPaymentMethod = (filteredTrips: Trip[]) => {
    if (selectedPaymentMethod === "all") return filteredTrips;
    return filteredTrips.filter(trip => 
      (trip.paymentMethod || "מזומן") === selectedPaymentMethod
    );
  };

  const generateReport = () => {
    const periodTrips = filterTripsByPeriod(selectedPeriod);
    const finalTrips = filterTripsByPaymentMethod(periodTrips);

    const reportData = {
      period: selectedPeriod === "daily" ? "יומי" : selectedPeriod === "weekly" ? "שבועי" : "חודשי",
      paymentMethod: selectedPaymentMethod === "all" ? "כל אמצעי התשלום" : selectedPaymentMethod,
      totalTrips: finalTrips.length,
      totalAmount: finalTrips.reduce((sum, trip) => sum + trip.amount, 0),
      averageTrip: finalTrips.length > 0 ? finalTrips.reduce((sum, trip) => sum + trip.amount, 0) / finalTrips.length : 0,
      breakdown: getPaymentBreakdown(periodTrips),
      trips: finalTrips
    };

    return reportData;
  };

  const getPaymentBreakdown = (trips: Trip[]) => {
    const breakdown: Record<string, { count: number; total: number }> = {};
    
    trips.forEach(trip => {
      const method = trip.paymentMethod || "מזומן";
      if (!breakdown[method]) {
        breakdown[method] = { count: 0, total: 0 };
      }
      breakdown[method].count++;
      breakdown[method].total += trip.amount;
    });
    
    return breakdown;
  };

  const exportToCSV = () => {
    const report = generateReport();
    
    let csvContent = "תאריך,סכום,אמצעי תשלום,שעה\n";
    report.trips.forEach(trip => {
      const date = new Date(trip.timestamp).toLocaleDateString('he-IL');
      const time = new Date(trip.timestamp).toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      csvContent += `${date},${trip.amount},${trip.paymentMethod || "מזומן"},${time}\n`;
    });

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `דוח_${report.period}_${new Date().toLocaleDateString('he-IL')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "דוח יוצא",
      description: `דוח ${report.period} נוצר בהצלחה`,
    });
  };

  const report = generateReport();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            ייצוא דוחות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">תקופה</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">יומי</SelectItem>
                  <SelectItem value="weekly">שבועי</SelectItem>
                  <SelectItem value="monthly">חודשי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">אמצעי תשלום</label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  {paymentMethods.slice(1).map(method => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Report Summary */}
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">סה"כ נסיעות:</span>
              <span className="font-semibold">{report.totalTrips}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">סה"כ הכנסות:</span>
              <span className="font-semibold text-primary">₪{report.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">ממוצע לנסיעה:</span>
              <span className="font-semibold">₪{Math.round(report.averageTrip)}</span>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          {Object.entries(report.breakdown).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">פירוט לפי אמצעי תשלום:</h4>
              <div className="space-y-1">
                {Object.entries(report.breakdown).map(([method, data]) => (
                  <div key={method} className="flex justify-between text-sm">
                    <span>{method}:</span>
                    <span>{data.count} נסיעות, ₪{data.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={exportToCSV}
            className="w-full h-10 touch-manipulation"
            disabled={report.totalTrips === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            ייצא ל-CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
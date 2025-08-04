import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Clock, MapPin } from "lucide-react";
import { Trip } from "../TaxiDashboard";

interface AnalyticsTabProps {
  trips: Trip[];
}

export const AnalyticsTab = ({ trips }: AnalyticsTabProps) => {
  const today = new Date();
  const todayStr = today.toDateString();
  
  // חישוב סטטיסטיקות
  const todayTrips = trips.filter(trip => trip.date === todayStr);
  const weekTrips = trips.filter(trip => {
    const tripDate = new Date(trip.timestamp);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return tripDate >= weekAgo;
  });
  
  const monthTrips = trips.filter(trip => {
    const tripDate = new Date(trip.timestamp);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return tripDate >= monthAgo;
  });

  const todayIncome = todayTrips.reduce((sum, trip) => sum + trip.amount, 0);
  const weekIncome = weekTrips.reduce((sum, trip) => sum + trip.amount, 0);
  const monthIncome = monthTrips.reduce((sum, trip) => sum + trip.amount, 0);

  const avgPerTrip = todayTrips.length > 0 ? todayIncome / todayTrips.length : 0;
  const avgPerDay = weekTrips.length > 0 ? weekIncome / 7 : 0;
  const avgPerWeek = monthTrips.length > 0 ? monthIncome / 4 : 0;

  // ניתוח לפי אמצעי תשלום
  const paymentMethods = ['מזומן', 'ביט', 'אשראי', 'GetTaxi'];
  const paymentStats = paymentMethods.map(method => ({
    method,
    amount: todayTrips
      .filter(trip => trip.paymentMethod === method)
      .reduce((sum, trip) => sum + trip.amount, 0),
    count: todayTrips.filter(trip => trip.paymentMethod === method).length
  }));

  // ניתוח שעות פעילות
  const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
    const hourTrips = todayTrips.filter(trip => {
      const tripHour = new Date(trip.timestamp).getHours();
      return tripHour === hour;
    });
    return {
      hour,
      trips: hourTrips.length,
      income: hourTrips.reduce((sum, trip) => sum + trip.amount, 0)
    };
  }).filter(stat => stat.trips > 0);

  const bestHour = hourlyStats.reduce((best, current) => 
    current.income > best.income ? current : best, 
    { hour: 0, income: 0, trips: 0 }
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ממוצעים */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            ממוצעים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="text-xs text-muted-foreground">ממוצע לנסיעה</div>
              <div className="text-lg font-bold text-primary">₪{avgPerTrip.toFixed(0)}</div>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="text-xs text-muted-foreground">ממוצע יומי</div>
              <div className="text-lg font-bold text-primary">₪{avgPerDay.toFixed(0)}</div>
            </div>
          </div>
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="text-xs text-muted-foreground">ממוצע שבועי</div>
            <div className="text-lg font-bold text-primary">₪{avgPerWeek.toFixed(0)}</div>
          </div>
        </CardContent>
      </Card>

      {/* ניתוח אמצעי תשלום */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            פירוק לפי אמצעי תשלום - היום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {paymentStats
              .filter(stat => stat.count > 0)
              .sort((a, b) => b.amount - a.amount)
              .map(stat => (
              <div key={stat.method} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">{stat.method}</div>
                  <div className="text-xs text-muted-foreground">{stat.count} נסיעות</div>
                </div>
                <div className="text-lg font-bold">₪{stat.amount}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ניתוח שעות */}
      {bestHour.income > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              ניתוח שעות פעילות - היום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="text-sm text-muted-foreground">השעה הכי רווחית היום:</div>
              <div className="text-lg font-bold text-primary">
                {bestHour.hour}:00 - ₪{bestHour.income} ({bestHour.trips} נסיעות)
              </div>
            </div>
            
            <div className="mt-3 space-y-1">
              <div className="text-sm font-medium mb-2">פעילות לפי שעות:</div>
              {hourlyStats
                .sort((a, b) => b.income - a.income)
                .slice(0, 5)
                .map(stat => (
                <div key={stat.hour} className="flex justify-between text-sm">
                  <span>{stat.hour}:00</span>
                  <span>₪{stat.income} ({stat.trips})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* סיכום תקופתי */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">סיכום תקופתי</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted rounded">
              <div className="text-xs text-muted-foreground">היום</div>
              <div className="font-bold">₪{todayIncome}</div>
              <div className="text-xs">{todayTrips.length} נסיעות</div>
            </div>
            <div className="p-2 bg-muted rounded">
              <div className="text-xs text-muted-foreground">השבוע</div>
              <div className="font-bold">₪{weekIncome}</div>
              <div className="text-xs">{weekTrips.length} נסיעות</div>
            </div>
            <div className="p-2 bg-muted rounded">
              <div className="text-xs text-muted-foreground">החודש</div>
              <div className="font-bold">₪{monthIncome}</div>
              <div className="text-xs">{monthTrips.length} נסיעות</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
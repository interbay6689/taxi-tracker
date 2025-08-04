import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, MapPin, Target, BarChart3 } from "lucide-react";
import { Trip } from "@/hooks/useDatabase";

interface AnalyticsTabProps {
  trips: Trip[];
}

export const AnalyticsTab = ({ trips }: AnalyticsTabProps) => {
  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayTrips = trips.filter(trip => new Date(trip.timestamp) >= today);
    const weekTrips = trips.filter(trip => new Date(trip.timestamp) >= weekAgo);
    const monthTrips = trips.filter(trip => new Date(trip.timestamp) >= monthAgo);

    const todayIncome = todayTrips.reduce((sum, trip) => sum + trip.amount, 0);
    const weekIncome = weekTrips.reduce((sum, trip) => sum + trip.amount, 0);
    const monthIncome = monthTrips.reduce((sum, trip) => sum + trip.amount, 0);

    const avgTripValue = todayTrips.length > 0 ? todayIncome / todayTrips.length : 0;
    const avgDailyIncome = weekTrips.length > 0 ? weekIncome / 7 : 0;
    const avgWeeklyIncome = monthTrips.length > 0 ? monthIncome / 4 : 0;

    // ניתוח תשלומים
    const paymentStats = ['cash', 'card', 'app'].map(method => {
      const methodTrips = todayTrips.filter(trip => trip.payment_method === method);
      return {
        method: method === 'cash' ? 'מזומן' : method === 'card' ? 'כרטיס' : 'אפליקציה',
        income: methodTrips.reduce((sum, trip) => sum + trip.amount, 0),
        count: methodTrips.length
      };
    });

    // ניתוח שעות
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
      const hourTrips = todayTrips.filter(trip => 
        new Date(trip.timestamp).getHours() === hour
      );
      return {
        hour,
        trips: hourTrips.length,
        income: hourTrips.reduce((sum, trip) => sum + trip.amount, 0)
      };
    });

    const bestHour = hourlyStats.reduce((best, current) => 
      current.income > best.income ? current : best, 
      { hour: 0, income: 0, trips: 0 }
    );

    return {
      todayIncome,
      weekIncome,
      monthIncome,
      avgTripValue,
      avgDailyIncome,
      avgWeeklyIncome,
      paymentStats,
      hourlyStats,
      bestHour,
      todayTrips: todayTrips.length,
      weekTrips: weekTrips.length,
      monthTrips: monthTrips.length
    };
  }, [trips]);

  return (
    <div className="space-y-6">
      {/* ממוצעים */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממוצע לנסיעה</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{analytics.avgTripValue.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממוצע יומי</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{analytics.avgDailyIncome.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממוצע שבועי</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{analytics.avgWeeklyIncome.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* ניתוח תשלומים */}
      <Card>
        <CardHeader>
          <CardTitle>התפלגות תשלומים היום</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.paymentStats.map((stat) => (
              <div key={stat.method} className="flex justify-between items-center">
                <span className="font-medium">{stat.method}</span>
                <div className="text-right">
                  <div className="font-bold">₪{stat.income}</div>
                  <div className="text-sm text-muted-foreground">{stat.count} נסיעות</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* השעה הטובה ביותר */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            השעה הרווחית ביותר היום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {analytics.bestHour.hour.toString().padStart(2, '0')}:00
            </div>
            <div className="text-lg text-muted-foreground">
              ₪{analytics.bestHour.income} ({analytics.bestHour.trips} נסיעות)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* סיכום תקופות */}
      <Card>
        <CardHeader>
          <CardTitle>סיכום תקופות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">היום</div>
              <div className="text-2xl font-bold text-primary">₪{analytics.todayIncome}</div>
              <div className="text-sm text-muted-foreground">{analytics.todayTrips} נסיעות</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">השבוע</div>
              <div className="text-2xl font-bold text-primary">₪{analytics.weekIncome}</div>
              <div className="text-sm text-muted-foreground">{analytics.weekTrips} נסיעות</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">החודש</div>
              <div className="text-2xl font-bold text-primary">₪{analytics.monthIncome}</div>
              <div className="text-sm text-muted-foreground">{analytics.monthTrips} נסיעות</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
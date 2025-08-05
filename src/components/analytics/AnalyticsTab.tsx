import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, MapPin, Target, BarChart3, Tag, Zap } from "lucide-react";
import { Trip } from "@/hooks/useDatabase";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";

interface AnalyticsTabProps {
  trips: Trip[];
}

export const AnalyticsTab = ({ trips }: AnalyticsTabProps) => {
  const { getPaymentMethodDetails, allPaymentOptions } = useCustomPaymentTypes();
  
  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayTrips = trips.filter(trip => new Date(trip.timestamp) >= today);
    const weekTrips = trips.filter(trip => new Date(trip.timestamp) >= weekAgo);
    const monthTrips = trips.filter(trip => new Date(trip.timestamp) >= monthAgo);

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

    // ניתוח תשלומים מתקדם - כולל כל התיוגים
    const paymentStats = allPaymentOptions.map(option => {
      const methodTrips = todayTrips.filter(trip => trip.payment_method === option.value);
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

    // ניתוח שעות
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
      const hourTrips = todayTrips.filter(trip => 
        new Date(trip.timestamp).getHours() === hour
      );
      const income = hourTrips.reduce((sum, trip) => {
        const paymentDetails = getPaymentMethodDetails(trip.payment_method);
        return sum + (trip.amount * (1 - paymentDetails.commissionRate));
      }, 0);
      return {
        hour,
        trips: hourTrips.length,
        income
      };
    });

    const bestHour = hourlyStats.reduce((best, current) => 
      current.income > best.income ? current : best, 
      { hour: 0, income: 0, trips: 0 }
    );

    // פיצ'ר חדש: נתונים מתקדמים
    const avgTripValueToday = todayTrips.length > 0 ? todayIncome / todayTrips.length : 0;
    const totalCommissionLost = todayTrips.reduce((sum, trip) => {
      const paymentDetails = getPaymentMethodDetails(trip.payment_method);
      return sum + (trip.amount * paymentDetails.commissionRate);
    }, 0);
    
    const busyHours = hourlyStats.filter(h => h.trips > 0).length;
    const efficiency = todayTrips.length > 0 ? (todayIncome / todayTrips.length) : 0;

    return {
      todayIncome,
      weekIncome,
      monthIncome,
      avgTripValueToday,
      totalCommissionLost,
      busyHours,
      efficiency,
      paymentStats,
      hourlyStats,
      bestHour,
      todayTrips: todayTrips.length,
      weekTrips: weekTrips.length,
      monthTrips: monthTrips.length
    };
  }, [trips, getPaymentMethodDetails, allPaymentOptions]);

  return (
    <div className="space-y-6">
      {/* נתונים מתקדמים */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממוצע לנסיעה היום</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{analytics.avgTripValueToday.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">עמלות שנגזרו</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₪{analytics.totalCommissionLost.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שעות פעילות</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.busyHours}</div>
            <div className="text-xs text-muted-foreground">מתוך 24 שעות</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">יעילות</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{analytics.efficiency.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">לנסיעה נטו</div>
          </CardContent>
        </Card>
      </div>

      {/* ניתוח תיוגי תשלומים */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            התפלגות תיוגי תשלומים היום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.paymentStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">אין נסיעות היום</p>
            ) : (
              analytics.paymentStats.map((stat, index) => (
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
              ))
            )}
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
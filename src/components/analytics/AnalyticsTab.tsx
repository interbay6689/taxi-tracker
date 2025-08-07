import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Import only the icons still used in this component. Icons for the removed
// metrics (average per trip, commissions, busy hours, efficiency, best hour)
// have been removed from the imports.
import { Tag } from "lucide-react";
import { Trip } from "@/hooks/useDatabase";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";

interface AnalyticsTabProps {
  trips: Trip[];
}

export const AnalyticsTab = ({ trips }: AnalyticsTabProps) => {
  const { getPaymentMethodDetails, allPaymentOptions } = useCustomPaymentTypes();
  
  const analytics = useMemo(() => {
    const now = new Date();
    
    // תיקון חישוב תקופות
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // שבוע - מתחילת השבוע (יום ראשון)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    // חודש - מתחילת החודש
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayTrips = trips.filter(trip => {
      const tripDate = new Date(trip.timestamp);
      return tripDate >= today && tripDate < tomorrow;
    });
    
    const weekTrips = trips.filter(trip => {
      const tripDate = new Date(trip.timestamp);
      return tripDate >= startOfWeek;
    });
    
    const monthTrips = trips.filter(trip => {
      const tripDate = new Date(trip.timestamp);
      return tripDate >= startOfMonth;
    });

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

    return {
      todayIncome,
      weekIncome,
      monthIncome,
      paymentStats,
      todayTrips: todayTrips.length,
      weekTrips: weekTrips.length,
      monthTrips: monthTrips.length
    };
  }, [trips, getPaymentMethodDetails, allPaymentOptions]);

  return (
    <div className="space-y-6">
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



      {/* סיכום תקופות */}
      <Card>
        <CardHeader>
          <CardTitle>סיכום תקופות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">היום</div>
              <div className="text-2xl font-bold text-primary">₪{Math.round(analytics.todayIncome).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{analytics.todayTrips} נסיעות</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">השבוע הנוכחי</div>
              <div className="text-2xl font-bold text-primary">₪{Math.round(analytics.weekIncome).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{analytics.weekTrips} נסיעות</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">החודש הנוכחי</div>
              <div className="text-2xl font-bold text-primary">₪{Math.round(analytics.monthIncome).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{analytics.monthTrips} נסיעות</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
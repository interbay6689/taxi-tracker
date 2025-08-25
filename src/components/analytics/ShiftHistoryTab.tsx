import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { Trip, WorkDay } from "@/hooks/useDatabase";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";

interface ShiftHistoryTabProps {
  trips: Trip[];
  workDays: WorkDay[];
}

interface ShiftSummary {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  tripsCount: number;
  totalIncome: number;
  netIncome: number;
  isActive: boolean;
  trips: Trip[];
}

export const ShiftHistoryTab = ({ trips, workDays }: ShiftHistoryTabProps) => {
  const { getPaymentMethodDetails } = useCustomPaymentTypes();
  
  const shiftSummaries = useMemo(() => {
    const summaries: ShiftSummary[] = [];
    
    workDays.forEach(workDay => {
      const startTime = new Date(workDay.start_time);
      const endTime = workDay.end_time ? new Date(workDay.end_time) : null;
      
      // Filter trips for this specific shift
      const shiftTrips = trips.filter(trip => {
        const tripTime = new Date(trip.timestamp);
        const isAfterStart = tripTime >= startTime;
        const isBeforeEnd = !endTime || tripTime <= endTime;
        return isAfterStart && isBeforeEnd;
      });
      
      // Calculate income metrics
      const totals = shiftTrips.reduce(
        (acc, trip) => {
          const paymentDetails = getPaymentMethodDetails(trip.payment_method);
          const netAmount = trip.amount * (1 - paymentDetails.commissionRate);
          acc.gross += trip.amount;
          acc.net += netAmount;
          return acc;
        },
        { gross: 0, net: 0 }
      );
      
      // Calculate duration
      const duration = endTime 
        ? (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) // hours
        : (new Date().getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      summaries.push({
        id: workDay.id,
        startTime,
        endTime,
        duration,
        tripsCount: shiftTrips.length,
        totalIncome: totals.gross,
        netIncome: totals.net,
        isActive: workDay.is_active,
        trips: shiftTrips
      });
    });
    
    // Sort by start time, newest first
    return summaries.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [trips, workDays, getPaymentMethodDetails]);
  
  const totalStats = useMemo(() => {
    const completedShifts = shiftSummaries.filter(shift => !shift.isActive);
    
    const totalGrossIncome = completedShifts.reduce((sum, shift) => sum + shift.totalIncome, 0);
    const totalNetIncome = completedShifts.reduce((sum, shift) => sum + shift.netIncome, 0);
    const totalTrips = completedShifts.reduce((sum, shift) => sum + shift.tripsCount, 0);
    const totalDuration = completedShifts.reduce((sum, shift) => sum + shift.duration, 0);
    
    const avgIncomePerShift = completedShifts.length > 0 ? totalNetIncome / completedShifts.length : 0;
    const avgTripsPerShift = completedShifts.length > 0 ? totalTrips / completedShifts.length : 0;
    const avgIncomePerHour = totalDuration > 0 ? totalNetIncome / totalDuration : 0;
    
    return {
      totalGrossIncome,
      totalNetIncome,
      totalTrips,
      totalShifts: completedShifts.length,
      avgIncomePerShift,
      avgTripsPerShift,
      avgIncomePerHour
    };
  }, [shiftSummaries]);

  return (
    <div className="space-y-6">
      {/* סיכום כללי */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            סיכום משמרות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">הכנסה בפועל</div>
              <div className="text-xl font-bold text-primary">₪{totalStats.totalNetIncome.toLocaleString()}</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">סה"כ נסיעות</div>
              <div className="text-xl font-bold text-primary">{totalStats.totalTrips}</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">ממוצע למשמרת</div>
              <div className="text-xl font-bold text-primary">₪{totalStats.avgIncomePerShift.toFixed(0)}</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">ממוצע לשעה</div>
              <div className="text-xl font-bold text-primary">₪{totalStats.avgIncomePerHour.toFixed(0)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* רשימת משמרות */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            היסטוריית משמרות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shiftSummaries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">אין נתונים זמינים</p>
            ) : (
              shiftSummaries.map((shift) => (
                <div
                  key={shift.id}
                  className={`p-4 rounded-lg border ${
                    shift.isActive 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-muted/30 border-muted'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {shift.startTime.toLocaleDateString('he-IL')}
                        </span>
                        {shift.isActive && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            פעיל
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {shift.startTime.toLocaleTimeString('he-IL')} - {
                            shift.endTime 
                              ? shift.endTime.toLocaleTimeString('he-IL')
                              : 'ממשיך'
                          }
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({shift.duration.toFixed(1)} שעות)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">₪{shift.netIncome.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{shift.tripsCount} נסיעות</div>
                    </div>
                  </div>
                  
                  {/* פירוט נסיעות המשמרת */}
                  {shift.trips.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-muted">
                      <div className="text-sm font-medium mb-2">פירוט נסיעות:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {shift.trips.map((trip) => {
                          const paymentDetails = getPaymentMethodDetails(trip.payment_method);
                          return (
                            <div key={trip.id} className="text-xs bg-background/50 p-2 rounded">
                              <div className="flex justify-between">
                                <span>₪{trip.amount.toLocaleString()}</span>
                                <span className="text-muted-foreground">
                                  {new Date(trip.timestamp).toLocaleTimeString('he-IL')}
                                </span>
                              </div>
                              <div className="text-muted-foreground">
                                {paymentDetails.displayName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* נתונים נוספים */}
                  <div className="mt-3 pt-3 border-t border-muted flex justify-between text-sm text-muted-foreground">
                    <span>ממוצע לנסיעה: ₪{shift.tripsCount > 0 ? (shift.netIncome / shift.tripsCount).toFixed(0) : '0'}</span>
                    <span>ממוצע לשעה: ₪{shift.duration > 0 ? (shift.netIncome / shift.duration).toFixed(0) : '0'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
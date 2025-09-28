import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle2, CircleSlash, Car, Clock, Edit3, Fuel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Trip } from '@/hooks/database/types';
import { QuickGetButton } from './QuickGetButton';

interface UnifiedDashboardProps {
  currentWorkDay: any;
  shiftTrips: Trip[];
  shiftIncomeGross: number;
  shiftTripsCount: number;
  totalIncomeToday: number;
  totalTripsToday: number;
  dailyGoals: { income_goal: number; trips_goal: number };
  onAddTrip: (amount: number, paymentMethod: string, tag?: string) => void;
  onStartShift: () => void;
  onEndShift: () => void;
  onPauseShift: () => void;
  tripsToday: Trip[];
  loading?: boolean;
  onEditTrips?: () => void;
  onAddFuel?: () => void;
  shiftExpenses?: any[];
}

export const UnifiedDashboard = ({
  currentWorkDay,
  shiftTrips,
  shiftIncomeGross,
  shiftTripsCount,
  totalIncomeToday,
  totalTripsToday,
  dailyGoals,
  onAddTrip,
  onStartShift,
  onEndShift,
  onPauseShift,
  tripsToday = [],
  loading = false,
  onEditTrips,
  onAddFuel,
  shiftExpenses = []
}: UnifiedDashboardProps) => {
  const { toast } = useToast();
  
  // התקדמות יעדים
  const incomeProgress = Math.min((shiftIncomeGross / dailyGoals.income_goal) * 100, 100);
  const tripsProgress = Math.min((shiftTripsCount / dailyGoals.trips_goal) * 100, 100);
  
  // חישוב סה"כ הוצאות דלק במשמרת
  const shiftFuelExpenses = React.useMemo(() => {
    return shiftExpenses.reduce((total, expense) => total + expense.amount, 0);
  }, [shiftExpenses]);
  
  // הכנסה נטו (אחרי הוצאות דלק)
  const shiftIncomeNet = shiftIncomeGross - shiftFuelExpenses;

  if (!currentWorkDay) {
    return (
      <div className="space-y-6">
        {/* סיכום יומי ללא משמרת */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">₪{totalIncomeToday.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">הכנסות היום</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">{totalTripsToday}</div>
                <div className="text-sm text-muted-foreground">נסיעות היום</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* התחלת משמרת */}
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Car className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">התחל משמרת חדשה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              כדי להתחיל לרשום נסיעות, תחילה צריך להתחיל משמרת
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                זמן התחלה יירשם אוטומטית
              </div>
            </div>

            <Button 
              onClick={onStartShift}
              size="lg"
              className="w-full h-16 text-xl bg-gradient-to-r from-primary to-blue-500"
              disabled={loading}
            >
              <Play className="mr-3 h-6 w-6" />
              {loading ? 'מתחיל משמרת...' : 'התחל משמרת'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* סיכום משמרת ויעדים */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 text-center mb-6">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">₪{shiftIncomeGross.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mb-3">הכנסות משמרת</div>
              {shiftFuelExpenses > 0 && (
                <div className="text-sm text-red-600 mb-2">
                  דלק: -₪{shiftFuelExpenses.toLocaleString()}
                </div>
              )}
              <div className="progress-bar h-3">
                <div 
                  className="progress-fill"
                  style={{ width: `${incomeProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                יעד: ₪{dailyGoals.income_goal.toLocaleString()}
              </div>
              {shiftFuelExpenses > 0 && (
                <div className="text-xs font-medium text-secondary-foreground mt-1">
                  נטו: ₪{shiftIncomeNet.toLocaleString()}
                </div>
              )}
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">{shiftTripsCount}</div>
              <div className="text-sm text-muted-foreground mb-3">נסיעות משמרת</div>
              <div className="progress-bar h-3">
                <div 
                  className="progress-fill"
                  style={{ width: `${tripsProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                יעד: {dailyGoals.trips_goal} נסיעות
              </div>
            </div>
          </div>

          {/* פעולות משמרת */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button onClick={onPauseShift} variant="secondary">
              <CircleSlash className="mr-2 h-4 w-4" />
              השהה
            </Button>
            <Button onClick={onEndShift} variant="destructive">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              סיים משמרת
            </Button>
          </div>
          
          {/* פעולות נוספות */}
          <div className="grid grid-cols-2 gap-3">
            {onEditTrips && (
              <Button onClick={onEditTrips} variant="outline" size="sm">
                <Edit3 className="mr-2 h-4 w-4" />
                ערוך נסיעות
              </Button>
            )}
            {onAddFuel && (
              <Button onClick={onAddFuel} variant="outline" size="sm">
                <Fuel className="mr-2 h-4 w-4" />
                הוסף דלק
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* כפתור GET מרכזי */}
      <Card>
        <CardContent className="p-6">
          <QuickGetButton onAddTrip={onAddTrip} disabled={loading} />
        </CardContent>
      </Card>

      {/* יעדים ונתונים מהירים */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ממוצע לנסיעה:</span>
              <Badge variant="secondary">
                ₪{shiftTripsCount > 0 ? Math.round(shiftIncomeGross / shiftTripsCount) : 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">יעדים הושגו:</span>
              <div className="flex gap-1">
                <Badge variant={incomeProgress >= 100 ? "default" : "secondary"}>
                  הכנסות {Math.round(incomeProgress)}%
                </Badge>
                <Badge variant={tripsProgress >= 100 ? "default" : "secondary"}>
                  נסיעות {Math.round(tripsProgress)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
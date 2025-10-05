import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle2, CircleSlash, Car, Clock, Edit3, Fuel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Trip } from '@/hooks/database/types';
import { QuickTripButtons } from './QuickTripButtons';
import { QuickStatsBar } from './dashboard/QuickStatsBar';
import { ProgressRing } from './dashboard/ProgressRing';
import { EmptyState } from './ui/empty-state';

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
        <QuickStatsBar
          dailyIncome={totalIncomeToday}
          dailyTrips={totalTripsToday}
          avgPerTrip={totalTripsToday > 0 ? totalIncomeToday / totalTripsToday : 0}
        />

        <EmptyState
          icon={Car}
          title="התחל משמרת חדשה"
          description="כדי להתחיל לרשום נסיעות, תחילה צריך להתחיל משמרת. זמן ההתחלה יירשם אוטומטית."
          actionLabel={loading ? 'מתחיל משמרת...' : 'התחל משמרת'}
          onAction={onStartShift}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuickStatsBar
        dailyIncome={shiftIncomeGross}
        dailyTrips={shiftTripsCount}
        avgPerTrip={shiftTripsCount > 0 ? shiftIncomeGross / shiftTripsCount : 0}
      />

      {/* סיכום משמרת ויעדים */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center mb-6">
            <ProgressRing
              value={shiftIncomeGross}
              max={dailyGoals.income_goal}
              label="₪"
              className="mx-auto"
            />
            <ProgressRing
              value={shiftTripsCount}
              max={dailyGoals.trips_goal}
              label=""
              className="mx-auto"
            />
          </div>
          <div className="grid grid-cols-2 gap-6 text-center mb-6 hidden">
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

      {/* כפתורי נסיעות מהירות */}
      <Card>
        <CardContent className="p-6">
          <QuickTripButtons 
            onAddTrip={onAddTrip} 
            disabled={loading} 
            tripsToday={tripsToday}
          />
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
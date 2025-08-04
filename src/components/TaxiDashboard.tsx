import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, Target, TrendingUp, DollarSign } from "lucide-react";
import { AddTripDialog } from "./AddTripDialog";
import { DailySummaryCard } from "./DailySummaryCard";
import { ProgressBar } from "./ProgressBar";
import { TripsList } from "./TripsList";
import { SettingsDialog } from "./SettingsDialog";
import { TripTimer } from "./TripTimer";
import { QuickAmounts } from "./QuickAmounts";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage, cleanupOldData } from "@/hooks/useLocalStorage";
import { useMemo } from "react";

export interface Trip {
  id: string;
  amount: number;
  timestamp: Date;
  date: string;
  paymentMethod: string;
}

export interface DailyGoals {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface DailyExpenses {
  fixedDaily: number;
  fuel: number;
}

export const TaxiDashboard = () => {
  const [trips, setTrips] = useLocalStorage<Trip[]>('taxi-trips', []);
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [goals, setGoals] = useLocalStorage<DailyGoals>('taxi-goals', {
    daily: 909,
    weekly: 4545,
    monthly: 20000
  });
  const [expenses, setExpenses] = useLocalStorage<DailyExpenses>('taxi-expenses', {
    fixedDaily: 260,
    fuel: 150
  });
  const { toast } = useToast();

  // Clean up old data on component mount
  useEffect(() => {
    cleanupOldData();
  }, []);

  // קאשינג חישובים יומיים לביצועים
  const dailyStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayTrips = trips.filter(trip => trip.date === today);
    const todayIncome = todayTrips.reduce((sum, trip) => sum + trip.amount, 0);
    const todayExpenses = expenses.fixedDaily + expenses.fuel;
    const todayNet = todayIncome - todayExpenses;
    const remainingToGoal = Math.max(0, goals.daily - todayIncome);
    const goalProgress = Math.min(100, (todayIncome / goals.daily) * 100);
    
    return {
      today,
      todayTrips,
      todayIncome,
      todayExpenses,
      todayNet,
      remainingToGoal,
      goalProgress
    };
  }, [trips, expenses, goals]);

  const addTrip = (amount: number, paymentMethod: string = "מזומן") => {
    const newTrip: Trip = {
      id: Date.now().toString(),
      amount,
      timestamp: new Date(),
      date: dailyStats.today,
      paymentMethod
    };
    setTrips(prev => [newTrip, ...prev]);
    setIsAddTripOpen(false);
    
    // Check if goal is reached
    const newTotalIncome = dailyStats.todayIncome + amount;
    if (newTotalIncome >= goals.daily) {
      toast({
        title: "יעד יומי הושג! 🎉",
        description: `הכנסת ₪${newTotalIncome} היום`,
      });
    }
  };

  const handleQuickAmount = (amount: number) => {
    setIsAddTripOpen(true);
    // הוספת לוגיקה להכנסת סכום מהיר
  };

  const handleTripComplete = (duration: number, distance?: number) => {
    // פתיחת דיאלוג הוספת נסיעה עם פרטי הזמן
    setIsAddTripOpen(true);
    toast({
      title: "נסיעה הושלמה",
      description: `משך זמן: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}${distance ? `, מרחק: ${distance.toFixed(1)} ק"מ` : ''}`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-3 rtl">
      <div className="w-full max-w-sm mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-2">
          <h1 className="text-xl font-bold text-foreground">מונית פרו</h1>
          <p className="text-sm text-muted-foreground">מעקב הכנסות יומי</p>
        </div>

        {/* Daily Progress */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              יעד יומי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary animate-scale-in">
                  ₪{dailyStats.todayIncome.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  מתוך ₪{goals.daily.toLocaleString()}
                </span>
              </div>
              <ProgressBar progress={dailyStats.goalProgress} />
              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  נותר: ₪{dailyStats.remainingToGoal.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Timer */}
        <TripTimer onTripComplete={handleTripComplete} />

        {/* Quick Amounts */}
        <QuickAmounts onSelectAmount={handleQuickAmount} />

        {/* Add Trip Button */}
        <Button
          onClick={() => setIsAddTripOpen(true)}
          size="lg"
          className="w-full h-20 text-lg font-semibold bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-lg touch-manipulation hover-scale"
        >
          <Plus className="mr-2 h-7 w-7" />
          הוספת נסיעה
        </Button>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <DailySummaryCard
            title="הכנסות היום"
            value={dailyStats.todayIncome}
            icon={DollarSign}
            variant="income"
          />
          <DailySummaryCard
            title="רווח נקי"
            value={dailyStats.todayNet}
            icon={TrendingUp}
            variant={dailyStats.todayNet >= 0 ? "profit" : "loss"}
          />
        </div>

        {/* Today's Trips */}
        <TripsList trips={dailyStats.todayTrips} />

        {/* Settings Button */}
        <Button
          variant="outline"
          className="w-full touch-manipulation hover-scale"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="mr-2 h-4 w-4" />
          הגדרות
        </Button>

        {/* Add Trip Dialog */}
        <AddTripDialog
          isOpen={isAddTripOpen}
          onClose={() => setIsAddTripOpen(false)}
          onAddTrip={addTrip}
        />

        {/* Settings Dialog */}
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          goals={goals}
          expenses={expenses}
          trips={trips}
          onUpdateGoals={setGoals}
          onUpdateExpenses={setExpenses}
          onUpdateTrips={setTrips}
        />
      </div>
    </div>
  );
};
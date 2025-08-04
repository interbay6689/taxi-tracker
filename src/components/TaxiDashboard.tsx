import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, Target, TrendingUp, DollarSign, Moon, Sun, Edit, LogOut } from "lucide-react";
import { AddTripDialog } from "./AddTripDialog";
import { DailySummaryCard } from "./DailySummaryCard";
import { ProgressBar } from "./ProgressBar";
import { TripsList } from "./TripsList";
import { SettingsDialog } from "./SettingsDialog";
import { TripTimer } from "./TripTimer";
import { QuickAmounts } from "./QuickAmounts";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage, cleanupOldData } from "@/hooks/useLocalStorage";
import { useLocation } from "@/hooks/useLocation";
import { useTheme } from "next-themes";
import { useMemo } from "react";

export interface Trip {
  id: string;
  amount: number;
  timestamp: Date;
  date: string;
  paymentMethod: string;
  workDayId?: string;
}

export interface WorkDay {
  id: string;
  startTime: Date;
  endTime?: Date;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  tripCount: number;
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
  const [currentWorkDay, setCurrentWorkDay] = useLocalStorage<WorkDay | null>('current-work-day', null);
  const [workDayHistory, setWorkDayHistory] = useLocalStorage<WorkDay[]>('work-day-history', []);
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
  const { startTracking, stopTracking } = useLocation();
  const { theme, setTheme } = useTheme();

  // Clean up old data on component mount
  useEffect(() => {
    cleanupOldData();
  }, []);

  // קאשינג חישובים יומיים לביצועים
  const dailyStats = useMemo(() => {
    if (!currentWorkDay) {
      return {
        today: new Date().toDateString(),
        todayTrips: [],
        todayIncome: 0,
        todayExpenses: 0,
        todayNet: 0,
        remainingToGoal: goals.daily,
        goalProgress: 0
      };
    }

    const workDayTrips = trips.filter(trip => trip.workDayId === currentWorkDay.id);
    const todayIncome = workDayTrips.reduce((sum, trip) => sum + trip.amount, 0);
    const todayExpenses = expenses.fixedDaily + expenses.fuel;
    const todayNet = todayIncome - todayExpenses;
    const remainingToGoal = Math.max(0, goals.daily - todayIncome);
    const goalProgress = Math.min(100, (todayIncome / goals.daily) * 100);
    
    return {
      today: new Date().toDateString(),
      todayTrips: workDayTrips,
      todayIncome,
      todayExpenses,
      todayNet,
      remainingToGoal,
      goalProgress
    };
  }, [trips, expenses, goals, currentWorkDay]);

  const addTrip = (amount: number, paymentMethod: string = "מזומן") => {
    if (!currentWorkDay) {
      toast({
        title: "שגיאה",
        description: "יש להתחיל יום עבודה לפני הוספת נסיעות",
        variant: "destructive"
      });
      return;
    }

    const newTrip: Trip = {
      id: Date.now().toString(),
      amount,
      timestamp: new Date(),
      date: dailyStats.today,
      paymentMethod,
      workDayId: currentWorkDay.id
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

  const startWorkDay = async () => {
    if (currentWorkDay) {
      toast({
        title: "יום עבודה כבר פעיל",
        description: "יש לסיים את יום העבודה הנוכחי לפני התחלת יום חדש",
        variant: "destructive"
      });
      return;
    }

    const newWorkDay: WorkDay = {
      id: Date.now().toString(),
      startTime: new Date(),
      totalIncome: 0,
      totalExpenses: expenses.fixedDaily + expenses.fuel,
      netProfit: 0,
      tripCount: 0
    };

    setCurrentWorkDay(newWorkDay);
    
    // התחלת מעקב מיקום אוטומטית
    await startTracking();
    
    toast({
      title: "יום עבודה התחיל! 🚖",
      description: `התחלת עבודה ב-${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} | מעקב מיקום פעיל`,
    });
  };

  const endWorkDay = async () => {
    if (!currentWorkDay) {
      toast({
        title: "אין יום עבודה פעיל",
        description: "יש להתחיל יום עבודה לפני הסיום",
        variant: "destructive"
      });
      return;
    }

    const endTime = new Date();
    const completedWorkDay: WorkDay = {
      ...currentWorkDay,
      endTime,
      totalIncome: dailyStats.todayIncome,
      totalExpenses: dailyStats.todayExpenses,
      netProfit: dailyStats.todayNet,
      tripCount: dailyStats.todayTrips.length
    };

    setWorkDayHistory(prev => [completedWorkDay, ...prev]);
    setCurrentWorkDay(null);

    // הפסקת מעקב מיקום
    await stopTracking();

    const workDuration = Math.round((endTime.getTime() - currentWorkDay.startTime.getTime()) / (1000 * 60 * 60 * 100)) / 10;
    
    toast({
      title: "יום עבודה הסתיים! 🏁",
      description: `סה"כ הכנסות: ₪${dailyStats.todayIncome} | משך עבודה: ${workDuration} שעות`,
    });
  };

  const handleLogout = () => {
    // ניקוי נתונים מקומיים
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background p-3 rtl">
      <div className="w-full max-w-sm mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">מונית פרו</h1>
            <p className="text-sm text-muted-foreground">מעקב הכנסות יומי</p>
            {currentWorkDay && (
              <div className="text-xs text-primary font-medium mt-1">
                יום עבודה פעיל מ-{new Date(currentWorkDay.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
          
          {/* Control Panel */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 h-8 w-8"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="p-2 h-8 w-8 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Work Day Controls */}
        <div className="flex gap-2">
          {!currentWorkDay ? (
            <Button
              onClick={startWorkDay}
              size="lg"
              className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-semibold touch-manipulation hover-scale"
            >
              🚖 התחל יום עבודה
            </Button>
          ) : (
            <Button
              onClick={endWorkDay}
              size="lg"
              variant="destructive"
              className="flex-1 h-14 font-semibold touch-manipulation hover-scale"
            >
              🏁 סיים יום עבודה
            </Button>
          )}
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
          disabled={!currentWorkDay}
          className="w-full h-20 text-lg font-semibold bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-lg touch-manipulation hover-scale disabled:opacity-50 disabled:cursor-not-allowed"
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
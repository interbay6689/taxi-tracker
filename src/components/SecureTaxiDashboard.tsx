import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, Target, TrendingUp, DollarSign, Play, Square, LogOut, User } from "lucide-react";
import { AddTripDialog } from "./AddTripDialog";
import { DailySummaryCard } from "./DailySummaryCard";
import { ProgressBar } from "./ProgressBar";
import { TripsList } from "./TripsList";
import { SettingsDialog } from "./SettingsDialog";
import { TripTimer } from "./TripTimer";
import { QuickAmounts } from "./QuickAmounts";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, Trip, WorkDay, DailyGoals, DailyExpenses } from "@/hooks/useDatabase";

export const TaxiDashboard = () => {
  const { user, signOut } = useAuth();
  const {
    trips,
    currentWorkDay,
    dailyGoals,
    dailyExpenses,
    loading,
    addTrip,
    startWorkDay,
    endWorkDay,
    updateGoals,
    updateExpenses,
    deleteTrip,
    updateTrip
  } = useDatabase();

  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState<number | null>(null);

  const dailyStats = useMemo(() => {
    const totalIncome = trips.reduce((sum, trip) => sum + trip.amount, 0);
    const totalExpensesValue = dailyExpenses.fuel + dailyExpenses.maintenance + dailyExpenses.other;
    const netProfit = totalIncome - totalExpensesValue;
    const incomeProgress = Math.min((totalIncome / dailyGoals.income_goal) * 100, 100);
    const tripsProgress = Math.min((trips.length / dailyGoals.trips_goal) * 100, 100);
    
    return {
      totalIncome,
      totalExpenses: totalExpensesValue,
      netProfit,
      incomeProgress,
      tripsProgress,
      tripsCount: trips.length,
      goalMet: totalIncome >= dailyGoals.income_goal && trips.length >= dailyGoals.trips_goal
    };
  }, [trips, dailyGoals, dailyExpenses]);

  const handleAddTrip = async (amount: number, paymentMethod: 'cash' | 'card' | 'app') => {
    const success = await addTrip(amount, paymentMethod);
    if (success) {
      setIsAddTripOpen(false);
      setQuickAmount(null);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setQuickAmount(amount);
    setIsAddTripOpen(true);
  };

  const handleTripComplete = () => {
    setIsAddTripOpen(true);
  };

  const handleUpdateTrips = (updatedTrips: Trip[]) => {
    // This will be handled by the database hook automatically
    // through the updateTrip and deleteTrip functions
  };

  const handleUpdateGoals = (newGoals: DailyGoals) => {
    updateGoals(newGoals);
  };

  const handleUpdateExpenses = (newExpenses: DailyExpenses) => {
    updateExpenses(newExpenses);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center">
        <div className="text-center">
          <Target className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg">טוען נתונים מאובטחים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with User Info and Logout */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <span className="text-lg font-medium">שלום, {user?.user_metadata?.display_name || user?.email}</span>
          </div>
          <Button variant="outline" onClick={signOut} size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            התנתק
          </Button>
        </div>

        {/* Work Day Controls */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              ניהול יום עבודה מאובטח
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {!currentWorkDay ? (
                <Button onClick={startWorkDay} className="flex items-center gap-2" size="lg">
                  <Play className="h-5 w-5" />
                  התחל יום עבודה
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    יום עבודה פעיל מאז: {new Date(currentWorkDay.start_time).toLocaleTimeString('he-IL')}
                  </div>
                  <Button onClick={endWorkDay} variant="destructive" className="flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    סיים יום עבודה
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Goal Progress */}
        <DailySummaryCard
          title="יעד יומי"
          value={dailyGoals.income_goal}
          icon={Target}
          variant="income"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProgressBar
            progress={dailyStats.incomeProgress}
            className="h-full"
          />
          <ProgressBar
            progress={dailyStats.tripsProgress}
            className="h-full"
          />
        </div>

        {/* Add Trip Button */}
        {currentWorkDay && (
          <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <Button 
                onClick={() => setIsAddTripOpen(true)}
                className="w-full h-16 text-lg"
                size="lg"
              >
                <Plus className="mr-2 h-6 w-6" />
                הוסף נסיעה מאובטחת
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DailySummaryCard
            title="הכנסות היום"
            value={dailyStats.totalIncome}
            icon={TrendingUp}
            variant="income"
          />
          <DailySummaryCard
            title="הוצאות היום"
            value={dailyStats.totalExpenses}
            icon={DollarSign}
            variant="loss"
          />
          <DailySummaryCard
            title="רווח נקי"
            value={dailyStats.netProfit}
            icon={Target}
            variant={dailyStats.netProfit >= 0 ? "profit" : "loss"}
          />
        </div>

        {/* Today's Trips - Convert format */}
        <Card>
          <CardHeader>
            <CardTitle>נסיעות היום ({trips.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                עדיין לא נוספו נסיעות היום
              </p>
            ) : (
              <div className="space-y-2">
                {trips.map((trip) => (
                  <div key={trip.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">₪{trip.amount}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(trip.timestamp).toLocaleTimeString('he-IL')}
                      </span>
                      <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                        {trip.payment_method === 'cash' ? 'מזומן' : 
                         trip.payment_method === 'card' ? 'כרטיס' : 'אפליקציה'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Trip Dialog - Simple version */}
        <AddTripDialog
          isOpen={isAddTripOpen}
          onClose={() => setIsAddTripOpen(false)}
          onAddTrip={(amount, method) => {
            const paymentMap: Record<string, 'cash' | 'card' | 'app'> = {
              'מזומן': 'cash',
              'אשראי': 'card', 
              'ביט': 'card',
              'GetTaxi': 'app'
            };
            handleAddTrip(amount, paymentMap[method] || 'cash');
          }}
        />
      </div>
    </div>
  );
};
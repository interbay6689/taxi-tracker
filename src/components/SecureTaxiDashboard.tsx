import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, Target, TrendingUp, DollarSign, Play, Square, LogOut, User, Moon, Sun, Car, BarChart3, FileText, Navigation } from "lucide-react";
import { AddTripDialog } from "./AddTripDialog";
import { DailySummaryCard } from "./DailySummaryCard";
import { ProgressBar } from "./ProgressBar";
import { TripsList } from "./TripsList";
import { SettingsDialog } from "./SettingsDialog";
import { TripTimer } from "./TripTimer";
import { QuickAmounts } from "./QuickAmounts";
import { AnalyticsTab } from "./analytics/AnalyticsTab";
import { ReportsExport } from "./ReportsExport";
import { DrivingModeHeader } from "./DrivingModeHeader";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, Trip, WorkDay, DailyGoals, DailyExpenses } from "@/hooks/useDatabase";
import { useAppMode } from "@/hooks/useAppMode";
import { useNotifications } from "@/hooks/useNotifications";

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
  const { mode, toggleNightMode, toggleDrivingMode } = useAppMode();

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

  // התראות
  useNotifications({
    dailyGoals,
    totalIncome: dailyStats.totalIncome,
    tripsCount: dailyStats.tripsCount,
    workDayStartTime: currentWorkDay?.start_time,
    goalMet: dailyStats.goalMet
  });

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

  // מצב נהיגה
  if (mode === 'driving') {
    return (
      <div className="min-h-screen">{/* מצב נהיגה */}
        <DrivingModeHeader
          totalIncome={dailyStats.totalIncome}
          tripsCount={dailyStats.tripsCount}
          dailyGoal={dailyGoals.income_goal}
          onAddTrip={() => setIsAddTripOpen(true)}
          onEndWorkDay={endWorkDay}
          currentWorkDay={currentWorkDay}
        />
        
        <div className="pt-32 pb-6 px-4">
          <div className="max-w-md mx-auto">
            <Button 
              onClick={toggleDrivingMode}
              variant="outline"
              className="w-full mb-4"
            >
              חזור למצב רגיל
            </Button>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-lg">
                  מצב נהיגה פעיל
                </div>
                <div className="text-center text-sm text-muted-foreground mt-2">
                  ממשק מינימלי לנהיגה בטוחה
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background to-muted/50 p-4 ${mode === 'night' ? 'dark' : ''}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with User Info, Mode Controls and Logout */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <span className="text-lg font-medium">שלום, {user?.user_metadata?.display_name || user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={toggleNightMode} size="sm">
              {mode === 'night' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={toggleDrivingMode} size="sm">
              <Car className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={signOut} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              התנתק
            </Button>
          </div>
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">דשבורד</TabsTrigger>
            <TabsTrigger value="analytics">ניתוחים</TabsTrigger>
            <TabsTrigger value="reports">דוחות</TabsTrigger>
            <TabsTrigger value="navigation">ניווט</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            {/* Today's Trips */}
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
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab trips={trips} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsExport trips={trips} />
          </TabsContent>

          <TabsContent value="navigation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  ניווט ומפות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    className="w-full"
                    onClick={() => window.open('https://maps.google.com', '_blank')}
                  >
                    פתח Google Maps
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => window.open('https://waze.com', '_blank')}
                  >
                    פתח Waze
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    ניווט חכם בקרוב...
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Settings Dialog - Temporarily disabled due to type conflicts */}
        {/* TODO: Update SettingsDialog to work with new database types */}
        
        {/* Add Trip Dialog */}
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
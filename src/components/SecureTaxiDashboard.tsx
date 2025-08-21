import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, Target, TrendingUp, DollarSign, Play, Square, LogOut, User, Moon, Sun, Car, BarChart3, FileText, Navigation, Fuel } from "lucide-react";
import { AddTripDialog } from "./AddTripDialog";
import { AddFuelDialog } from "./AddFuelDialog";
import { DailySummaryCard } from "./DailySummaryCard";
import { ProgressBar } from "./ProgressBar";
import { TripsList } from "./TripsList";
import { SettingsDialog } from "./SettingsDialog";
import { TripTimer } from "./TripTimer";
import { QuickAmounts } from "./QuickAmounts";
import { DrivingModeHeader } from "./DrivingModeHeader";
import { SimpleSettingsDialog } from "./SimpleSettingsDialog";
import { EditTripsDialog } from "./EditTripsDialog";
import { GoalsProgress } from "./GoalsProgress";
import { ExpensesDetailCard } from "./ExpensesDetailCard";
import { MobileStatus } from "./MobileStatus";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, Trip, WorkDay, DailyGoals, DailyExpenses } from "@/hooks/useDatabase";
import { useAppMode } from "@/hooks/useAppMode";
import { useNotifications } from "@/hooks/useNotifications";
import { useLocation } from "@/hooks/useLocation";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Import heavy components normally for now to avoid loading issues
import { AnalyticsTab } from "./analytics/AnalyticsTab";
import { ReportsExport } from "./ReportsExport";

export const SecureTaxiDashboard = () => {
  const { user, signOut } = useAuth();
  const {
    trips,
    workDays,
    currentWorkDay,
    dailyGoals,
    dailyExpenses,
    loading,
    addTrip,
    addTripWithLocation,
    startWorkDay,
    endWorkDay,
    pauseWorkDay,
    resumeWorkDay,
    updateGoals,
    updateExpenses,
    deleteTrip,
    updateTrip,
    loadUserData,
    // new: shift-level expenses and adder for fuel expenses
    shiftExpenses,
    addShiftExpense,
    deleteShiftExpense,
    updateShiftExpense,
  } = useDatabase();

  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  // Controls the visibility of the fuel expense dialog
  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditTripsOpen, setIsEditTripsOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState<number | null>(null);
  const { mode, toggleNightMode, toggleDrivingMode } = useAppMode();
  const { currentLocation } = useLocation();
  const { isOnline, saveOfflineTrip, vibrateSuccess, vibrateError } = useOfflineStorage();
  
  // מערכת תיוגים
  const [tags, setTags] = useLocalStorage<string[]>('trip_tags', 
    ["שדה", "תחנה", "הזמנה", "שדה תעופה", "נסיעה ארוכה", "עיר"]
  );
  const { getPaymentMethodDetails } = useCustomPaymentTypes();

  const dailyStats = useMemo(() => {
    // אם אין משמרת פעילה, מציגים אפס לכל הנתונים
    if (!currentWorkDay) {
      return {
        totalIncomeGross: 0,
        totalIncomeNet: 0,
        totalExpenses: 0,
        netProfit: 0,
        incomeProgress: 0,
        tripsProgress: 0,
        tripsCount: 0,
      };
    }

    // מסננים נסיעות רק למשמרת הפעילה
    const filteredTrips = trips.filter((trip) => {
      const tripTime = new Date(trip.timestamp).getTime();
      const shiftStart = new Date(currentWorkDay.start_time).getTime();
      const shiftEnd = currentWorkDay.end_time 
        ? new Date(currentWorkDay.end_time).getTime() 
        : Date.now();
      
      return tripTime >= shiftStart && tripTime <= shiftEnd;
    });

    const totals = filteredTrips.reduce(
      (acc, trip) => {
        const paymentDetails = getPaymentMethodDetails(trip.payment_method);
        const netAmount = trip.amount * (1 - paymentDetails.commissionRate);
        acc.gross += trip.amount;
        acc.net += netAmount;
        return acc;
      },
      { gross: 0, net: 0 }
    );

    // הוצאות - רק של המשמרת הפעילה
    const currentShiftExpenses = shiftExpenses.filter(expense => 
      expense.work_day_id === currentWorkDay.id
    );
    const fuelExpensesTotal = currentShiftExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );

    const totalExpensesValue =
      (dailyExpenses.maintenance || 0) +
      (dailyExpenses.other || 0) +
      (dailyExpenses.daily_fixed_price || 0) +
      fuelExpensesTotal;

    const netProfit = totals.gross - totalExpensesValue;

    // התקדמות יעדים - רק בהתבסס על המשמרת הפעילה
    const incomeProgress =
      dailyGoals.income_goal > 0
        ? Math.min((totals.gross / dailyGoals.income_goal) * 100, 100)
        : 0;
    const tripsProgress =
      dailyGoals.trips_goal > 0
        ? Math.min((filteredTrips.length / dailyGoals.trips_goal) * 100, 100)
        : 0;

    return {
      totalIncomeGross: totals.gross,
      totalIncomeNet: totals.net,
      totalExpenses: totalExpensesValue,
      netProfit,
      incomeProgress,
      tripsProgress,
      tripsCount: filteredTrips.length,
    };
  }, [trips, dailyGoals, dailyExpenses, shiftExpenses, currentWorkDay, getPaymentMethodDetails]);

  /**
   * חישוב נתונים שבועיים וחודשיים - רק עבור נתונים היסטוריים
   * כאשר אין משמרת פעילה, נציג נתונים היסטוריים בלבד
   */
  const weeklyMonthlyStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // אם יש משמרת פעילה, נכלול את נתוני המשמרת הנוכחית
    let weeklyIncome = currentWorkDay ? dailyStats.totalIncomeGross : 0;
    let monthlyIncome = currentWorkDay ? dailyStats.totalIncomeGross : 0;
    let monthlyTrips = currentWorkDay ? dailyStats.tripsCount : 0;

    // מוסיפים נתונים היסטוריים מימי עבודה קודמים
    workDays.forEach((day) => {
      const dayStart = new Date(day.start_time);
      if (dayStart >= startOfWeek) {
        weeklyIncome += day.total_income;
      }
      if (dayStart >= startOfMonth) {
        monthlyIncome += day.total_income;
        monthlyTrips += day.total_trips;
      }
    });

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weeklyGoalIncome =
      dailyGoals.weekly_income_goal ?? dailyGoals.income_goal * 7;
    const monthlyGoalIncome =
      dailyGoals.monthly_income_goal ?? dailyGoals.income_goal * daysInMonth;

    const tripsGoalMonthly = dailyGoals.trips_goal;
    const tripsProgressMonthly =
      tripsGoalMonthly > 0
        ? Math.min((monthlyTrips / tripsGoalMonthly) * 100, 100)
        : 0;
    return {
      weeklyIncome,
      monthlyIncome,
      weeklyGoalIncome,
      monthlyGoalIncome,
      monthlyTrips,
      tripsGoalMonthly,
      tripsProgressMonthly,
    };
  }, [workDays, dailyStats.totalIncomeGross, dailyStats.tripsCount, dailyGoals, currentWorkDay]);

  const goalMet = dailyStats.totalIncomeGross >= dailyGoals.income_goal && dailyStats.tripsCount >= dailyGoals.trips_goal;

  // התראות
  useNotifications({
    dailyGoals,
    // Use gross income for notifications since the net value includes
    // commissions and expenses.  The previous property `totalIncome`
    // no longer exists on dailyStats.
    totalIncome: dailyStats.totalIncomeGross,
    tripsCount: dailyStats.tripsCount,
    workDayStartTime: currentWorkDay?.start_time,
    goalMet
  });

  const handleAddTrip = async (
    amount: number,
    paymentMethod: string,
    tag?: string,
  ) => {
    console.log('handleAddTrip called with:', { amount, paymentMethod, tag });
    // אם אופליין, שמור אופליין
    if (!isOnline) {
      const offlineTrip = {
        id: `offline_${Date.now()}`,
        amount,
        payment_method: paymentMethod as any,
        timestamp: new Date().toISOString(),
        location: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        } : undefined
      };
      
      const success = await saveOfflineTrip(offlineTrip);
      if (success) {
        setIsAddTripOpen(false);
        setQuickAmount(null);
        vibrateSuccess();
      } else {
        vibrateError();
      }
      return;
    }

    // אם מחובר, שמור בדרך הרגילה
    const success = await addTrip(amount, paymentMethod, tag);
    if (success) {
      setIsAddTripOpen(false);
      setQuickAmount(null);
      vibrateSuccess();
    } else {
      vibrateError();
    }
  };

  /**
   * Handles adding a fuel expense. Delegates the persistence to the
   * `addShiftExpense` hook. Provides haptic feedback similar to adding a
   * trip.
   */
  const handleAddFuel = async (amount: number) => {
    // Save the fuel expense using the database hook. Currently no offline
    // storage is implemented for fuel expenses. If needed, similar logic to
    // handleAddTrip can be applied.
    const success = await addShiftExpense(amount);
    if (success) {
      setIsAddFuelOpen(false);
      vibrateSuccess();
    } else {
      vibrateError();
    }
  };

  const handleQuickAmount = (amount: number) => {
    setQuickAmount(amount);
    setIsAddTripOpen(true);
  };

  const handleTripComplete = () => {
    setIsAddTripOpen(true);
  };

  const handleTripWithLocationComplete = async (tripData: {
    amount: number;
    startLocation: {
      address: string;
      city: string;
      lat: number;
      lng: number;
    };
    endLocation: {
      address: string;
      city: string;
      lat: number;
      lng: number;
    };
    duration: number;
    paymentMethod: string;
    tag?: string;
  }) => {
    // מיפוי אמצעי תשלום עבריים לאנגליים
    const paymentMethodMap: { [key: string]: 'cash' | 'card' | 'app' } = {
      'מזומן': 'cash',
      'ביט': 'card',
      'אשראי': 'card',
      'GetTaxi': 'app'
    };

    const success = await addTripWithLocation({
      ...tripData,
      paymentMethod: paymentMethodMap[tripData.paymentMethod] || 'cash',
      tag: tripData.tag,
    });

    if (success) {
      await loadUserData();
    }
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
          totalIncome={dailyStats.totalIncomeGross}
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

      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background to-muted/50 p-4 ${mode === 'night' ? 'dark' : ''}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Mode Controls and Logout */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span className={`text-lg font-medium leading-tight text-right ${mode === 'night' ? 'text-primary-foreground' : 'text-foreground'}`}>
              Taxi<br />Tracker
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsSettingsOpen(true)} size="sm" className={`${mode === 'night' ? 'bg-secondary/50 hover:bg-secondary border-secondary text-primary-foreground' : 'bg-secondary/50 hover:bg-secondary'}`}>
              <Settings className={`h-4 w-4 mr-1 ${mode === 'night' ? 'text-primary-foreground' : 'text-foreground'}`} />
              <span className={mode === 'night' ? 'text-primary-foreground' : 'text-foreground'}>הגדרות</span>
            </Button>
            <Button variant="outline" onClick={toggleNightMode} size="sm" className={`${mode === 'night' ? 'bg-secondary/50 hover:bg-secondary border-secondary text-primary-foreground' : 'bg-secondary/50 hover:bg-secondary'}`}>
              {mode === 'night' ? 
                <Sun className="h-4 w-4 text-primary-foreground" /> : 
                <Moon className="h-4 w-4 text-foreground" />
              }
            </Button>
            <Button variant="outline" onClick={() => setIsEditTripsOpen(true)} size="sm" className={`${mode === 'night' ? 'bg-secondary/50 hover:bg-secondary border-secondary text-primary-foreground' : 'bg-secondary/50 hover:bg-secondary'}`}>
              <Car className={`h-4 w-4 ${mode === 'night' ? 'text-primary-foreground' : 'text-foreground'}`} />
            </Button>
            <Button variant="outline" onClick={signOut} size="sm" className={`${mode === 'night' ? 'bg-secondary/50 hover:bg-destructive/10 border-secondary text-destructive-foreground' : 'bg-secondary/50 hover:bg-destructive/10'}`}>
              <LogOut className={`h-4 w-4 mr-2 ${mode === 'night' ? 'text-destructive-foreground' : 'text-destructive'}`} />
              <span className={mode === 'night' ? 'text-destructive-foreground' : 'text-foreground'}>התנתק</span>
            </Button>
          </div>
        </div>

        {/* Mobile Status */}
        <MobileStatus />

        {/* Work Day Controls */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              ניהול יום עבודה מאובטח
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center">
              {!currentWorkDay ? (
                <Button onClick={startWorkDay} className="flex items-center gap-2" size="lg">
                  <Play className="h-5 w-5" />
                  התחל משמרת
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    יום עבודה {currentWorkDay.is_active ? 'פעיל' : 'מושהה'} מאז: {new Date(currentWorkDay.start_time).toLocaleTimeString('he-IL')}
                  </div>
                  {currentWorkDay.is_active ? (
                    <Button onClick={pauseWorkDay} variant="outline" size="sm" className="flex items-center gap-2">
                      <Square className="h-3 w-3" />
                      הפסקה
                    </Button>
                  ) : (
                    <Button onClick={resumeWorkDay} variant="default" size="sm" className="flex items-center gap-2">
                      <Play className="h-3 w-3" />
                      סיים הפסקה
                    </Button>
                  )}
                  <Button onClick={endWorkDay} variant="destructive" size="sm" className="flex items-center gap-2">
                    <Square className="h-3 w-3" />
                    סיים משמרת
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <GoalsProgress
          incomeProgress={dailyStats.incomeProgress}
          tripsProgress={weeklyMonthlyStats.tripsProgressMonthly}
          currentIncome={dailyStats.totalIncomeGross}
          currentTrips={weeklyMonthlyStats.monthlyTrips}
          incomeGoal={dailyGoals.income_goal}
          tripsGoal={weeklyMonthlyStats.tripsGoalMonthly}
          weeklyIncome={weeklyMonthlyStats.weeklyIncome}
          monthlyIncome={weeklyMonthlyStats.monthlyIncome}
          weeklyGoal={weeklyMonthlyStats.weeklyGoalIncome}
          monthlyGoal={weeklyMonthlyStats.monthlyGoalIncome}
        />

        {/* Action Buttons: add trip and add fuel expense */}
        {currentWorkDay && (
          <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setIsAddTripOpen(true)}
                  className="h-16 text-lg"
                  size="lg"
                >
                  <Plus className="mr-2 h-6 w-6" />
                  הוסף נסיעה
                </Button>
                <Button
                  onClick={() => setIsAddFuelOpen(true)}
                  // Smaller and light red button for fuel
                  className="h-14 text-base bg-red-100 text-red-700 hover:bg-red-200"
                  size="lg"
                >
                  <Fuel className="mr-2 h-6 w-6" />
                  דלק
                </Button>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Trip Tracker - רק כשיום עבודה פעיל */}
        {currentWorkDay && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              {/* פירוט נסיעות והוצאות */}
            </div>
            <div>
              <ExpensesDetailCard 
                dailyExpenses={dailyExpenses} 
                shiftExpenses={shiftExpenses} 
              />
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DailySummaryCard
            title="הכנסות היום"
            value={dailyStats.totalIncomeGross}
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
            variant={dailyStats.netProfit >= 0 ? 'profit' : 'loss'}
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
                  <div className="space-y-3">
                     {trips.map((trip) => {
                       const paymentDetails = getPaymentMethodDetails(trip.payment_method);
                       const finalAmount = trip.amount * (1 - paymentDetails.commissionRate);
                       
                       return (
                         <div key={trip.id} className="p-3 bg-muted/50 rounded-lg border border-muted-foreground/20">
                           <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-3">
                               {paymentDetails.commissionRate !== 0 ? (
                                 <div className="flex flex-col items-start">
                                   {paymentDetails.commissionRate > 0 && (
                                     <span className="text-xs text-destructive">-{(paymentDetails.commissionRate * 100).toFixed(1)}% עמלה</span>
                                   )}
                                   {paymentDetails.commissionRate < 0 && (
                                     <span className="text-xs text-green-600">+{Math.abs(paymentDetails.commissionRate * 100).toFixed(1)}% בונוס</span>
                                   )}
                                   <div className="flex items-center gap-2">
                                     <span className="font-medium text-lg">₪{finalAmount.toLocaleString()}</span>
                                     <span className="text-sm text-muted-foreground line-through">₪{trip.amount.toLocaleString()}</span>
                                   </div>
                                 </div>
                               ) : (
                                 <span className="font-medium text-lg">₪{trip.amount.toLocaleString()}</span>
                               )}
                               <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                                 {paymentDetails.displayName}
                               </span>
                             </div>
                             <span className="text-sm text-muted-foreground">
                               {new Date(trip.timestamp).toLocaleTimeString('he-IL')}
                             </span>
                           </div>
                           
                           {/* תצוגת מיקומים */}
                           {trip.start_location_city && trip.end_location_city && (
                             <div className="text-sm text-muted-foreground">
                               <span className="text-primary font-medium">
                                 {trip.start_location_city} → {trip.end_location_city}
                               </span>
                             </div>
                           )}
                         </div>
                       );
                     })}

                     {/* הוצאות דלק */}
                     {shiftExpenses.map((expense) => (
                       <div key={`expense-${expense.id}`} className="p-3 bg-red-50 rounded-lg border border-red-200">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-3">
                             <span className="font-medium text-lg text-red-700">
                               -₪{expense.amount.toLocaleString()}
                             </span>
                             <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                               דלק
                             </span>
                           </div>
                           <span className="text-sm text-muted-foreground">
                             {new Date(expense.created_at).toLocaleTimeString('he-IL')}
                           </span>
                         </div>
                         {expense.description && (
                           <div className="text-sm text-muted-foreground mt-1">
                             {expense.description}
                           </div>
                         )}
                       </div>
                     ))}
                     {/* Summary row: show net profit after all expenses and the average per trip */}
                     <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30 mt-4">
                       <div className="flex justify-between items-center">
                         <span className="font-bold text-lg text-primary">סכום כולל:</span>
                         <span className="font-bold text-xl text-primary">
                           {(() => {
                             // Use the net profit from dailyStats which already
                             // subtracts maintenance, other expenses and fuel
                             // expenses from the gross income.
                             const net = dailyStats.netProfit;
                             return `₪${net.toLocaleString()}`;
                           })()}
                         </span>
                       </div>
                       <div className="text-sm text-muted-foreground mt-1">
                         {trips.length} נסיעות • ממוצע: ₪{
                           trips.length > 0
                             ? (dailyStats.netProfit / trips.length).toFixed(0)
                             : '0'
                         }
                       </div>
                     </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>ניתוחים מתקדמים</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="daily" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                     <TabsTrigger value="daily">ניתוח יומי</TabsTrigger>
                     <TabsTrigger value="shifts">היסטוריית משמרות</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="daily">
                    <AnalyticsTab trips={trips} />
                  </TabsContent>
                  
                  <TabsContent value="shifts">
                    <div className="text-center p-8 text-muted-foreground">
                      ניתוח משמרות זמין בהגדרות ← ניתוח
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <ReportsExport trips={trips} workDays={workDays} />
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

        {/* Settings Dialog */}
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          goals={dailyGoals}
          expenses={dailyExpenses}
          trips={trips}
          workDays={workDays}
          currentWorkDay={currentWorkDay}
          onUpdateGoals={handleUpdateGoals}
          onUpdateExpenses={handleUpdateExpenses}
          onUpdateTrips={handleUpdateTrips}
          tags={tags}
          onUpdateTags={setTags}
        />

        {/* Edit Trips Dialog */}
        <EditTripsDialog
          isOpen={isEditTripsOpen}
          onClose={() => setIsEditTripsOpen(false)}
          trips={trips}
          expenses={shiftExpenses}
          onDeleteTrip={deleteTrip}
          onUpdateTrip={updateTrip}
          onDeleteExpense={deleteShiftExpense}
          onUpdateExpense={updateShiftExpense}
          onAddTrip={() => {
            setIsEditTripsOpen(false);
            setIsAddTripOpen(true);
          }}
        />

        {/* Add Trip Dialog */}
        <AddTripDialog
          isOpen={isAddTripOpen}
          onClose={() => setIsAddTripOpen(false)}
          tripsToday={trips}
          tags={tags}
          onAddTrip={(amount, method, tag) => {
            handleAddTrip(amount, method, tag);
          }}
        />

        {/* Add Fuel Dialog */}
        <AddFuelDialog
          isOpen={isAddFuelOpen}
          onClose={() => setIsAddFuelOpen(false)}
          onAddFuel={(amount) => {
            handleAddFuel(amount);
          }}
        />
      </div>
    </div>
  );
};
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
import { TripTracker } from "./TripTracker";
import { MobileStatus } from "./MobileStatus";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, Trip, WorkDay, DailyGoals, DailyExpenses } from "@/hooks/useDatabase";
import { useAppMode } from "@/hooks/useAppMode";
import { useNotifications } from "@/hooks/useNotifications";
import { useLocation } from "@/hooks/useLocation";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";

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
  const { getPaymentMethodDetails } = useCustomPaymentTypes();

  const dailyStats = useMemo(() => {
    // Filter trips to only include those that fall within the current shift
    // boundaries. If no work day is active, consider all trips for the day.
    const filteredTrips = trips.filter(trip => {
      const ts = new Date(trip.timestamp).getTime();
      const start = currentWorkDay?.start_time ? new Date(currentWorkDay.start_time).getTime() : null;
      const end = currentWorkDay?.end_time ? new Date(currentWorkDay.end_time).getTime() : null;
      if (start && ts < start) return false;
      if (end && ts > end) return false;
      return true;
    });

    const totalIncome = filteredTrips.reduce((sum, trip) => {
      const paymentDetails = getPaymentMethodDetails(trip.payment_method);
      const finalAmount = trip.amount * (1 - paymentDetails.commissionRate);
      return sum + finalAmount;
    }, 0);
    // Calculate expenses: include daily expenses (maintenance + other) and any
    // shift-level expenses such as fuel. Each shift expense record has an
    // amount field representing its shekel value.
    const fuelExpensesTotal = shiftExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalExpensesValue = dailyExpenses.maintenance + dailyExpenses.other + fuelExpensesTotal;
    const netProfit = totalIncome - totalExpensesValue;
    const incomeProgress = Math.min((totalIncome / dailyGoals.income_goal) * 100, 100);
    const tripsProgress = Math.min((filteredTrips.length / dailyGoals.trips_goal) * 100, 100);
    
    return {
      totalIncome,
      totalExpenses: totalExpensesValue,
      netProfit,
      incomeProgress,
      tripsProgress,
      tripsCount: filteredTrips.length,
      goalMet: totalIncome >= dailyGoals.income_goal && filteredTrips.length >= dailyGoals.trips_goal,
    };
  }, [trips, dailyGoals, dailyExpenses, shiftExpenses, currentWorkDay, getPaymentMethodDetails]);

  // התראות
  useNotifications({
    dailyGoals,
    totalIncome: dailyStats.totalIncome,
    tripsCount: dailyStats.tripsCount,
    workDayStartTime: currentWorkDay?.start_time,
    goalMet: dailyStats.goalMet
  });

  const handleAddTrip = async (amount: number, paymentMethod: 'cash' | 'card' | 'app' | 'מזומן' | 'ביט' | 'אשראי' | 'GetTaxi' | 'דהרי') => {
    console.log('handleAddTrip called with:', { amount, paymentMethod });
    // אם אופליין, שמור אופליין
    if (!isOnline) {
      const offlineTrip = {
        id: `offline_${Date.now()}`,
        amount,
        payment_method: paymentMethod,
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
    const success = await addTrip(amount, paymentMethod);
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
      paymentMethod: paymentMethodMap[tripData.paymentMethod] || 'cash'
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
          tripsProgress={dailyStats.tripsProgress}
          currentIncome={dailyStats.totalIncome}
          currentTrips={dailyStats.tripsCount}
          incomeGoal={dailyGoals.income_goal}
          tripsGoal={dailyGoals.trips_goal}
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
          <TripTracker onTripComplete={handleTripWithLocationComplete} />
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
                     {/* שורת סיכום: סכום הכנסות אחרי קיזוז הוצאות דלק */}
                     <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30 mt-4">
                       <div className="flex justify-between items-center">
                         <span className="font-bold text-lg text-primary">סכום כולל:</span>
                         <span className="font-bold text-xl text-primary">
                           {(() => {
                             const fuelTotal = shiftExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                             const net = dailyStats.totalIncome - fuelTotal;
                             return `₪${net.toLocaleString()}`;
                           })()}
                         </span>
                       </div>
                       <div className="text-sm text-muted-foreground mt-1">
                         {trips.length} נסיעות • ממוצע: ₪{trips.length > 0 ? ((dailyStats.totalIncome - shiftExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)) / trips.length).toFixed(0) : '0'}
                       </div>
                     </div>
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

        {/* Settings Dialog */}
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          goals={dailyGoals}
          expenses={dailyExpenses}
          trips={trips}
          onUpdateGoals={handleUpdateGoals}
          onUpdateExpenses={handleUpdateExpenses}
          onUpdateTrips={handleUpdateTrips}
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
          onAddTrip={(amount, method) => {
            handleAddTrip(amount, method as 'cash' | 'card' | 'app' | 'מזומן' | 'ביט' | 'אשראי' | 'GetTaxi' | 'דהרי');
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
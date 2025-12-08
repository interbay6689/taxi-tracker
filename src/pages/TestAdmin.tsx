import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle2, CircleSlash, Car, Edit3, Fuel, BarChart4, TrendingUp, RefreshCcw, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Trip } from '@/hooks/database/types';
import { QuickTripButtons } from '@/components/QuickTripButtons';
import { QuickStatsBar } from '@/components/dashboard/QuickStatsBar';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { ShadcnTabs } from '@/components/ui/shadcn-tabs';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { BottomNav } from '@/components/navigation/BottomNav';
import { FAB } from '@/components/ui/fab';
import { AddTripDialog } from '@/components/AddTripDialog';
import { StartShiftDialog } from '@/components/StartShiftDialog';
import { EndShiftDialog } from '@/components/EndShiftDialog';
import { AddFuelDialog } from '@/components/AddFuelDialog';

// נתונים מדומים לבדיקה
const mockTrips: Trip[] = [
  {
    id: '1',
    amount: 45,
    payment_method: 'מזומן',
    order_source: 'גט',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    amount: 62,
    payment_method: 'אשראי',
    order_source: 'דהרי',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    amount: 38,
    payment_method: 'ביט',
    order_source: 'מזדמן',
    timestamp: new Date().toISOString(),
  },
  {
    id: '4',
    amount: 85,
    payment_method: 'אשראי',
    order_source: 'גט',
    timestamp: new Date().toISOString(),
  },
  {
    id: '5',
    amount: 55,
    payment_method: 'מזומן',
    order_source: 'מזדמן',
    timestamp: new Date().toISOString(),
  },
];

const mockWorkDay = {
  id: 'test-shift',
  start_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  is_active: true,
};

const mockGoals = {
  income_goal: 500,
  trips_goal: 20,
};

const mockExpenses = [
  { id: '1', amount: 50, description: 'דלק', payment_method: 'מזומן' },
];

const TestAdmin = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [hasActiveShift, setHasActiveShift] = useState(true);
  const [isAddTripOpen, setAddTripOpen] = useState(false);
  const [isStartShiftOpen, setStartShiftOpen] = useState(false);
  const [isEndShiftOpen, setEndShiftOpen] = useState(false);
  const [isAddFuelOpen, setAddFuelOpen] = useState(false);

  // חישובים
  const shiftIncomeGross = trips.reduce((sum, t) => sum + t.amount, 0);
  const shiftTripsCount = trips.length;
  const shiftFuelExpenses = mockExpenses.reduce((total, expense) => total + expense.amount, 0);
  const shiftIncomeNet = shiftIncomeGross - shiftFuelExpenses;
  const incomeProgress = Math.min((shiftIncomeGross / mockGoals.income_goal) * 100, 100);
  const tripsProgress = Math.min((shiftTripsCount / mockGoals.trips_goal) * 100, 100);

  const handleAddTrip = (amount: number, paymentMethod: string, orderSource?: string) => {
    // המרה לטיפוס הנכון
    const validPaymentMethod = (['מזומן', 'אשראי', 'ביט'].includes(paymentMethod) 
      ? paymentMethod 
      : 'מזומן') as 'מזומן' | 'אשראי' | 'ביט';
    
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      amount,
      payment_method: validPaymentMethod,
      order_source: orderSource || 'מזדמן',
      timestamp: new Date().toISOString(),
    };
    setTrips([...trips, newTrip]);
    toast({ title: 'נסיעה נוספה', description: `₪${amount} - ${paymentMethod}` });
  };

  const handleStartShift = () => {
    setHasActiveShift(true);
    setStartShiftOpen(false);
    toast({ title: 'משמרת החלה', description: 'המשמרת החלה בהצלחה!' });
  };

  const handleEndShift = () => {
    setHasActiveShift(false);
    setEndShiftOpen(false);
    toast({ title: 'משמרת הסתיימה', description: `סה"כ: ₪${shiftIncomeGross}` });
  };

  const handlePauseShift = () => {
    toast({ title: 'משמרת הושהתה', description: 'ניתן להמשיך בכל עת' });
  };

  const handleAddFuel = (expense: any) => {
    toast({ title: 'דלק נוסף', description: `₪${expense.amount}` });
  };

  const resetDemo = () => {
    setTrips(mockTrips);
    setHasActiveShift(true);
    toast({ title: 'הדמו אופס', description: 'הנתונים חזרו למצב ההתחלתי' });
  };

  const renderDashboard = () => {
    if (!hasActiveShift) {
      return (
        <div className="space-y-6">
          <QuickStatsBar
            dailyIncome={0}
            dailyTrips={0}
            avgPerTrip={0}
          />
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">התחל משמרת חדשה</h3>
              <p className="text-muted-foreground mb-6">
                כדי להתחיל לרשום נסיעות, תחילה צריך להתחיל משמרת
              </p>
              <Button onClick={() => setStartShiftOpen(true)} size="lg">
                <Play className="mr-2 h-5 w-5" />
                התחל משמרת
              </Button>
            </CardContent>
          </Card>
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
                max={mockGoals.income_goal}
                label="₪"
                className="mx-auto"
              />
              <ProgressRing
                value={shiftTripsCount}
                max={mockGoals.trips_goal}
                label=""
                className="mx-auto"
              />
            </div>
            <div className="grid grid-cols-2 gap-6 text-center mb-6 hidden md:grid">
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
                  יעד: ₪{mockGoals.income_goal.toLocaleString()}
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
                  יעד: {mockGoals.trips_goal} נסיעות
                </div>
              </div>
            </div>

            {/* פעולות משמרת */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button onClick={handlePauseShift} variant="secondary">
                <CircleSlash className="mr-2 h-4 w-4" />
                השהה
              </Button>
              <Button onClick={() => setEndShiftOpen(true)} variant="destructive">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                סיים משמרת
              </Button>
            </div>
            
            {/* פעולות נוספות */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={() => toast({ title: 'עריכת נסיעות', description: 'פונקציה זו לדוגמה בלבד' })}>
                <Edit3 className="mr-2 h-4 w-4" />
                ערוך נסיעות
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAddFuelOpen(true)}>
                <Fuel className="mr-2 h-4 w-4" />
                הוסף דלק
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* כפתורי נסיעות מהירות */}
        <Card>
          <CardContent className="p-6">
            <QuickTripButtons 
              onAddTrip={handleAddTrip} 
              disabled={false} 
              tripsToday={trips}
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

  const renderAnalytics = () => (
    <Card>
      <CardHeader>
        <CardTitle>אנליטיקה - מצב בדיקה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">₪{shiftIncomeGross}</div>
              <div className="text-xs text-muted-foreground">הכנסות היום</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{shiftTripsCount}</div>
              <div className="text-xs text-muted-foreground">נסיעות</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">₪{Math.round(shiftIncomeGross / Math.max(shiftTripsCount, 1))}</div>
              <div className="text-xs text-muted-foreground">ממוצע</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">₪{shiftFuelExpenses}</div>
              <div className="text-xs text-muted-foreground">הוצאות</div>
            </CardContent>
          </Card>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          זוהי תצוגה מוגבלת - האנליטיקה המלאה זמינה רק לאחר התחברות
        </p>
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center gap-4 shadow-sm md:hidden">
            <SidebarTrigger className="md:hidden" />
            <h2 className="text-lg font-semibold">מצב בדיקה</h2>
          </div>

          <div className="min-h-screen py-6">
            <div className="container mx-auto px-4">
              {/* כותרת ופעולות */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold">שלום נהג בדיקה!</h1>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    מצב בדיקה
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={resetDemo}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    אפס דמו
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
                    <Home className="mr-2 h-4 w-4" />
                    דף הבית
                  </Button>
                </div>
              </div>

              {/* הודעת בדיקה */}
              <Card className="mb-6 bg-amber-500/10 border-amber-500/30">
                <CardContent className="p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300 text-center">
                    🔧 זהו מצב בדיקה - הנתונים מדומים ואינם נשמרים. כל הפעולות עובדות אך אינן משפיעות על בסיס הנתונים.
                  </p>
                </CardContent>
              </Card>

              {/* טאבים */}
              <ShadcnTabs
                tabs={[
                  { label: 'דשבורד', value: 'dashboard', icon: BarChart4 },
                  { label: 'אנליטיקה', value: 'analytics', icon: TrendingUp },
                ]}
                activeTab={activeTab}
                setActiveTab={(value) => setActiveTab(value as typeof activeTab)}
              />

              {/* תוכן */}
              <div className="mt-6">
                {activeTab === 'dashboard' ? renderDashboard() : renderAnalytics()}
              </div>

              {/* דיאלוגים */}
              <AddTripDialog
                isOpen={isAddTripOpen}
                onClose={() => setAddTripOpen(false)}
                onAddTrip={handleAddTrip}
                tripsToday={trips}
              />

              <StartShiftDialog
                isOpen={isStartShiftOpen}
                onClose={() => setStartShiftOpen(false)}
                onSubmit={handleStartShift}
              />

              <EndShiftDialog
                isOpen={isEndShiftOpen}
                onClose={() => setEndShiftOpen(false)}
                onSubmit={handleEndShift}
              />

              <AddFuelDialog
                isOpen={isAddFuelOpen}
                onClose={() => setAddFuelOpen(false)}
                onAddFuel={handleAddFuel}
              />

              {/* FAB */}
              <FAB
                onAddTrip={() => setAddTripOpen(true)}
                onAddFuel={() => setAddFuelOpen(true)}
                onStartShift={() => setStartShiftOpen(true)}
                onEndShift={() => setEndShiftOpen(true)}
                hasActiveShift={hasActiveShift}
              />
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
};

export default TestAdmin;

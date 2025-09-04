import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Car, CheckCircle2, CircleSlash, Plus, Settings, BarChart4, Clock, TrendingUp, RefreshCcw } from 'lucide-react';
import { AddTripDialog } from '@/components/AddTripDialog';
import { EditTripsDialog } from '@/components/EditTripsDialog';
import { useDatabase } from '@/hooks/useDatabase';
import { StartShiftDialog } from '@/components/StartShiftDialog';
import { EndShiftDialog } from '@/components/EndShiftDialog';
import { AddFuelDialog } from '@/components/AddFuelDialog';
import { useToast } from '@/hooks/use-toast';
import { ShadcnTabs } from '@/components/ui/shadcn-tabs';
import { AnalyticsTab } from '@/components/analytics/AnalyticsTab';
import { ShiftHistoryTab } from '@/components/analytics/ShiftHistoryTab';
import { ReportsExport } from '@/components/ReportsExport';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import { SettingsDialog } from '@/components/SettingsDialog';
import { useCustomPaymentTypes } from '@/hooks/useCustomPaymentTypes';
import { QuickTripDashboard } from '@/components/QuickTripDashboard';
import { QuickShiftStart } from '@/components/QuickShiftStart';

interface GoalsPeriodSelectorProps {
  selectedPeriod: 'today' | 'week' | 'month' | 'year' | 'custom';
  onPeriodChange: (period: 'today' | 'week' | 'month' | 'year' | 'custom') => void;
  customDateRange?: DateRange | undefined;
  onCustomDateRangeChange: (dateRange: DateRange | undefined) => void;
}

const GoalsPeriodSelector: React.FC<GoalsPeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  customDateRange,
  onCustomDateRangeChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>תקופת זמן</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 grid-cols-4 md:grid-cols-auto">
        <Button
          variant={selectedPeriod === 'today' ? 'default' : 'outline'}
          onClick={() => onPeriodChange('today')}
        >
          היום
        </Button>
        <Button
          variant={selectedPeriod === 'week' ? 'default' : 'outline'}
          onClick={() => onPeriodChange('week')}
        >
          השבוע
        </Button>
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          onClick={() => onPeriodChange('month')}
        >
          החודש
        </Button>
        <Button
          variant={selectedPeriod === 'year' ? 'default' : 'outline'}
          onClick={() => onPeriodChange('year')}
        >
          השנה
        </Button>
        <DateRangePicker
          date={customDateRange}
          onDateChange={onCustomDateRangeChange}
        />
      </CardContent>
    </Card>
  );
};

export const SecureTaxiDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    trips = [],
    workDays = [],
    currentWorkDay,
    dailyGoals = { income_goal: 500, trips_goal: 20 },
    dailyExpenses = { maintenance: 0, other: 0, daily_fixed_price: 0 },
    loading: dbLoading,
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
    shiftExpenses = [],
    addShiftExpense,
    deleteShiftExpense,
    updateShiftExpense,
    loadUserData
  } = useDatabase();
  const { toast } = useToast();

  const [isAddTripOpen, setAddTripOpen] = useState(false);
  const [isEditTripsOpen, setEditTripsOpen] = useState(false);
  const [isStartShiftOpen, setStartShiftOpen] = useState(false);
  const [isEndShiftOpen, setEndShiftOpen] = useState(false);
  const [isAddFuelOpen, setAddFuelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quick' | 'analytics' | 'history' | 'reports' | 'settings'>('quick');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const tripsToday = React.useMemo(() => {
    try {
      if (!trips || !Array.isArray(trips)) return [];
      return trips.filter(
        (trip) => {
          try {
            return new Date(trip.timestamp).toDateString() === new Date().toDateString();
          } catch (error) {
            console.error('Error filtering trip:', error, trip);
            return false;
          }
        }
      );
    } catch (error) {
      console.error('Error in tripsToday calculation:', error);
      return [];
    }
  }, [trips]);

  const totalIncomeToday = React.useMemo(() => {
    try {
      return tripsToday.reduce((sum, trip) => sum + (trip.amount || 0), 0);
    } catch (error) {
      console.error('Error calculating total income:', error);
      return 0;
    }
  }, [tripsToday]);

  const totalTripsToday = tripsToday.length;

  // Accurate shift metrics (filter by current work day window)
  const { getPaymentMethodDetails } = useCustomPaymentTypes();

  const shiftTrips = React.useMemo(() => {
    if (!currentWorkDay) return [] as typeof trips;
    const start = new Date(currentWorkDay.start_time);
    const end = currentWorkDay.end_time ? new Date(currentWorkDay.end_time) : new Date();
    return trips.filter((t) => {
      try {
        const tt = new Date(t.timestamp);
        return tt >= start && tt <= end;
      } catch {
        return false;
      }
    });
  }, [trips, currentWorkDay]);

  const shiftIncomeGross = React.useMemo(() =>
    shiftTrips.reduce((sum, t) => sum + (t.amount || 0), 0)
  , [shiftTrips]);

  const shiftIncomeNet = React.useMemo(() =>
    shiftTrips.reduce((sum, t) => {
      const details = getPaymentMethodDetails(t.payment_method);
      return sum + (t.amount * (1 - details.commissionRate));
    }, 0)
  , [shiftTrips, getPaymentMethodDetails]);

  const shiftTripsCount = shiftTrips.length;

  const handleStartShift = async () => {
    try {
      const success = await startWorkDay();
      if (success) {
        toast({ title: "משמרת החלה", description: "המשמרת החלה בהצלחה!" });
        setStartShiftOpen(false);
      }
    } catch (error) {
      console.error('Error starting shift:', error);
      toast({ 
        title: "שגיאה", 
        description: "אירעה שגיאה בהתחלת המשמרת", 
        variant: "destructive" 
      });
    }
  };

  const handleEndShift = async () => {
    try {
      const success = await endWorkDay();
      if (success) {
        toast({ title: "משמרת הסתיימה", description: "המשמרת הסתיימה בהצלחה!" });
        setEndShiftOpen(false);
      }
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({ 
        title: "שגיאה", 
        description: "אירעה שגיאה בסיום המשמרת", 
        variant: "destructive" 
      });
    }
  };

  const handlePauseShift = async () => {
    try {
      const success = await pauseWorkDay();
      if (success) {
        toast({ title: "משמרת הופסקה", description: "המשמרת הופסקה בהצלחה!" });
      }
    } catch (error) {
      console.error('Error pausing shift:', error);
      toast({ 
        title: "שגיאה", 
        description: "אירעה שגיאה בהפסקת המשמרת", 
        variant: "destructive" 
      });
    }
  };

  const handleResumeShift = async () => {
    try {
      const success = await resumeWorkDay();
      if (success) {
        toast({ title: "משמרת חודשה", description: "המשמרת חודשה בהצלחה!" });
      }
    } catch (error) {
      console.error('Error resuming shift:', error);
      toast({ 
        title: "שגיאה", 
        description: "אירעה שגיאה בחידוש המשמרת", 
        variant: "destructive" 
      });
    }
  };

  const renderTabContent = () => {
    try {
      switch (activeTab) {
        case 'quick':
          return currentWorkDay ? (
            <QuickTripDashboard
              currentWorkDay={currentWorkDay}
              shiftTrips={shiftTrips}
              shiftIncomeGross={shiftIncomeGross}
              shiftTripsCount={shiftTripsCount}
              dailyGoals={dailyGoals}
              onAddTrip={addTrip}
              tripsToday={tripsToday}
            />
          ) : (
            <QuickShiftStart 
              onStartShift={handleStartShift}
              loading={dbLoading}
            />
          );

        case 'dashboard':
          return (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>סיכום יומי</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-lg font-bold">הכנסות: ₪{totalIncomeToday.toLocaleString()}</div>
                      <div>נסיעות: {totalTripsToday}</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">יעד הכנסות: ₪{dailyGoals.income_goal.toLocaleString()}</div>
                      <div>יעד נסיעות: {dailyGoals.trips_goal}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentWorkDay ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>משמרת פעילה</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div>הכנסה משמרת: ₪{shiftIncomeGross.toLocaleString()}</div>
                      <div>נסיעות משמרת: {shiftTripsCount}</div>
                      <div className="flex gap-2">
                        <Button onClick={handlePauseShift} variant="secondary">
                          <CircleSlash className="mr-2 h-4 w-4" />
                          השהה משמרת
                        </Button>
                        <Button onClick={() => setEndShiftOpen(true)} variant="destructive">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          סיים משמרת
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>אין משמרת פעילה</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => setStartShiftOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        התחל משמרת
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>פעולות מהירות</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <Button onClick={() => setAddTripOpen(true)} disabled={!currentWorkDay}>
                      <Plus className="mr-2 h-4 w-4" />
                      הוסף נסיעה
                    </Button>
                    <Button onClick={() => setEditTripsOpen(true)}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      ערוך נסיעות
                    </Button>
                    <Button onClick={() => setAddFuelOpen(true)} variant="secondary" disabled={!currentWorkDay}>
                      <Car className="mr-2 h-4 w-4" />
                      הוסף דלק
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          );

        case 'analytics':
          return (
            <div className="space-y-6">
              <AnalyticsTab trips={trips} />
            </div>
          );

        case 'history':
          return (
            <div className="space-y-6">
              <ShiftHistoryTab trips={trips} workDays={workDays} />
            </div>
          );

        case 'reports':
          return (
            <div className="space-y-6">
              <GoalsPeriodSelector
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                customDateRange={customDateRange}
                onCustomDateRangeChange={setCustomDateRange}
              />
              <ReportsExport
                trips={trips}
                workDays={workDays}
                selectedPeriod={selectedPeriod}
                customDateRange={customDateRange && customDateRange.from && customDateRange.to 
                  ? { from: customDateRange.from, to: customDateRange.to }
                  : undefined
                }
              />
            </div>
          );

        case 'settings':
          return (
            <SettingsDialog
              isOpen={true}
              onClose={() => setActiveTab('dashboard')}
              goals={dailyGoals}
              expenses={dailyExpenses}
              onUpdateGoals={updateGoals}
              onUpdateExpenses={updateExpenses}
              trips={trips}
              workDays={workDays}
              currentWorkDay={currentWorkDay}
              onUpdateTrips={() => {}}
            />
          );

        default:
          return (
            <div className="text-center py-8">
              <p>נתונים לא זמינים</p>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering tab content:', error);
      return (
        <div className="text-center py-8">
          <p className="text-destructive">שגיאה בטעינת הנתונים</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            רענן דף
          </Button>
        </div>
      );
    }
  };

  if (authLoading || dbLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center items-center gap-2 mb-4">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">מערכת מונית מאובטחת</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full" size="lg">
              התחבר למערכת
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold">
            שלום {user?.email?.split('@')[0] || 'נהג'}!
          </h1>
          <Button variant="outline" size="sm" onClick={loadUserData} disabled={dbLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            רענן נתונים
          </Button>
        </div>

        <ShadcnTabs
          tabs={[
            { label: 'הוספה מהירה', value: 'quick', icon: Plus },
            { label: 'לוח בקרה', value: 'dashboard', icon: BarChart4 },
            { label: 'אנליטיקה', value: 'analytics', icon: TrendingUp },
            { label: 'היסטוריה', value: 'history', icon: Clock },
            { label: 'דוחות', value: 'reports', icon: CalendarIcon },
            { label: 'הגדרות', value: 'settings', icon: Settings },
          ]}
          activeTab={activeTab}
          setActiveTab={(value) => setActiveTab(value as typeof activeTab)}
        />

        <div className="mt-6">{renderTabContent()}</div>

        <AddTripDialog
          isOpen={isAddTripOpen}
          onClose={() => setAddTripOpen(false)}
          onAddTrip={addTrip}
          tripsToday={tripsToday}
        />

        <EditTripsDialog
          isOpen={isEditTripsOpen}
          onClose={() => setEditTripsOpen(false)}
          trips={tripsToday}
          expenses={shiftExpenses}
          onDeleteTrip={deleteTrip}
          onUpdateTrip={updateTrip}
          onDeleteExpense={deleteShiftExpense}
          onUpdateExpense={updateShiftExpense}
          onAddTrip={() => setAddTripOpen(true)}
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
          onAddFuel={addShiftExpense}
        />
      </div>
    </div>
  );
};

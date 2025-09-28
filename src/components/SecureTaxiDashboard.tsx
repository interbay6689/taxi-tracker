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
import { UnifiedDashboard } from '@/components/UnifiedDashboard';
import { OptionsMenu } from '@/components/OptionsMenu';

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
    loadUserData,
    manualRefresh
  } = useDatabase();
  const { toast } = useToast();

  const [isAddTripOpen, setAddTripOpen] = useState(false);
  const [isEditTripsOpen, setEditTripsOpen] = useState(false);
  const [isStartShiftOpen, setStartShiftOpen] = useState(false);
  const [isEndShiftOpen, setEndShiftOpen] = useState(false);
  const [isAddFuelOpen, setAddFuelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');
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
        case 'dashboard':
          return (
            <UnifiedDashboard
              currentWorkDay={currentWorkDay}
              shiftTrips={shiftTrips}
              shiftIncomeGross={shiftIncomeGross}
              shiftTripsCount={shiftTripsCount}
              totalIncomeToday={totalIncomeToday}
              totalTripsToday={totalTripsToday}
              dailyGoals={dailyGoals}
              onAddTrip={addTrip}
              onStartShift={handleStartShift}
              onEndShift={handleEndShift}
              onPauseShift={handlePauseShift}
              tripsToday={tripsToday}
              loading={dbLoading}
              onEditTrips={() => setEditTripsOpen(true)}
              onAddFuel={() => setAddFuelOpen(true)}
              shiftExpenses={shiftExpenses}
            />
          );

        case 'analytics':
          return (
            <div className="space-y-6">
              <AnalyticsTab 
                trips={trips} 
                shiftExpenses={shiftExpenses}
                selectedPeriod={selectedPeriod}
                customDateRange={customDateRange}
                onPeriodChange={(period) => {
                  console.log('SecureTaxiDashboard - Period change:', period);
                  setSelectedPeriod(period);
                }}
                onCustomDateRangeChange={(dateRange) => {
                  console.log('SecureTaxiDashboard - Custom date range change:', dateRange);
                  setCustomDateRange(dateRange);
                }}
              />
            </div>
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">
            שלום {user?.email?.split('@')[0] || 'נהג'}!
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={manualRefresh} disabled={dbLoading}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${dbLoading ? 'animate-spin' : ''}`} />
              רענן
            </Button>
            <OptionsMenu
              trips={trips}
              workDays={workDays}
              currentWorkDay={currentWorkDay}
              dailyGoals={dailyGoals}
              dailyExpenses={dailyExpenses}
              onUpdateGoals={updateGoals}
              onUpdateExpenses={updateExpenses}
            />
          </div>
        </div>

        <ShadcnTabs
          tabs={[
            { label: 'דשבורד', value: 'dashboard', icon: BarChart4 },
            { label: 'אנליטיקה', value: 'analytics', icon: TrendingUp },
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

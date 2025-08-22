import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Car, CheckCircle2, CircleSlash, Plus, Settings, BarChart4, Clock } from 'lucide-react';
import { AddTripDialog } from '@/components/AddTripDialog';
import { EditTripsDialog } from '@/components/EditTripsDialog';
import { useDatabase } from '@/hooks/useDatabase';
import { StartShiftDialog } from '@/components/StartShiftDialog';
import { EndShiftDialog } from '@/components/EndShiftDialog';
import { AddFuelDialog } from '@/components/AddFuelDialog';
import { useToast } from '@/hooks/use-toast';
import { ShadcnTabs } from '@/components/ui/shadcn-tabs';
import { AnalyticsTab } from '@/components/AnalyticsTab';
import { ShiftHistoryTab } from '@/components/ShiftHistoryTab';
import { ReportsExport } from '@/components/ReportsExport';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker"
import { SettingsDialog } from '@/components/SettingsDialog';

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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const {
    trips,
    workDays,
    currentWorkDay,
    dailyGoals,
    dailyExpenses,
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
    shiftExpenses,
    addShiftExpense,
    deleteShiftExpense,
    updateShiftExpense
  } = useDatabase();
  const { toast } = useToast();

  const [isAddTripOpen, setAddTripOpen] = useState(false);
  const [isEditTripsOpen, setEditTripsOpen] = useState(false);
  const [isStartShiftOpen, setStartShiftOpen] = useState(false);
  const [isEndShiftOpen, setEndShiftOpen] = useState(false);
  const [isAddFuelOpen, setAddFuelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'history' | 'reports' | 'settings'>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleStartShift = async () => {
    const success = await startWorkDay();
    if (success) {
      toast({
        title: "משמרת החלה",
        description: "המשמרת החלה בהצלחה!",
      });
    }
  };

  const handleEndShift = async () => {
    const success = await endWorkDay();
    if (success) {
      toast({
        title: "משמרת הסתיימה",
        description: "המשמרת הסתיימה בהצלחה!",
      });
    }
  };

  const handlePauseShift = async () => {
    const success = await pauseWorkDay();
    if (success) {
      toast({
        title: "משמרת הופסקה",
        description: "המשמרת הופסקה בהצלחה!",
      });
    }
  };

  const handleResumeShift = async () => {
    const success = await resumeWorkDay();
    if (success) {
      toast({
        title: "משמרת חודשה",
        description: "המשמרת חודשה בהצלחה!",
      });
    }
  };

  const tripsToday = trips.filter(
    (trip) => new Date(trip.timestamp).toDateString() === new Date().toDateString()
  );

  const totalIncomeToday = tripsToday.reduce((sum, trip) => sum + trip.amount, 0);
  const totalTripsToday = tripsToday.length;

  const renderTabContent = () => {
    switch (activeTab) {
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
                    <div className="text-lg font-bold">הכנסות: ₪{totalIncomeToday}</div>
                    <div>נסיעות: {totalTripsToday}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">יעד הכנסות: ₪{dailyGoals.income_goal}</div>
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
                    <div>הכנסה משמרת: ₪{tripsToday.reduce((sum, trip) => sum + trip.amount, 0)}</div>
                    <div>נסיעות משמרת: {tripsToday.length}</div>
                    <div className="flex gap-2">
                      <Button onClick={handlePauseShift} variant="secondary">
                        <CircleSlash className="mr-2 h-4 w-4" />
                        השהה משמרת
                      </Button>
                      <Button onClick={handleEndShift} variant="destructive">
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
                  <Button onClick={() => setAddTripOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    הוסף נסיעה
                  </Button>
                  <Button onClick={() => setEditTripsOpen(true)}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    ערוך נסיעות
                  </Button>
                  <Button onClick={() => setAddFuelOpen(true)} variant="secondary">
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
            <AnalyticsTab 
              trips={trips} 
              workDays={workDays}
              dailyGoals={dailyGoals}
              dailyExpenses={dailyExpenses}
            />
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <ShiftHistoryTab workDays={workDays} />
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
              customDateRange={customDateRange}
            />
          </div>
        );

      case 'settings':
        return (
          <SettingsDialog
            isOpen={true}
            onClose={() => setActiveTab('dashboard')}
            dailyGoals={dailyGoals}
            dailyExpenses={dailyExpenses}
            onUpdateGoals={updateGoals}
            onUpdateExpenses={updateExpenses}
            trips={trips}
            workDays={workDays}
          />
        );

      default:
        return null;
    }
  };

  if (loading || dbLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-semibold mb-4">
          שלום {user?.email || user?.name || 'נהג'}!
        </h1>

        <ShadcnTabs
          tabs={[
            { label: 'לוח בקרה', value: 'dashboard', icon: BarChart4 },
            { label: 'אנליטיקה', value: 'analytics', icon: TrendingUp },
            { label: 'היסטוריה', value: 'history', icon: Clock },
            { label: 'דוחות', value: 'reports', icon: CalendarIcon },
            { label: 'הגדרות', value: 'settings', icon: Settings },
          ]}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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

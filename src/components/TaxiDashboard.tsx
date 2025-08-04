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
import { SimpleSettingsDialog } from "./SimpleSettingsDialog";
import { EditTripsDialog } from "./EditTripsDialog";
import { GoalsProgress } from "./GoalsProgress";
import { MobileStatus } from "./MobileStatus";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, Trip, WorkDay, DailyGoals, DailyExpenses } from "@/hooks/useDatabase";
import { useAppMode } from "@/hooks/useAppMode";
import { useNotifications } from "@/hooks/useNotifications";
import { useLocation } from "@/hooks/useLocation";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";

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
  const [isEditTripsOpen, setIsEditTripsOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState<number | null>(null);
  const { mode, toggleNightMode, toggleDrivingMode } = useAppMode();
  const { currentLocation } = useLocation();
  const { isOnline, saveOfflineTrip, vibrateSuccess, vibrateError } = useOfflineStorage();

  const dailyStats = useMemo(() => {
    const totalIncome = trips.reduce((sum, trip) => {
      const amount = trip.payment_method === 'דהרי' ? trip.amount * 0.9 : trip.amount;
      return sum + amount;
    }, 0);
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

  // Load page in read-only mode
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 max-w-md">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-primary mb-2">Taxi Tracker</h1>
                <p className="text-muted-foreground">Dashboard מרכזי</p>
              </div>
            </CardContent>
          </Card>

          <TripsList trips={trips} />
        </div>
      </div>
    </div>
  );
};
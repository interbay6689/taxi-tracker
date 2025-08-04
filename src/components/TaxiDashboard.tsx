import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, Target, TrendingUp, DollarSign } from "lucide-react";
import { AddTripDialog } from "./AddTripDialog";
import { DailySummaryCard } from "./DailySummaryCard";
import { ProgressBar } from "./ProgressBar";
import { TripsList } from "./TripsList";

export interface Trip {
  id: string;
  amount: number;
  timestamp: Date;
  date: string;
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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [goals] = useState<DailyGoals>({
    daily: 909,
    weekly: 4545,
    monthly: 20000
  });
  const [expenses] = useState<DailyExpenses>({
    fixedDaily: 260,
    fuel: 150
  });

  const today = new Date().toDateString();
  const todayTrips = trips.filter(trip => trip.date === today);
  const todayIncome = todayTrips.reduce((sum, trip) => sum + trip.amount, 0);
  const todayExpenses = expenses.fixedDaily + expenses.fuel;
  const todayNet = todayIncome - todayExpenses;
  const remainingToGoal = Math.max(0, goals.daily - todayIncome);
  const goalProgress = Math.min(100, (todayIncome / goals.daily) * 100);

  const addTrip = (amount: number) => {
    const newTrip: Trip = {
      id: Date.now().toString(),
      amount,
      timestamp: new Date(),
      date: today
    };
    setTrips(prev => [newTrip, ...prev]);
    setIsAddTripOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 rtl">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">מונית פרו</h1>
          <p className="text-muted-foreground">מעקב הכנסות יומי</p>
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
                <span className="text-2xl font-bold text-primary">
                  ₪{todayIncome.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  מתוך ₪{goals.daily.toLocaleString()}
                </span>
              </div>
              <ProgressBar progress={goalProgress} />
              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  נותר: ₪{remainingToGoal.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Trip Button */}
        <Button
          onClick={() => setIsAddTripOpen(true)}
          size="lg"
          className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-lg"
        >
          <Plus className="mr-2 h-6 w-6" />
          הוספת נסיעה
        </Button>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <DailySummaryCard
            title="הכנסות היום"
            value={todayIncome}
            icon={DollarSign}
            variant="income"
          />
          <DailySummaryCard
            title="רווח נקי"
            value={todayNet}
            icon={TrendingUp}
            variant={todayNet >= 0 ? "profit" : "loss"}
          />
        </div>

        {/* Today's Trips */}
        <TripsList trips={todayTrips} />

        {/* Settings Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {/* TODO: Open settings */}}
        >
          <Settings className="mr-2 h-4 w-4" />
          הגדרות
        </Button>

        {/* Add Trip Dialog */}
        <AddTripDialog
          isOpen={isAddTripOpen}
          onClose={() => setIsAddTripOpen(false)}
          onAddTrip={addTrip}
        />
      </div>
    </div>
  );
};
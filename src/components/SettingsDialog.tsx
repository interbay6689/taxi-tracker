
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Fuel, List, FileText, BarChart3, Moon, Sun, Tag, User } from "lucide-react";
import { Trip, DailyGoals, DailyExpenses, WorkDay } from "@/hooks/useDatabase";
import { ReportsExport } from "./ReportsExport";
import { GoalsTab } from "./settings/GoalsTab";
import { ExpensesTab } from "./settings/ExpensesTab";
import { TripsTab } from "./settings/TripsTab";
import { PaymentTypesTab } from "./settings/PaymentTypesTab";
import { AnalyticsTab } from "./analytics/AnalyticsTab";
import { ProfileTab } from "./settings/ProfileTab";
import { useAppMode } from "@/hooks/useAppMode";
import { useState } from "react";
import { DateRange } from "react-day-picker";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goals: DailyGoals;
  expenses: DailyExpenses;
  trips: Trip[];
  workDays: WorkDay[];
  currentWorkDay: any;
  onUpdateGoals: (goals: DailyGoals) => void | Promise<boolean>;
  onUpdateExpenses: (expenses: DailyExpenses) => void | Promise<boolean>;
  onUpdateTrips: (trips: Trip[]) => void;
  tags?: string[];
  onUpdateTags?: (tags: string[]) => void;
}

export const SettingsDialog = ({
  isOpen,
  onClose,
  goals,
  expenses,
  trips,
  workDays,
  currentWorkDay,
  onUpdateGoals,
  onUpdateExpenses,
  onUpdateTrips,
}: SettingsDialogProps) => {
  const { mode, toggleNightMode } = useAppMode();
  const [selectedAnalyticsPeriod, setSelectedAnalyticsPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [analyticsDateRange, setAnalyticsDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedReportsPeriod, setSelectedReportsPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [reportsDateRange, setReportsDateRange] = useState<DateRange | undefined>(undefined);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto rtl" aria-describedby="settings-desc">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">הגדרות</DialogTitle>
          <p id="settings-desc" className="sr-only">מרכז הגדרות האפליקציה לניהול יעדים, הוצאות, תשלומים, פרופיל, נסיעות ודוחות.</p>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">הגדרות</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleNightMode}
            className="hover-scale"
          >
            {mode === "night" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <Tabs defaultValue="goals" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 text-xs gap-1">
            <TabsTrigger value="goals" className="text-xs">
              <Target className="h-3 w-3 ml-1" />
              יעדים
            </TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs">
              <Fuel className="h-3 w-3 ml-1" />
              הוצאות
            </TabsTrigger>
            <TabsTrigger value="payment-types" className="text-xs">
              <Tag className="h-3 w-3 ml-1" />
              תשלומים
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs">
              <User className="h-3 w-3 ml-1" />
              פרופיל
            </TabsTrigger>
            <TabsTrigger value="trips" className="text-xs">
              <List className="h-3 w-3 ml-1" />
              נסיעות
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              <BarChart3 className="h-3 w-3 ml-1" />
              ניתוח
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs">
              <FileText className="h-3 w-3 ml-1" />
              דוחות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals">
            <GoalsTab goals={goals} setGoals={onUpdateGoals as any} />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab expenses={expenses} setExpenses={onUpdateExpenses as any} />
          </TabsContent>

          <TabsContent value="payment-types">
            <PaymentTypesTab />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="trips">
            <TripsTab 
              trips={trips}
              currentWorkDay={currentWorkDay}
              onDeleteTrip={(tripId) => console.log('Delete trip:', tripId)}
              onEditTrip={(tripId, amount) => console.log('Edit trip:', tripId, amount)}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab 
              trips={trips}
              selectedPeriod={selectedAnalyticsPeriod}
              customDateRange={analyticsDateRange}
              onPeriodChange={setSelectedAnalyticsPeriod}
              onCustomDateRangeChange={setAnalyticsDateRange}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsExport 
              trips={trips} 
              workDays={workDays} 
              selectedPeriod={selectedReportsPeriod}
              customDateRange={reportsDateRange && reportsDateRange.from && reportsDateRange.to 
                ? { from: reportsDateRange.from, to: reportsDateRange.to }
                : undefined
              }
              onPeriodChange={setSelectedReportsPeriod}
              onCustomDateRangeChange={setReportsDateRange}
            />
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 touch-manipulation"
          >
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

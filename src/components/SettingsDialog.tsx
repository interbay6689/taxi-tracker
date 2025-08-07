import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Fuel, List, FileText, BarChart3, Moon, Sun, Tag } from "lucide-react";
import { Trip, DailyGoals, DailyExpenses } from "@/hooks/useDatabase";
import { ReportsExport } from "./ReportsExport";
import { GoalsTab } from "./settings/GoalsTab";
import { ExpensesTab } from "./settings/ExpensesTab";
import { TripsTab } from "./settings/TripsTab";
import { PaymentTypesTab } from "./settings/PaymentTypesTab";
import { AnalyticsTab } from "./analytics/AnalyticsTab";
import { useTheme } from "next-themes";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goals: DailyGoals;
  expenses: DailyExpenses;
  trips: Trip[];
  currentWorkDay: any;
  onUpdateGoals: (goals: DailyGoals) => void;
  onUpdateExpenses: (expenses: DailyExpenses) => void;
  onUpdateTrips: (trips: Trip[]) => void;
}

export const SettingsDialog = ({
  isOpen,
  onClose,
  goals,
  expenses,
  trips,
  currentWorkDay,
  onUpdateGoals,
  onUpdateExpenses,
  onUpdateTrips
}: SettingsDialogProps) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">הגדרות</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">הגדרות</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="hover-scale"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <Tabs defaultValue="goals" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
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
              תיוגים
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
            <GoalsTab goals={goals} setGoals={onUpdateGoals} />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab expenses={expenses} setExpenses={onUpdateExpenses} />
          </TabsContent>

          <TabsContent value="payment-types">
            <PaymentTypesTab />
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
            <div className="text-center p-8 text-muted-foreground">
              ניתוחים זמינים בדשבורד הראשי
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="text-center p-8 text-muted-foreground">
              דוחות זמינים בדשבורד הראשי
            </div>
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
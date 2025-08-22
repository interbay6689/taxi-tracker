
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Fuel, List, FileText, BarChart3, Moon, Sun, Tag, Tags } from "lucide-react";
import { Trip, DailyGoals, DailyExpenses, WorkDay } from "@/hooks/useDatabase";
import { ReportsExport } from "./ReportsExport";
import { GoalsTab } from "./settings/GoalsTab";
import { ExpensesTab } from "./settings/ExpensesTab";
import { TripsTab } from "./settings/TripsTab";
import { PaymentTypesTab } from "./settings/PaymentTypesTab";
import { AnalyticsTab } from "./analytics/AnalyticsTab";
import { TagsManagement } from "./TagsManagement";
import { useTheme } from "next-themes";
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
  tags = ["שדה", "תחנה", "הזמנה", "שדה תעופה", "נסיעה ארוכה", "עיר"],
  onUpdateTags
}: SettingsDialogProps) => {
  const { theme, setTheme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto rtl" aria-describedby="settings-desc">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">הגדרות</DialogTitle>
          <p id="settings-desc" className="sr-only">מרכז הגדרות האפליקציה לניהול יעדים, הוצאות, תשלומים, תיוגים, נסיעות ודוחות.</p>
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
          <TabsList className="grid w-full grid-cols-6 text-xs gap-1">
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
            <TabsTrigger value="tags" className="text-xs">
              <Tags className="h-3 w-3 ml-1" />
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
            <GoalsTab goals={goals} setGoals={onUpdateGoals as any} />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab expenses={expenses} setExpenses={onUpdateExpenses as any} />
          </TabsContent>

          <TabsContent value="payment-types">
            <PaymentTypesTab />
          </TabsContent>

          <TabsContent value="tags">
            {onUpdateTags ? (
              <TagsManagement
                tags={tags}
                onUpdateTags={onUpdateTags}
              />
            ) : (
              <div className="text-center text-muted-foreground p-4">
                ניהול תיוגים לא זמין
              </div>
            )}
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
            <div className="space-y-4">
              <Tabs defaultValue="daily" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="daily">ניתוח יומי</TabsTrigger>
                  <TabsTrigger value="shifts">היסטוריית משמרות</TabsTrigger>
                </TabsList>
                
                <TabsContent value="daily">
                  <AnalyticsTab trips={trips} />
                </TabsContent>
                
                <TabsContent value="shifts">
                  <div className="mt-4">
                    <div className="text-center p-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      ניתוח משמרות יוצג כאן בעדכון הבא
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <ReportsExport 
              trips={trips} 
              workDays={workDays} 
              selectedPeriod={selectedPeriod}
              customDateRange={customDateRange && customDateRange.from && customDateRange.to 
                ? { from: customDateRange.from, to: customDateRange.to }
                : undefined
              }
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

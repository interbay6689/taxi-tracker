import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, FileText, Clock, LogOut, MoreVertical } from 'lucide-react';
import { SettingsDialog } from '@/components/SettingsDialog';
import { ReportsExport } from '@/components/ReportsExport';
import { ShiftHistoryTab } from '@/components/analytics/ShiftHistoryTab';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from '@/components/date-range-picker';
import { useAuth } from '@/hooks/useAuth';

interface OptionsMenuProps {
  trips: any[];
  workDays: any[];
  currentWorkDay: any;
  dailyGoals: any;
  dailyExpenses: any;
  onUpdateGoals: (goals: any) => void;
  onUpdateExpenses: (expenses: any) => void;
}

export const OptionsMenu = ({
  trips,
  workDays,
  currentWorkDay,
  dailyGoals,
  dailyExpenses,
  onUpdateGoals,
  onUpdateExpenses
}: OptionsMenuProps) => {
  const { signOut } = useAuth();
  const [openDialog, setOpenDialog] = useState<'settings' | 'reports' | 'history' | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setOpenDialog('settings')}>
            <Settings className="mr-2 h-4 w-4" />
            הגדרות
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('history')}>
            <Clock className="mr-2 h-4 w-4" />
            היסטוריית משמרות
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('reports')}>
            <FileText className="mr-2 h-4 w-4" />
            דוחות וייצוא
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            התנתק
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={openDialog === 'settings'}
        onClose={() => setOpenDialog(null)}
        goals={dailyGoals}
        expenses={dailyExpenses}
        onUpdateGoals={onUpdateGoals}
        onUpdateExpenses={onUpdateExpenses}
        trips={trips}
        workDays={workDays}
        currentWorkDay={currentWorkDay}
        onUpdateTrips={() => {}}
      />

      {/* History Dialog */}
      {openDialog === 'history' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">היסטוריית משמרות</h2>
                <Button variant="outline" onClick={() => setOpenDialog(null)}>
                  סגור
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <ShiftHistoryTab trips={trips} workDays={workDays} />
            </div>
          </div>
        </div>
      )}

      {/* Reports Dialog */}
      {openDialog === 'reports' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">דוחות וייצוא</h2>
                <Button variant="outline" onClick={() => setOpenDialog(null)}>
                  סגור
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-6">
                {/* Period Selector */}
                <div className="space-y-4">
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                    <Button
                      variant={selectedPeriod === 'today' ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod('today')}
                    >
                      היום
                    </Button>
                    <Button
                      variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod('week')}
                    >
                      השבוע
                    </Button>
                    <Button
                      variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod('month')}
                    >
                      החודש
                    </Button>
                    <Button
                      variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod('year')}
                    >
                      השנה
                    </Button>
                    <Button
                      variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod('custom')}
                    >
                      תקופה מותאמת
                    </Button>
                  </div>
                  
                  {/* Custom Date Range Picker */}
                  {selectedPeriod === 'custom' && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="text-sm font-medium mb-3">בחר טווח תאריכים:</h4>
                      <DateRangePicker
                        date={customDateRange}
                        onDateChange={setCustomDateRange}
                        placeholder="בחר טווח תאריכים"
                      />
                    </div>
                  )}
                </div>
                
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};
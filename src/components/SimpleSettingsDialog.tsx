import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, DollarSign, Fuel, Wrench, Package } from "lucide-react";
import { DailyGoals, DailyExpenses } from "@/hooks/useDatabase";

interface SimpleSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goals: DailyGoals;
  expenses: DailyExpenses;
  onUpdateGoals: (goals: DailyGoals) => void;
  onUpdateExpenses: (expenses: DailyExpenses) => void;
}

export const SimpleSettingsDialog = ({
  isOpen,
  onClose,
  goals,
  expenses,
  onUpdateGoals,
  onUpdateExpenses
}: SimpleSettingsDialogProps) => {
  const [incomeGoal, setIncomeGoal] = useState(goals.income_goal.toString());
  const [tripsGoal, setTripsGoal] = useState(goals.trips_goal.toString());
  
  const [maintenance, setMaintenance] = useState(expenses.maintenance.toString());
  const [other, setOther] = useState(expenses.other.toString());

  const handleSave = () => {
    onUpdateGoals({
      ...goals,
      income_goal: Number(incomeGoal) || 0,
      trips_goal: Number(tripsGoal) || 0
    });

    onUpdateExpenses({
      ...expenses,
      maintenance: Number(maintenance) || 0,
      other: Number(other) || 0
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>הגדרות</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* יעדים יומיים */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                יעדים יומיים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="income-goal">יעד הכנסות (₪)</Label>
                <Input
                  id="income-goal"
                  type="number"
                  value={incomeGoal}
                  onChange={(e) => setIncomeGoal(e.target.value)}
                  placeholder="500"
                />
              </div>
              <div>
                <Label htmlFor="trips-goal">יעד נסיעות</Label>
                <Input
                  id="trips-goal"
                  type="number"
                  value={tripsGoal}
                  onChange={(e) => setTripsGoal(e.target.value)}
                  placeholder="20"
                />
              </div>
            </CardContent>
          </Card>

          {/* הוצאות יומיות */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-destructive" />
                הוצאות יומיות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maintenance" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  תחזוקה (₪)
                </Label>
                <Input
                  id="maintenance"
                  type="number"
                  value={maintenance}
                  onChange={(e) => setMaintenance(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="other" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  אחר (₪)
                </Label>
                <Input
                  id="other"
                  type="number"
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* כפתורי פעולה */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              שמור
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
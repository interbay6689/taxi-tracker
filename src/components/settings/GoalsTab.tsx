import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Target, DollarSign, Calendar, Car, Save, RotateCcw } from 'lucide-react';
import { DailyGoals } from "@/hooks/useDatabase";

interface GoalsTabProps {
  goals: DailyGoals;
  setGoals: (goals: DailyGoals) => void;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ goals, setGoals }) => {
  const [localGoals, setLocalGoals] = useState<DailyGoals>(goals);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalGoals(goals);
    setHasChanges(false);
  }, [goals]);

  useEffect(() => {
    const hasChanged = 
      localGoals.income_goal !== goals.income_goal ||
      localGoals.trips_goal !== goals.trips_goal ||
      localGoals.weekly_income_goal !== goals.weekly_income_goal ||
      localGoals.monthly_income_goal !== goals.monthly_income_goal;
    setHasChanges(hasChanged);
  }, [localGoals, goals]);

  const handleSave = () => {
    setGoals(localGoals);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setLocalGoals(goals);
    setHasChanges(false);
  };
  return (
    <div className="space-y-4">
      {/* כפתורי שמירה וביטול */}
      {hasChanges && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">יש לך שינויים שלא נשמרו</span>
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  שמור
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  ביטול
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            יעד הכנסה יומי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="income_goal">יעד הכנסה (₪)</Label>
          <Input
            id="income_goal"
            type="number"
            placeholder="הזן יעד הכנסה יומי"
            value={localGoals.income_goal}
            onChange={(e) => setLocalGoals({
              ...localGoals,
              income_goal: Number(e.target.value) || 0
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            יעד נסיעות יומי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="trips_goal">מספר נסיעות</Label>
          <Input
            id="trips_goal"
            type="number"
            placeholder="הזן מספר נסיעות יומי"
            value={localGoals.trips_goal}
            onChange={(e) => setLocalGoals({
              ...localGoals,
              trips_goal: Number(e.target.value) || 0
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            יעדים נוספים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weekly income goal input */}
          <div>
            <Label htmlFor="weekly_income_goal">יעד הכנסה שבועי (₪)</Label>
            <Input
              id="weekly_income_goal"
              type="number"
              placeholder="הזן יעד הכנסה שבועי"
              value={
                localGoals.weekly_income_goal !== undefined
                  ? localGoals.weekly_income_goal
                  : localGoals.income_goal * 7
              }
              onChange={(e) =>
                setLocalGoals({
                  ...localGoals,
                  weekly_income_goal: Number(e.target.value) || 0,
                })
              }
            />
          </div>

          {/* Monthly income goal input */}
          <div>
            <Label htmlFor="monthly_income_goal">יעד הכנסה חודשי (₪)</Label>
            <Input
              id="monthly_income_goal"
              type="number"
              placeholder="הזן יעד הכנסה חודשי"
              value={
                localGoals.monthly_income_goal !== undefined
                  ? localGoals.monthly_income_goal
                  : (() => {
                      const now = new Date();
                      const daysInMonth = new Date(
                        now.getFullYear(),
                        now.getMonth() + 1,
                        0
                      ).getDate();
                      return localGoals.income_goal * daysInMonth;
                    })()
              }
              onChange={(e) =>
                setLocalGoals({
                  ...localGoals,
                  monthly_income_goal: Number(e.target.value) || 0,
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
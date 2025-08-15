import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, DollarSign, Calendar, Car } from 'lucide-react';
import { DailyGoals } from "@/hooks/useDatabase";

interface GoalsTabProps {
  goals: DailyGoals;
  setGoals: (goals: DailyGoals) => void;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ goals, setGoals }) => {
  return (
    <div className="space-y-4">
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
            value={goals.income_goal}
            onChange={(e) => setGoals({
              ...goals,
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
            value={goals.trips_goal}
            onChange={(e) => setGoals({
              ...goals,
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
                goals.weekly_income_goal !== undefined
                  ? goals.weekly_income_goal
                  : goals.income_goal * 7
              }
              onChange={(e) =>
                setGoals({
                  ...goals,
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
                goals.monthly_income_goal !== undefined
                  ? goals.monthly_income_goal
                  : (() => {
                      const now = new Date();
                      const daysInMonth = new Date(
                        now.getFullYear(),
                        now.getMonth() + 1,
                        0
                      ).getDate();
                      return goals.income_goal * daysInMonth;
                    })()
              }
              onChange={(e) =>
                setGoals({
                  ...goals,
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
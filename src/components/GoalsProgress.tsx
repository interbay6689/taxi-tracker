import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Car, DollarSign } from "lucide-react";

interface GoalsProgressProps {
  incomeProgress: number;
  tripsProgress: number;
  currentIncome: number;
  currentTrips: number;
  incomeGoal: number;
  tripsGoal: number;
}

export const GoalsProgress = ({
  incomeProgress,
  tripsProgress,
  currentIncome,
  currentTrips,
  incomeGoal,
  tripsGoal
}: GoalsProgressProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          התקדמות יעדים יומיים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* התקדמות הכנסות */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="font-medium">יעד הכנסות</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(incomeProgress)}%
            </div>
          </div>
          <Progress value={incomeProgress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>₪{currentIncome} / ₪{incomeGoal}</span>
            <span>נותרו: ₪{Math.max(0, incomeGoal - currentIncome)}</span>
          </div>
        </div>

        {/* התקדמות נסיעות */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              <span className="font-medium">יעד נסיעות</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(tripsProgress)}%
            </div>
          </div>
          <Progress value={tripsProgress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{currentTrips} / {tripsGoal} נסיעות</span>
            <span>נותרו: {Math.max(0, tripsGoal - currentTrips)} נסיעות</span>
          </div>
        </div>

        {/* סטטוס כללי */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-center gap-2">
            {incomeProgress >= 100 && tripsProgress >= 100 ? (
              <div className="flex items-center gap-2 text-success font-medium">
                <Target className="h-4 w-4" />
                🎉 כל הכבוד! השגת את כל היעדים!
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                {incomeProgress >= 100 ? "✅ יעד הכנסות הושג" : "💰 ממשיך לעבר יעד ההכנסות"}
                {" • "}
                {tripsProgress >= 100 ? "✅ יעד נסיעות הושג" : "🚗 ממשיך לעבר יעד הנסיעות"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
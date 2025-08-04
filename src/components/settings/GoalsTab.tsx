import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DailyGoals } from "../TaxiDashboard";

interface GoalsTabProps {
  goals: DailyGoals;
  onUpdateGoals: (goals: DailyGoals) => void;
}

export const GoalsTab = ({ goals, onUpdateGoals }: GoalsTabProps) => {
  const [localGoals, setLocalGoals] = useState(goals);
  const { toast } = useToast();

  const handleSaveGoals = () => {
    onUpdateGoals(localGoals);
    toast({
      title: "יעדים עודכנו",
      description: "היעדים החדשים נשמרו בהצלחה",
    });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          יעדים כספיים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="daily-goal">יעד יומי (₪)</Label>
          <Input
            id="daily-goal"
            type="number"
            value={localGoals.daily}
            onChange={(e) => setLocalGoals({
              ...localGoals,
              daily: parseInt(e.target.value) || 0
            })}
            className="text-center"
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weekly-goal">יעד שבועי (₪)</Label>
          <Input
            id="weekly-goal"
            type="number"
            value={localGoals.weekly}
            onChange={(e) => setLocalGoals({
              ...localGoals,
              weekly: parseInt(e.target.value) || 0
            })}
            className="text-center"
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly-goal">יעד חודשי (₪)</Label>
          <Input
            id="monthly-goal"
            type="number"
            value={localGoals.monthly}
            onChange={(e) => setLocalGoals({
              ...localGoals,
              monthly: parseInt(e.target.value) || 0
            })}
            className="text-center"
            dir="ltr"
          />
        </div>
        <Button 
          onClick={handleSaveGoals}
          className="w-full touch-manipulation hover-scale"
        >
          שמור יעדים
        </Button>
      </CardContent>
    </Card>
  );
};
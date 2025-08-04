import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DailyExpenses } from "@/hooks/useDatabase";

interface ExpensesTabProps {
  expenses: DailyExpenses;
  onUpdateExpenses: (expenses: DailyExpenses) => void;
}

export const ExpensesTab = ({ expenses, onUpdateExpenses }: ExpensesTabProps) => {
  const [localExpenses, setLocalExpenses] = useState(expenses);
  const { toast } = useToast();

  const handleSaveExpenses = () => {
    onUpdateExpenses(localExpenses);
    toast({
      title: "הוצאות עודכנו", 
      description: "הוצאות הדלק והפיקס עודכנו בהצלחה",
    });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Fuel className="h-4 w-4" />
          הוצאות יומיות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fixed-daily">פיקס יומי (₪)</Label>
          <Input
            id="fixed-daily"
            type="number"
            value={localExpenses.fixedDaily}
            onChange={(e) => setLocalExpenses({
              ...localExpenses,
              fixedDaily: parseInt(e.target.value) || 0
            })}
            className="text-center"
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuel">דלק יומי (₪)</Label>
          <Input
            id="fuel"
            type="number"
            value={localExpenses.fuel}
            onChange={(e) => setLocalExpenses({
              ...localExpenses,
              fuel: parseInt(e.target.value) || 0
            })}
            className="text-center"
            dir="ltr"
          />
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">סה"כ הוצאות יומיות:</div>
          <div className="text-lg font-bold text-foreground">
            ₪{(localExpenses.fixedDaily + localExpenses.fuel).toLocaleString()}
          </div>
        </div>
        <Button 
          onClick={handleSaveExpenses}
          className="w-full touch-manipulation hover-scale"
        >
          שמור הוצאות
        </Button>
      </CardContent>
    </Card>
  );
};
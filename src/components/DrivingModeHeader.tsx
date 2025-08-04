import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Square, Target } from "lucide-react";

interface DrivingModeHeaderProps {
  totalIncome: number;
  tripsCount: number;
  dailyGoal: number;
  onAddTrip: () => void;
  onEndWorkDay: () => void;
  currentWorkDay?: any;
}

export const DrivingModeHeader = ({
  totalIncome,
  tripsCount,
  dailyGoal,
  onAddTrip,
  onEndWorkDay,
  currentWorkDay
}: DrivingModeHeaderProps) => {
  const progress = Math.min((totalIncome / dailyGoal) * 100, 100);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="p-4 max-w-md mx-auto">
        {/* סטטיסטיקות מרוכזות */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">₪{totalIncome}</div>
                <div className="text-xs text-muted-foreground">הכנסות</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{tripsCount}</div>
                <div className="text-xs text-muted-foreground">נסיעות</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{progress.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">מטרה</div>
              </div>
            </div>
            
            {/* פס התקדמות */}
            <div className="mt-3 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* כפתורי פעולה */}
        <div className="flex gap-2">
          <Button 
            onClick={onAddTrip}
            className="flex-1 h-14 text-lg"
            size="lg"
          >
            <Plus className="mr-2 h-6 w-6" />
            הוסף נסיעה
          </Button>
          
          {currentWorkDay && (
            <Button 
              onClick={onEndWorkDay}
              variant="destructive"
              className="h-14"
              size="lg"
            >
              <Square className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
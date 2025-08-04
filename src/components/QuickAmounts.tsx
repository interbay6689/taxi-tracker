import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface QuickAmountsProps {
  onSelectAmount: (amount: number) => void;
}

export const QuickAmounts = ({ onSelectAmount }: QuickAmountsProps) => {
  const quickAmounts = [15, 20, 25, 30, 35, 40, 50, 60, 80, 100];
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          סכומים מהירים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {quickAmounts.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              className="h-10 text-xs hover-scale"
              onClick={() => onSelectAmount(amount)}
            >
              ₪{amount}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AddTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrip: (amount: number) => void;
}

export const AddTripDialog = ({ isOpen, onClose, onAddTrip }: AddTripDialogProps) => {
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "שגיאה",
        description: "אנא הזן סכום תקין",
        variant: "destructive"
      });
      return;
    }

    onAddTrip(numAmount);
    setAmount("");
    toast({
      title: "נסיעה נוספה!",
      description: `נוספו ₪${numAmount} להכנסות היום`,
    });
  };

  const quickAmounts = [20, 30, 40, 50, 60, 80, 100];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-sm mx-auto rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">הוספת נסיעה</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              סכום בשקלים
            </label>
            <Input
              type="number"
              placeholder="הזן סכום..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-xl text-center h-14 touch-manipulation"
              dir="ltr"
              autoFocus
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              סכומים מהירים
            </label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="h-12 touch-manipulation"
                >
                  ₪{quickAmount}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 touch-manipulation"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 bg-gradient-to-r from-primary to-blue-500 touch-manipulation"
            >
              הוסף נסיעה
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
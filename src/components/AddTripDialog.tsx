import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";

interface AddTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrip: (amount: number, paymentMethod: string) => void;
}

export const AddTripDialog = ({ isOpen, onClose, onAddTrip }: AddTripDialogProps) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const { toast } = useToast();
  const { allPaymentOptions } = useCustomPaymentTypes();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "שגיאה",
        description: "אנא הזן סכום תקין",
        variant: "destructive"
      });
      return;
    }

    onAddTrip(parsedAmount, paymentMethod);
    setAmount("");
    setPaymentMethod("cash");
    onClose();
    toast({
      title: "נסיעה נוספה",
      description: `נוספה נסיעה בסכום ₪${parsedAmount} (${paymentMethod})`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-sm mx-auto rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">הוספת נסיעה</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-base">סכום הנסיעה</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="הכנס סכום"
              className="text-xl text-center h-14"
              dir="ltr"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">אמצעי תשלום</Label>
            <div className="grid grid-cols-2 gap-2">
              {allPaymentOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={paymentMethod === option.value ? "default" : "outline"}
                  onClick={() => setPaymentMethod(option.value)}
                  className="text-sm h-10"
                >
                  {option.label}
                  {option.isCustom && 'commissionRate' in option && typeof option.commissionRate === 'number' && option.commissionRate !== 0 && (
                    <span className="mr-1 text-xs">
                      {option.commissionRate > 0 ? `(-${option.commissionRate * 100}%)` : `(+${Math.abs(option.commissionRate) * 100}%)`}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base">סכומים מהירים</Label>
            <div className="grid grid-cols-3 gap-2">
              {[20, 30, 40, 50, 60, 80].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onAddTrip(quickAmount, paymentMethod);
                    setAmount("");
                    setPaymentMethod("cash");
                    onClose();
                    toast({
                      title: "נסיעה נוספה",
                      description: `נוספה נסיעה בסכום ₪${quickAmount} (${paymentMethod})`,
                    });
                  }}
                  className="text-base h-12"
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
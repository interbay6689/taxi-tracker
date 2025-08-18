import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AddFuelDialogProps {
  /**
   * Whether the dialog is open. When false the dialog is hidden.
   */
  isOpen: boolean;
  /**
   * Called when the dialog should be closed. The parent component should
   * toggle the `isOpen` prop accordingly.
   */
  onClose: () => void;
  /**
   * Called when the user submits a valid fuel amount. Receives the parsed
   * numeric amount in shekels. Should return void or a promise. The parent
   * component can handle adding the expense and showing additional feedback.
   */
  onAddFuel: (amount: number) => void;
}

/**
 * A simple dialog that prompts the user to enter a fuel expense amount. If the
 * amount entered is invalid (not a positive number) an error toast is
 * displayed. Otherwise, the value is passed back via the `onAddFuel`
 * callback. The dialog automatically closes after a successful submission.
 */
export const AddFuelDialog = ({ isOpen, onClose, onAddFuel }: AddFuelDialogProps) => {
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "שגיאה",
        description: "אנא הזן סכום דלק תקין",
        variant: "destructive",
      });
      return;
    }
    // Invoke the callback with the parsed amount
    onAddFuel(parsedAmount);
    setAmount("");
    onClose();
    toast({
      title: "הוצאה נרשמה",
      description: `נוסף תדלוק בסכום ₪${parsedAmount.toFixed(2)}`,
      variant: "default",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent aria-describedby="add-fuel-desc">
        <DialogHeader>
          <DialogTitle>הוספת הוצאת דלק</DialogTitle>
          <p id="add-fuel-desc" className="sr-only">טופס להוספת הוצאת דלק בסכום כסף.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="fuelAmount">סכום (₪)</Label>
            <Input
              id="fuelAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="הזן סכום"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" className="">הוסף</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
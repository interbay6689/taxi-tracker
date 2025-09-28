import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface QuickCasualTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrip: (amount: number, paymentMethod: string, tag?: string) => void;
  disabled?: boolean;
  paymentMethodOverride?: string;
}

export const QuickCasualTripDialog = ({
  isOpen,
  onClose,
  onAddTrip,
  disabled = false,
  paymentMethodOverride
}: QuickCasualTripDialogProps) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'מזומן' | 'אשראי'>('מזומן');
  const { toast } = useToast();

  // Update payment method when override changes
  useEffect(() => {
    if (paymentMethodOverride) {
      // For override, we'll use it directly in the submit function
      return;
    }
  }, [paymentMethodOverride]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס סכום תקין",
        variant: "destructive"
      });
      return;
    }

    // Use override payment method if provided, otherwise use selected method
    const finalPaymentMethod = paymentMethodOverride || paymentMethod;
    
    try {
      await onAddTrip(numAmount, finalPaymentMethod, paymentMethodOverride ? undefined : 'מזדמן');
      setAmount('');
      setPaymentMethod('מזומן');
      onClose();
      
      toast({
        title: paymentMethodOverride ? `נסיעה ${paymentMethodOverride} נוספה!` : "נסיעה מזדמנת נוספה!",
        description: `נסיעה בסך ${numAmount} ₪ נוספה בהצלחה`,
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת הנסיעה",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {paymentMethodOverride ? `נסיעה ${paymentMethodOverride}` : 'נסיעה מזדמנת'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-medium">
              סכום (₪)
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="הכנס סכום"
              className="text-lg h-12 text-center"
              disabled={disabled}
              min="0"
              step="0.01"
              autoFocus
            />
          </div>

          {/* Only show payment method selection if no override */}
          {!paymentMethodOverride && (
            <div className="space-y-3">
              <Label className="text-base font-medium">אמצעי תשלום</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={paymentMethod === 'מזומן' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('מזומן')}
                  className="h-12 text-base"
                  disabled={disabled}
                >
                  💵 מזומן
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'אשראי' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('אשראי')}
                  className="h-12 text-base"
                  disabled={disabled}
                >
                  💳 אשראי
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12"
              disabled={disabled}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              disabled={disabled || !amount}
            >
              הוסף נסיעה
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
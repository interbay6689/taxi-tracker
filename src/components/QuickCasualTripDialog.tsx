import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface QuickCasualTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrip: (amount: number, paymentMethod: string, orderSource: string, tag?: string) => void;
  disabled?: boolean;
  orderSourceOverride?: string;
  defaultPaymentMethod?: 'מזומן' | 'אשראי' | 'ביט';
}

export const QuickCasualTripDialog = ({
  isOpen,
  onClose,
  onAddTrip,
  disabled = false,
  orderSourceOverride,
  defaultPaymentMethod
}: QuickCasualTripDialogProps) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'מזומן' | 'אשראי' | 'ביט'>(defaultPaymentMethod || 'מזומן');
  const { toast } = useToast();

  // Update payment method when dialog opens with defaultPaymentMethod
  useEffect(() => {
    if (isOpen && defaultPaymentMethod) {
      setPaymentMethod(defaultPaymentMethod);
    }
  }, [isOpen, defaultPaymentMethod]);

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

    const orderSource = orderSourceOverride || 'מזדמן';
    
    try {
      await onAddTrip(numAmount, paymentMethod, orderSource);
      setAmount('');
      setPaymentMethod('מזומן');
      onClose();
      
      toast({
        title: `נסיעה ${orderSource} נוספה!`,
        description: `נסיעה בסך ${numAmount} ₪ (${paymentMethod}) נוספה בהצלחה`,
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
            {orderSourceOverride ? `נסיעה ${orderSourceOverride}` : 'נסיעה מזדמנת'}
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

          <div className="space-y-3">
            <Label className="text-base font-medium">אמצעי תשלום</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={paymentMethod === 'מזומן' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('מזומן')}
                className="h-12 text-sm"
                disabled={disabled}
              >
                💵 מזומן
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'אשראי' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('אשראי')}
                className="h-12 text-sm"
                disabled={disabled}
              >
                💳 אשראי
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'ביט' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('ביט')}
                className="h-12 text-sm"
                disabled={disabled}
              >
                📱 ביט
              </Button>
            </div>
          </div>

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
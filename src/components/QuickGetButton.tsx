import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Car, CreditCard, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickGetButtonProps {
  onAddTrip: (amount: number, paymentMethod: string, orderSource: string) => void;
  disabled?: boolean;
}

export const QuickGetButton = ({ onAddTrip, disabled }: QuickGetButtonProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('מזומן');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'שגיאה',
        description: 'הזן סכום תקין',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      await onAddTrip(parsedAmount, paymentMethod, 'גט');
      setAmount('');
      setIsOpen(false);
      toast({
        title: 'נסיעה גט נוספה! 🚗',
        description: `₪${parsedAmount} • ${paymentMethod === 'מזומן' ? '💵 מזומן' : paymentMethod === 'אשראי' ? '💳 אשראי' : '📱 ביט'}`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף נסיעה',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const resetAndClose = () => {
    setAmount('');
    setPaymentMethod('מזומן');
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        size="lg"
        className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-primary to-green-500 hover:from-primary/90 hover:to-green-500/90 shadow-lg"
      >
        <Car className="mr-3 h-8 w-8" />
        GET
      </Button>

      <Dialog open={isOpen} onOpenChange={resetAndClose}>
        <DialogContent className="w-[95vw] max-w-sm mx-auto rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              הוספת נסיעה מהירה
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-3">
              <Label htmlFor="quick-amount" className="text-lg font-medium">
                סכום הנסיעה
              </Label>
              <Input
                id="quick-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="הזן סכום..."
                className="text-2xl text-center h-16 font-bold"
                dir="ltr"
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-medium">אמצעי תשלום</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'מזומן' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('מזומן')}
                  className="h-14 text-sm"
                >
                  <Banknote className="mr-1 h-5 w-5" />
                  מזומן
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'אשראי' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('אשראי')}
                  className="h-14 text-sm"
                >
                  <CreditCard className="mr-1 h-5 w-5" />
                  אשראי
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'ביט' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('ביט')}
                  className="h-14 text-sm"
                >
                  📱
                  ביט
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetAndClose}
                className="flex-1 h-14 text-lg"
                disabled={isAdding}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                className="flex-1 h-14 text-lg bg-gradient-to-r from-primary to-green-500 font-bold"
                disabled={!amount || isAdding}
              >
                {isAdding ? 'מוסיף...' : 'הוסף נסיעה'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
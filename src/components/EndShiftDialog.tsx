import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface EndShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentMethod: string, amount: number) => void;
}

export const EndShiftDialog: React.FC<EndShiftDialogProps> = ({ isOpen, onClose, onSubmit }) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!paymentMethod) {
      toast({
        title: "שגיאה",
        description: "יש לבחור אופן תשלום",
        variant: "destructive"
      });
      return;
    }

    const numAmount = parseFloat(amount) || 0;
    onSubmit(paymentMethod, numAmount);
    setPaymentMethod('');
    setAmount('');
    onClose();
  };

  const handleSkip = () => {
    onSubmit('', 0);
    setPaymentMethod('');
    setAmount('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>סיום משמרת</DialogTitle>
          <DialogDescription>
            הוסף הוצאות נוספות למשמרת זו (אופציונלי)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="paymentMethod">אופן התשלום</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="בחר אופן תשלום" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fuel">דלק</SelectItem>
                <SelectItem value="maintenance">תחזוקה</SelectItem>
                <SelectItem value="food">אוכל</SelectItem>
                <SelectItem value="parking">חניה</SelectItem>
                <SelectItem value="other">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">סכום (₪)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="הזן סכום"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              שמור וסיים משמרת
            </Button>
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              דלג וסיים משמרת
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
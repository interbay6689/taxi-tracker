import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, Clock, Target, TrendingUp, CreditCard, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCustomPaymentTypes } from '@/hooks/useCustomPaymentTypes';
import { Trip } from '@/hooks/useDatabase';

interface QuickTripDashboardProps {
  currentWorkDay: any;
  shiftTrips: Trip[];
  shiftIncomeGross: number;
  shiftTripsCount: number;
  dailyGoals: { income_goal: number; trips_goal: number };
  onAddTrip: (amount: number, paymentMethod: string, tag?: string) => void;
  tripsToday: Trip[];
}

const QUICK_TAGS = ['שדה', 'תחנה', 'הזמנה', 'שדה תעופה'];

export const QuickTripDashboard = ({
  currentWorkDay,
  shiftTrips,
  shiftIncomeGross,
  shiftTripsCount,
  dailyGoals,
  onAddTrip,
  tripsToday = []
}: QuickTripDashboardProps) => {
  const { toast } = useToast();
  const { allPaymentOptions } = useCustomPaymentTypes();
  
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [isAdding, setIsAdding] = useState(false);

  // חישוב סכומים מהירים בהתבסס על נסיעות קודמות
  const quickAmounts = useMemo(() => {
    const recentAmounts = tripsToday
      .map(trip => trip.amount)
      .filter(amount => amount > 0);
    
    const uniqueAmounts = Array.from(new Set(recentAmounts))
      .sort((a, b) => b - a)
      .slice(0, 8);
    
    return uniqueAmounts.length > 0 
      ? uniqueAmounts 
      : [20, 25, 30, 35, 40, 50, 60, 80];
  }, [tripsToday]);

  // התקדמות יעדים
  const incomeProgress = Math.min((shiftIncomeGross / dailyGoals.income_goal) * 100, 100);
  const tripsProgress = Math.min((shiftTripsCount / dailyGoals.trips_goal) * 100, 100);

  const handleQuickTrip = async (amount: number) => {
    if (isAdding) return;
    setIsAdding(true);
    
    try {
      await onAddTrip(amount, selectedPayment, selectedTag);
      toast({
        title: 'נסיעה נוספה! 🚗',
        description: `₪${amount} • ${getPaymentLabel(selectedPayment)}`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף נסיעה',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const handleCustomTrip = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'שגיאה',
        description: 'הזן סכום תקין',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onAddTrip(amount, selectedPayment, selectedTag);
      setCustomAmount('');
      toast({
        title: 'נסיעה נוספה! 🚗',
        description: `₪${amount} • ${getPaymentLabel(selectedPayment)}`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף נסיעה',
        variant: 'destructive',
      });
    }
  };

  const getPaymentLabel = (method: string) => {
    const option = allPaymentOptions.find(opt => opt.value === method);
    return option?.label || method;
  };

  const getPaymentIcon = (method: string) => {
    if (method === 'cash') return <Banknote className="h-4 w-4" />;
    return <CreditCard className="h-4 w-4" />;
  };

  if (!currentWorkDay) {
    return (
      <Card className="text-center p-8">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">אין משמרת פעילה</h3>
        <p className="text-muted-foreground">התחל משמרת כדי להוסיף נסיעות</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* סיכום משמרת מהיר */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">₪{shiftIncomeGross.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">הכנסות משמרת</div>
              <div className="progress-bar w-full h-2 mt-1">
                <div 
                  className="progress-fill"
                  style={{ width: `${incomeProgress}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{shiftTripsCount}</div>
              <div className="text-sm text-muted-foreground">נסיעות</div>
              <div className="progress-bar w-full h-2 mt-1">
                <div 
                  className="progress-fill"
                  style={{ width: `${tripsProgress}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* בחירת אמצעי תשלום ותיוג */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <Select value={selectedPayment} onValueChange={setSelectedPayment}>
              <SelectTrigger className="flex-1">
                <div className="flex items-center gap-2">
                  {getPaymentIcon(selectedPayment)}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {allPaymentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(option.value)}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* תיוגים מהירים */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(undefined)}
              className="h-7 px-2 text-xs"
            >
              ללא תיוג
            </Button>
            {QUICK_TAGS.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(tag)}
                className="h-7 px-2 text-xs"
              >
                {tag}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* סכומים מהירים */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            הוספה מהירה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className={`quick-amount-btn h-12 text-base ${isAdding ? 'success-pulse' : ''}`}
                onClick={() => handleQuickTrip(amount)}
                disabled={isAdding}
              >
                ₪{amount}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* הוספת סכום מותאם */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            סכום מותאם
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="הזן סכום..."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 text-center text-lg h-12"
              dir="ltr"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomTrip();
                }
              }}
            />
            <Button 
              onClick={handleCustomTrip}
              disabled={!customAmount}
              className="h-12 px-6 bg-gradient-to-r from-primary to-blue-500"
            >
              הוסף
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* יעדים מהירים */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span>יעד הכנסות:</span>
              <Badge variant={incomeProgress >= 100 ? "default" : "secondary"}>
                ₪{shiftIncomeGross} / ₪{dailyGoals.income_goal}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>יעד נסיעות:</span>
              <Badge variant={tripsProgress >= 100 ? "default" : "secondary"}>
                {shiftTripsCount} / {dailyGoals.trips_goal}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
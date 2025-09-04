import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Zap, Target, TrendingUp, CreditCard, Banknote, Play, CheckCircle2, CircleSlash, Car, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCustomPaymentTypes } from '@/hooks/useCustomPaymentTypes';
import { Trip } from '@/hooks/useDatabase';

interface UnifiedDashboardProps {
  currentWorkDay: any;
  shiftTrips: Trip[];
  shiftIncomeGross: number;
  shiftTripsCount: number;
  totalIncomeToday: number;
  totalTripsToday: number;
  dailyGoals: { income_goal: number; trips_goal: number };
  onAddTrip: (amount: number, paymentMethod: string, tag?: string) => void;
  onStartShift: () => void;
  onEndShift: () => void;
  onPauseShift: () => void;
  tripsToday: Trip[];
  loading?: boolean;
}

const QUICK_TAGS = ['שדה', 'תחנה', 'הזמנה', 'שדה תעופה'];

export const UnifiedDashboard = ({
  currentWorkDay,
  shiftTrips,
  shiftIncomeGross,
  shiftTripsCount,
  totalIncomeToday,
  totalTripsToday,
  dailyGoals,
  onAddTrip,
  onStartShift,
  onEndShift,
  onPauseShift,
  tripsToday = [],
  loading = false
}: UnifiedDashboardProps) => {
  const { toast } = useToast();
  const { allPaymentOptions } = useCustomPaymentTypes();
  
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [isAdding, setIsAdding] = useState(false);

  // חישוב סכומים מהירים חכמים
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

    if (isAdding) return;
    setIsAdding(true);

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
    } finally {
      setTimeout(() => setIsAdding(false), 500);
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
      <div className="space-y-6">
        {/* סיכום יומי ללא משמרת */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">₪{totalIncomeToday.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">הכנסות היום</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">{totalTripsToday}</div>
                <div className="text-sm text-muted-foreground">נסיעות היום</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* התחלת משמרת */}
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Car className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">התחל משמרת חדשה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              כדי להתחיל לרשום נסיעות, תחילה צריך להתחיל משמרת
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                זמן התחלה יירשם אוטומטית
              </div>
            </div>

            <Button 
              onClick={onStartShift}
              size="lg"
              className="w-full h-16 text-xl bg-gradient-to-r from-primary to-blue-500"
              disabled={loading}
            >
              <Play className="mr-3 h-6 w-6" />
              {loading ? 'מתחיל משמרת...' : 'התחל משמרת'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* סיכום משמרת ויעדים */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 text-center mb-6">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">₪{shiftIncomeGross.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mb-3">הכנסות משמרת</div>
              <div className="progress-bar h-3">
                <div 
                  className="progress-fill"
                  style={{ width: `${incomeProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                יעד: ₪{dailyGoals.income_goal.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">{shiftTripsCount}</div>
              <div className="text-sm text-muted-foreground mb-3">נסיעות משמרת</div>
              <div className="progress-bar h-3">
                <div 
                  className="progress-fill"
                  style={{ width: `${tripsProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                יעד: {dailyGoals.trips_goal} נסיעות
              </div>
            </div>
          </div>

          {/* פעולות משמרת */}
          <div className="flex gap-3">
            <Button onClick={onPauseShift} variant="secondary" className="flex-1">
              <CircleSlash className="mr-2 h-4 w-4" />
              השהה
            </Button>
            <Button onClick={onEndShift} variant="destructive" className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              סיים משמרת
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* בחירת תשלום ותיוגים */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <Select value={selectedPayment} onValueChange={setSelectedPayment}>
            <SelectTrigger className="h-12">
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

          {/* תיוגים מהירים */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(undefined)}
              className="h-8 px-3 text-sm"
            >
              ללא תיוג
            </Button>
            {QUICK_TAGS.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(tag)}
                className="h-8 px-3 text-sm"
              >
                {tag}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* הוספת נסיעה מהירה */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            הוספת נסיעה מהירה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* סכומים מהירים */}
          <div className="grid grid-cols-4 gap-3">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className={`quick-amount-btn h-16 text-lg ${isAdding ? 'success-pulse' : ''}`}
                onClick={() => handleQuickTrip(amount)}
                disabled={isAdding}
              >
                ₪{amount}
              </Button>
            ))}
          </div>

          <Separator />

          {/* סכום מותאם */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">סכום מותאם</div>
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="הזן סכום..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 text-center text-xl h-14"
                dir="ltr"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomTrip();
                  }
                }}
              />
              <Button 
                onClick={handleCustomTrip}
                disabled={!customAmount || isAdding}
                className="h-14 px-8 bg-gradient-to-r from-primary to-blue-500 text-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                הוסף
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* יעדים ונתונים מהירים */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ממוצע לנסיעה:</span>
              <Badge variant="secondary">
                ₪{shiftTripsCount > 0 ? Math.round(shiftIncomeGross / shiftTripsCount) : 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">יעדים הושגו:</span>
              <div className="flex gap-1">
                <Badge variant={incomeProgress >= 100 ? "default" : "secondary"}>
                  הכנסות {Math.round(incomeProgress)}%
                </Badge>
                <Badge variant={tripsProgress >= 100 ? "default" : "secondary"}>
                  נסיעות {Math.round(tripsProgress)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Fuel, Wrench, CreditCard } from 'lucide-react';
import { DailyExpenses } from "@/hooks/useDatabase";

interface ExpensesTabProps {
  expenses: DailyExpenses;
  setExpenses: (expenses: DailyExpenses) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ expenses, setExpenses }) => {
  return (
    <div className="space-y-4">

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            תחזוקה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="maintenance">עלות תחזוקה יומית (₪)</Label>
          <Input
            id="maintenance"
            type="number"
            placeholder="הזן עלות תחזוקה"
            value={expenses.maintenance}
            onChange={(e) => setExpenses({
              ...expenses,
              maintenance: Number(e.target.value) || 0
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            הוצאות אחרות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="other">הוצאות נוספות יומיות (₪)</Label>
          <Input
            id="other"
            type="number"
            placeholder="הזן הוצאות נוספות"
            value={expenses.other}
            onChange={(e) => setExpenses({
              ...expenses,
              other: Number(e.target.value) || 0
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            מחיר פיקס יומי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="daily_fixed_price">מחיר פיקס יומי (₪)</Label>
          <Input
            id="daily_fixed_price"
            type="number"
            placeholder="הזן עלות פיקס יומית"
            value={expenses.daily_fixed_price ?? 0}
            onChange={(e) => setExpenses({
              ...expenses,
              daily_fixed_price: Number(e.target.value) || 0,
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>סיכום הוצאות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 text-lg">
            <div className="flex justify-between items-center">
              <span>סה"כ הוצאות יומיות:</span>
              <span className="font-bold">
                ₪{(
                  (expenses.maintenance || 0) +
                  (expenses.other || 0) +
                  (expenses.daily_fixed_price || 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>הוצאה חודשית (משוער):</span>
              <span>
                ₪{(() => {
                  const now = new Date();
                  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                  const monthly = (expenses.daily_fixed_price || 0) * daysInMonth;
                  return monthly.toLocaleString();
                })()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
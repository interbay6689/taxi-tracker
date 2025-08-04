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
            <Fuel className="h-5 w-5" />
            דלק
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="fuel">עלות דלק יומית (₪)</Label>
          <Input
            id="fuel"
            type="number"
            placeholder="הזן עלות דלק"
            value={expenses.fuel}
            onChange={(e) => setExpenses({
              ...expenses,
              fuel: Number(e.target.value) || 0
            })}
          />
        </CardContent>
      </Card>

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
          <CardTitle>סיכום הוצאות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-lg">
            <span>סה"כ הוצאות יומיות:</span>
            <span className="font-bold">₪{(expenses.fuel + expenses.maintenance + expenses.other).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Fuel, Wrench, CreditCard, Save, RotateCcw } from 'lucide-react';
import { DailyExpenses } from "@/hooks/useDatabase";

interface ExpensesTabProps {
  expenses: DailyExpenses;
  setExpenses: (expenses: DailyExpenses) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ expenses, setExpenses }) => {
  const [localExpenses, setLocalExpenses] = useState<DailyExpenses>(expenses);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalExpenses(expenses);
    setHasChanges(false);
  }, [expenses]);

  useEffect(() => {
    const hasChanged = 
      localExpenses.maintenance !== expenses.maintenance ||
      localExpenses.other !== expenses.other ||
      localExpenses.daily_fixed_price !== expenses.daily_fixed_price;
    setHasChanges(hasChanged);
  }, [localExpenses, expenses]);

  const handleSave = () => {
    setExpenses(localExpenses);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setLocalExpenses(expenses);
    setHasChanges(false);
  };
  return (
    <div className="space-y-4">
      {/* כפתורי שמירה וביטול */}
      {hasChanges && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">יש לך שינויים שלא נשמרו</span>
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  שמור
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  ביטול
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            value={localExpenses.maintenance}
            onChange={(e) => setLocalExpenses({
              ...localExpenses,
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
            value={localExpenses.other}
            onChange={(e) => setLocalExpenses({
              ...localExpenses,
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
            value={localExpenses.daily_fixed_price ?? 0}
            onChange={(e) => setLocalExpenses({
              ...localExpenses,
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
                  (localExpenses.maintenance || 0) +
                  (localExpenses.other || 0) +
                  (localExpenses.daily_fixed_price || 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>הוצאה חודשית (משוער):</span>
              <span>
                ₪{(() => {
                  const now = new Date();
                  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                  const monthly = (localExpenses.daily_fixed_price || 0) * daysInMonth;
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
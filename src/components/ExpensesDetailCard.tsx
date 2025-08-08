import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fuel, Wrench, CreditCard, Receipt, Calendar } from "lucide-react";
import { DailyExpenses, ShiftExpense } from "@/hooks/useDatabase";

interface ExpensesDetailCardProps {
  dailyExpenses: DailyExpenses;
  shiftExpenses: ShiftExpense[];
}

export const ExpensesDetailCard = ({ dailyExpenses, shiftExpenses }: ExpensesDetailCardProps) => {
  const dailyTotal = (dailyExpenses.maintenance || 0) + 
                     (dailyExpenses.other || 0) + 
                     (dailyExpenses.daily_fixed_price || 0);
  
  const shiftTotal = shiftExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalExpenses = dailyTotal + shiftTotal;

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'fuel':
        return <Fuel className="h-3 w-3" />;
      default:
        return <Receipt className="h-3 w-3" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'fuel':
        return 'דלק';
      default:
        return method;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          פירוט הוצאות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* הוצאות יומיות */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <Calendar className="h-4 w-4" />
            הוצאות יומיות
          </div>
          
          {dailyExpenses.maintenance > 0 && (
            <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">תחזוקה</span>
              </div>
              <span className="font-medium">₪{dailyExpenses.maintenance.toLocaleString()}</span>
            </div>
          )}
          
          {dailyExpenses.other > 0 && (
            <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">אחרות</span>
              </div>
              <span className="font-medium">₪{dailyExpenses.other.toLocaleString()}</span>
            </div>
          )}
          
          {(dailyExpenses.daily_fixed_price || 0) > 0 && (
            <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">מחיר פיקס יומי</span>
              </div>
              <span className="font-medium">₪{(dailyExpenses.daily_fixed_price || 0).toLocaleString()}</span>
            </div>
          )}

          {dailyTotal === 0 && (
            <div className="text-center p-3 text-muted-foreground text-sm">
              אין הוצאות יומיות
            </div>
          )}
        </div>

        {/* הוצאות משמרת */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <Receipt className="h-4 w-4" />
            הוצאות משמרת
          </div>
          
          {shiftExpenses.length > 0 ? (
            shiftExpenses.map((expense) => (
              <div key={expense.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(expense.payment_method)}
                  <div className="flex flex-col">
                    <span className="text-sm">{getPaymentMethodLabel(expense.payment_method)}</span>
                    {expense.description && (
                      <span className="text-xs text-muted-foreground">{expense.description}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">₪{expense.amount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(expense.created_at).toLocaleTimeString('he-IL')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-3 text-muted-foreground text-sm">
              אין הוצאות משמרת
            </div>
          )}
        </div>

        {/* סיכום */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between items-center font-medium">
            <span>סה"כ הוצאות יומיות:</span>
            <Badge variant="outline">₪{dailyTotal.toLocaleString()}</Badge>
          </div>
          <div className="flex justify-between items-center font-medium">
            <span>סה"כ הוצאות משמרת:</span>
            <Badge variant="outline">₪{shiftTotal.toLocaleString()}</Badge>
          </div>
          <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
            <span>סה"כ הוצאות:</span>
            <Badge variant="destructive">₪{totalExpenses.toLocaleString()}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
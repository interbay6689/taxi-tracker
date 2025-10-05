import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpensesTab } from '@/components/settings/ExpensesTab';
import { Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/ui/help-tooltip';

const Expenses = () => {
  const { user, loading: authLoading } = useAuth();
  const { dailyExpenses, updateExpenses, loading } = useDatabase();

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Receipt className="h-6 w-6 text-primary" />
            הוצאות קבועות
            <HelpTooltip content="הגדר הוצאות יומיות קבועות כמו דלק, תחזוקה ועוד" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpensesTab expenses={dailyExpenses} setExpenses={updateExpenses} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;

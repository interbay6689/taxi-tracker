import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShiftHistoryTab } from '@/components/analytics/ShiftHistoryTab';
import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/ui/help-tooltip';

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const { trips, workDays, loading } = useDatabase();

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
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Clock className="h-6 w-6 text-primary" />
            היסטוריית משמרות
            <HelpTooltip content="צפה בכל המשמרות שלך והנסיעות שבוצעו בכל משמרת" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ShiftHistoryTab trips={trips} workDays={workDays} />
        </CardContent>
      </Card>
    </div>
  );
};

export default History;

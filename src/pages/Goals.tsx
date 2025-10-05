import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalsTab } from '@/components/settings/GoalsTab';
import { Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/ui/help-tooltip';

const Goals = () => {
  const { user, loading: authLoading } = useAuth();
  const { dailyGoals, updateGoals, loading } = useDatabase();

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
            <Target className="h-6 w-6 text-primary" />
            יעדים
            <HelpTooltip content="הגדר יעדים יומיים, שבועיים וחודשיים להכנסות ומספר נסיעות" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GoalsTab goals={dailyGoals} setGoals={updateGoals} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;

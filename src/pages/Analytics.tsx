import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { Navigate } from 'react-router-dom';
import { AnalyticsTab } from '@/components/analytics/AnalyticsTab';
import { QuickStatsBar } from '@/components/dashboard/QuickStatsBar';
import { Skeleton } from '@/components/ui/skeleton';

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const { trips, loading } = useDatabase();

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayTrips = trips.filter(
      trip => new Date(trip.timestamp).toDateString() === today
    );
    const totalIncome = todayTrips.reduce((sum, trip) => sum + trip.amount, 0);
    const avgPerTrip = todayTrips.length > 0 ? totalIncome / todayTrips.length : 0;

    return {
      dailyIncome: totalIncome,
      dailyTrips: todayTrips.length,
      avgPerTrip
    };
  }, [trips]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">אנליטיקה</h1>
      </div>

      <QuickStatsBar
        dailyIncome={todayStats.dailyIncome}
        dailyTrips={todayStats.dailyTrips}
        avgPerTrip={todayStats.avgPerTrip}
      />

      <AnalyticsTab trips={trips} />
    </div>
  );
};

export default Analytics;

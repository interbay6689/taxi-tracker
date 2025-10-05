import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { Navigate } from 'react-router-dom';
import { ReportsExport } from '@/components/ReportsExport';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const { trips, workDays, loading } = useDatabase();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

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
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">דוחות וייצוא</h1>
      </div>

      <ReportsExport
        trips={trips}
        workDays={workDays}
        selectedPeriod={selectedPeriod}
        customDateRange={customDateRange}
        onPeriodChange={setSelectedPeriod}
        onCustomDateRangeChange={setCustomDateRange}
      />
    </div>
  );
};

export default Reports;

import React from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/date-range-picker';

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

interface AnalyticsPeriodSelectorProps {
  selectedPeriod: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  customDateRange?: DateRange | undefined;
  onCustomDateRangeChange: (dateRange: DateRange | undefined) => void;
}

export const AnalyticsPeriodSelector: React.FC<AnalyticsPeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  customDateRange,
  onCustomDateRangeChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>תקופת זמן</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 grid-cols-4 md:grid-cols-auto">
        <Button
          variant={selectedPeriod === 'today' ? 'default' : 'outline'}
          onClick={() => onPeriodChange('today')}
        >
          היום
        </Button>
        <Button
          variant={selectedPeriod === 'week' ? 'default' : 'outline'}
          onClick={() => onPeriodChange('week')}
        >
          השבוע
        </Button>
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          onClick={() => onPeriodChange('month')}
        >
          החודש
        </Button>
        <Button
          variant={selectedPeriod === 'year' ? 'default' : 'outline'}
          onClick={() => onPeriodChange('year')}
        >
          השנה
        </Button>
        <Button
          variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
          onClick={() => onPeriodChange('custom')}
        >
          תקופה מותאמת
        </Button>
      </CardContent>
      
      {/* Custom Date Range Picker */}
      {selectedPeriod === 'custom' && (
        <CardContent className="pt-0">
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="text-sm font-medium mb-3">בחר טווח תאריכים:</h4>
            <DateRangePicker
              date={customDateRange}
              onDateChange={onCustomDateRangeChange}
              placeholder="בחר טווח תאריכים"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
};
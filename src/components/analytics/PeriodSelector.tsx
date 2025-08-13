import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type TimePeriod = 'today' | 'week' | 'month';

interface PeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ 
  selectedPeriod, 
  onPeriodChange 
}) => {
  return (
    <Tabs value={selectedPeriod} onValueChange={onPeriodChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="today" className="text-xs">היום</TabsTrigger>
        <TabsTrigger value="week" className="text-xs">השבוע</TabsTrigger>
        <TabsTrigger value="month" className="text-xs">החודש</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GoalsPeriodSelectorProps {
  selectedPeriod: 'daily' | 'weekly' | 'monthly';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void;
}

export const GoalsPeriodSelector: React.FC<GoalsPeriodSelectorProps> = ({ 
  selectedPeriod, 
  onPeriodChange 
}) => {
  return (
    <Tabs value={selectedPeriod} onValueChange={onPeriodChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="daily" className="text-xs">יומי</TabsTrigger>
        <TabsTrigger value="weekly" className="text-xs">שבועי</TabsTrigger>
        <TabsTrigger value="monthly" className="text-xs">חודשי</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
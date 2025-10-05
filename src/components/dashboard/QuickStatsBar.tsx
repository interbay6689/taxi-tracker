import React from 'react';
import { DollarSign, Car, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickStatsBarProps {
  dailyIncome: number;
  dailyTrips: number;
  avgPerTrip: number;
  shiftTime?: string;
  className?: string;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  dailyIncome,
  dailyTrips,
  avgPerTrip,
  shiftTime,
  className
}) => {
  const stats = [
    {
      icon: DollarSign,
      label: 'הכנסות היום',
      value: `₪${dailyIncome.toLocaleString()}`,
      color: 'text-primary'
    },
    {
      icon: Car,
      label: 'נסיעות היום',
      value: dailyTrips.toString(),
      color: 'text-foreground'
    },
    {
      icon: TrendingUp,
      label: 'ממוצע לנסיעה',
      value: `₪${avgPerTrip.toFixed(0)}`,
      color: 'text-success'
    },
    ...(shiftTime ? [{
      icon: Clock,
      label: 'זמן משמרת',
      value: shiftTime,
      color: 'text-info'
    }] : [])
  ];

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3 mb-6', className)}>
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="border-border/50 shadow-sm hover:shadow-md transition-shadow animate-fade-slide-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className={cn('text-lg font-bold truncate', stat.color)}>
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

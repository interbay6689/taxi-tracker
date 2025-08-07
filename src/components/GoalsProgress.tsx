import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Car, DollarSign } from "lucide-react";
import { GoalsPeriodSelector } from './GoalsPeriodSelector';

/**
 * Props for the GoalsProgress component.  This component displays
 * progress toward income goals over different periods (daily,
 * weekly, monthly) as well as a separate progress bar for
 * monthly trip goals.  If weekly or monthly income data is not
 * provided the component will fall back to zero values.
 */
interface GoalsProgressProps {
  /** Percentage of the daily income goal that has been met (0–100). */
  incomeProgress: number;
  /** Percentage of the monthly trips goal that has been met (0–100). */
  tripsProgress: number;
  /** Gross income for the current day (shift). */
  currentIncome: number;
  /** Number of trips completed in the current month. */
  currentTrips: number;
  /** Daily income goal. */
  incomeGoal: number;
  /** Monthly trips goal. */
  tripsGoal: number;
  /** Gross income accumulated this week. */
  weeklyIncome?: number;
  /** Gross income accumulated this month. */
  monthlyIncome?: number;
  /** Weekly income goal. */
  weeklyGoal?: number;
  /** Monthly income goal. */
  monthlyGoal?: number;
}

export const GoalsProgress = ({
  incomeProgress,
  tripsProgress,
  currentIncome,
  currentTrips,
  incomeGoal,
  tripsGoal,
  weeklyIncome = 0,
  monthlyIncome = 0,
  weeklyGoal = 0,
  monthlyGoal = 0,
}: GoalsProgressProps) => {
  // Selected period for the income progress (does not affect trips progress).
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Determine the data to display based on the selected period.  If no
  // goals or income values are provided the component falls back to
  // zeros.  The label is used in the UI to indicate which period is
  // currently shown.
  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return {
          income: weeklyIncome,
          goal: weeklyGoal,
          progress: weeklyGoal > 0 ? (weeklyIncome / weeklyGoal) * 100 : 0,
          remaining: Math.max(0, weeklyGoal - weeklyIncome),
          label: 'שבועי',
        };
      case 'monthly':
        return {
          income: monthlyIncome,
          goal: monthlyGoal,
          progress: monthlyGoal > 0 ? (monthlyIncome / monthlyGoal) * 100 : 0,
          remaining: Math.max(0, monthlyGoal - monthlyIncome),
          label: 'חודשי',
        };
      default:
        return {
          income: currentIncome,
          goal: incomeGoal,
          progress: incomeProgress,
          remaining: Math.max(0, incomeGoal - currentIncome),
          label: 'משמרת',
        };
    }
  };

  const currentData = getCurrentData();
  const remainingTrips = Math.max(0, tripsGoal - currentTrips);
  const isIncomeGoalMet = currentData.income >= currentData.goal;
  const isTripsGoalMet = currentTrips >= tripsGoal;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          התקדמות יעדים
        </CardTitle>
        <GoalsPeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Income progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="font-medium">יעד הכנסות ({currentData.label})</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(currentData.progress)}%
            </div>
          </div>
          <Progress value={currentData.progress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              ₪{currentData.income.toLocaleString()} / ₪{currentData.goal.toLocaleString()}
            </span>
            <span>
              {isIncomeGoalMet
                ? 'יעד הושג! 🎉'
                : `נותרו: ₪${currentData.remaining.toLocaleString()}`}
            </span>
          </div>
        </div>
        {/* Trips progress (monthly) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              <span className="font-medium">יעד נסיעות (חודשי)</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(tripsProgress)}%
            </div>
          </div>
          <Progress value={tripsProgress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {currentTrips} / {tripsGoal} נסיעות
            </span>
            <span>
              {isTripsGoalMet
                ? 'יעד הושג! 🎉'
                : `נותרו: ${remainingTrips} נסיעות`}
            </span>
          </div>
        </div>
        {/* Overall status */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-center gap-2">
            {isIncomeGoalMet && isTripsGoalMet ? (
              <div className="flex items-center gap-2 text-success font-medium">
                <Target className="h-4 w-4" />
                🎉 כל הכבוד! השגת את כל היעדים!
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                {isIncomeGoalMet ? '✅ יעד הכנסות הושג' : '💰 ממשיך לעבר יעד ההכנסות'}{' '}
                •{' '}
                {isTripsGoalMet ? '✅ יעד נסיעות הושג' : '🚗 ממשיך לעבר יעד הנסיעות'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
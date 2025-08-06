import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Car, DollarSign } from "lucide-react";
import { GoalsPeriodSelector } from './GoalsPeriodSelector';

interface GoalsProgressProps {
  incomeProgress: number;
  tripsProgress: number;
  currentIncome: number;
  currentTrips: number;
  incomeGoal: number;
  tripsGoal: number;
  weeklyIncome?: number;
  monthlyIncome?: number;
  weeklyGoal?: number;
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
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return {
          income: weeklyIncome,
          goal: weeklyGoal,
          progress: weeklyGoal > 0 ? (weeklyIncome / weeklyGoal) * 100 : 0,
          remaining: Math.max(0, weeklyGoal - weeklyIncome),
          label: 'שבועי'
        };
      case 'monthly':
        return {
          income: monthlyIncome,
          goal: monthlyGoal,
          progress: monthlyGoal > 0 ? (monthlyIncome / monthlyGoal) * 100 : 0,
          remaining: Math.max(0, monthlyGoal - monthlyIncome),
          label: 'חודשי'
        };
      default:
        return {
          income: currentIncome,
          goal: incomeGoal,
          progress: incomeProgress,
          remaining: Math.max(0, incomeGoal - currentIncome),
          label: 'משמרת'
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
        {/* התקדמות הכנסות */}
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
            <span>₪{currentData.income} / ₪{currentData.goal}</span>
            <span>{isIncomeGoalMet ? "יעד הושג! 🎉" : `נותרו: ₪${currentData.remaining}`}</span>
          </div>
        </div>

        {/* התקדמות נסיעות - רק במצב יומי */}
        {selectedPeriod === 'daily' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                <span className="font-medium">יעד נסיעות</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(tripsProgress)}%
              </div>
            </div>
            <Progress value={tripsProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{currentTrips} / {tripsGoal} נסיעות</span>
              <span>{isTripsGoalMet ? "יעד הושג! 🎉" : `נותרו: ${remainingTrips} נסיעות`}</span>
            </div>
          </div>
        )}

        {/* סטטוס כללי */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-center gap-2">
            {selectedPeriod === 'daily' ? (
              incomeProgress >= 100 && tripsProgress >= 100 ? (
                <div className="flex items-center gap-2 text-success font-medium">
                  <Target className="h-4 w-4" />
                  🎉 כל הכבוד! השגת את כל היעדים!
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  {incomeProgress >= 100 ? "✅ יעד הכנסות הושג" : "💰 ממשיך לעבר יעד ההכנסות"}
                  {" • "}
                  {tripsProgress >= 100 ? "✅ יעד נסיעות הושג" : "🚗 ממשיך לעבר יעד הנסיעות"}
                </div>
              )
            ) : (
              isIncomeGoalMet ? (
                <div className="flex items-center gap-2 text-success font-medium">
                  <Target className="h-4 w-4" />
                  🎉 יעד {currentData.label} הושג!
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  💰 ממשיך לעבר יעד ההכנסות {currentData.label}
                </div>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
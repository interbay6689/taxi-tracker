
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DailyGoals, DailyExpenses } from './types';

export function useSettings(user: any) {
  const { toast } = useToast();
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({ 
    income_goal: 500, 
    trips_goal: 20 
  });
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpenses>({ 
    maintenance: 0, 
    other: 0, 
    daily_fixed_price: 0 
  });

  const loadSettings = useCallback(async () => {
    if (!user) return;

    try {
      // Load goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goalsError) throw goalsError;

      // Load expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (expensesError) throw expensesError;

      if (goalsData) {
        setDailyGoals({
          income_goal: Number(goalsData.income_goal),
          trips_goal: goalsData.trips_goal,
          weekly_income_goal: goalsData.weekly_income_goal ?? undefined,
          monthly_income_goal: goalsData.monthly_income_goal ?? undefined,
        });
      }

      if (expensesData) {
        setDailyExpenses({
          maintenance: Number(expensesData.maintenance || 0),
          other: Number(expensesData.other || 0),
          daily_fixed_price: Number((expensesData as any).daily_fixed_price || 0),
        });
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast({
        title: "שגיאה בטעינת הגדרות",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const updateGoals = useCallback(async (newGoals: DailyGoals) => {
    if (!user) return false;

    try {
      const { data: existingGoals } = await supabase
        .from('daily_goals')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingGoals) {
        const { error } = await supabase
          .from('daily_goals')
          .update({
            income_goal: newGoals.income_goal,
            trips_goal: newGoals.trips_goal,
            weekly_income_goal: newGoals.weekly_income_goal ?? null,
            monthly_income_goal: newGoals.monthly_income_goal ?? null,
          })
          .eq('id', existingGoals.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_goals')
          .insert({
            user_id: user.id,
            income_goal: newGoals.income_goal,
            trips_goal: newGoals.trips_goal,
            weekly_income_goal: newGoals.weekly_income_goal ?? null,
            monthly_income_goal: newGoals.monthly_income_goal ?? null,
          });

        if (error) throw error;
      }

      setDailyGoals(newGoals);

      toast({
        title: "יעדים עודכנו!",
        description: "היעדים היומיים עודכנו בהצלחה",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating goals:', error);
      toast({
        title: "שגיאה בעדכון יעדים",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  const updateExpenses = useCallback(async (newExpenses: DailyExpenses) => {
    if (!user) return false;

    try {
      const { data: existingExpenses } = await supabase
        .from('daily_expenses')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingExpenses) {
        let { error } = await supabase
          .from('daily_expenses')
          .update({
            maintenance: newExpenses.maintenance,
            other: newExpenses.other,
            daily_fixed_price: newExpenses.daily_fixed_price ?? 0,
          })
          .eq('id', existingExpenses.id);

        if (error) {
          const retry = await supabase
            .from('daily_expenses')
            .update({
              maintenance: newExpenses.maintenance,
              other: newExpenses.other,
            })
            .eq('id', existingExpenses.id);
          error = retry.error;
        }

        if (error) throw error;
      } else {
        let { error } = await supabase
          .from('daily_expenses')
          .insert({
            user_id: user.id,
            maintenance: newExpenses.maintenance,
            other: newExpenses.other,
            daily_fixed_price: newExpenses.daily_fixed_price ?? 0,
          });

        if (error) {
          const retry = await supabase
            .from('daily_expenses')
            .insert({
              user_id: user.id,
              maintenance: newExpenses.maintenance,
              other: newExpenses.other,
            });
          error = retry.error;
        }

        if (error) throw error;
      }

      setDailyExpenses(newExpenses);

      toast({
        title: "הוצאות עודכנו!",
        description: "ההוצאות היומיות עודכנו בהצלחה",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating expenses:', error);
      toast({
        title: "שגיאה בעדכון הוצאות",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  return {
    dailyGoals,
    dailyExpenses,
    loadSettings,
    updateGoals,
    updateExpenses,
  };
}

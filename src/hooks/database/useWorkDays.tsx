
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkDay } from './types';

export function useWorkDays(user: any) {
  const { toast } = useToast();
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [currentWorkDay, setCurrentWorkDay] = useState<WorkDay | null>(null);

  const loadWorkDays = useCallback(async () => {
    if (!user) return { activeWorkDay: null, workDaysHistory: [] };

    try {
      // Fetch active work day
      const { data: activeWorkDay, error: activeError } = await supabase
        .from('work_days')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeError) throw activeError;

      // Fetch completed work days
      const { data: workDaysHistory, error: historyError } = await supabase
        .from('work_days')
        .select('*')
        .eq('user_id', user.id)
        .neq('is_active', true)
        .order('start_time', { ascending: false });

      if (historyError) throw historyError;

      setCurrentWorkDay(activeWorkDay ?? null);
      
      // Combine active and completed work days
      const combinedWorkDays = [
        ...(activeWorkDay ? [activeWorkDay] : []),
        ...(workDaysHistory ?? []),
      ];
      setWorkDays(combinedWorkDays);

      return { activeWorkDay, workDaysHistory: workDaysHistory ?? [] };
    } catch (error: any) {
      console.error('Error loading work days:', error);
      toast({
        title: "שגיאה בטעינת ימי עבודה",
        description: error.message,
        variant: "destructive",
      });
      return { activeWorkDay: null, workDaysHistory: [] };
    }
  }, [user, toast]);

  const startWorkDay = useCallback(async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('work_days')
        .insert({
          start_time: new Date().toISOString(),
          is_active: true,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentWorkDay(data);

      toast({
        title: "יום עבודה החל!",
        description: "יום עבודה חדש החל בהצלחה",
      });

      return true;
    } catch (error: any) {
      console.error('Error starting work day:', error);
      toast({
        title: "שגיאה בתחילת יום עבודה",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  const endWorkDay = useCallback(async (totalIncome: number, totalTrips: number) => {
    if (!user || !currentWorkDay) return false;

    try {
      const endTime = new Date().toISOString();

      const { error } = await supabase
        .from('work_days')
        .update({
          end_time: endTime,
          is_active: false,
          total_income: totalIncome,
          total_trips: totalTrips,
        })
        .eq('id', currentWorkDay.id);

      if (error) throw error;

      const completedWorkDay = {
        ...currentWorkDay,
        end_time: endTime,
        is_active: false,
        total_income: totalIncome,
        total_trips: totalTrips,
      };

      setWorkDays(prev => [completedWorkDay, ...prev.filter(wd => wd.id !== currentWorkDay.id)]);
      setCurrentWorkDay(null);

      toast({
        title: "יום עבודה הסתיים!",
        description: `יום עבודה הסתיים עם ${totalTrips} נסיעות ו-${totalIncome} ₪`,
      });

      return true;
    } catch (error: any) {
      console.error('Error ending work day:', error);
      toast({
        title: "שגיאה בסיום יום עבודה",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, currentWorkDay, toast]);

  const updateWorkDayTotals = useCallback(async (additionalIncome: number, additionalTrips: number) => {
    if (!currentWorkDay) return false;

    try {
      const newTotalIncome = currentWorkDay.total_income + additionalIncome;
      const newTotalTrips = currentWorkDay.total_trips + additionalTrips;

      const { error } = await supabase
        .from('work_days')
        .update({
          total_income: newTotalIncome,
          total_trips: newTotalTrips,
        })
        .eq('id', currentWorkDay.id);

      if (error) throw error;

      setCurrentWorkDay(prev =>
        prev
          ? {
              ...prev,
              total_income: newTotalIncome,
              total_trips: newTotalTrips,
            }
          : null
      );

      return true;
    } catch (error: any) {
      console.error('Error updating work day totals:', error);
      return false;
    }
  }, [currentWorkDay]);

  return {
    workDays,
    currentWorkDay,
    setWorkDays,
    setCurrentWorkDay,
    loadWorkDays,
    startWorkDay,
    endWorkDay,
    updateWorkDayTotals,
  };
}

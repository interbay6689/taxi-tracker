
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShiftExpense } from './types';
import { withRetry } from '@/utils/withRetry';
import { isNetworkError } from '@/utils/networkError';

export function useShiftExpenses(user: any, currentWorkDayId?: string) {
  const { toast } = useToast();
  const [shiftExpenses, setShiftExpenses] = useState<ShiftExpense[]>([]);

  const loadShiftExpenses = useCallback(async (workDayId?: string) => {
    if (!user || !workDayId) return [];

    try {
      const { data: shiftExpData } = await withRetry(async () => {
        const res = await supabase
          .from('shift_expenses')
          .select('*')
          .eq('user_id', user.id)
          .eq('work_day_id', workDayId)
          .order('created_at', { ascending: false });
        if (res.error) throw res.error;
        return res;
      }, 2, 600);

      const mappedExpenses = (shiftExpData ?? []).map((expense: any) => ({
        id: expense.id,
        amount: Number(expense.amount),
        payment_method: expense.payment_method,
        work_day_id: expense.work_day_id,
        description: expense.description ?? undefined,
        created_at: expense.created_at,
      }));

      setShiftExpenses(mappedExpenses);
      return mappedExpenses;
    } catch (error: any) {
      if (isNetworkError(error)) {
        console.warn('Network issue: Error loading shift expenses (using empty fallback).', error?.message);
      } else {
        console.error('Error loading shift expenses:', error);
      }
      if (!isNetworkError(error)) {
        toast({
          title: "שגיאה בטעינת הוצאות",
          description: error.message,
          variant: "destructive",
        });
      }
      return [];
    }
  }, [user, toast]);

  const addShiftExpense = useCallback(async (amount: number) => {
    if (!user || !currentWorkDayId) {
      toast({
        title: "שגיאה בהוספת הוצאה",
        description: "אין יום עבודה פעיל",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('shift_expenses')
        .insert({
          amount,
          payment_method: 'fuel',
          user_id: user.id,
          work_day_id: currentWorkDayId,
        })
        .select()
        .single();

      if (error) throw error;

      const newExpense: ShiftExpense = {
        id: data.id,
        amount: Number(data.amount),
        payment_method: data.payment_method,
        work_day_id: data.work_day_id,
        description: data.description ?? undefined,
        created_at: data.created_at,
      };

      setShiftExpenses(prev => [newExpense, ...prev]);
      return true;
    } catch (error: any) {
      console.error('Error adding shift expense:', error);
      toast({
        title: "שגיאה בהוספת הוצאה",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, currentWorkDayId, toast]);

  const deleteShiftExpense = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('shift_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setShiftExpenses(prev => prev.filter(exp => exp.id !== id));

      toast({
        title: 'הוצאה נמחקה',
        description: 'ההוצאה הוסרה בהצלחה',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting shift expense:', error);
      toast({
        title: 'שגיאה במחיקת הוצאה',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  const updateShiftExpense = useCallback(async (id: string, amount: number) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('shift_expenses')
        .update({ amount })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setShiftExpenses(prev => 
        prev.map(exp => 
          exp.id === id ? { ...exp, amount: Number(data.amount) } : exp
        )
      );

      toast({
        title: 'הוצאה עודכנה',
        description: 'ההוצאה עודכנה בהצלחה',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating shift expense:', error);
      toast({
        title: 'שגיאה בעדכון הוצאה',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  return {
    shiftExpenses,
    setShiftExpenses,
    loadShiftExpenses,
    addShiftExpense,
    deleteShiftExpense,
    updateShiftExpense,
  };
}

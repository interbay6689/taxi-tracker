
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useTrips } from './database/useTrips';
import { useWorkDays } from './database/useWorkDays';
import { useSettings } from './database/useSettings';
import { useShiftExpenses } from './database/useShiftExpenses';

// Re-export types for backward compatibility
export type {
  Trip,
  WorkDay,
  DailyGoals,
  DailyExpenses,
  ShiftExpense,
} from './database/types';

export function useDatabase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Initialize sub-hooks
  const tripsHook = useTrips(user);
  const workDaysHook = useWorkDays(user);
  const settingsHook = useSettings(user);
  const shiftExpensesHook = useShiftExpenses(user, workDaysHook.currentWorkDay?.id);

  // Load all user data
  const loadUserData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load all data in parallel for better performance
      const [workDaysResult, trips] = await Promise.all([
        workDaysHook.loadWorkDays(),
        tripsHook.loadTrips(),
        settingsHook.loadSettings(),
      ]);

      // Load shift expenses if there's an active work day
      if (workDaysResult.activeWorkDay) {
        await shiftExpensesHook.loadShiftExpenses(workDaysResult.activeWorkDay.id);
      }

    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: "שגיאה בטעינת נתונים",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, workDaysHook, tripsHook, settingsHook, shiftExpensesHook]);

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user, loadUserData]);

  // Enhanced addTrip that updates work day totals
  const addTrip = useCallback(
    async (amount: number, paymentMethod: string, tag?: string) => {
      const success = await tripsHook.addTrip(amount, paymentMethod, tag);
      if (success && workDaysHook.currentWorkDay) {
        await workDaysHook.updateWorkDayTotals(amount, 1);
      }
      return success;
    },
    [tripsHook, workDaysHook]
  );

  // Enhanced addTripWithLocation
  const addTripWithLocation = useCallback(
    async (tripData: {
      amount: number;
      paymentMethod?: string;
      startLocation: { address: string; city: string; lat: number; lng: number; };
      endLocation: { address: string; city: string; lat: number; lng: number; };
      duration?: number;
      tag?: string;
    }) => {
      // This would need to be implemented in the trips hook
      // For now, just use the regular addTrip
      const success = await addTrip(tripData.amount, tripData.paymentMethod || 'cash', tripData.tag);
      return success;
    },
    [addTrip]
  );

  // Enhanced endWorkDay
  const endWorkDay = useCallback(async () => {
    if (!workDaysHook.currentWorkDay) return false;

    const tripSum = tripsHook.trips.reduce((sum, trip) => sum + trip.amount, 0);
    const tripCount = tripsHook.trips.length;

    const success = await workDaysHook.endWorkDay(tripSum, tripCount);
    if (success) {
      tripsHook.setTrips([]);
      shiftExpensesHook.setShiftExpenses([]);
    }
    return success;
  }, [workDaysHook, tripsHook, shiftExpensesHook]);

  // Pause and resume work day functions
  const pauseWorkDay = useCallback(async () => {
    // Implementation would go here - not in the original scope
    return false;
  }, []);

  const resumeWorkDay = useCallback(async () => {
    // Implementation would go here - not in the original scope  
    return false;
  }, []);

  return {
    // State
    trips: tripsHook.trips,
    workDays: workDaysHook.workDays,
    currentWorkDay: workDaysHook.currentWorkDay,
    dailyGoals: settingsHook.dailyGoals,
    dailyExpenses: settingsHook.dailyExpenses,
    shiftExpenses: shiftExpensesHook.shiftExpenses,
    loading,

    // Trip functions
    addTrip,
    addTripWithLocation,
    deleteTrip: tripsHook.deleteTrip,
    updateTrip: tripsHook.updateTrip,

    // Work day functions
    startWorkDay: workDaysHook.startWorkDay,
    endWorkDay,
    pauseWorkDay,
    resumeWorkDay,

    // Settings functions
    updateGoals: settingsHook.updateGoals,
    updateExpenses: settingsHook.updateExpenses,

    // Shift expenses functions
    addShiftExpense: shiftExpensesHook.addShiftExpense,
    deleteShiftExpense: shiftExpensesHook.deleteShiftExpense,
    updateShiftExpense: shiftExpensesHook.updateShiftExpense,

    // Utility functions
    loadUserData,
  };
}

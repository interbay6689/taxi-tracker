

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
  const [error, setError] = useState<string | null>(null);

  // Initialize sub-hooks with error handling
  const tripsHook = useTrips(user);
  const workDaysHook = useWorkDays(user);
  const settingsHook = useSettings(user);
  const shiftExpensesHook = useShiftExpenses(user, workDaysHook.currentWorkDay?.id);

  // Load all user data with enhanced error handling
  const loadUserData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading user data...');
      setLoading(true);
      setError(null);

      // Load all data in parallel for better performance
      const [workDaysResult, trips] = await Promise.all([
        workDaysHook.loadWorkDays().catch(error => {
          console.error('Error loading work days:', error);
          return { activeWorkDay: null, workDaysHistory: [] };
        }),
        tripsHook.loadTrips().catch(error => {
          console.error('Error loading trips:', error);
          return [];
        }),
        settingsHook.loadSettings().catch(error => {
          console.error('Error loading settings:', error);
          return null;
        }),
      ]);

      // Load shift expenses if there's an active work day
      if (workDaysResult.activeWorkDay) {
        try {
          await shiftExpensesHook.loadShiftExpenses(workDaysResult.activeWorkDay.id);
        } catch (error) {
          console.error('Error loading shift expenses:', error);
        }
      }

      console.log('✅ User data loaded successfully');

    } catch (error: any) {
      console.error('❌ Critical error loading user data:', error);
      setError(error.message || 'אירעה שגיאה בטעינת הנתונים');
      
      // Only show toast for critical errors, not network errors
      if (!error.message?.includes('fetch')) {
        toast({
          title: "שגיאה בטעינת נתונים",
          description: "אירעה שגיאה בטעינת הנתונים. נסה לרענן את הדף.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, workDaysHook, tripsHook, settingsHook, shiftExpensesHook, toast]);

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
      try {
        const success = await tripsHook.addTrip(amount, paymentMethod, tag);
        if (success && workDaysHook.currentWorkDay) {
          await workDaysHook.updateWorkDayTotals(amount, 1);
        }
        return success;
      } catch (error) {
        console.error('Error in addTrip:', error);
        return false;
      }
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
      try {
        // This would need to be implemented in the trips hook
        // For now, just use the regular addTrip
        const success = await addTrip(tripData.amount, tripData.paymentMethod || 'cash', tripData.tag);
        return success;
      } catch (error) {
        console.error('Error in addTripWithLocation:', error);
        return false;
      }
    },
    [addTrip]
  );

  // Enhanced endWorkDay
  const endWorkDay = useCallback(async () => {
    try {
      if (!workDaysHook.currentWorkDay) return false;

      const tripSum = tripsHook.trips.reduce((sum, trip) => sum + trip.amount, 0);
      const tripCount = tripsHook.trips.length;

      const success = await workDaysHook.endWorkDay(tripSum, tripCount);
      if (success) {
        tripsHook.setTrips([]);
        shiftExpensesHook.setShiftExpenses([]);
      }
      return success;
    } catch (error) {
      console.error('Error in endWorkDay:', error);
      return false;
    }
  }, [workDaysHook, tripsHook, shiftExpensesHook]);

  // Pause and resume work day functions
  const pauseWorkDay = useCallback(async () => {
    try {
      // Implementation would go here - not in the original scope
      console.log('Pause work day - not implemented yet');
      return false;
    } catch (error) {
      console.error('Error in pauseWorkDay:', error);
      return false;
    }
  }, []);

  const resumeWorkDay = useCallback(async () => {
    try {
      // Implementation would go here - not in the original scope  
      console.log('Resume work day - not implemented yet');
      return false;
    } catch (error) {
      console.error('Error in resumeWorkDay:', error);
      return false;
    }
  }, []);

  return {
    // State
    trips: tripsHook.trips || [],
    workDays: workDaysHook.workDays || [],
    currentWorkDay: workDaysHook.currentWorkDay,
    dailyGoals: settingsHook.dailyGoals || { income_goal: 500, trips_goal: 20 },
    dailyExpenses: settingsHook.dailyExpenses || { maintenance: 0, other: 0, daily_fixed_price: 0 },
    shiftExpenses: shiftExpensesHook.shiftExpenses || [],
    loading,
    error,

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

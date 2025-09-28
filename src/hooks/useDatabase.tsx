
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useTrips } from './database/useTrips';
import { useWorkDays } from './database/useWorkDays';
import { useSettings } from './database/useSettings';
import { useShiftExpenses } from './database/useShiftExpenses';
import { isNetworkError } from '@/utils/networkError';

// Re-export types for backward compatibility
export type {
  Trip,
  WorkDay,
  DailyGoals,
  DailyExpenses,
  ShiftExpense,
} from './database/types';

export function useDatabase() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track data loading state and prevent duplicate loads
  const loadGuard = useRef<{ running: boolean; sessionKey: string | null; dataLoaded: boolean }>({
    running: false,
    sessionKey: null,
    dataLoaded: false,
  });

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
      console.groupCollapsed('🔄 Loading user data (composite)');
      setLoading(true);
      setError(null);

      // Load all data in parallel for better performance
      const [workDaysResult, trips] = await Promise.all([
        workDaysHook.loadWorkDays().catch(error => {
          if (isNetworkError(error)) {
            console.warn('Network issue while loading work days (will use fallback):', error?.message);
          } else {
            console.error('Error loading work days:', error);
          }
          return { activeWorkDay: null, workDaysHistory: [] };
        }),
        tripsHook.loadTrips().catch(error => {
          if (isNetworkError(error)) {
            console.warn('Network issue while loading trips (will use fallback):', error?.message);
          } else {
            console.error('Error loading trips:', error);
          }
          return [];
        }),
        settingsHook.loadSettings().catch(error => {
          if (isNetworkError(error)) {
            console.warn('Network issue while loading settings (will use fallback):', error?.message);
          } else {
            console.error('Error loading settings:', error);
          }
          return null;
        }),
      ]);

      // Load shift expenses if there's an active work day
      if (workDaysResult.activeWorkDay) {
        try {
          await shiftExpensesHook.loadShiftExpenses(workDaysResult.activeWorkDay.id);
        } catch (error) {
          if (isNetworkError(error)) {
            console.warn('Network issue while loading shift expenses (skipping now):', (error as any)?.message);
          } else {
            console.error('Error loading shift expenses:', error);
          }
        }
      }

      console.log('✅ User data loaded successfully');
      console.groupEnd();
    } catch (error: any) {
      console.error('❌ Critical error loading user data:', error);
      setError(error.message || 'אירעה שגיאה בטעינת הנתונים');

      // Only show toast for critical errors, not network errors
      if (!isNetworkError(error)) {
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

  // Load data when user/session is authenticated – optimize for fast initial display
  useEffect(() => {
    const sessKey = session ? `${session.user?.id}::${session.expires_at || ''}` : null;

    if (user && session) {
      // If data already loaded for this session, skip
      if (loadGuard.current.sessionKey === sessKey && loadGuard.current.dataLoaded) {
        setLoading(false);
        return;
      }

      // Prevent concurrent loads
      if (loadGuard.current.running) {
        return;
      }

      // Set loading to false immediately if we have cached data
      const hasLocalData = tripsHook.trips.length > 0 || workDaysHook.currentWorkDay;
      if (hasLocalData) {
        setLoading(false);
      }

      loadGuard.current.running = true;
      loadUserData()
        .finally(() => {
          loadGuard.current.running = false;
          loadGuard.current.sessionKey = sessKey;
          loadGuard.current.dataLoaded = true;
          setLoading(false);
        });
    } else {
      // No user – ensure state reset
      setLoading(false);
      loadGuard.current.sessionKey = null;
      loadGuard.current.dataLoaded = false;
    }
  }, [user, session, loadUserData, tripsHook.trips.length, workDaysHook.currentWorkDay]);

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

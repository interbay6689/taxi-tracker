import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// A single trip taken by the driver.  Each trip records the amount and
// payment method used.  Optionally, a tag can be stored in the
// `trip_status` column which we repurpose to hold arbitrary string tags.
// Historically `trip_status` was limited to the strings "active" or
// "completed", but since Supabase stores it as a free‐form string we
// widen its type here to allow any value.  Consumers should treat
// `tag` as optional metadata for categorising trips (for example,
// "שדה", "תחנה", etc.).
export interface Trip {
  id: string;
  amount: number;
  payment_method:
    | 'cash'
    | 'card'
    | 'app'
    | 'מזומן'
    | 'ביט'
    | 'אשראי'
    | 'GetTaxi'
    | 'דהרי';
  timestamp: string;
  start_location_address?: string;
  start_location_city?: string;
  start_location_lat?: number;
  start_location_lng?: number;
  end_location_address?: string;
  end_location_city?: string;
  end_location_lat?: number;
  end_location_lng?: number;
  /**
   * A free form string representing the status or tag of the trip.  In
   * this application we repurpose it as an optional tag field.  When
   * undefined the trip has no tag associated with it.
   */
  trip_status?: string;
  trip_start_time?: string;
  trip_end_time?: string;
}

export interface WorkDay {
  id: string;
  start_time: string;
  end_time?: string;
  total_income: number;
  total_trips: number;
  is_active: boolean;
}

export interface DailyGoals {
  income_goal: number;
  trips_goal: number;
  goal_type?: 'daily' | 'shift';
  /**
   * Optional weekly income goal defined by the user.  When undefined
   * the application will derive a weekly goal by multiplying the
   * daily income goal by 7.
   */
  weekly_income_goal?: number;
  /**
   * Optional monthly income goal defined by the user.  When undefined
   * the application will derive a monthly goal by multiplying the
   * daily income goal by the number of days in the current month.
   */
  monthly_income_goal?: number;
}

export interface DailyExpenses {
  /**
   * Daily maintenance cost (e.g. car wash, oil change).
   */
  maintenance: number;
  /**
   * Other daily expenses that aren't part of maintenance or the fixed cost.
   */
  other: number;
  /**
   * A fixed cost that applies every day the driver works.  This value
   * represents the daily cost of owning or leasing the taxi (for
   * example, insurance or permit fees).  The application will
   * multiply this value by the number of days in a given period when
   * presenting monthly or weekly summaries.  When unspecified it
   * defaults to zero.
   */
  daily_fixed_price?: number;
}

export interface ShiftExpense {
  id: string;
  work_day_id: string;
  payment_method: string;
  amount: number;
  description?: string;
  created_at: string;
}

export function useDatabase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [currentWorkDay, setCurrentWorkDay] = useState<WorkDay | null>(null);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({ income_goal: 500, trips_goal: 20 });
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpenses>({ maintenance: 0, other: 0, daily_fixed_price: 0 });
  const [shiftExpenses, setShiftExpenses] = useState<ShiftExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data when user is authenticated.  This function fetches the
  // current active work day (if any) and then loads all trips and
  // shift-level expenses that fall within that shift.  It also
  // retrieves completed work days for history and the latest goals
  // and expenses configured by the user.  Everything is mapped into
  // local state.  If there is no active user the function exits
  // early and clears the loading state.
  const loadUserData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch the current active work day for this user.  The
      // combination of `is_active = true` and `user_id` uniquely
      // identifies at most one active shift.  We order by start time
      // descending just in case and take the most recent.
      const { data: activeWorkDay, error: activeError } = await supabase
        .from('work_days')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activeError) throw activeError;

      // Set currentWorkDay (null if there is no active shift)
      setCurrentWorkDay(activeWorkDay ?? null);

      // Initialise containers for trips and expenses
      let tripRows: any[] = [];
      let expenseRows: any[] = [];

      if (activeWorkDay) {
        // Fetch trips that belong to this shift.  The trips table does
        // not have a work_day_id FK so we filter by timestamp between
        // start_time and (optional) end_time.
        let tripQuery = supabase
          .from('trips')
          .select('*')
          .eq('user_id', user.id)
          .gte('timestamp', activeWorkDay.start_time)
          .order('timestamp', { ascending: false });
        if (activeWorkDay.end_time) {
          tripQuery = tripQuery.lt('timestamp', activeWorkDay.end_time);
        }
        const { data: tripsData, error: tripsError } = await tripQuery;
        if (tripsError) throw tripsError;
        tripRows = tripsData ?? [];

        // Fetch shift-level expenses tied to this work day.  These
        // correspond to fuel or other per-shift costs stored in
        // shift_expenses.
        const { data: shiftExpData, error: shiftExpError } = await supabase
          .from('shift_expenses')
          .select('*')
          .eq('user_id', user.id)
          .eq('work_day_id', activeWorkDay.id)
          .order('created_at', { ascending: false });
        if (shiftExpError) throw shiftExpError;
        expenseRows = shiftExpData ?? [];
      }

      // Fetch all completed work days for history.  We exclude the
      // currently active shift to avoid counting it twice.  Work days
      // are ordered by start_time descending.
      const { data: workDaysHistory, error: historyError } = await supabase
        .from('work_days')
        .select('*')
        .eq('user_id', user.id)
        .neq('is_active', true)
        .order('start_time', { ascending: false });
      if (historyError) throw historyError;

      // Fetch the latest goals record for this user.  If none exist
      // the defaults remain unchanged.
      const { data: goalsData, error: goalsError } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (goalsError) throw goalsError;

      // Fetch the latest expenses record for this user.  If none exist
      // the defaults remain unchanged.
      const { data: expensesData, error: expensesError } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (expensesError) throw expensesError;

      // Map trips to local Trip type
      setTrips(
        tripRows.map(trip => ({
          id: trip.id,
          amount: Number(trip.amount),
          payment_method: trip.payment_method as
            | 'cash'
            | 'card'
            | 'app'
            | 'מזומן'
            | 'ביט'
            | 'אשראי'
            | 'GetTaxi'
            | 'דהרי',
          timestamp: trip.timestamp,
          start_location_address: trip.start_location_address,
          start_location_city: trip.start_location_city,
          start_location_lat: trip.start_location_lat ? Number(trip.start_location_lat) : undefined,
          start_location_lng: trip.start_location_lng ? Number(trip.start_location_lng) : undefined,
          end_location_address: trip.end_location_address,
          end_location_city: trip.end_location_city,
          end_location_lat: trip.end_location_lat ? Number(trip.end_location_lat) : undefined,
          end_location_lng: trip.end_location_lng ? Number(trip.end_location_lng) : undefined,
          trip_status: trip.trip_status as 'active' | 'completed' | undefined,
          trip_start_time: trip.trip_start_time,
          trip_end_time: trip.trip_end_time,
        }))
      );

      // Map shift expenses to local ShiftExpense type
      setShiftExpenses(
        expenseRows.map((expense: any) => ({
          id: expense.id,
          amount: Number(expense.amount),
          payment_method: expense.payment_method,
          work_day_id: expense.work_day_id,
          description: expense.description ?? undefined,
          created_at: expense.created_at,
        }))
      );

      // Populate work days history
      setWorkDays(workDaysHistory ?? []);

      // Set goals if available
      if (goalsData) {
        setDailyGoals({
          income_goal: Number(goalsData.income_goal),
          trips_goal: goalsData.trips_goal,
          weekly_income_goal: goalsData.weekly_income_goal ?? undefined,
          monthly_income_goal: goalsData.monthly_income_goal ?? undefined,
        });
      }

      // Set expenses if available
      if (expensesData) {
        setDailyExpenses({
          maintenance: Number(expensesData.maintenance || 0),
          other: Number(expensesData.other || 0),
          daily_fixed_price: Number((expensesData as any).daily_fixed_price || 0),
        });
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
  }, [user, toast]);

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user, loadUserData]);

  /**
   * Adds a new trip record.  Accepts an optional `tag` which will be
   * stored in the `trip_status` column.  When the user starts a
   * shift the trip contributes to the current work day totals.  If no
   * user is authenticated the operation fails silently.
   *
   * @param amount The trip amount in shekels
   * @param paymentMethod The payment method used (cash, card, app, etc.)
   * @param tag Optional string tag to categorise the trip
   */
  const addTrip = useCallback(
    async (
      amount: number,
      paymentMethod: 'cash' | 'card' | 'app' | 'מזומן' | 'ביט' | 'אשראי' | 'GetTaxi' | 'דהרי',
      tag?: string
    ) => {
      if (!user) return false;

      try {
        const { data, error } = await supabase
          .from('trips')
          .insert({
            amount,
            payment_method: paymentMethod,
            user_id: user.id,
            // Persist tag in the trip_status column if provided
            trip_status: tag ?? null,
          })
          .select()
          .single();

        if (error) throw error;

        setTrips(prev => [
          {
            id: data.id,
            amount: Number(data.amount),
            payment_method: data.payment_method as
              | 'cash'
              | 'card'
              | 'app'
              | 'מזומן'
              | 'ביט'
              | 'אשראי'
              | 'GetTaxi'
              | 'דהרי',
            timestamp: data.timestamp,
            start_location_address: data.start_location_address,
            start_location_city: data.start_location_city,
            start_location_lat: data.start_location_lat
              ? Number(data.start_location_lat)
              : undefined,
            start_location_lng: data.start_location_lng
              ? Number(data.start_location_lng)
              : undefined,
            end_location_address: data.end_location_address,
            end_location_city: data.end_location_city,
            end_location_lat: data.end_location_lat
              ? Number(data.end_location_lat)
              : undefined,
            end_location_lng: data.end_location_lng
              ? Number(data.end_location_lng)
              : undefined,
            trip_status: data.trip_status ?? undefined,
            trip_start_time: data.trip_start_time,
            trip_end_time: data.trip_end_time,
          },
          ...prev,
        ]);

        // Update current work day if active
        if (currentWorkDay) {
          const newTotalIncome = currentWorkDay.total_income + amount;
          const newTotalTrips = currentWorkDay.total_trips + 1;

          const { error: updateError } = await supabase
            .from('work_days')
            .update({
              total_income: newTotalIncome,
              total_trips: newTotalTrips,
            })
            .eq('id', currentWorkDay.id);

          if (updateError) throw updateError;

          setCurrentWorkDay(prev =>
            prev
              ? {
                  ...prev,
                  total_income: newTotalIncome,
                  total_trips: newTotalTrips,
                }
              : null
          );
        }

        toast({
          title: 'נסיעה נוספה!',
          description: `נסיעה בסך ${amount} ₪ נוספה בהצלחה`,
        });

        return true;
      } catch (error: any) {
        console.error('Error adding trip:', error);
        toast({
          title: 'שגיאה בהוספת נסיעה',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }
    },
    [user, currentWorkDay, toast]
  );

  const addTripWithLocation = useCallback(
    async (tripData: {
      amount: number;
      paymentMethod?:
        | 'cash'
        | 'card'
        | 'app'
        | 'מזומן'
        | 'ביט'
        | 'אשראי'
        | 'GetTaxi'
        | 'דהרי';
      startLocation: {
        address: string;
        city: string;
        lat: number;
        lng: number;
      };
      endLocation: {
        address: string;
        city: string;
        lat: number;
        lng: number;
      };
      duration?: number;
      tag?: string;
    }) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          amount: tripData.amount,
          payment_method: tripData.paymentMethod || 'cash',
          user_id: user.id,
          start_location_address: tripData.startLocation.address,
          start_location_city: tripData.startLocation.city,
          start_location_lat: tripData.startLocation.lat,
          start_location_lng: tripData.startLocation.lng,
          end_location_address: tripData.endLocation.address,
          end_location_city: tripData.endLocation.city,
          end_location_lat: tripData.endLocation.lat,
          end_location_lng: tripData.endLocation.lng,
          // Persist the optional tag in trip_status.  If no tag is
          // provided we mark the status as completed.
          trip_status: tripData.tag ?? 'completed',
          trip_start_time: new Date(
            Date.now() - (tripData.duration || 0) * 1000
          ).toISOString(),
          trip_end_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setTrips(prev => [{
        id: data.id,
        amount: Number(data.amount),
        payment_method: data.payment_method as 'cash' | 'card' | 'app' | 'מזומן' | 'ביט' | 'אשראי' | 'GetTaxi' | 'דהרי',
        timestamp: data.timestamp,
        start_location_address: data.start_location_address,
        start_location_city: data.start_location_city,
        start_location_lat: data.start_location_lat ? Number(data.start_location_lat) : undefined,
        start_location_lng: data.start_location_lng ? Number(data.start_location_lng) : undefined,
        end_location_address: data.end_location_address,
        end_location_city: data.end_location_city,
        end_location_lat: data.end_location_lat ? Number(data.end_location_lat) : undefined,
        end_location_lng: data.end_location_lng ? Number(data.end_location_lng) : undefined,
        trip_status: data.trip_status as 'active' | 'completed' | undefined,
        trip_start_time: data.trip_start_time,
        trip_end_time: data.trip_end_time
      }, ...prev]);

      // Update current work day if active
      if (currentWorkDay) {
        const newTotalIncome = currentWorkDay.total_income + tripData.amount;
        const newTotalTrips = currentWorkDay.total_trips + 1;

        const { error: updateError } = await supabase
          .from('work_days')
          .update({
            total_income: newTotalIncome,
            total_trips: newTotalTrips
          })
          .eq('id', currentWorkDay.id);

        if (updateError) throw updateError;

        setCurrentWorkDay(prev => prev ? {
          ...prev,
          total_income: newTotalIncome,
          total_trips: newTotalTrips
        } : null);
      }

      return true;
    } catch (error: any) {
      console.error('Error adding trip with location:', error);
      toast({
        title: "שגיאה בהוספת נסיעה",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, currentWorkDay, toast]);

  /**
   * Adds a shift-level expense (e.g. fuel). Shift expenses are tied to the
   * current active work day. The amount should be a positive number. If no
   * active work day is found an error toast is displayed and the operation
   * fails silently.
   *
   * @param amount The expense amount in shekels.
   * @returns A boolean indicating whether the expense was successfully
   * inserted into the database.
   */
  const addShiftExpense = useCallback(async (amount: number) => {
    if (!user || !currentWorkDay) {
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
          work_day_id: currentWorkDay.id,
        })
        .select()
        .single();
      if (error) throw error;
      // Append the new expense to local state
      setShiftExpenses(prev => [
        ...prev,
        {
          id: data.id,
          amount: Number(data.amount),
          payment_method: data.payment_method,
          work_day_id: data.work_day_id,
          description: data.description ?? undefined,
          created_at: data.created_at,
        },
      ]);
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
  }, [user, currentWorkDay, toast]);

  /**
   * Deletes a shift-level expense by its ID. Upon successful deletion the
   * local state is updated to remove the expense from the current list. If
   * there is an error, an error toast is shown.
   *
   * @param id The ID of the expense to delete
   * @returns A boolean indicating whether the deletion succeeded
   */
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

  /**
   * Updates the amount of an existing shift-level expense. Only the amount
   * can be modified; other fields remain unchanged. If the update
   * succeeds, the local state is updated accordingly.
   *
   * @param id The ID of the expense to update
   * @param amount The new amount in shekels
   * @returns A boolean indicating whether the update succeeded
   */
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
      // Update local state
      setShiftExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, amount: Number(data.amount) } : exp));
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
      setTrips([]); // Reset trips for new work day

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

  const endWorkDay = useCallback(async () => {
    if (!user || !currentWorkDay) return false;

    try {
      const endTime = new Date().toISOString();

      // Compute totals for this shift before closing it.  Sum up the
      // amounts of all trips that belong to the current shift and count
      // them.  These values will be stored in the work_days record and
      // displayed in history views.
      const tripSum = trips.reduce((sum, trip) => sum + trip.amount, 0);
      const tripCount = trips.length;

      const { error } = await supabase
        .from('work_days')
        .update({
          end_time: endTime,
          is_active: false,
          total_income: tripSum,
          total_trips: tripCount,
        })
        .eq('id', currentWorkDay.id);

      if (error) throw error;

      const completedWorkDay = {
        ...currentWorkDay,
        end_time: endTime,
        is_active: false,
        total_income: tripSum,
        total_trips: tripCount,
      };

      setWorkDays(prev => [completedWorkDay, ...prev]);
      setCurrentWorkDay(null);
      setTrips([]); // Reset trips for next work day
      setShiftExpenses([]); // Reset shift expenses for next work day

      toast({
        title: "יום עבודה הסתיים!",
        description: `יום עבודה הסתיים עם ${tripCount} נסיעות ו-${tripSum} ₪`,
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

  const pauseWorkDay = useCallback(async () => {
    if (!user || !currentWorkDay) return false;

    try {
      const { error } = await supabase
        .from('work_days')
        .update({
          is_active: false
        })
        .eq('id', currentWorkDay.id);

      if (error) throw error;

      setCurrentWorkDay({
        ...currentWorkDay,
        is_active: false
      });

      toast({
        title: "עבודה הופסקה",
        description: "ניתן לחזור ולהמשיך לעבוד מאוחר יותר",
      });

      return true;
    } catch (error: any) {
      console.error('Error pausing work day:', error);
      toast({
        title: "שגיאה בהפסקת עבודה",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, currentWorkDay, toast]);

  const resumeWorkDay = useCallback(async () => {
    if (!user || !currentWorkDay) return false;

    try {
      const { error } = await supabase
        .from('work_days')
        .update({
          is_active: true
        })
        .eq('id', currentWorkDay.id);

      if (error) throw error;

      setCurrentWorkDay({
        ...currentWorkDay,
        is_active: true
      });

      toast({
        title: "עבודה חודשה",
        description: "המשך יום עבודה טוב!",
      });

      return true;
    } catch (error: any) {
      console.error('Error resuming work day:', error);
      toast({
        title: "שגיאה בחידוש עבודה",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, currentWorkDay, toast]);

  const updateGoals = useCallback(async (newGoals: DailyGoals) => {
    if (!user) return false;

    try {
      // Check if goals exist for this user
      const { data: existingGoals } = await supabase
        .from('daily_goals')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingGoals) {
        // Update existing goals
        const { error } = await supabase
          .from('daily_goals')
          .update({
            income_goal: newGoals.income_goal,
            trips_goal: newGoals.trips_goal,
            // Persist optional weekly and monthly income goals when provided.
            weekly_income_goal: newGoals.weekly_income_goal ?? null,
            monthly_income_goal: newGoals.monthly_income_goal ?? null,
          })
          .eq('id', existingGoals.id);

        if (error) throw error;
      } else {
        // Create new goals
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
      // Check if expenses exist for this user
      const { data: existingExpenses } = await supabase
        .from('daily_expenses')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingExpenses) {
        // Update existing expenses. Attempt to include daily_fixed_price; if any error
        // occurs (for example, the column does not exist in the database), retry
        // without the daily_fixed_price field.  This ensures that the update
        // gracefully falls back until the migration adding daily_fixed_price has
        // been applied.
        let { error } = await supabase
          .from('daily_expenses')
          .update({
            maintenance: newExpenses.maintenance,
            other: newExpenses.other,
            daily_fixed_price: newExpenses.daily_fixed_price ?? 0,
          })
          .eq('id', existingExpenses.id);

        if (error) {
          // Retry without the daily_fixed_price column.  Do not check the error
          // message since different Supabase instances may report varying text.
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
        // Create new expenses. Attempt to include daily_fixed_price; on failure,
        // retry without it.  This fallback ensures inserts work even if the
        // column does not exist yet.
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

  const deleteTrip = useCallback(async (tripId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

      setTrips(prev => prev.filter(trip => trip.id !== tripId));

      toast({
        title: "נסיעה נמחקה!",
        description: "הנסיעה נמחקה בהצלחה",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting trip:', error);
      toast({
        title: "שגיאה במחיקת נסיעה",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  /**
   * Updates an existing trip.  You can modify the amount, payment
   * method or tag (trip_status).  Only the fields provided will be
   * updated; others remain unchanged.  If the update succeeds the
   * local state is updated accordingly.
   *
   * @param tripId The ID of the trip to update
   * @param amount The new amount in shekels
   * @param paymentMethod Optional new payment method
   * @param tag Optional new tag for the trip
   */
  const updateTrip = useCallback(
    async (
      tripId: string,
      amount: number,
      paymentMethod?:
        | 'cash'
        | 'card'
        | 'app'
        | 'מזומן'
        | 'ביט'
        | 'אשראי'
        | 'GetTaxi'
        | 'דהרי',
      tag?: string
    ) => {
      if (!user) return false;

      try {
        const updateObject: any = { amount };
        if (paymentMethod) {
          updateObject.payment_method = paymentMethod;
        }
        if (typeof tag !== 'undefined') {
          updateObject.trip_status = tag;
        }

        const { error, data } = await supabase
          .from('trips')
          .update(updateObject)
          .eq('id', tripId)
          .select()
          .single();
        if (error) throw error;

        setTrips(prev =>
          prev.map(trip =>
            trip.id === tripId
              ? {
                  ...trip,
                  amount,
                  ...(paymentMethod ? { payment_method: paymentMethod } : {}),
                  ...(typeof tag !== 'undefined'
                    ? { trip_status: tag ?? undefined }
                    : {}),
                }
              : trip
          )
        );

        toast({
          title: 'נסיעה עודכנה!',
          description: 'הנסיעה עודכנה בהצלחה',
        });

        return true;
      } catch (error: any) {
        console.error('Error updating trip:', error);
        toast({
          title: 'שגיאה בעדכון נסיעה',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }
    },
    [user, toast]
  );

  return {
    trips,
    workDays,
    currentWorkDay,
    dailyGoals,
    dailyExpenses,
    loading,
    addTrip,
    addTripWithLocation,
    startWorkDay,
    endWorkDay,
    pauseWorkDay,
    resumeWorkDay,
    updateGoals,
    updateExpenses,
    deleteTrip,
    updateTrip,
    loadUserData,
    // Expose shift-level expenses and the function to add a new expense (fuel)
    shiftExpenses,
    addShiftExpense,
    // New: allow deletion and updating of shift expenses
    deleteShiftExpense,
    updateShiftExpense
  };
}
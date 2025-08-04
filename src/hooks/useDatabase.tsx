import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Trip {
  id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'app' | 'מזומן' | 'ביט' | 'אשראי' | 'GetTaxi' | 'דהרי';
  timestamp: string;
  start_location_address?: string;
  start_location_city?: string;
  start_location_lat?: number;
  start_location_lng?: number;
  end_location_address?: string;
  end_location_city?: string;
  end_location_lat?: number;
  end_location_lng?: number;
  trip_status?: 'active' | 'completed';
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
}

export interface DailyExpenses {
  fuel: number;
  maintenance: number;
  other: number;
}

export function useDatabase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [currentWorkDay, setCurrentWorkDay] = useState<WorkDay | null>(null);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({ income_goal: 500, trips_goal: 20 });
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpenses>({ fuel: 0, maintenance: 0, other: 0 });
  const [loading, setLoading] = useState(true);

  // Load data when user is authenticated
  const loadUserData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load all data in parallel with timeout protection
      const today = new Date().toISOString().split('T')[0];
      
      const loadPromises = [
        // Load trips for today
        supabase
          .from('trips')
          .select('*')
          .gte('timestamp', `${today}T00:00:00.000Z`)
          .lt('timestamp', `${today}T23:59:59.999Z`)
          .order('timestamp', { ascending: false }),
        
        // Load current active work day
        supabase
          .from('work_days')
          .select('*')
          .eq('is_active', true)
          .maybeSingle(),
        
        // Load work days history
        supabase
          .from('work_days')
          .select('*')
          .eq('is_active', false)
          .order('start_time', { ascending: false })
          .limit(30),
        
        // Load daily goals
        supabase
          .from('daily_goals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        
        // Load daily expenses
        supabase
          .from('daily_expenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ];

      // Execute with timeout protection (5 seconds max)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      );

      const [
        tripsResponse,
        activeWorkDayResponse,
        workDaysHistoryResponse,
        goalsResponse,
        expensesResponse
      ] = await Promise.race([
        Promise.all(loadPromises),
        timeoutPromise
      ]) as any;

      // Handle trips
      if (tripsResponse.error) throw tripsResponse.error;
      setTrips((tripsResponse.data || []).map(trip => ({
        id: trip.id,
        amount: Number(trip.amount),
        payment_method: trip.payment_method as 'cash' | 'card' | 'app' | 'מזומן' | 'ביט' | 'אשראי' | 'GetTaxi' | 'דהרי',
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
        trip_end_time: trip.trip_end_time
      })));

      // Handle active work day
      if (activeWorkDayResponse.error) throw activeWorkDayResponse.error;
      setCurrentWorkDay(activeWorkDayResponse.data);

      // Handle work days history
      if (workDaysHistoryResponse.error) throw workDaysHistoryResponse.error;
      setWorkDays(workDaysHistoryResponse.data || []);

      // Handle goals
      if (goalsResponse.error) throw goalsResponse.error;
      if (goalsResponse.data) {
        setDailyGoals({
          income_goal: Number(goalsResponse.data.income_goal),
          trips_goal: goalsResponse.data.trips_goal
        });
      }

      // Handle expenses
      if (expensesResponse.error) throw expensesResponse.error;
      if (expensesResponse.data) {
        setDailyExpenses({
          fuel: Number(expensesResponse.data.fuel),
          maintenance: Number(expensesResponse.data.maintenance),
          other: Number(expensesResponse.data.other)
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

  const addTrip = useCallback(async (amount: number, paymentMethod: 'cash' | 'card' | 'app' | 'מזומן' | 'ביט' | 'אשראי' | 'GetTaxi' | 'דהרי') => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          amount,
          payment_method: paymentMethod,
          user_id: user.id
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
        const newTotalIncome = currentWorkDay.total_income + amount;
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

      toast({
        title: "נסיעה נוספה!",
        description: `נסיעה בסך ${amount} ₪ נוספה בהצלחה`,
      });

      return true;
    } catch (error: any) {
      console.error('Error adding trip:', error);
      toast({
        title: "שגיאה בהוספת נסיעה",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, currentWorkDay, toast]);

  const addTripWithLocation = useCallback(async (tripData: {
    amount: number;
    paymentMethod?: 'cash' | 'card' | 'app' | 'מזומן' | 'ביט' | 'אשראי' | 'GetTaxi' | 'דהרי';
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
          trip_status: 'completed',
          trip_start_time: new Date(Date.now() - (tripData.duration || 0) * 1000).toISOString(),
          trip_end_time: new Date().toISOString()
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

      const { error } = await supabase
        .from('work_days')
        .update({
          end_time: endTime,
          is_active: false
        })
        .eq('id', currentWorkDay.id);

      if (error) throw error;

      const completedWorkDay = {
        ...currentWorkDay,
        end_time: endTime,
        is_active: false
      };

      setWorkDays(prev => [completedWorkDay, ...prev]);
      setCurrentWorkDay(null);
      setTrips([]); // Reset for next work day

      toast({
        title: "יום עבודה הסתיים!",
        description: `יום עבודה הסתיים עם ${currentWorkDay.total_trips} נסיעות ו-${currentWorkDay.total_income} ₪`,
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
            trips_goal: newGoals.trips_goal
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
            trips_goal: newGoals.trips_goal
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
        // Update existing expenses
        const { error } = await supabase
          .from('daily_expenses')
          .update({
            fuel: newExpenses.fuel,
            maintenance: newExpenses.maintenance,
            other: newExpenses.other
          })
          .eq('id', existingExpenses.id);

        if (error) throw error;
      } else {
        // Create new expenses
        const { error } = await supabase
          .from('daily_expenses')
          .insert({
            user_id: user.id,
            fuel: newExpenses.fuel,
            maintenance: newExpenses.maintenance,
            other: newExpenses.other
          });

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

  const updateTrip = useCallback(async (tripId: string, amount: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('trips')
        .update({ amount })
        .eq('id', tripId);

      if (error) throw error;

      setTrips(prev => prev.map(trip => 
        trip.id === tripId ? { ...trip, amount } : trip
      ));

      toast({
        title: "נסיעה עודכנה!",
        description: "הנסיעה עודכנה בהצלחה",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating trip:', error);
      toast({
        title: "שגיאה בעדכון נסיעה",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

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
    updateGoals,
    updateExpenses,
    deleteTrip,
    updateTrip,
    loadUserData
  };
}
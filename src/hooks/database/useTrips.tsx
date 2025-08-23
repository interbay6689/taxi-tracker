
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trip } from './types';
import { withRetry } from '@/utils/withRetry';
import { isNetworkError } from '@/utils/networkError';

export function useTrips(user: any) {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);

  const loadTrips = useCallback(async () => {
    if (!user) return [];

    try {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);

      const { data: allTripsData } = await withRetry(async () => {
        const res = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', user.id)
          .gte('timestamp', startOfYear.toISOString())
          .order('timestamp', { ascending: false });
        if (res.error) throw res.error;
        return res;
      }, 2, 700);

      const mappedTrips = (allTripsData ?? []).map(trip => ({
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
        trip_status: trip.trip_status ?? undefined,
        trip_start_time: trip.trip_start_time,
        trip_end_time: trip.trip_end_time,
      }));

      setTrips(mappedTrips);
      return mappedTrips;
    } catch (error: any) {
      console.error('Error loading trips:', error);
      if (!isNetworkError(error)) {
        toast({
          title: "שגיאה בטעינת נסיעות",
          description: error.message,
          variant: "destructive",
        });
      }
      return [];
    }
  }, [user, toast]);

  const addTrip = useCallback(
    async (amount: number, paymentMethod: string, tag?: string) => {
      if (!user) return false;

      try {
        const { data, error } = await supabase
          .from('trips')
          .insert({
            amount,
            payment_method: paymentMethod,
            user_id: user.id,
            trip_status: tag ?? null,
          })
          .select()
          .single();

        if (error) throw error;

        const newTrip: Trip = {
          id: data.id,
          amount: Number(data.amount),
          payment_method: data.payment_method as any,
          timestamp: data.timestamp,
          start_location_address: data.start_location_address,
          start_location_city: data.start_location_city,
          start_location_lat: data.start_location_lat ? Number(data.start_location_lat) : undefined,
          start_location_lng: data.start_location_lng ? Number(data.start_location_lng) : undefined,
          end_location_address: data.end_location_address,
          end_location_city: data.end_location_city,
          end_location_lat: data.end_location_lat ? Number(data.end_location_lat) : undefined,
          end_location_lng: data.end_location_lng ? Number(data.end_location_lng) : undefined,
          trip_status: data.trip_status ?? undefined,
          trip_start_time: data.trip_start_time,
          trip_end_time: data.trip_end_time,
        };

        setTrips(prev => [newTrip, ...prev]);

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
    [user, toast]
  );

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

  const updateTrip = useCallback(
    async (
      tripId: string,
      amount: number,
      paymentMethod?: string,
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

        const { error } = await supabase
          .from('trips')
          .update(updateObject)
          .eq('id', tripId);

        if (error) throw error;

        setTrips(prev =>
          prev.map(trip =>
            trip.id === tripId
              ? {
                  ...trip,
                  amount,
                  ...(paymentMethod ? { payment_method: paymentMethod as any } : {}),
                  ...(typeof tag !== 'undefined' ? { trip_status: tag ?? undefined } : {}),
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
    setTrips,
    loadTrips,
    addTrip,
    deleteTrip,
    updateTrip,
  };
}

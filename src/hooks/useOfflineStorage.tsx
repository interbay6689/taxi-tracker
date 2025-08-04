import { useState, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEYS = {
  TRIPS: 'offline_trips',
  GOALS: 'offline_goals',
  EXPENSES: 'offline_expenses',
  PENDING_SYNC: 'pending_sync_data'
};

interface OfflineTrip {
  id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'app' | 'מזומן' | 'ביט' | 'אשראי' | 'GetTaxi' | 'דהרי';
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  synced: boolean;
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      vibrateSuccess();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      vibrateWarning();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // רטט להתראות
  const vibrateSuccess = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.log('Haptics not available');
    }
  };

  const vibrateWarning = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 100);
    } catch (error) {
      console.log('Haptics not available');
    }
  };

  const vibrateError = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 100);
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 200);
    } catch (error) {
      console.log('Haptics not available');
    }
  };

  // שמירה אופליין
  const saveOfflineTrip = async (trip: Omit<OfflineTrip, 'synced'>) => {
    try {
      const existingTrips = await getOfflineTrips();
      const newTrip: OfflineTrip = { ...trip, synced: false };
      const updatedTrips = [...existingTrips, newTrip];
      
      await Preferences.set({
        key: STORAGE_KEYS.TRIPS,
        value: JSON.stringify(updatedTrips)
      });

      updatePendingSyncCount();
      vibrateSuccess();
      return true;
    } catch (error) {
      console.error('Error saving offline trip:', error);
      vibrateError();
      return false;
    }
  };

  const getOfflineTrips = async (): Promise<OfflineTrip[]> => {
    try {
      const result = await Preferences.get({ key: STORAGE_KEYS.TRIPS });
      return result.value ? JSON.parse(result.value) : [];
    } catch (error) {
      console.error('Error getting offline trips:', error);
      return [];
    }
  };

  const syncOfflineData = async (syncFunction: (data: OfflineTrip[]) => Promise<boolean>) => {
    try {
      const offlineTrips = await getOfflineTrips();
      const unsyncedTrips = offlineTrips.filter(trip => !trip.synced);
      
      if (unsyncedTrips.length === 0) return true;

      const success = await syncFunction(unsyncedTrips);
      
      if (success) {
        // סמן את הנסיעות כמסונכרנות
        const updatedTrips = offlineTrips.map(trip => ({
          ...trip,
          synced: true
        }));
        
        await Preferences.set({
          key: STORAGE_KEYS.TRIPS,
          value: JSON.stringify(updatedTrips)
        });
        
        updatePendingSyncCount();
        vibrateSuccess();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error syncing offline data:', error);
      vibrateError();
      return false;
    }
  };

  const updatePendingSyncCount = async () => {
    const offlineTrips = await getOfflineTrips();
    const unsyncedCount = offlineTrips.filter(trip => !trip.synced).length;
    setPendingSyncCount(unsyncedCount);
  };

  const clearOfflineData = async () => {
    try {
      await Preferences.remove({ key: STORAGE_KEYS.TRIPS });
      setPendingSyncCount(0);
      vibrateSuccess();
    } catch (error) {
      console.error('Error clearing offline data:', error);
      vibrateError();
    }
  };

  // Update pending sync count only when necessary to prevent re-renders
  useEffect(() => {
    if (isOnline) {
      updatePendingSyncCount();
    }
  }, [isOnline]);

  return {
    isOnline,
    pendingSyncCount,
    saveOfflineTrip,
    getOfflineTrips,
    syncOfflineData,
    clearOfflineData,
    vibrateSuccess,
    vibrateWarning,
    vibrateError,
    updatePendingSyncCount
  };
};
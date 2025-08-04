import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

export function cleanupOldData() {
  try {
    const trips = JSON.parse(localStorage.getItem('taxi-trips') || '[]');
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const filteredTrips = trips.filter((trip: any) => {
      const tripDate = new Date(trip.timestamp);
      return tripDate > threeMonthsAgo;
    });
    
    localStorage.setItem('taxi-trips', JSON.stringify(filteredTrips));
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
}
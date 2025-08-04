import { useState, useEffect } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export const useLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<string | null>(null);
  const { toast } = useToast();

  const requestPermissions = async () => {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      toast({
        title: "שגיאה בהרשאות",
        description: "לא ניתן לגשת למיקום. אנא אפשר גישה בהגדרות האפליקציה",
        variant: "destructive"
      });
      return false;
    }
  };

  const getCurrentPosition = async (): Promise<LocationData | null> => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return null;

      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      setCurrentLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting current position:', error);
      toast({
        title: "שגיאה במיקום",
        description: "לא ניתן לקבל את המיקום הנוכחי",
        variant: "destructive"
      });
      return null;
    }
  };

  const startTracking = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const id = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 30000
      }, (position, err) => {
        if (err) {
          console.error('Error in location tracking:', err);
          return;
        }
        
        if (position) {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          setCurrentLocation(locationData);
        }
      });

      setWatchId(id);
      setIsTracking(true);
      
      toast({
        title: "מעקב מיקום הופעל",
        description: "המערכת עוקבת אחר המיקום שלך"
      });
    } catch (error) {
      console.error('Error starting location tracking:', error);
      toast({
        title: "שגיאה במעקב מיקום",
        description: "לא ניתן להתחיל מעקב אחר המיקום",
        variant: "destructive"
      });
    }
  };

  const stopTracking = async () => {
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
      setIsTracking(false);
      
      toast({
        title: "מעקב מיקום הופסק",
        description: "המערכת הפסיקה לעקוב אחר המיקום שלך"
      });
    }
  };

  useEffect(() => {
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchId]);

  return {
    currentLocation,
    isTracking,
    getCurrentPosition,
    startTracking,
    stopTracking
  };
};
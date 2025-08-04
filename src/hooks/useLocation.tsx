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
      // בדיקה אם Capacitor זמין (אפליקציה מקורית)
      if (typeof Geolocation.checkPermissions === 'function') {
        const currentPermissions = await Geolocation.checkPermissions();
        
        if (currentPermissions.location === 'granted') {
          return true;
        }
        
        if (currentPermissions.location === 'denied') {
          toast({
            title: "הרשאות מיקום נדחו",
            description: "אנא אפשר גישה למיקום בהגדרות הדפדפן או האפליקציה",
            variant: "destructive"
          });
          return false;
        }
        
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location === 'granted') {
          toast({
            title: "הרשאות מיקום אושרו",
            description: "המערכת יכולה כעת לעקוב אחר המיקום שלך",
          });
          return true;
        }
      } else {
        // Fallback לדפדפן רגיל
        if (!navigator.geolocation) {
          toast({
            title: "מיקום לא נתמך",
            description: "הדפדפן שלך לא תומך בשירותי מיקום",
            variant: "destructive"
          });
          return false;
        }
        
        // בדפדפן, אין דרך לבדוק הרשאות מראש, אז נעשה ניסיון ישיר
        return true;
      }
      
      toast({
        title: "הרשאות מיקום נדחו",
        description: "לא ניתן להשתמש במעקב מיקום ללא הרשאה",
        variant: "destructive"
      });
      return false;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      // Fallback לדפדפן במקרה של שגיאה ב-Capacitor
      if (navigator.geolocation) {
        return true;
      }
      toast({
        title: "שגיאה בהרשאות",
        description: "בעיה טכנית בבקשת הרשאות מיקום",
        variant: "destructive"
      });
      return false;
    }
  };

  const getCurrentPosition = async (): Promise<LocationData | null> => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return null;

      let position: Position;
      
      // ניסיון עם Capacitor תחילה
      try {
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
      } catch (capacitorError) {
        // Fallback לדפדפן רגיל
        const browserPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000
          });
        });
        
        position = {
          coords: {
            latitude: browserPosition.coords.latitude,
            longitude: browserPosition.coords.longitude,
            accuracy: browserPosition.coords.accuracy,
            altitude: browserPosition.coords.altitude,
            altitudeAccuracy: browserPosition.coords.altitudeAccuracy,
            heading: browserPosition.coords.heading,
            speed: browserPosition.coords.speed
          },
          timestamp: browserPosition.timestamp
        };
      }

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

      let id: string;
      
      // ניסיון עם Capacitor תחילה
      try {
        id = await Geolocation.watchPosition({
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
      } catch (capacitorError) {
        // Fallback לדפדפן רגיל
        id = navigator.geolocation.watchPosition(
          (browserPosition) => {
            const locationData: LocationData = {
              latitude: browserPosition.coords.latitude,
              longitude: browserPosition.coords.longitude,
              accuracy: browserPosition.coords.accuracy,
              timestamp: browserPosition.timestamp
            };
            setCurrentLocation(locationData);
          },
          (error) => {
            console.error('Error in browser location tracking:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 30000
          }
        ).toString();
      }

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
      try {
        // ניסיון עם Capacitor תחילה
        await Geolocation.clearWatch({ id: watchId });
      } catch (capacitorError) {
        // Fallback לדפדפן רגיל
        navigator.geolocation.clearWatch(parseInt(watchId));
      }
      
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
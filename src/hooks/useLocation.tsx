import { useState, useEffect } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  city?: string;
  address?: string;
}

export const useLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<string | null>(null);
  const { toast } = useToast();

  const requestPermissions = async () => {
    // Lazy permission request - only when explicitly needed
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

  const getCityFromCoordinates = async (lat: number, lng: number): Promise<{ city: string; address: string }> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=he,en`
      );
      const data = await response.json();
      
      const city = data.address?.city || 
                   data.address?.town || 
                   data.address?.village || 
                   data.address?.municipality || 
                   data.address?.county || 
                   'מיקום לא ידוע';
      
      const address = data.display_name || 'כתובת לא זמינה';
      
      return { city, address };
    } catch (error) {
      console.error('Error getting city name:', error);
      return { city: 'מיקום לא ידוע', address: 'כתובת לא זמינה' };
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

      // קבלת שם העיר
      const { city, address } = await getCityFromCoordinates(
        position.coords.latitude, 
        position.coords.longitude
      );
      locationData.city = city;
      locationData.address = address;

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
        }, async (position, err) => {
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
            
            // קבלת שם העיר
            try {
              const { city, address } = await getCityFromCoordinates(
                position.coords.latitude, 
                position.coords.longitude
              );
              locationData.city = city;
              locationData.address = address;
            } catch (error) {
              console.error('Error getting city during tracking:', error);
            }
            
            setCurrentLocation(locationData);
          }
        });
      } catch (capacitorError) {
        // Fallback לדפדפן רגיל
        id = navigator.geolocation.watchPosition(
          async (browserPosition) => {
            const locationData: LocationData = {
              latitude: browserPosition.coords.latitude,
              longitude: browserPosition.coords.longitude,
              accuracy: browserPosition.coords.accuracy,
              timestamp: browserPosition.timestamp
            };
            
            // קבלת שם העיר
            try {
              const { city, address } = await getCityFromCoordinates(
                browserPosition.coords.latitude, 
                browserPosition.coords.longitude
              );
              locationData.city = city;
              locationData.address = address;
            } catch (error) {
              console.error('Error getting city during browser tracking:', error);
            }
            
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
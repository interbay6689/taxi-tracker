import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Play, Square, Clock } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { useToast } from '@/hooks/use-toast';

interface TripTrackerProps {
  onTripComplete: (tripData: {
    amount: number;
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
    duration: number;
  }) => void;
}

interface LocationInfo {
  address: string;
  city: string;
  lat: number;
  lng: number;
}

export const TripTracker: React.FC<TripTrackerProps> = ({ onTripComplete }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [startLocation, setStartLocation] = useState<LocationInfo | null>(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  const { getCurrentPosition } = useLocation();
  const { toast } = useToast();

  const startTrip = async () => {
    try {
      const location = await getCurrentPosition();
      if (!location) {
        toast({
          title: "שגיאה במיקום",
          description: "לא ניתן לקבל את מיקום ההתחלה",
          variant: "destructive"
        });
        return;
      }

      const startLocationData: LocationInfo = {
        address: location.address || 'כתובת לא זמינה',
        city: location.city || 'עיר לא ידועה',
        lat: location.latitude,
        lng: location.longitude
      };

      setStartLocation(startLocationData);
      setStartTime(new Date());
      setIsTracking(true);
      setCurrentDuration(0);

      // התחל ספירת זמן
      const interval = setInterval(() => {
        setCurrentDuration(prev => prev + 1);
      }, 1000);

      // שמור את interval id ב-session storage כדי לנקות אותו
      sessionStorage.setItem('tripInterval', interval.toString());

      toast({
        title: "נסיעה החלה!",
        description: `התחלה: ${startLocationData.city}`,
      });
    } catch (error) {
      console.error('Error starting trip:', error);
      toast({
        title: "שגיאה בתחילת נסיעה",
        description: "לא ניתן להתחיל מעקב נסיעה",
        variant: "destructive"
      });
    }
  };

  const endTrip = async () => {
    if (!startLocation || !startTime) return;

    try {
      const location = await getCurrentPosition();
      if (!location) {
        toast({
          title: "שגיאה במיקום",
          description: "לא ניתן לקבל את מיקום הסיום",
          variant: "destructive"
        });
        return;
      }

      const endLocationData: LocationInfo = {
        address: location.address || 'כתובת לא זמינה',
        city: location.city || 'עיר לא ידועה',
        lat: location.latitude,
        lng: location.longitude
      };

      const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      // נקה את interval
      const intervalId = sessionStorage.getItem('tripInterval');
      if (intervalId) {
        clearInterval(parseInt(intervalId));
        sessionStorage.removeItem('tripInterval');
      }

      // בקש מהמשתמש להזין סכום
      const amount = prompt(`נסיעה הסתיימה!\n\nמ: ${startLocation.city}\nאל: ${endLocationData.city}\nמשך: ${formatDuration(duration)}\n\nהזן סכום הנסיעה (₪):`);
      
      if (amount && !isNaN(Number(amount))) {
        onTripComplete({
          amount: Number(amount),
          startLocation,
          endLocation: endLocationData,
          duration
        });

        // איפוס המצב
        setIsTracking(false);
        setStartTime(null);
        setStartLocation(null);
        setCurrentDuration(0);

        toast({
          title: "נסיעה הושלמה!",
          description: `נסיעה של ${amount}₪ נוספה בהצלחה`,
        });
      } else {
        toast({
          title: "סכום לא תקין",
          description: "הנסיעה לא נשמרה",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error ending trip:', error);
      toast({
        title: "שגיאה בסיום נסיעה",
        description: "לא ניתן לסיים את הנסיעה",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
            <MapPin className="h-5 w-5" />
            מעקב נסיעה
          </h3>

          {!isTracking ? (
            <Button 
              onClick={startTrip}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Play className="h-5 w-5 mr-2" />
              התחל נסיעה
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {formatDuration(currentDuration)}
                </div>
                {startLocation && (
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MapPin className="h-4 w-4" />
                      נסיעה החלה מ: {startLocation.city}
                    </div>
                    <div className="text-xs opacity-75">
                      {startTime?.toLocaleTimeString('he-IL')}
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={endTrip}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <Square className="h-5 w-5 mr-2" />
                סיים נסיעה
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
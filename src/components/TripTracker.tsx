import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Play, Square, Clock } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { useToast } from '@/hooks/use-toast';
import { AddTripDialog } from './AddTripDialog';

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
    paymentMethod: string;
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
  const [endLocation, setEndLocation] = useState<LocationInfo | null>(null);
  const [showAddTripDialog, setShowAddTripDialog] = useState(false);
  const { getCurrentPosition } = useLocation();
  const { toast } = useToast();

  // טען מצב נסיעה מהזיכרון כאשר הקומפוננט נטען
  useEffect(() => {
    console.log('TripTracker mounted, checking for saved trip state...');
    const savedTripState = localStorage.getItem('activeTrip');
    console.log('Saved trip state:', savedTripState);
    
    if (savedTripState) {
      try {
        const tripData = JSON.parse(savedTripState);
        console.log('Parsed trip data:', tripData);
        
        setIsTracking(tripData.isTracking);
        setStartTime(new Date(tripData.startTime));
        setStartLocation(tripData.startLocation);
        
        // חשב את משך הזמן מאז התחלת הנסיעה
        const elapsedSeconds = Math.floor((new Date().getTime() - new Date(tripData.startTime).getTime()) / 1000);
        setCurrentDuration(elapsedSeconds);
        console.log('Trip restored, elapsed seconds:', elapsedSeconds);

        // התחל ספירת זמן מחדש
        if (tripData.isTracking) {
          console.log('Starting interval timer...');
          const interval = setInterval(() => {
            setCurrentDuration(prev => prev + 1);
          }, 1000);
          sessionStorage.setItem('tripInterval', interval.toString());
        }
      } catch (error) {
        console.error('Error loading trip state:', error);
        localStorage.removeItem('activeTrip');
      }
    } else {
      console.log('No saved trip state found');
    }
  }, []);

  // שמור מצב נסיעה בזיכרון כאשר המצב משתנה
  const saveTripState = (tracking: boolean, time: Date | null, location: LocationInfo | null) => {
    if (tracking && time && location) {
      const tripData = {
        isTracking: tracking,
        startTime: time.toISOString(),
        startLocation: location
      };
      localStorage.setItem('activeTrip', JSON.stringify(tripData));
    } else {
      localStorage.removeItem('activeTrip');
    }
  };

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

      const newStartTime = new Date();
      setStartLocation(startLocationData);
      setStartTime(newStartTime);
      setIsTracking(true);
      setCurrentDuration(0);

      // שמור מצב הנסיעה
      saveTripState(true, newStartTime, startLocationData);

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

      // שמור את מיקום הסיום ופתח את דיאלוג הוספת נסיעה
      setEndLocation(endLocationData);
      setShowAddTripDialog(true);

      toast({
        title: "נסיעה הסתיימה!",
        description: `מ: ${startLocation.city} אל: ${endLocationData.city}`,
      });
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

  const handleTripAdd = (amount: number, paymentMethod: string) => {
    if (!startLocation || !endLocation || !startTime) return;

    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    onTripComplete({
      amount,
      startLocation,
      endLocation,
      duration,
      paymentMethod
    });

    // איפוס המצב
    setIsTracking(false);
    setStartTime(null);
    setStartLocation(null);
    setEndLocation(null);
    setCurrentDuration(0);
    setShowAddTripDialog(false);

    // נקה את מצב הנסיעה מהזיכרון
    saveTripState(false, null, null);
  };

  const handleDialogClose = () => {
    setShowAddTripDialog(false);
    // אם המשתמש סוגר את הדיאלוג בלי להוסיף נסיעה, נחזיר את המצב
    setIsTracking(true);
  };

  return (
    <>
      <AddTripDialog
        isOpen={showAddTripDialog}
        onClose={handleDialogClose}
        onAddTrip={handleTripAdd}
      />
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
              <Play className="h-5 w-5 ml-2" />
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
                <Square className="h-5 w-5 ml-2" />
                סיים נסיעה
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
};
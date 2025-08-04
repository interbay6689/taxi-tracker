import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TripTimerProps {
  onTripComplete: (duration: number, distance?: number) => void;
}

export const TripTimer = ({ onTripComplete }: TripTimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startTrip = () => {
    // בקשת מיקום
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: "מיקום נקלט",
            description: "הנסיעה החלה עם מעקב מיקום",
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          toast({
            title: "לא ניתן לקבל מיקום",
            description: "הנסיעה תתחיל ללא מעקב מיקום",
            variant: "destructive"
          });
        }
      );
    }
    
    setIsRunning(true);
    setStartTime(new Date());
    setSeconds(0);
    
    toast({
      title: "נסיעה החלה",
      description: "הטיימר פועל",
    });
  };

  const pauseTrip = () => {
    setIsRunning(false);
    toast({
      title: "נסיעה הושהתה",
      description: "ניתן להמשיך או לסיים",
    });
  };

  const resumeTrip = () => {
    setIsRunning(true);
    toast({
      title: "נסיעה התחדשה",
      description: "הטיימר פועל שוב",
    });
  };

  const endTrip = () => {
    setIsRunning(false);
    
    // חישוב מרחק אם יש מיקום
    let distance: number | undefined;
    if (location && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const endLat = position.coords.latitude;
          const endLng = position.coords.longitude;
          
          // חישוב מרחק בקו ישר (קירוב)
          const R = 6371; // רדיוס כדור הארץ בק"מ
          const dLat = (endLat - location.lat) * Math.PI / 180;
          const dLng = (endLng - location.lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(location.lat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = R * c;
          
          onTripComplete(seconds, distance);
        },
        () => {
          onTripComplete(seconds);
        }
      );
    } else {
      onTripComplete(seconds);
    }
    
    // איפוס
    setSeconds(0);
    setStartTime(null);
    setLocation(null);
    
    toast({
      title: "נסיעה הסתיימה",
      description: `משך זמן: ${formatTime(seconds)}`,
    });
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">טיימר נסיעה</span>
          </div>
          
          <div className="text-3xl font-bold font-mono text-primary">
            {formatTime(seconds)}
          </div>
          
          {startTime && (
            <div className="text-xs text-muted-foreground">
              התחלה: {startTime.toLocaleTimeString('he-IL')}
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            {!isRunning && seconds === 0 && (
              <Button
                onClick={startTrip}
                className="flex-1 hover-scale"
                size="sm"
              >
                <Play className="h-4 w-4 mr-1" />
                התחל נסיעה
              </Button>
            )}
            
            {isRunning && (
              <Button
                onClick={pauseTrip}
                variant="outline"
                className="hover-scale"
                size="sm"
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            
            {!isRunning && seconds > 0 && (
              <Button
                onClick={resumeTrip}
                className="hover-scale"
                size="sm"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            {seconds > 0 && (
              <Button
                onClick={endTrip}
                variant="destructive"
                className="hover-scale"
                size="sm"
              >
                <Square className="h-4 w-4 mr-1" />
                סיים נסיעה
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
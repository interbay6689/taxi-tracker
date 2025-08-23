import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaxiMeterCalculator } from "./TaxiMeterCalculator";
import { AddTripDialog } from "./AddTripDialog";
import { 
  Play, 
  Pause, 
  Square, 
  MapPin, 
  Clock, 
  Navigation,
  DollarSign,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Trip } from "@/hooks/database/types";

interface SmartTripTrackerProps {
  onTripComplete?: (trip: Partial<Trip>) => void;
  isActive?: boolean;
}

interface TripData {
  startTime: Date | null;
  endTime: Date | null;
  startLocation: { lat: number; lng: number; address: string } | null;
  endLocation: { lat: number; lng: number; address: string } | null;
  duration: number; // in seconds
  distance: number; // in kilometers
  calculatedPrice: number;
  actualPrice?: number;
}

export const SmartTripTracker = ({ onTripComplete, isActive = false }: SmartTripTrackerProps) => {
  const { toast } = useToast();
  const [trackingState, setTrackingState] = useState<'idle' | 'active' | 'paused' | 'completed'>('idle');
  const [tripData, setTripData] = useState<TripData>({
    startTime: null,
    endTime: null,
    startLocation: null,
    endLocation: null,
    duration: 0,
    distance: 0,
    calculatedPrice: 0,
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // עדכון זמן בזמן אמת
  useEffect(() => {
    if (trackingState === 'active' && tripData.startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - tripData.startTime!.getTime()) / 1000);
        setTripData(prev => ({ ...prev, duration }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [trackingState, tripData.startTime]);

  // מעקב מיקום GPS
  const startLocationTracking = (): Promise<{ lat: number; lng: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("הדפדפן לא תומך במיקום GPS"));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // ניסיון לקבל כתובת מהמיקום (במציאות צריך API key של Google)
            const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            
            resolve({
              lat: latitude,
              lng: longitude,
              address: address
            });
          } catch (error) {
            resolve({
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        options
      );
    });
  };

  const handleStartTrip = async () => {
    try {
      toast({
        title: "מתחיל מעקב GPS...",
        description: "מחכה למיקום התחלתי"
      });

      const startLocation = await startLocationTracking();
      
      setTripData({
        startTime: new Date(),
        endTime: null,
        startLocation,
        endLocation: null,
        duration: 0,
        distance: 0,
        calculatedPrice: 0,
      });
      
      setTrackingState('active');
      
      toast({
        title: "נסיעה החלה!",
        description: `מיקום התחלה: ${startLocation.address}`,
      });
    } catch (error) {
      toast({
        title: "שגיאה במיקום",
        description: "לא ניתן לקבל מיקום GPS. המשך ידנית?",
        variant: "destructive"
      });
    }
  };

  const handlePauseTrip = () => {
    setTrackingState('paused');
    toast({
      title: "נסיעה הושהתה",
      description: "הטיימר הושהה"
    });
  };

  const handleResumeTrip = () => {
    setTrackingState('active');
    toast({
      title: "נסיעה התחדשה",
      description: "הטיימר חזר לפעול"
    });
  };

  const handleEndTrip = async () => {
    if (!tripData.startTime) return;

    try {
      const endLocation = await startLocationTracking();
      const endTime = new Date();
      const finalDuration = Math.floor((endTime.getTime() - tripData.startTime.getTime()) / 1000);
      
      // חישוב מרחק מוערך (במציאות צריך API של מרחקים)
      let estimatedDistance = 0;
      if (tripData.startLocation && endLocation) {
        // חישוב מרחק אווירי פשוט (לא מדויק לכבישים)
        const lat1 = tripData.startLocation.lat;
        const lng1 = tripData.startLocation.lng;
        const lat2 = endLocation.lat;
        const lng2 = endLocation.lng;
        
        const R = 6371; // רדיוס כדור הארץ בק"מ
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        estimatedDistance = R * c;
      }

      setTripData(prev => ({
        ...prev,
        endTime,
        endLocation,
        duration: finalDuration,
        distance: estimatedDistance
      }));
      
      setTrackingState('completed');
      setShowAddDialog(true);
      
      toast({
        title: "נסיעה הסתיימה!",
        description: `משך: ${formatDuration(finalDuration)}, מרחק: ${estimatedDistance.toFixed(1)} ק"מ`
      });
    } catch (error) {
      // אם יש בעיה עם GPS, נסיים בכל מקרה
      const endTime = new Date();
      const finalDuration = Math.floor((endTime.getTime() - tripData.startTime.getTime()) / 1000);
      
      setTripData(prev => ({
        ...prev,
        endTime,
        endLocation: null,
        duration: finalDuration
      }));
      
      setTrackingState('completed');
      setShowAddDialog(true);
    }
  };

  const handleTripAdd = (amount: number, paymentMethod: string, tag?: string) => {
    const completedTrip: Partial<Trip> = {
      amount,
      payment_method: paymentMethod as Trip['payment_method'],
      timestamp: tripData.endTime?.toISOString() || new Date().toISOString(),
      start_location_address: tripData.startLocation?.address,
      start_location_lat: tripData.startLocation?.lat,
      start_location_lng: tripData.startLocation?.lng,
      end_location_address: tripData.endLocation?.address,
      end_location_lat: tripData.endLocation?.lat,
      end_location_lng: tripData.endLocation?.lng,
      trip_start_time: tripData.startTime?.toISOString(),
      trip_end_time: tripData.endTime?.toISOString(),
      trip_status: 'completed'
    };

    onTripComplete?.(completedTrip);
    resetTrip();
  };

  const resetTrip = () => {
    setTripData({
      startTime: null,
      endTime: null,
      startLocation: null,
      endLocation: null,
      duration: 0,
      distance: 0,
      calculatedPrice: 0,
    });
    setTrackingState('idle');
    setShowAddDialog(false);
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

  const getStateColor = () => {
    switch (trackingState) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStateText = () => {
    switch (trackingState) {
      case 'active': return 'נסיעה פעילה';
      case 'paused': return 'נסיעה מושהית';
      case 'completed': return 'נסיעה הסתיימה';
      default: return 'ממתין לנסיעה';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              מעקב נסיעה חכם
            </div>
            <Badge className={`${getStateColor()} text-white`}>
              {getStateText()}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* תצוגת זמן ומיקום */}
          {trackingState !== 'idle' && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {formatDuration(tripData.duration)}
                  </div>
                  <div className="text-sm text-muted-foreground">זמן נסיעה</div>
                </div>
              </div>
              
              {tripData.startLocation && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-500 mt-1" />
                    <div>
                      <div className="text-sm font-medium">מיקום התחלה</div>
                      <div className="text-xs text-muted-foreground">
                        {tripData.startLocation.address}
                      </div>
                    </div>
                  </div>
                  
                  {tripData.endLocation && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 mt-1" />
                      <div>
                        <div className="text-sm font-medium">מיקום סיום</div>
                        <div className="text-xs text-muted-foreground">
                          {tripData.endLocation.address}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tripData.distance > 0 && (
                <div className="flex justify-center gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{tripData.distance.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">ק"מ</div>
                  </div>
                  {tripData.calculatedPrice > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-semibold">₪{tripData.calculatedPrice.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">מחיר משוער</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* כפתורי בקרה */}
          <div className="flex gap-2">
            {trackingState === 'idle' && (
              <Button 
                onClick={handleStartTrip}
                className="flex-1 h-12"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                התחל נסיעה
              </Button>
            )}
            
            {trackingState === 'active' && (
              <>
                <Button 
                  onClick={handlePauseTrip}
                  variant="outline"
                  className="flex-1 h-12"
                  size="lg"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  השהה
                </Button>
                <Button 
                  onClick={handleEndTrip}
                  variant="destructive"
                  className="flex-1 h-12"
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  סיים נסיעה
                </Button>
              </>
            )}
            
            {trackingState === 'paused' && (
              <>
                <Button 
                  onClick={handleResumeTrip}
                  className="flex-1 h-12"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  המשך
                </Button>
                <Button 
                  onClick={handleEndTrip}
                  variant="destructive"
                  className="flex-1 h-12"
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  סיים נסיעה
                </Button>
              </>
            )}
            
            {trackingState === 'completed' && (
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="flex-1 h-12"
                size="lg"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                הוסף לרישומים
              </Button>
            )}
          </div>

          {/* מחשבון מונה משולב */}
          {(trackingState === 'active' || trackingState === 'paused') && (
            <div className="border-t pt-4">
              <TaxiMeterCalculator 
                onCalculatedPrice={(price) => {
                  setTripData(prev => ({ ...prev, calculatedPrice: price }));
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* דיאלוג הוספת נסיעה */}
      <AddTripDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAddTrip={handleTripAdd}
        tripsToday={[]}
      />
    </div>
  );
};
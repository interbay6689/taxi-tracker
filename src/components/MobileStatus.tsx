import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, MapPin, Clock, Smartphone } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";

export const MobileStatus = () => {
  const { currentLocation, isTracking, startTracking, stopTracking } = useLocation();
  const { isOnline, pendingSyncCount } = useOfflineStorage();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLocation = () => {
    if (!currentLocation) return "מיקום לא זמין";
    return `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`;
  };

  const getLocationAccuracy = () => {
    if (!currentLocation) return "";
    if (currentLocation.accuracy < 10) return "מדויק מאוד";
    if (currentLocation.accuracy < 50) return "מדויק";
    if (currentLocation.accuracy < 100) return "בינוני";
    return "לא מדויק";
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* סטטוס חיבור */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {isOnline ? "מחובר" : "מצב אופליין"}
              </span>
            </div>
            {pendingSyncCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {pendingSyncCount} ממתינות לסנכרון
              </Badge>
            )}
          </div>

          {/* מיקום */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">מיקום GPS</span>
              </div>
              <Button 
                variant={isTracking ? "destructive" : "outline"}
                size="sm"
                onClick={isTracking ? stopTracking : startTracking}
              >
                {isTracking ? "עצור מעקב" : "התחל מעקב"}
              </Button>
            </div>
            
            {currentLocation && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>קואורדינטות: {formatLocation()}</div>
                <div className="flex justify-between">
                  <span>דיוק: {getLocationAccuracy()}</span>
                  <span>{Math.round(currentLocation.accuracy)}m</span>
                </div>
              </div>
            )}
          </div>

          {/* שעה נוכחית */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-600" />
            <span>{currentTime.toLocaleTimeString('he-IL')}</span>
            <Smartphone className="h-4 w-4 text-primary ml-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
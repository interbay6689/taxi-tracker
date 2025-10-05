import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin, ArrowLeft, Clock, Car } from 'lucide-react';
import { getPaymentMethodDisplayLabel } from '@/utils/paymentMethodsHelper';
import { getOrderSourceDisplayLabel } from '@/utils/orderSourceHelper';
import { Trip } from '@/hooks/useDatabase';

interface TripsListProps {
  trips: Trip[];
  currentWorkDay?: any;
}

const formatLocationForDisplay = (city?: string, address?: string) => {
  if (!city && !address) return 'מיקום לא זמין';
  
  if (city && address) {
    // הצג רק את החלק הרלוונטי מהכתובת
    const parts = address.split(',');
    const relevantPart = parts.find(part => 
      part.includes('רחוב') || 
      part.includes('שדרות') || 
      part.match(/\d+/) || 
      part.includes(city)
    ) || parts[0];
    
    return relevantPart.trim();
  }
  
  return city || address;
};

export const TripsList: React.FC<TripsListProps> = ({ trips, currentWorkDay }) => {
  const [activeTab, setActiveTab] = useState('shift');

  const filteredTrips = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // משמרת נוכחית - רק נסיעות מהמשמרת הפעילה
    const shiftTrips = currentWorkDay ? trips.filter(trip => {
      const tripTime = new Date(trip.timestamp);
      const shiftStartTime = new Date(currentWorkDay.start_time);
      const shiftEndTime = currentWorkDay.end_time ? new Date(currentWorkDay.end_time) : now;
      
      return tripTime >= shiftStartTime && tripTime <= shiftEndTime;
    }) : [];

    // שבוע נוכחי - כל הנסיעות מתחילת השבוע (ראשון) עד היום
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday is day 0
    startOfWeek.setHours(0, 0, 0, 0);
    const weekTrips = trips.filter(trip => {
      const tripTime = new Date(trip.timestamp);
      return tripTime >= startOfWeek && tripTime <= now;
    });

    // חודש נוכחי - כל הנסיעות מתחילת החודש עד היום
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTrips = trips.filter(trip => {
      const tripTime = new Date(trip.timestamp);
      return tripTime >= startOfMonth && tripTime <= now;
    });

    return {
      shift: shiftTrips,
      week: weekTrips,
      month: monthTrips
    };
  }, [trips, currentWorkDay]);

  const displayTrips = filteredTrips[activeTab as keyof typeof filteredTrips] || [];
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'shift':
        return 'משמרת';
      case 'week':
        return 'השבוע';
      case 'month':
        return 'מתחילת החודש';
      default:
        return 'משמרת';
    }
  };

  const getEmptyMessage = (tab: string) => {
    switch (tab) {
      case 'shift':
        return currentWorkDay ? 'עדיין לא נוספו נסיעות במשמרת הנוכחית' : 'התחל משמרת כדי לראות נסיעות';
      case 'week':
        return 'אין נסיעות השבוע';
      case 'month':
        return 'אין נסיעות מתחילת החודש';
      default:
        return 'אין נסיעות';
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5 text-primary" />
          נסיעות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="shift" className="text-xs">משמרת</TabsTrigger>
            <TabsTrigger value="week" className="text-xs">השבוע</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">מתחילת החודש</TabsTrigger>
          </TabsList>

          {['shift', 'week', 'month'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {getTabLabel(tab)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {filteredTrips[tab as keyof typeof filteredTrips].length} נסיעות
                </span>
              </div>

              {filteredTrips[tab as keyof typeof filteredTrips].length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{getEmptyMessage(tab)}</p>
                  <p className="text-sm">השתמש במעקב נסיעה כדי להתחיל</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {filteredTrips[tab as keyof typeof filteredTrips].map((trip) => (
                      <div
                        key={trip.id}
                        className="p-3 bg-muted/50 rounded-lg border border-muted-foreground/20"
                      >
                        {/* סכום, מקור הזמנה ואמצעי תשלום */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg font-bold text-primary">
                                ₪{trip.amount.toLocaleString()}
                              </span>
                              <Badge variant="default" className="flex items-center gap-1">
                                {getOrderSourceDisplayLabel(trip.order_source)}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                {getPaymentMethodDisplayLabel(trip.payment_method)}
                              </Badge>
                            </div>
                            {/* תיוג */}
                            {trip.trip_status && trip.trip_status !== 'completed' && trip.trip_status !== 'active' && (
                              <div className="mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {trip.trip_status}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(trip.timestamp).toLocaleTimeString('he-IL', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        {/* מיקומים */}
                        {(trip.start_location_city || trip.end_location_city) && (
                          <div className="space-y-1">
                            {trip.start_location_city && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 text-green-600" />
                                <span className="font-medium">התחלה:</span>
                                <span>{formatLocationForDisplay(trip.start_location_city, trip.start_location_address)}</span>
                              </div>
                            )}
                            
                            {trip.end_location_city && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 text-red-600" />
                                <span className="font-medium">סיום:</span>
                                <span>{formatLocationForDisplay(trip.end_location_city, trip.end_location_address)}</span>
                              </div>
                            )}

                            {trip.start_location_city && trip.end_location_city && (
                              <div className="flex items-center gap-1 text-xs text-primary font-medium mt-1">
                                <span>{trip.start_location_city}</span>
                                <ArrowLeft className="h-3 w-3" />
                                <span>{trip.end_location_city}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">
                        סה"כ {getTabLabel(tab)}:
                      </span>
                      <span className="text-lg font-bold text-primary">
                        ₪{filteredTrips[tab as keyof typeof filteredTrips].reduce((sum, trip) => sum + trip.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
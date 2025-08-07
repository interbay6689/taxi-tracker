import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Smartphone, MapPin, ArrowLeft, Clock, Car } from 'lucide-react';

import { Trip } from '@/hooks/useDatabase';

interface TripsListProps {
  trips: Trip[];
  currentWorkDay?: any;
}

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'card':
      return <CreditCard className="h-3 w-3" />;
    case 'app':
      return <Smartphone className="h-3 w-3" />;
    case 'cash':
    default:
      return <Banknote className="h-3 w-3" />;
  }
};

const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'card':
    case 'כרטיס':
    case 'אשראי':
      return 'כרטיס';
    case 'app':
    case 'אפליקציה':
    case 'GetTaxi':
      return 'אפליקציה';
    case 'דהרי':
      return 'דהרי';
    case 'cash':
    case 'מזומן':
    default:
      return 'מזומן';
  }
};

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
  // Filter trips to show only those from the current active shift
  const displayTrips = currentWorkDay ? trips.filter(trip => {
    const tripTime = new Date(trip.timestamp);
    const shiftStartTime = new Date(currentWorkDay.start_time);
    const shiftEndTime = currentWorkDay.end_time ? new Date(currentWorkDay.end_time) : new Date();
    
    return tripTime >= shiftStartTime && tripTime <= shiftEndTime;
  }) : trips;
  if (displayTrips.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-primary" />
            נסיעות היום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>עדיין לא נוספו נסיעות היום</p>
            <p className="text-sm">השתמש במעקב נסיעה כדי להתחיל</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            נסיעות היום
          </div>
          <span className="text-sm text-muted-foreground">
            {displayTrips.length} נסיעות
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {displayTrips.map((trip) => (
            <div
              key={trip.id}
              className="p-3 bg-muted/50 rounded-lg border border-muted-foreground/20"
            >
              {/* סכום ואמצעי תשלום */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col gap-1">
                  {trip.payment_method === 'דהרי' ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600 font-medium">
                          -10% עמלת סדרנים
                        </span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getPaymentMethodIcon(trip.payment_method)}
                          {getPaymentMethodText(trip.payment_method)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base line-through text-muted-foreground">
                          ₪{trip.amount.toLocaleString()}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          ₪{Math.round(trip.amount * 0.9).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        ₪{trip.amount.toLocaleString()}
                      </span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getPaymentMethodIcon(trip.payment_method)}
                        {getPaymentMethodText(trip.payment_method)}
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
        
        {displayTrips.length > 0 && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                סה"כ היום:
              </span>
              <span className="text-lg font-bold text-primary">
                ₪{displayTrips.reduce((sum, trip) => {
                  const amount = trip.payment_method === 'דהרי' ? trip.amount * 0.9 : trip.amount;
                  return sum + amount;
                }, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
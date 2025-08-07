import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Trash2, Edit, MapPin, Clock } from 'lucide-react';
import { Trip } from "@/hooks/useDatabase";

interface TripsTabProps {
  trips: Trip[];
  currentWorkDay: any;
  onDeleteTrip: (tripId: string) => void;
  onEditTrip: (tripId: string, amount: number) => void;
}

export const TripsTab: React.FC<TripsTabProps> = ({ trips, currentWorkDay, onDeleteTrip, onEditTrip }) => {
  // Filter trips to show only those from the current active shift
  const shiftTrips = trips.filter(trip => {
    if (!currentWorkDay) return false;
    
    const tripTime = new Date(trip.timestamp);
    const shiftStartTime = new Date(currentWorkDay.start_time);
    const shiftEndTime = currentWorkDay.end_time ? new Date(currentWorkDay.end_time) : new Date();
    
    return tripTime >= shiftStartTime && tripTime <= shiftEndTime;
  });

  if (!currentWorkDay) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">אין משמרת פעילה</p>
        </CardContent>
      </Card>
    );
  }

  if (shiftTrips.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">אין נסיעות במשמרת הנוכחית</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {shiftTrips.map((trip) => (
        <Card key={trip.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col gap-1">
                {trip.payment_method === 'דהרי' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600 font-medium">
                        -10% עמלת סדרנים
                      </span>
                      <Badge variant="outline">דהרי</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base line-through text-muted-foreground">
                        ₪{trip.amount.toLocaleString()}
                      </span>
                      <span className="text-lg font-bold">
                        ₪{Math.round(trip.amount * 0.9).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">₪{trip.amount.toLocaleString()}</span>
                    <Badge variant="outline">
                      {trip.payment_method === 'cash' || trip.payment_method === 'מזומן' ? 'מזומן' : 
                       trip.payment_method === 'card' || trip.payment_method === 'אשראי' ? 'כרטיס' : 
                       trip.payment_method === 'ביט' ? 'ביט' :
                       trip.payment_method === 'app' || trip.payment_method === 'GetTaxi' ? 'אפליקציה' : 
                       trip.payment_method === 'דהרי' ? 'דהרי' : trip.payment_method}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newAmount = prompt("הזן סכום חדש:", trip.amount.toString());
                    if (newAmount && !isNaN(Number(newAmount))) {
                      onEditTrip(trip.id, Number(newAmount));
                    }
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteTrip(trip.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(trip.timestamp).toLocaleTimeString('he-IL')}
              </div>
              
              {trip.start_location_city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-green-600" />
                  <span>התחלה: {trip.start_location_city}</span>
                </div>
              )}
              
              {trip.end_location_city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-red-600" />
                  <span>סיום: {trip.end_location_city}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">סה"כ נסיעות במשמרת:</span>
            <span className="text-lg font-bold">
              ₪{shiftTrips.reduce((sum, trip) => {
                const amount = trip.payment_method === 'דהרי' ? trip.amount * 0.9 : trip.amount;
                return sum + amount;
              }, 0).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
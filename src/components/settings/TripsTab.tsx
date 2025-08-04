import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Trash2, Edit, MapPin, Clock } from 'lucide-react';
import { Trip } from "@/hooks/useDatabase";

interface TripsTabProps {
  trips: Trip[];
  onDeleteTrip: (tripId: string) => void;
  onEditTrip: (tripId: string, amount: number) => void;
}

export const TripsTab: React.FC<TripsTabProps> = ({ trips, onDeleteTrip, onEditTrip }) => {
  const todayTrips = trips.filter(trip => trip.timestamp.startsWith(new Date().toISOString().split('T')[0]));

  if (todayTrips.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">אין נסיעות להצגה</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {todayTrips.map((trip) => (
        <Card key={trip.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">₪{trip.amount.toLocaleString()}</span>
                <Badge variant="outline">
                  {trip.payment_method === 'cash' ? 'מזומן' : 
                   trip.payment_method === 'card' ? 'כרטיס' : 'אפליקציה'}
                </Badge>
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
            <span className="font-medium">סה"כ נסיעות היום:</span>
            <span className="text-lg font-bold">
              ₪{todayTrips.reduce((sum, trip) => sum + trip.amount, 0).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
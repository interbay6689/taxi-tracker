import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Clock } from "lucide-react";
import { Trip } from "./TaxiDashboard";

interface TripsListProps {
  trips: Trip[];
}

export const TripsList = ({ trips }: TripsListProps) => {
  if (trips.length === 0) {
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
            <p className="text-sm">לחץ על "הוספת נסיעה" כדי להתחיל</p>
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
            {trips.length} נסיעות
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Car className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    ₪{trip.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {trip.timestamp.toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    <span>•</span>
                    <span className="text-primary font-medium">
                      {trip.paymentMethod || "מזומן"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {trips.length > 0 && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                סה"כ היום:
              </span>
              <span className="text-lg font-bold text-primary">
                ₪{trips.reduce((sum, trip) => sum + trip.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
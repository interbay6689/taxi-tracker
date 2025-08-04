import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit3, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Trip } from "../TaxiDashboard";

interface TripsTabProps {
  trips: Trip[];
  onUpdateTrips: (trips: Trip[]) => void;
}

export const TripsTab = ({ trips, onUpdateTrips }: TripsTabProps) => {
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const { toast } = useToast();

  const todayTrips = trips.filter(trip => trip.date === new Date().toDateString());

  const handleDeleteTrip = (tripId: string) => {
    const updatedTrips = trips.filter(trip => trip.id !== tripId);
    onUpdateTrips(updatedTrips);
    toast({
      title: "נסיעה נמחקה",
      description: "הנסיעה הוסרה בהצלחה",
    });
  };

  const handleEditTrip = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      setEditingTrip(tripId);
      setEditAmount(trip.amount.toString());
    }
  };

  const handleSaveEdit = (tripId: string) => {
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      toast({
        title: "שגיאה",
        description: "אנא הזן סכום תקין",
        variant: "destructive"
      });
      return;
    }

    const updatedTrips = trips.map(trip => 
      trip.id === tripId ? { ...trip, amount: newAmount } : trip
    );
    onUpdateTrips(updatedTrips);
    setEditingTrip(null);
    setEditAmount("");
    toast({
      title: "נסיעה עודכנה",
      description: `הסכום עודכן ל-₪${newAmount}`,
    });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <List className="h-4 w-4" />
          נסיעות היום ({todayTrips.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayTrips.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            אין נסיעות היום
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {todayTrips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-2 bg-muted rounded-lg animate-scale-in">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">
                    {trip.timestamp.toLocaleTimeString('he-IL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  {editingTrip === trip.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="h-8 w-20 text-center"
                        dir="ltr"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(trip.id)}
                        className="h-8 px-2 hover-scale"
                      >
                        שמור
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTrip(null)}
                        className="h-8 px-2 hover-scale"
                      >
                        ביטול
                      </Button>
                    </div>
                   ) : (
                     <div>
                       <div className="font-semibold">₪{trip.amount}</div>
                       <div className="text-xs text-muted-foreground">
                         {trip.paymentMethod || "מזומן"}
                       </div>
                     </div>
                   )}
                </div>
                {editingTrip !== trip.id && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTrip(trip.id)}
                      className="h-8 w-8 p-0 hover-scale"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover-scale"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit3, Plus } from "lucide-react";
import { Trip } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";

interface EditTripsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  onDeleteTrip: (id: string) => void;
  onUpdateTrip: (id: string, amount: number, paymentMethod: 'cash' | 'card' | 'app') => void;
  onAddTrip: () => void;
}

export const EditTripsDialog = ({
  isOpen,
  onClose,
  trips,
  onDeleteTrip,
  onUpdateTrip,
  onAddTrip
}: EditTripsDialogProps) => {
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'card' | 'app'>('cash');
  const { toast } = useToast();

  const handleEditStart = (trip: Trip) => {
    setEditingTrip(trip.id);
    setEditAmount(trip.amount.toString());
    setEditPaymentMethod(trip.payment_method);
  };

  const handleEditSave = (tripId: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס סכום תקין",
        variant: "destructive"
      });
      return;
    }

    onUpdateTrip(tripId, amount, editPaymentMethod);
    setEditingTrip(null);
    toast({
      title: "נסיעה עודכנה",
      description: "הנסיעה עודכנה בהצלחה"
    });
  };

  const handleEditCancel = () => {
    setEditingTrip(null);
    setEditAmount("");
    setEditPaymentMethod('cash');
  };

  const handleDelete = (tripId: string) => {
    onDeleteTrip(tripId);
    toast({
      title: "נסיעה נמחקה",
      description: "הנסיעה נמחקה בהצלחה"
    });
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'מזומן';
      case 'card': return 'כרטיס';
      case 'app': return 'אפליקציה';
      default: return method;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            עריכת נסיעות היום
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* כפתור הוספת נסיעה */}
          <Button onClick={onAddTrip} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            הוסף נסיעה חדשה
          </Button>

          {/* רשימת נסיעות */}
          {trips.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                אין נסיעות היום
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <Card key={trip.id}>
                  <CardContent className="p-4">
                    {editingTrip === trip.id ? (
                      // מצב עריכה
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-amount">סכום (₪)</Label>
                            <Input
                              id="edit-amount"
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-payment">אמצעי תשלום</Label>
                            <Select value={editPaymentMethod} onValueChange={(value: 'cash' | 'card' | 'app') => setEditPaymentMethod(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">מזומן</SelectItem>
                                <SelectItem value="card">כרטיס</SelectItem>
                                <SelectItem value="app">אפליקציה</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleEditSave(trip.id)} size="sm">
                            שמור
                          </Button>
                          <Button onClick={handleEditCancel} variant="outline" size="sm">
                            ביטול
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // מצב תצוגה
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-bold">₪{trip.amount}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(trip.timestamp).toLocaleTimeString('he-IL')}
                          </div>
                          <div className="text-xs bg-primary/10 px-2 py-1 rounded">
                            {getPaymentMethodText(trip.payment_method)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleEditStart(trip)}
                            variant="outline" 
                            size="sm"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleDelete(trip.id)}
                            variant="destructive" 
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit3, Plus, MapPin, ArrowLeft, Clock } from "lucide-react";
import { Trip, ShiftExpense } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import { getPaymentMethodDisplayLabel } from "@/utils/paymentMethodsHelper";
import { getOrderSourceDisplayLabel } from "@/utils/orderSourceHelper";
import { useCustomOrderSources } from '@/hooks/useCustomOrderSources';

interface EditTripsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  expenses?: ShiftExpense[];
  onDeleteTrip: (id: string) => void;
  onUpdateTrip: (id: string, updates: { amount?: number; payment_method?: string; order_source?: string }) => void;
  onDeleteExpense?: (id: string) => void;
  onUpdateExpense?: (id: string, amount: number) => void;
  onAddTrip: () => void;
}

export const EditTripsDialog = ({
  isOpen,
  onClose,
  trips,
  expenses = [],
  onDeleteTrip,
  onUpdateTrip,
  onDeleteExpense = () => {},
  onUpdateExpense = () => {},
  onAddTrip
}: EditTripsDialogProps) => {
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('מזומן');
  const [editOrderSource, setEditOrderSource] = useState<string>('מזדמן');
  const { toast } = useToast();
  const { allOrderSources, paymentMethods } = useCustomOrderSources();

  // State for editing a shift expense (e.g. fuel)
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editExpenseAmount, setEditExpenseAmount] = useState<string>("");

  // Debug logging
  console.log('EditTripsDialog - trips count:', trips?.length || 0);
  console.log('EditTripsDialog - expenses count:', expenses?.length || 0);
  console.log('EditTripsDialog - expenses data:', expenses);

  const handleEditStart = (trip: Trip) => {
    setEditingTrip(trip.id);
    setEditAmount(trip.amount.toString());
    setEditPaymentMethod(trip.payment_method);
    setEditOrderSource(trip.order_source || 'מזדמן');
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

    onUpdateTrip(tripId, {
      amount,
      payment_method: editPaymentMethod,
      order_source: editOrderSource
    });
    setEditingTrip(null);
    toast({
      title: "נסיעה עודכנה",
      description: "הנסיעה עודכנה בהצלחה"
    });
  };

  const handleEditCancel = () => {
    setEditingTrip(null);
    setEditAmount("");
    setEditPaymentMethod('מזומן');
    setEditOrderSource('מזדמן');
  };

  const handleDelete = (tripId: string) => {
    onDeleteTrip(tripId);
    toast({
      title: "נסיעה נמחקה",
      description: "הנסיעה נמחקה בהצלחה"
    });
  };

  // Handle editing of a shift expense (fuel)
  const handleExpenseEditStart = (expense: ShiftExpense) => {
    setEditingExpense(expense.id);
    setEditExpenseAmount(expense.amount.toString());
  };

  const handleExpenseEditSave = (expenseId: string) => {
    const amount = parseFloat(editExpenseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס סכום תקין",
        variant: "destructive"
      });
      return;
    }
    onUpdateExpense(expenseId, amount);
    setEditingExpense(null);
    toast({
      title: "הוצאה עודכנה",
      description: "ההוצאה עודכנה בהצלחה"
    });
  };

  const handleExpenseCancel = () => {
    setEditingExpense(null);
    setEditExpenseAmount("");
  };

  const handleDeleteExpense = (expenseId: string) => {
    onDeleteExpense(expenseId);
    toast({
      title: "הוצאה נמחקה",
      description: "ההוצאה נמחקה בהצלחה"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            עריכת נסיעות היום
          </DialogTitle>
          <DialogDescription className="sr-only">עדכון, מחיקה והוספה של נסיעות והוצאות למשמרת הנוכחית.</DialogDescription>
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
                        <div className="grid grid-cols-3 gap-4">
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
                            <Label htmlFor="edit-order-source">מקור הזמנה</Label>
                            <Select value={editOrderSource} onValueChange={setEditOrderSource}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {allOrderSources.map((source) => (
                                  <SelectItem key={source.value} value={source.value}>
                                    {source.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="edit-payment">אמצעי תשלום</Label>
                            <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentMethods.map((method) => (
                                  <SelectItem key={method.value} value={method.value}>
                                    {method.label}
                                  </SelectItem>
                                ))}
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
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="text-lg font-bold">₪{trip.amount}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(trip.timestamp).toLocaleTimeString('he-IL')}
                              </div>
                              <div className="text-xs bg-primary/10 px-2 py-1 rounded font-medium">
                                {getOrderSourceDisplayLabel(trip.order_source)}
                              </div>
                              <div className="text-xs bg-secondary/30 px-2 py-1 rounded">
                                {getPaymentMethodDisplayLabel(trip.payment_method)}
                              </div>
                              {/* תיוג */}
                              {trip.trip_status && trip.trip_status !== 'completed' && trip.trip_status !== 'active' && (
                                <div className="text-xs bg-accent px-2 py-1 rounded">
                                  {trip.trip_status}
                                </div>
                              )}
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

                        {/* תצוגת מיקומים */}
                        {(trip.start_location_city || trip.end_location_city) && (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {trip.start_location_city && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-green-600" />
                                <span className="font-medium">התחלה:</span>
                                <span>{trip.start_location_city}</span>
                              </div>
                            )}
                            
                            {trip.end_location_city && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-red-600" />
                                <span className="font-medium">סיום:</span>
                                <span>{trip.end_location_city}</span>
                              </div>
                            )}

                            {trip.start_location_city && trip.end_location_city && (
                              <div className="flex items-center gap-1 text-primary font-medium mt-1">
                                <span>{trip.start_location_city}</span>
                                <ArrowLeft className="h-3 w-3" />
                                <span>{trip.end_location_city}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* רשימת הוצאות דלק */}
              {expenses && expenses.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3 text-red-700">הוצאות דלק</h3>
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <Card key={expense.id} className="border-red-200">
                        <CardContent className="p-4">
                          {editingExpense === expense.id ? (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor={`edit-expense-${expense.id}`}>סכום (₪)</Label>
                                <Input
                                  id={`edit-expense-${expense.id}`}
                                  type="number"
                                  value={editExpenseAmount}
                                  onChange={(e) => setEditExpenseAmount(e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => handleExpenseEditSave(expense.id)} size="sm">
                                  שמור
                                </Button>
                                <Button onClick={handleExpenseCancel} variant="outline" size="sm">
                                  ביטול
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                <div className="text-lg font-bold text-red-600">-₪{expense.amount}</div>
                                <div className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                  דלק
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(expense.created_at).toLocaleTimeString('he-IL')}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => handleExpenseEditStart(expense)} variant="outline" size="sm">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleDeleteExpense(expense.id)} variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit3, Target, Fuel, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Trip, DailyGoals, DailyExpenses } from "./TaxiDashboard";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goals: DailyGoals;
  expenses: DailyExpenses;
  trips: Trip[];
  onUpdateGoals: (goals: DailyGoals) => void;
  onUpdateExpenses: (expenses: DailyExpenses) => void;
  onUpdateTrips: (trips: Trip[]) => void;
}

export const SettingsDialog = ({
  isOpen,
  onClose,
  goals,
  expenses,
  trips,
  onUpdateGoals,
  onUpdateExpenses,
  onUpdateTrips
}: SettingsDialogProps) => {
  const [localGoals, setLocalGoals] = useState(goals);
  const [localExpenses, setLocalExpenses] = useState(expenses);
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const { toast } = useToast();

  const handleSaveGoals = () => {
    onUpdateGoals(localGoals);
    toast({
      title: "יעדים עודכנו",
      description: "היעדים החדשים נשמרו בהצלחה",
    });
  };

  const handleSaveExpenses = () => {
    onUpdateExpenses(localExpenses);
    toast({
      title: "הוצאות עודכנו", 
      description: "הוצאות הדלק והפיקס עודכנו בהצלחה",
    });
  };

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

  const todayTrips = trips.filter(trip => trip.date === new Date().toDateString());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">הגדרות</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="goals" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="goals" className="text-xs">
              <Target className="h-3 w-3 ml-1" />
              יעדים
            </TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs">
              <Fuel className="h-3 w-3 ml-1" />
              הוצאות
            </TabsTrigger>
            <TabsTrigger value="trips" className="text-xs">
              <List className="h-3 w-3 ml-1" />
              נסיעות
            </TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">יעדים כספיים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-goal">יעד יומי (₪)</Label>
                  <Input
                    id="daily-goal"
                    type="number"
                    value={localGoals.daily}
                    onChange={(e) => setLocalGoals({
                      ...localGoals,
                      daily: parseInt(e.target.value) || 0
                    })}
                    className="text-center"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekly-goal">יעד שבועי (₪)</Label>
                  <Input
                    id="weekly-goal"
                    type="number"
                    value={localGoals.weekly}
                    onChange={(e) => setLocalGoals({
                      ...localGoals,
                      weekly: parseInt(e.target.value) || 0
                    })}
                    className="text-center"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly-goal">יעד חודשי (₪)</Label>
                  <Input
                    id="monthly-goal"
                    type="number"
                    value={localGoals.monthly}
                    onChange={(e) => setLocalGoals({
                      ...localGoals,
                      monthly: parseInt(e.target.value) || 0
                    })}
                    className="text-center"
                    dir="ltr"
                  />
                </div>
                <Button 
                  onClick={handleSaveGoals}
                  className="w-full touch-manipulation"
                >
                  שמור יעדים
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">הוצאות יומיות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fixed-daily">פיקס יומי (₪)</Label>
                  <Input
                    id="fixed-daily"
                    type="number"
                    value={localExpenses.fixedDaily}
                    onChange={(e) => setLocalExpenses({
                      ...localExpenses,
                      fixedDaily: parseInt(e.target.value) || 0
                    })}
                    className="text-center"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel">דלק יומי (₪)</Label>
                  <Input
                    id="fuel"
                    type="number"
                    value={localExpenses.fuel}
                    onChange={(e) => setLocalExpenses({
                      ...localExpenses,
                      fuel: parseInt(e.target.value) || 0
                    })}
                    className="text-center"
                    dir="ltr"
                  />
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">סה"כ הוצאות יומיות:</div>
                  <div className="text-lg font-bold text-foreground">
                    ₪{(localExpenses.fixedDaily + localExpenses.fuel).toLocaleString()}
                  </div>
                </div>
                <Button 
                  onClick={handleSaveExpenses}
                  className="w-full touch-manipulation"
                >
                  שמור הוצאות
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trips Tab */}
          <TabsContent value="trips" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">נסיעות היום ({todayTrips.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {todayTrips.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    אין נסיעות היום
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {todayTrips.map((trip) => (
                      <div key={trip.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
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
                                className="h-8 px-2"
                              >
                                שמור
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingTrip(null)}
                                className="h-8 px-2"
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
                              className="h-8 w-8 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 touch-manipulation"
          >
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
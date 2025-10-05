import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Edit, Car, Clock, MapPin, Coins, HandCoins, CreditCard } from 'lucide-react';
import { useCustomPaymentTypes, CustomPaymentType } from '@/hooks/useCustomPaymentTypes';
import { usePaymentButtonsPreferences } from '@/hooks/usePaymentButtonsPreferences';

export const PaymentTypesTab = () => {
  const { 
    customPaymentTypes, 
    loading, 
    addCustomPaymentType, 
    updateCustomPaymentType, 
    deleteCustomPaymentType 
  } = useCustomPaymentTypes();

  const {
    availablePaymentButtons,
    selectedPaymentButtons,
    togglePaymentButton
  } = usePaymentButtonsPreferences();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CustomPaymentType | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDefault, setNewTypeDefault] = useState<'מזומן' | 'אשראי' | 'ביט'>('מזומן');

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;

    const newTypeId = await addCustomPaymentType(newTypeName.trim(), newTypeDefault);
    
    if (newTypeId) {
      const newButtonId = `custom-${newTypeId}`;
      if (!selectedPaymentButtons.includes(newButtonId)) {
        togglePaymentButton(newButtonId);
      }
      
      setNewTypeName('');
      setNewTypeDefault('מזומן');
      setIsAddDialogOpen(false);
    }
  };

  const handleEditType = async () => {
    if (!editingType || !newTypeName.trim()) return;

    const success = await updateCustomPaymentType(editingType.id, {
      name: newTypeName.trim(),
      default_payment_method: newTypeDefault
    });
    
    if (success) {
      setEditingType(null);
      setNewTypeName('');
      setNewTypeDefault('מזומן');
      setIsEditDialogOpen(false);
    }
  };

  const handleEditClick = (type: CustomPaymentType) => {
    setEditingType(type);
    setNewTypeName(type.name);
    setNewTypeDefault(type.default_payment_method || 'מזומן');
    setIsEditDialogOpen(true);
  };

  const handleDeleteType = async (id: string) => {
    const typeToDelete = customPaymentTypes.find(t => t.id === id);
    const success = await deleteCustomPaymentType(id);
    
    // Also remove from selected buttons if it was selected
    if (success && typeToDelete) {
      const buttonId = `custom-${id}`;
      if (selectedPaymentButtons.includes(buttonId)) {
        togglePaymentButton(buttonId);
      }
    }
  };

  const getButtonIcon = (iconName?: string) => {
    const icons = {
      'Car': Car,
      'Clock': Clock,
      'MapPin': MapPin,
      'Coins': Coins,
      'HandCoins': HandCoins,
      'CreditCard': CreditCard
    };
    const IconComponent = iconName ? icons[iconName as keyof typeof icons] : Car;
    return IconComponent || Car;
  };

  if (loading) {
    return <div className="text-center">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Payment Buttons Selection */}
      <Card>
        <CardHeader>
          <CardTitle>כפתורי תשלום מהירים</CardTitle>
          <CardDescription>
            בחר אילו כפתורי תשלום יוצגו במסך הראשי.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availablePaymentButtons.map((button) => {
              const IconComponent = getButtonIcon(button.icon);
              const isSelected = selectedPaymentButtons.includes(button.id);
              const isDefault = button.isDefault;
              
              return (
                <div key={button.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{button.label}</span>
                        {isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            ברירת מחדל
                          </Badge>
                        )}
                        {button.isCustom && (
                          <Badge variant="outline" className="text-xs">
                            מותאם אישית
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {button.isCustom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const customType = customPaymentTypes.find(
                            t => `custom-${t.id}` === button.id
                          );
                          if (customType) {
                            handleDeleteType(customType.id);
                          }
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePaymentButton(button.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>תיוגי תשלום מותאמים (מקורות הזמנה)</CardTitle>
          <CardDescription>
            הוסף מקורות הזמנה מותאמים אישית עם אמצעי תשלום ברירת מחדל.
            <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">💡 הבדל חשוב:</p>
              <p>• <strong>מקור הזמנה</strong> = מאיפה הגיעה הנסיעה (גט, דהרי, מזדמן וכו')</p>
              <p>• <strong>אמצעי תשלום</strong> = איך שילמו (מזומן, אשראי, ביט)</p>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">התיוגים שלך</h3>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  הוסף תיוג
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>הוסף מקור הזמנה חדש</DialogTitle>
                  <DialogDescription>
                    צור מקור הזמנה מותאם אישית עם אמצעי תשלום ברירת מחדל.
                    <br/>
                    <span className="text-xs text-muted-foreground">
                      ⚠️ לא ניתן להשתמש בשמות קיימים: גט, דהרי, מזדמן
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="typeName">שם מקור ההזמנה</Label>
                    <Input
                      id="typeName"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="לדוגמה: יאנגו, תחנה, אפליקציה..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="defaultMethod">אמצעי תשלום ברירת מחדל (אופציונלי)</Label>
                    <Select value={newTypeDefault} onValueChange={(value: 'מזומן' | 'אשראי' | 'ביט') => setNewTypeDefault(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="מזומן">💵 מזומן</SelectItem>
                        <SelectItem value="אשראי">💳 אשראי</SelectItem>
                        <SelectItem value="ביט">📱 ביט</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddType} className="flex-1">
                      הוסף תיוג
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                      ביטול
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {customPaymentTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>עדיין לא הוספת תיוגי תשלום מותאמים</p>
              <p className="text-sm">לחץ על "הוסף תיוג" כדי להתחיל</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customPaymentTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      {type.default_payment_method && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            ברירת מחדל: {type.default_payment_method}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(type)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteType(type.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ערוך תיוג תשלום</DialogTitle>
            <DialogDescription>
              עדכן את הפרטים של תיוג התשלום
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTypeName">שם התיוג</Label>
              <Input
                id="editTypeName"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="לדוגמה: שוטף +"
              />
            </div>
            <div>
              <Label htmlFor="editDefaultMethod">אמצעי תשלום ברירת מחדל (אופציונלי)</Label>
              <Select value={newTypeDefault} onValueChange={(value: 'מזומן' | 'אשראי' | 'ביט') => setNewTypeDefault(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="מזומן">💵 מזומן</SelectItem>
                  <SelectItem value="אשראי">💳 אשראי</SelectItem>
                  <SelectItem value="ביט">📱 ביט</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditType} className="flex-1">
                שמור שינויים
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
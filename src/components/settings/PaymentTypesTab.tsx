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
  const [newTypeBase, setNewTypeBase] = useState<'cash' | 'card' | 'דהרי'>('דהרי');
  const [newTypeCommission, setNewTypeCommission] = useState('0');

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;

    const commissionRate = parseFloat(newTypeCommission) / 100;
    const newTypeId = await addCustomPaymentType(newTypeName.trim(), newTypeBase, commissionRate);
    
    if (newTypeId) {
      // Auto-add the new payment type to selected buttons
      const newButtonId = `custom-${newTypeId}`;
      if (!selectedPaymentButtons.includes(newButtonId)) {
        togglePaymentButton(newButtonId);
      }
      
      setNewTypeName('');
      setNewTypeBase('דהרי');
      setNewTypeCommission('0');
      setIsAddDialogOpen(false);
    }
  };

  const handleEditType = async () => {
    if (!editingType || !newTypeName.trim()) return;

    const commissionRate = parseFloat(newTypeCommission) / 100; // Convert percentage to decimal
    const success = await updateCustomPaymentType(editingType.id, {
      name: newTypeName.trim(),
      base_payment_method: newTypeBase,
      commission_rate: commissionRate
    });
    
    if (success) {
      setEditingType(null);
      setNewTypeName('');
      setNewTypeBase('דהרי');
      setNewTypeCommission('0');
      setIsEditDialogOpen(false);
    }
  };

  const handleEditClick = (type: CustomPaymentType) => {
    setEditingType(type);
    setNewTypeName(type.name);
    setNewTypeBase(type.base_payment_method);
    setNewTypeCommission((type.commission_rate * 100).toString());
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

  const getBaseMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'cash': 'מזומן',
      'card': 'כרטיס',
      'דהרי': 'דהרי'
    };
    return labels[method] || method;
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
          <CardTitle>תיוגי תשלום מותאמים</CardTitle>
          <CardDescription>
            הוסף תיוגי תשלום מותאמים עם עמלות שונות. לדוגמה: "שוטף +" עם בסיס דהרי ועמלה של 5%
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
                  <DialogTitle>הוסף תיוג תשלום חדש</DialogTitle>
                  <DialogDescription>
                    צור תיוג תשלום מותאם עם תיוג בסיס ועמלה
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="typeName">שם התיוג</Label>
                    <Input
                      id="typeName"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="לדוגמה: שוטף +"
                    />
                  </div>
                  <div>
                    <Label htmlFor="baseMethod">תיוג בסיס</Label>
                    <Select value={newTypeBase} onValueChange={(value: 'cash' | 'card' | 'דהרי') => setNewTypeBase(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">מזומן</SelectItem>
                        <SelectItem value="card">כרטיס</SelectItem>
                        <SelectItem value="דהרי">דהרי</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="commission">עמלה (%)</Label>
                    <Input
                      id="commission"
                      type="number"
                      value={newTypeCommission}
                      onChange={(e) => setNewTypeCommission(e.target.value)}
                      placeholder="0"
                      step="0.1"
                      min="-100"
                      max="100"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      עמלה חיובית = קיזוז מהסכום, עמלה שלילית = תוספת לסכום
                    </p>
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          בסיס: {getBaseMethodLabel(type.base_payment_method)}
                        </Badge>
                        {type.commission_rate !== 0 && (
                          <Badge variant={type.commission_rate > 0 ? "destructive" : "default"} className="text-xs">
                            {type.commission_rate > 0 ? '-' : '+'}
                            {Math.abs(type.commission_rate * 100)}%
                          </Badge>
                        )}
                      </div>
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
              <Label htmlFor="editBaseMethod">תיוג בסיס</Label>
              <Select value={newTypeBase} onValueChange={(value: 'cash' | 'card' | 'דהרי') => setNewTypeBase(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">מזומן</SelectItem>
                  <SelectItem value="card">כרטיס</SelectItem>
                  <SelectItem value="דהרי">דהרי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editCommission">עמלה (%)</Label>
              <Input
                id="editCommission"
                type="number"
                value={newTypeCommission}
                onChange={(e) => setNewTypeCommission(e.target.value)}
                placeholder="0"
                step="0.1"
                min="-100"
                max="100"
              />
              <p className="text-sm text-muted-foreground mt-1">
                עמלה חיובית = קיזוז מהסכום, עמלה שלילית = תוספת לסכום
              </p>
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
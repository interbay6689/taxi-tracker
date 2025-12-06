import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { useCustomOrderSources, CustomOrderSource } from '@/hooks/useCustomOrderSources';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentTypesTab } from '@/components/settings/PaymentTypesTab';
import { Tag, CreditCard, Plus, Trash2, Pencil, Check, X, PackageOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Sources = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading } = useDatabase();
  const { 
    customOrderSources, 
    baseOrderSources,
    paymentMethods,
    addCustomOrderSource, 
    updateCustomOrderSource,
    deleteCustomOrderSource,
    loading: sourcesLoading 
  } = useCustomOrderSources();
  
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourcePaymentMethod, setNewSourcePaymentMethod] = useState<'מזומן' | 'אשראי' | 'ביט' | undefined>(undefined);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<CustomOrderSource | null>(null);
  const [editName, setEditName] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'מזומן' | 'אשראי' | 'ביט' | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return;
    
    setIsSubmitting(true);
    const result = await addCustomOrderSource(newSourceName.trim(), newSourcePaymentMethod);
    setIsSubmitting(false);
    
    if (result) {
      setNewSourceName('');
      setNewSourcePaymentMethod(undefined);
      setIsAddDialogOpen(false);
    }
  };

  const handleEditSource = async () => {
    if (!editingSource || !editName.trim()) return;
    
    setIsSubmitting(true);
    const result = await updateCustomOrderSource(editingSource.id, {
      name: editName.trim(),
      default_payment_method: editPaymentMethod,
    });
    setIsSubmitting(false);
    
    if (result) {
      setEditingSource(null);
      setEditName('');
      setEditPaymentMethod(undefined);
    }
  };

  const handleDeleteSource = async (id: string) => {
    await deleteCustomOrderSource(id);
  };

  const openEditDialog = (source: CustomOrderSource) => {
    setEditingSource(source);
    setEditName(source.name);
    setEditPaymentMethod(source.default_payment_method);
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">מקורות הזמנה ותשלום</h1>
      
      <Tabs defaultValue="order-sources" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="order-sources">מקורות הזמנה</TabsTrigger>
          <TabsTrigger value="payment-types">אמצעי תשלום</TabsTrigger>
        </TabsList>

        <TabsContent value="order-sources" className="mt-6 space-y-6">
          {/* Base Order Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                מקורות הזמנה מובנים
                <HelpTooltip content="מקורות הזמנה קבועים במערכת שאי אפשר לשנות" />
              </CardTitle>
              <CardDescription>מקורות הזמנה מוגדרים מראש במערכת</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {baseOrderSources.map((source) => (
                  <Badge key={source.value} variant="secondary" className="px-3 py-1.5 text-sm">
                    {source.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Order Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                מקורות הזמנה מותאמים אישית
                <HelpTooltip content="הוסף מקורות הזמנה מותאמים אישית עם ברירת מחדל לתשלום" />
              </CardTitle>
              <CardDescription>צור מקורות הזמנה משלך עם הגדרות מותאמות</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sourcesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : customOrderSources.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">
                    עדיין לא הוספת מקורות הזמנה מותאמים
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף מקור הזמנה ראשון
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {customOrderSources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-medium">
                            {source.name}
                          </Badge>
                          {source.default_payment_method && (
                            <span className="text-sm text-muted-foreground">
                              ברירת מחדל: {source.default_payment_method}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(source)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSource(source.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="w-full">
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף מקור הזמנה
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-types" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                אמצעי תשלום
                <HelpTooltip content="אמצעי התשלום הזמינים במערכת" />
              </CardTitle>
              <CardDescription>אמצעי תשלום זמינים לכל הנסיעות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <Badge key={method.value} variant="secondary" className="px-3 py-1.5 text-sm">
                    {method.label}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                אמצעי התשלום קבועים במערכת: מזומן, אשראי וביט
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Source Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוסף מקור הזמנה חדש</DialogTitle>
            <DialogDescription>
              צור מקור הזמנה מותאם אישית עם ברירת מחדל לאמצעי תשלום
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source-name">שם מקור ההזמנה</Label>
              <Input
                id="source-name"
                placeholder="לדוגמה: יאנגו, תחנה..."
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">ברירת מחדל לתשלום (אופציונלי)</Label>
              <Select
                value={newSourcePaymentMethod || 'none'}
                onValueChange={(value) => 
                  setNewSourcePaymentMethod(value === 'none' ? undefined : value as 'מזומן' | 'אשראי' | 'ביט')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר אמצעי תשלום" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא ברירת מחדל</SelectItem>
                  <SelectItem value="מזומן">💵 מזומן</SelectItem>
                  <SelectItem value="אשראי">💳 אשראי</SelectItem>
                  <SelectItem value="ביט">📱 ביט</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddSource} disabled={!newSourceName.trim() || isSubmitting}>
              {isSubmitting ? 'מוסיף...' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Source Dialog */}
      <Dialog open={!!editingSource} onOpenChange={(open) => !open && setEditingSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ערוך מקור הזמנה</DialogTitle>
            <DialogDescription>
              עדכן את פרטי מקור ההזמנה
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-source-name">שם מקור ההזמנה</Label>
              <Input
                id="edit-source-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSource()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payment-method">ברירת מחדל לתשלום</Label>
              <Select
                value={editPaymentMethod || 'none'}
                onValueChange={(value) => 
                  setEditPaymentMethod(value === 'none' ? undefined : value as 'מזומן' | 'אשראי' | 'ביט')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר אמצעי תשלום" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא ברירת מחדל</SelectItem>
                  <SelectItem value="מזומן">💵 מזומן</SelectItem>
                  <SelectItem value="אשראי">💳 אשראי</SelectItem>
                  <SelectItem value="ביט">📱 ביט</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSource(null)}>
              ביטול
            </Button>
            <Button onClick={handleEditSource} disabled={!editName.trim() || isSubmitting}>
              {isSubmitting ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sources;
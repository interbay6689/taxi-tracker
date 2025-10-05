import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface CustomPaymentType {
  id: string;
  user_id: string;
  name: string;
  base_payment_method: 'cash' | 'card' | 'דהרי';
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCustomPaymentTypes = () => {
  const { user } = useAuth();
  const [customPaymentTypes, setCustomPaymentTypes] = useState<CustomPaymentType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomPaymentTypes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_payment_types')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading custom payment types:', error);
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת תיוגי התשלום המותאמים",
          variant: "destructive",
        });
        return;
      }

      setCustomPaymentTypes((data || []) as CustomPaymentType[]);
    } catch (error) {
      console.error('Error loading custom payment types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomPaymentTypes();
  }, [user?.id]);

  const addCustomPaymentType = async (
    name: string,
    basePaymentMethod: 'cash' | 'card' | 'דהרי',
    commissionRate: number = 0
  ) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('custom_payment_types')
        .insert([{
          user_id: user.id,
          name,
          base_payment_method: basePaymentMethod,
          commission_rate: commissionRate,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding custom payment type:', error);
        toast({
          title: "שגיאה",
          description: "שגיאה בהוספת תיוג תשלום מותאם",
          variant: "destructive",
        });
        return false;
      }

      const newType = data as CustomPaymentType;
      setCustomPaymentTypes(prev => [...prev, newType]);
      toast({
        title: "הצלחה",
        description: `תיוג התשלום "${name}" נוסף בהצלחה`,
      });
      return newType.id;
    } catch (error) {
      console.error('Error adding custom payment type:', error);
      return false;
    }
  };

  const updateCustomPaymentType = async (
    id: string,
    updates: Partial<Pick<CustomPaymentType, 'name' | 'base_payment_method' | 'commission_rate' | 'is_active'>>
  ) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('custom_payment_types')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating custom payment type:', error);
        toast({
          title: "שגיאה",
          description: "שגיאה בעדכון תיוג התשלום",
          variant: "destructive",
        });
        return false;
      }

      setCustomPaymentTypes(prev => 
        prev.map(type => type.id === id ? data as CustomPaymentType : type)
      );
      toast({
        title: "הצלחה",
        description: "תיוג התשלום עודכן בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error updating custom payment type:', error);
      return false;
    }
  };

  const deleteCustomPaymentType = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('custom_payment_types')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting custom payment type:', error);
        toast({
          title: "שגיאה",
          description: "שגיאה במחיקת תיוג התשלום",
          variant: "destructive",
        });
        return false;
      }

      setCustomPaymentTypes(prev => prev.filter(type => type.id !== id));
      toast({
        title: "הצלחה",
        description: "תיוג התשלום נמחק בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error deleting custom payment type:', error);
      return false;
    }
  };

  // Combine base payment methods with custom ones for display
  const allPaymentOptions = useMemo(() => {
    const baseOptions = [
      { value: 'מזומן', label: 'מזומן', isCustom: false },
      { value: 'אשראי', label: 'אשראי', isCustom: false },
      { value: 'דהרי', label: 'דהרי', isCustom: false }
    ];

    const customOptions = customPaymentTypes.map(type => ({
      value: type.name,
      label: type.name,
      isCustom: true,
      basePaymentMethod: type.base_payment_method,
      commissionRate: type.commission_rate
    }));

    return [...baseOptions, ...customOptions];
  }, [customPaymentTypes]);

  // Helper function to get payment method details
  const getPaymentMethodDetails = (paymentMethod: string) => {
    const customType = customPaymentTypes.find(type => type.name === paymentMethod);
    if (customType) {
      return {
        isCustom: true,
        basePaymentMethod: customType.base_payment_method,
        commissionRate: customType.commission_rate,
        displayName: customType.name
      };
    }

    // Base payment methods
    const baseLabels: Record<string, string> = {
      'cash': 'מזומן',
      'מזומן': 'מזומן',
      'card': 'אשראי',
      'אשראי': 'אשראי',
      'דהרי': 'דהרי'
    };

    return {
      isCustom: false,
      basePaymentMethod: paymentMethod as 'cash' | 'card' | 'דהרי',
      commissionRate: 0,
      displayName: baseLabels[paymentMethod] || paymentMethod
    };
  };

  return {
    customPaymentTypes,
    allPaymentOptions,
    loading,
    addCustomPaymentType,
    updateCustomPaymentType,
    deleteCustomPaymentType,
    getPaymentMethodDetails,
    refresh: loadCustomPaymentTypes
  };
};
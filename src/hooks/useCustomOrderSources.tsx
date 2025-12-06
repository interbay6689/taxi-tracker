import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface CustomOrderSource {
  id: string;
  user_id: string;
  name: string;
  default_payment_method?: 'מזומן' | 'אשראי' | 'ביט';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCustomOrderSources = () => {
  const { user } = useAuth();
  const [customOrderSources, setCustomOrderSources] = useState<CustomOrderSource[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomOrderSources = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_order_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading custom order sources:', error);
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת מקורות ההזמנה המותאמים",
          variant: "destructive",
        });
        return;
      }

      setCustomOrderSources((data || []) as CustomOrderSource[]);
    } catch (error) {
      console.error('Error loading custom order sources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomOrderSources();
  }, [user?.id]);

  const addCustomOrderSource = async (
    name: string,
    defaultPaymentMethod?: 'מזומן' | 'אשראי' | 'ביט'
  ) => {
    if (!user) return false;

    // Validation: Check if name is one of the base order sources
    const baseSourceNames = ['גט', 'דהרי', 'מזדמן', 'get', 'dahari', 'casual'];
    const trimmedName = name.trim();
    
    if (baseSourceNames.some(base => base.toLowerCase() === trimmedName.toLowerCase())) {
      toast({
        title: '❌ שם קיים במערכת',
        description: `"${trimmedName}" הוא מקור הזמנה קיים במערכת. אנא בחר שם אחר.`,
        variant: 'destructive',
      });
      return false;
    }

    // Validation: Check for duplicates
    const duplicateExists = customOrderSources.some(
      source => source.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (duplicateExists) {
      toast({
        title: '❌ שם כפול',
        description: `מקור הזמנה בשם "${trimmedName}" כבר קיים.`,
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('custom_order_sources')
        .insert([{
          user_id: user.id,
          name,
          default_payment_method: defaultPaymentMethod,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding custom order source:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505') {
          toast({
            title: "❌ שם כפול",
            description: "מקור הזמנה בשם זה כבר קיים במערכת",
            variant: "destructive",
          });
        } else if (error.code === '23514') {
          toast({
            title: "❌ אמצעי תשלום לא תקין",
            description: "אמצעי תשלום ברירת מחדל חייב להיות: מזומן, אשראי או ביט",
            variant: "destructive",
          });
        } else {
          toast({
            title: "שגיאה",
            description: "שגיאה בהוספת מקור הזמנה מותאם",
            variant: "destructive",
          });
        }
        return false;
      }

      const newSource = data as CustomOrderSource;
      setCustomOrderSources(prev => [...prev, newSource]);
      toast({
        title: "הצלחה",
        description: `מקור ההזמנה "${name}" נוסף בהצלחה`,
      });
      return newSource.id;
    } catch (error) {
      console.error('Error adding custom order source:', error);
      return false;
    }
  };

  const updateCustomOrderSource = async (
    id: string,
    updates: Partial<Pick<CustomOrderSource, 'name' | 'default_payment_method' | 'is_active'>>
  ) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('custom_order_sources')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating custom order source:', error);
        toast({
          title: "שגיאה",
          description: "שגיאה בעדכון מקור ההזמנה",
          variant: "destructive",
        });
        return false;
      }

      setCustomOrderSources(prev => 
        prev.map(source => source.id === id ? data as CustomOrderSource : source)
      );
      toast({
        title: "הצלחה",
        description: "מקור ההזמנה עודכן בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error updating custom order source:', error);
      return false;
    }
  };

  const deleteCustomOrderSource = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('custom_order_sources')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting custom order source:', error);
        toast({
          title: "שגיאה",
          description: "שגיאה במחיקת מקור ההזמנה",
          variant: "destructive",
        });
        return false;
      }

      setCustomOrderSources(prev => prev.filter(source => source.id !== id));
      toast({
        title: "הצלחה",
        description: "מקור ההזמנה נמחק בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error deleting custom order source:', error);
      return false;
    }
  };

  // Base order sources (predefined)
  const baseOrderSources = useMemo(
    () => [
      { value: 'גט', label: '🚕 גט', isCustom: false },
      { value: 'דהרי', label: '🚖 דהרי', isCustom: false },
      { value: 'מזדמן', label: '👋 מזדמן', isCustom: false },
    ],
    []
  );

  // Payment methods (these are the actual payment types)
  const paymentMethods = useMemo(
    () => [
      { value: 'מזומן', label: '💵 מזומן' },
      { value: 'אשראי', label: '💳 אשראי' },
      { value: 'ביט', label: '📱 ביט' },
    ],
    []
  );

  // All order sources (base + custom)
  const allOrderSources = useMemo(() => {
    const customSources = customOrderSources.map((source) => ({
      value: source.name,
      label: source.name,
      isCustom: true,
      defaultPaymentMethod: source.default_payment_method,
    }));

    return [...baseOrderSources, ...customSources];
  }, [customOrderSources, baseOrderSources]);

  const getOrderSourceDetails = (orderSource: string) => {
    const custom = customOrderSources.find((s) => s.name === orderSource);
    if (custom) {
      return {
        isCustom: true,
        defaultPaymentMethod: custom.default_payment_method,
        displayName: custom.name,
      };
    }

    const base = baseOrderSources.find((s) => s.value === orderSource);
    if (base) {
      return {
        isCustom: false,
        displayName: base.label,
      };
    }

    return {
      isCustom: false,
      displayName: orderSource,
    };
  };

  // Legacy compatibility: allPaymentOptions = paymentMethods
  const allPaymentOptions = paymentMethods;

  // Legacy compatibility: getPaymentMethodDetails = map to order source details
  const getPaymentMethodDetails = (paymentMethod: string) => {
    // Check if it's a payment method
    const pmMatch = paymentMethods.find(pm => pm.value === paymentMethod);
    if (pmMatch) {
      return {
        isCustom: false,
        displayName: pmMatch.label,
        basePaymentMethod: paymentMethod,
      };
    }

    // Otherwise treat as order source
    return getOrderSourceDetails(paymentMethod);
  };

  return {
    // New API
    customOrderSources,
    baseOrderSources,
    allOrderSources,
    paymentMethods,
    loading,
    addCustomOrderSource,
    updateCustomOrderSource,
    deleteCustomOrderSource,
    getOrderSourceDetails,
    refresh: loadCustomOrderSources,

    // Legacy API for backward compatibility
    customPaymentTypes: customOrderSources,
    allPaymentOptions,
    addCustomPaymentType: addCustomOrderSource,
    updateCustomPaymentType: updateCustomOrderSource,
    deleteCustomPaymentType: deleteCustomOrderSource,
    getPaymentMethodDetails,
  };
};

// Legacy export for backward compatibility
export const useCustomPaymentTypes = useCustomOrderSources;

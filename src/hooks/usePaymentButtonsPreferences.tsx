import { useLocalStorage } from './useLocalStorage';
import { useCustomPaymentTypes } from './useCustomPaymentTypes';
import { useMemo } from 'react';

export interface PaymentButtonOption {
  id: string;
  label: string;
  icon?: string;
  isDefault?: boolean;
  isCustom?: boolean;
  basePaymentMethod?: 'cash' | 'card' | 'דהרי';
  commissionRate?: number;
}

export const usePaymentButtonsPreferences = () => {
  const { customPaymentTypes, allPaymentOptions } = useCustomPaymentTypes();
  const [selectedPaymentButtons, setSelectedPaymentButtons] = useLocalStorage<string[]>('selected-payment-buttons', ['get', 'casual']);

  // Define all available payment button options
  const availablePaymentButtons = useMemo((): PaymentButtonOption[] => {
    const defaultButtons: PaymentButtonOption[] = [
      { id: 'get', label: 'GET', icon: 'Car', isDefault: true },
      { id: 'casual', label: 'מזדמן', icon: 'Clock', isDefault: true },
    ];

    const additionalButtons: PaymentButtonOption[] = [
      { id: 'yango', label: 'יאנגו', icon: 'Car' },
      { id: 'station', label: 'תחנה', icon: 'MapPin' },
      { id: 'crypto', label: 'קריפטו', icon: 'Coins' },
      { id: 'manual', label: 'תשלום ידני', icon: 'HandCoins' },
    ];

    // Add custom payment types as button options
    const customButtons: PaymentButtonOption[] = customPaymentTypes.map(type => ({
      id: `custom-${type.id}`,
      label: type.name,
      icon: 'CreditCard',
      isCustom: true,
      basePaymentMethod: type.base_payment_method,
      commissionRate: type.commission_rate
    }));

    return [...defaultButtons, ...additionalButtons, ...customButtons];
  }, [customPaymentTypes]);

  // Get selected payment buttons with their details
  const selectedPaymentButtonsWithDetails = useMemo(() => {
    return selectedPaymentButtons
      .map(buttonId => availablePaymentButtons.find(btn => btn.id === buttonId))
      .filter(Boolean) as PaymentButtonOption[];
  }, [selectedPaymentButtons, availablePaymentButtons]);

  const updateSelectedPaymentButtons = (buttonIds: string[]) => {
    setSelectedPaymentButtons(buttonIds);
  };

  const togglePaymentButton = (buttonId: string) => {
    if (selectedPaymentButtons.includes(buttonId)) {
      setSelectedPaymentButtons(prev => prev.filter(id => id !== buttonId));
    } else {
      setSelectedPaymentButtons(prev => [...prev, buttonId]);
    }
  };

  return {
    availablePaymentButtons,
    selectedPaymentButtons,
    selectedPaymentButtonsWithDetails,
    updateSelectedPaymentButtons,
    togglePaymentButton
  };
};
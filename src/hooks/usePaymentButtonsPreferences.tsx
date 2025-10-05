import { useLocalStorage } from './useLocalStorage';
import { useCustomOrderSources } from './useCustomOrderSources';
import { useMemo } from 'react';

export interface PaymentButtonOption {
  id: string;
  label: string;
  icon?: string;
  isDefault?: boolean;
  isCustom?: boolean;
  orderSource?: string;
  defaultPaymentMethod?: 'מזומן' | 'אשראי' | 'ביט';
}

export const usePaymentButtonsPreferences = () => {
  const { customOrderSources, allOrderSources, paymentMethods } = useCustomOrderSources();
  const [selectedPaymentButtons, setSelectedPaymentButtons] = useLocalStorage<string[]>('selected-payment-buttons', ['get', 'casual']);

  // Define all available payment button options
  const availablePaymentButtons = useMemo((): PaymentButtonOption[] => {
    const defaultButtons: PaymentButtonOption[] = [
      { id: 'get', label: 'GET', icon: 'Car', isDefault: true, orderSource: 'גט' },
      { id: 'dahari', label: 'דהרי', icon: 'Truck', isDefault: true, orderSource: 'דהרי' },
      { id: 'casual', label: 'מזדמן', icon: 'Clock', isDefault: true, orderSource: 'מזדמן' },
    ];

    const additionalButtons: PaymentButtonOption[] = [
      { id: 'yango', label: 'יאנגו', icon: 'Car', orderSource: 'יאנגו' },
      { id: 'station', label: 'תחנה', icon: 'MapPin', orderSource: 'תחנה' },
    ];

    // Add custom order sources as button options
    const customButtons: PaymentButtonOption[] = customOrderSources.map(source => ({
      id: `custom-${source.id}`,
      label: source.name,
      icon: 'Tag',
      isCustom: true,
      orderSource: source.name,
      defaultPaymentMethod: source.default_payment_method
    }));

    return [...defaultButtons, ...additionalButtons, ...customButtons];
  }, [customOrderSources]);

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
    togglePaymentButton,
    allOrderSources,
    paymentMethods
  };
};
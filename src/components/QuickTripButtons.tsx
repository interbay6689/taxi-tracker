import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Car, Clock, MapPin, Coins, HandCoins, CreditCard } from 'lucide-react';
import { QuickGetButton } from './QuickGetButton';
import { QuickCasualTripDialog } from './QuickCasualTripDialog';
import { usePaymentButtonsPreferences } from '@/hooks/usePaymentButtonsPreferences';

interface QuickTripButtonsProps {
  onAddTrip: (amount: number, paymentMethod: string, orderSource: string, tag?: string) => void;
  disabled?: boolean;
  tripsToday?: any[];
}

export const QuickTripButtons = ({ onAddTrip, disabled = false, tripsToday = [] }: QuickTripButtonsProps) => {
  const [showCasualTrip, setShowCasualTrip] = useState(false);
  const [showQuickTrip, setShowQuickTrip] = useState(false);
  const [selectedOrderSource, setSelectedOrderSource] = useState<string>('');
  
  const { selectedPaymentButtonsWithDetails } = usePaymentButtonsPreferences();

  const getButtonIcon = (iconName?: string) => {
    const icons = {
      'Car': Car,
      'Clock': Clock,
      'MapPin': MapPin,
      'Coins': Coins,
      'HandCoins': HandCoins,
      'CreditCard': CreditCard
    };
    return icons[iconName as keyof typeof icons] || Car;
  };

  const handleQuickPaymentClick = (button: any) => {
    if (button.id === 'get') return; // GET has its own component
    if (button.id === 'casual') {
      setShowCasualTrip(true);
      return;
    }
    
    // For all other buttons, set the order source
    setSelectedOrderSource(button.orderSource || button.label);
    setShowQuickTrip(true);
  };

  // Determine grid layout based on number of buttons
  const getGridClass = () => {
    const buttonCount = selectedPaymentButtonsWithDetails.length;
    if (buttonCount <= 2) return 'grid-cols-1';
    if (buttonCount === 3) return 'grid-cols-3';
    if (buttonCount === 4) return 'grid-cols-2';
    return 'grid-cols-3'; // For 5+ buttons
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Payment Buttons Grid */}
      <div className={`grid gap-3 ${getGridClass()}`}>
        {selectedPaymentButtonsWithDetails.map((button) => {
          const IconComponent = getButtonIcon(button.icon);
          
          // Special handling for GET button
          if (button.id === 'get') {
            return (
              <div key={button.id} className="col-span-full">
                <QuickGetButton onAddTrip={onAddTrip} disabled={disabled} />
              </div>
            );
          }
          
          return (
            <Button
              key={button.id}
              onClick={() => handleQuickPaymentClick(button)}
              variant={button.id === 'casual' ? 'outline' : 'secondary'}
              className={`h-14 text-sm ${
                button.id === 'casual' 
                  ? 'border-dashed border-2 hover:border-primary hover:bg-primary/5' 
                  : 'hover:bg-secondary/80'
              }`}
              disabled={disabled}
            >
              <IconComponent className="mr-2 h-5 w-5" />
              {button.label}
            </Button>
          );
        })}
      </div>

      {/* Dialogs */}
      <QuickCasualTripDialog
        isOpen={showCasualTrip}
        onClose={() => setShowCasualTrip(false)}
        onAddTrip={onAddTrip}
        disabled={disabled}
      />
      
      <QuickCasualTripDialog
        isOpen={showQuickTrip}
        onClose={() => {
          setShowQuickTrip(false);
          setSelectedOrderSource('');
        }}
        onAddTrip={onAddTrip}
        disabled={disabled}
        orderSourceOverride={selectedOrderSource}
        defaultPaymentMethod={
          selectedPaymentButtonsWithDetails.find(b => b.orderSource === selectedOrderSource)?.defaultPaymentMethod
        }
      />
    </div>
  );
};
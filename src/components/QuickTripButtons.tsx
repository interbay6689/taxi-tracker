import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Car, Clock } from 'lucide-react';
import { QuickGetButton } from './QuickGetButton';
import { AddTripDialog } from './AddTripDialog';

interface QuickTripButtonsProps {
  onAddTrip: (amount: number, paymentMethod: string, tag?: string) => void;
  disabled?: boolean;
  tripsToday?: any[];
}

export const QuickTripButtons = ({ onAddTrip, disabled = false, tripsToday = [] }: QuickTripButtonsProps) => {
  const [showAddTrip, setShowAddTrip] = useState(false);

  return (
    <div className="space-y-4">
      {/* כפתור GET הראשי */}
      <QuickGetButton onAddTrip={onAddTrip} disabled={disabled} />
      
      {/* כפתור נסיעה מזדמנת */}
      <div className="text-center">
        <Button 
          onClick={() => setShowAddTrip(true)}
          variant="outline"
          className="w-full h-14 text-lg border-dashed border-2 hover:border-primary hover:bg-primary/5"
          disabled={disabled}
        >
          <Clock className="mr-3 h-5 w-5" />
          מזדמן
        </Button>
      </div>

      <AddTripDialog
        isOpen={showAddTrip}
        onClose={() => setShowAddTrip(false)}
        onAddTrip={onAddTrip}
        tripsToday={tripsToday}
      />
    </div>
  );
};
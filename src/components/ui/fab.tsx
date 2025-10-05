import React, { useState } from 'react';
import { Plus, Car, Fuel, PlayCircle, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FABProps {
  onAddTrip?: () => void;
  onAddFuel?: () => void;
  onStartShift?: () => void;
  onEndShift?: () => void;
  hasActiveShift?: boolean;
  className?: string;
}

export const FAB: React.FC<FABProps> = ({
  onAddTrip,
  onAddFuel,
  onStartShift,
  onEndShift,
  hasActiveShift = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Car, label: 'הוסף נסיעה', onClick: onAddTrip, show: hasActiveShift },
    { icon: Fuel, label: 'הוסף דלק', onClick: onAddFuel, show: hasActiveShift },
    { icon: PlayCircle, label: 'התחל משמרת', onClick: onStartShift, show: !hasActiveShift },
    { icon: StopCircle, label: 'סיים משמרת', onClick: onEndShift, show: hasActiveShift },
  ].filter(action => action.show && action.onClick);

  const handleActionClick = (onClick?: () => void) => {
    if (onClick) {
      onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('fixed bottom-20 md:bottom-6 left-6 z-40', className)}>
      {/* Action Menu */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 space-y-2 mb-2 animate-fade-slide-up">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => handleActionClick(action.onClick)}
              variant="secondary"
              size="sm"
              className="w-full justify-start gap-2 shadow-lg hover:scale-105 transition-transform min-h-[44px]"
            >
              <action.icon className="h-4 w-4" />
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className={cn(
          'h-14 w-14 min-h-[44px] min-w-[44px] rounded-full shadow-2xl transition-all duration-300',
          'hover:scale-110 active:scale-95',
          isOpen && 'rotate-45'
        )}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

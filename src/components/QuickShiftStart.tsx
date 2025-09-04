import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Car, Clock } from 'lucide-react';

interface QuickShiftStartProps {
  onStartShift: () => void;
  loading?: boolean;
}

export const QuickShiftStart = ({ onStartShift, loading = false }: QuickShiftStartProps) => {
  return (
    <Card className="text-center">
      <CardHeader className="pb-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Car className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">התחל משמרת חדשה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          להתחיל לרשום נסיעות, תחילה צריך להתחיל משמרת
        </p>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            זמן התחלה יירשם אוטומטית
          </div>
        </div>

        <Button 
          onClick={onStartShift}
          size="lg"
          className="w-full h-14 text-lg bg-gradient-to-r from-primary to-blue-500"
          disabled={loading}
        >
          <Play className="mr-2 h-5 w-5" />
          {loading ? 'מתחיל משמרת...' : 'התחל משמרת'}
        </Button>
      </CardContent>
    </Card>
  );
};
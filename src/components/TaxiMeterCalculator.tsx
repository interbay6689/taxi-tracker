import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Clock, MapPin, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TaxiMeterCalculatorProps {
  onCalculatedPrice?: (price: number) => void;
}

type TariffType = 'A' | 'B' | 'C';

interface TariffRates {
  booking: number;
  initial: number;
  perMinute: number;
  perKm: number;
}

const TARIFF_RATES: Record<TariffType, TariffRates> = {
  A: { booking: 5.92, initial: 12.82, perMinute: 2.01, perKm: 2.01 },
  B: { booking: 5.92, initial: 12.82, perMinute: 2.4, perKm: 2.4 },
  C: { booking: 5.92, initial: 12.82, perMinute: 2.81, perKm: 2.81 },
};

const EXTRAS = {
  BEN_GURION: 5,
  HAIFA_RAMON_AIRPORT: 2,
  HIGHWAY_6_FULL: 19.48,
  HIGHWAY_6_SECTION_18: 7.48,
  CARMEL_TUNNELS_ONE: 11.59,
  CARMEL_TUNNELS_TWO: 23.18,
};

export const TaxiMeterCalculator = ({ onCalculatedPrice }: TaxiMeterCalculatorProps) => {
  const [minutes, setMinutes] = useState<string>("");
  const [kilometers, setKilometers] = useState<string>("");
  const [hasBooking, setHasBooking] = useState<boolean>(true);
  const [extras, setExtras] = useState<Record<string, boolean>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [currentTariff, setCurrentTariff] = useState<TariffType>('A');

  // חישוב תעריף אוטומטי לפי יום ושעה
  const getCurrentTariff = (): TariffType => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // שבת (6) או חג
    if (dayOfWeek === 6) {
      if (timeInMinutes >= 360 && timeInMinutes <= 1140) return 'B'; // 06:00-19:00
      return 'C'; // 19:01-05:59
    }

    // יום שישי או ערב חג
    if (dayOfWeek === 5) {
      if (timeInMinutes >= 360 && timeInMinutes <= 960) return 'A'; // 06:00-16:00
      if (timeInMinutes >= 961 && timeInMinutes <= 1260) return 'B'; // 16:01-21:00
      return 'C'; // 21:01-05:59
    }

    // יום חמישי
    if (dayOfWeek === 4) {
      if (timeInMinutes >= 360 && timeInMinutes <= 1260) return 'A'; // 06:00-21:00
      if (timeInMinutes >= 1261 && timeInMinutes <= 1380) return 'B'; // 21:01-23:00
      return 'C'; // 23:01-05:59
    }

    // ימים א'-ד'
    if (dayOfWeek >= 0 && dayOfWeek <= 3) {
      if (timeInMinutes >= 360 && timeInMinutes <= 1260) return 'A'; // 06:00-21:00
      return 'B'; // 21:01-05:59
    }

    return 'A'; // ברירת מחדל
  };

  useEffect(() => {
    setCurrentTariff(getCurrentTariff());
  }, []);

  const calculatePrice = () => {
    const mins = parseFloat(minutes) || 0;
    const kms = parseFloat(kilometers) || 0;
    
    if (mins <= 0 && kms <= 0) {
      setCalculatedPrice(0);
      return;
    }

    const rates = TARIFF_RATES[currentTariff];
    
    let total = rates.initial; // מצב התחלתי
    
    if (hasBooking) {
      total += rates.booking; // תוספת הזמנה
    }
    
    total += mins * rates.perMinute; // תעריף לפי זמן
    total += kms * rates.perKm; // תעריף לפי מרחק
    
    // הוספת תוספות
    Object.entries(extras).forEach(([key, isSelected]) => {
      if (isSelected) {
        switch (key) {
          case 'benGurion':
            total += EXTRAS.BEN_GURION;
            break;
          case 'airports':
            total += EXTRAS.HAIFA_RAMON_AIRPORT;
            break;
          case 'highway6Full':
            total += EXTRAS.HIGHWAY_6_FULL;
            break;
          case 'highway6Section':
            total += EXTRAS.HIGHWAY_6_SECTION_18;
            break;
          case 'carmelOne':
            total += EXTRAS.CARMEL_TUNNELS_ONE;
            break;
          case 'carmelTwo':
            total += EXTRAS.CARMEL_TUNNELS_TWO;
            break;
        }
      }
    });

    const roundedTotal = Math.round(total * 100) / 100;
    setCalculatedPrice(roundedTotal);
    onCalculatedPrice?.(roundedTotal);
  };

  const handleExtraChange = (key: string, checked: boolean) => {
    setExtras(prev => ({ ...prev, [key]: checked }));
  };

  const getTariffColor = (tariff: TariffType) => {
    switch (tariff) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-yellow-500';
      case 'C': return 'bg-red-500';
    }
  };

  const getTariffLabel = (tariff: TariffType) => {
    switch (tariff) {
      case 'A': return 'תעריף רגיל';
      case 'B': return 'תעריף לילה';
      case 'C': return 'תעריף שבת/חג';
    }
  };

  useEffect(() => {
    calculatePrice();
  }, [minutes, kilometers, hasBooking, extras, currentTariff]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <Calculator className="w-5 h-5" />
          מחשבון מונה מונית
        </CardTitle>
        <div className="flex items-center gap-2 justify-end">
          <Badge className={`${getTariffColor(currentTariff)} text-white`}>
            {getTariffLabel(currentTariff)} ({currentTariff})
          </Badge>
          <span className="text-sm text-muted-foreground">תעריף נוכחי</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* זמן ומרחק */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minutes" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              זמן נסיעה (דקות)
            </Label>
            <Input
              id="minutes"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="kilometers" className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              מרחק (ק"מ)
            </Label>
            <Input
              id="kilometers"
              type="number"
              value={kilometers}
              onChange={(e) => setKilometers(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        {/* הזמנה */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="booking"
            checked={hasBooking}
            onChange={(e) => setHasBooking(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="booking">הזמנה טלפונית/אפליקציה (+₪{TARIFF_RATES.A.booking})</Label>
        </div>

        {/* תוספות */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">תוספות</Label>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="benGurion"
                checked={extras.benGurion || false}
                onChange={(e) => handleExtraChange('benGurion', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="benGurion">נתב"ג (+₪{EXTRAS.BEN_GURION})</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="airports"
                checked={extras.airports || false}
                onChange={(e) => handleExtraChange('airports', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="airports">נמל רמון/חיפה (+₪{EXTRAS.HAIFA_RAMON_AIRPORT})</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="highway6Full"
                checked={extras.highway6Full || false}
                onChange={(e) => handleExtraChange('highway6Full', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="highway6Full">כביש 6 מלא (+₪{EXTRAS.HIGHWAY_6_FULL})</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="highway6Section"
                checked={extras.highway6Section || false}
                onChange={(e) => handleExtraChange('highway6Section', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="highway6Section">כביש 6 קטע 18 (+₪{EXTRAS.HIGHWAY_6_SECTION_18})</Label>
            </div>
          </div>
        </div>

        {/* מחיר מחושב */}
        <div className="bg-primary/10 p-4 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-lg font-semibold">מחיר משוער</span>
          </div>
          <div className="text-3xl font-bold text-primary">
            ₪{calculatedPrice.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            כולל מע"מ | תעריף {currentTariff}
          </div>
        </div>

        {/* פירוט חישוב */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded">
          <div className="font-medium mb-2">פירוט החישוב:</div>
          <div>מצב התחלתי: ₪{TARIFF_RATES[currentTariff].initial}</div>
          {hasBooking && <div>תוספת הזמנה: ₪{TARIFF_RATES[currentTariff].booking}</div>}
          {parseFloat(minutes) > 0 && (
            <div>זמן נסיעה: {minutes} דקות × ₪{TARIFF_RATES[currentTariff].perMinute} = ₪{(parseFloat(minutes) * TARIFF_RATES[currentTariff].perMinute).toFixed(2)}</div>
          )}
          {parseFloat(kilometers) > 0 && (
            <div>מרחק נסיעה: {kilometers} ק"מ × ₪{TARIFF_RATES[currentTariff].perKm} = ₪{(parseFloat(kilometers) * TARIFF_RATES[currentTariff].perKm).toFixed(2)}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
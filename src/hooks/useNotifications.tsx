import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { validateTrip, AnomalyDetection } from "@/utils/dataValidation";
import { Trip } from "@/hooks/useDatabase";

interface UseNotificationsProps {
  dailyGoals: { income_goal: number; trips_goal: number };
  totalIncome: number;
  tripsCount: number;
  workDayStartTime?: string;
  goalMet: boolean;
  lastTrip?: Trip;
}

export const useNotifications = ({
  dailyGoals,
  totalIncome,
  tripsCount,
  workDayStartTime,
  goalMet,
  lastTrip
}: UseNotificationsProps) => {
  const { toast } = useToast();
  const lastGoalMet = useRef(false);
  const longShiftNotified = useRef(false);
  const lastValidatedTripId = useRef<string | null>(null);

  // התראה למטרה יומית
  useEffect(() => {
    if (goalMet && !lastGoalMet.current) {
      toast({
        title: "🎉 מזל טוב!",
        description: "השגת את המטרה היומית!",
        duration: 5000,
      });
      
      // רטט חזק לחגיגה
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {
        // Fallback לדפדפן
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 400]);
        }
      });
    }
    lastGoalMet.current = goalMet;
  }, [goalMet, toast]);

  // הזכרה לסיום משמרת
  useEffect(() => {
    if (!workDayStartTime || longShiftNotified.current) return;

    const checkLongShift = () => {
      const startTime = new Date(workDayStartTime);
      const now = new Date();
      const hoursWorked = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      if (hoursWorked >= 10 && !longShiftNotified.current) {
        toast({
          title: "⏰ הזכרה",
          description: "אתה עובד כבר יותר מ-10 שעות. אולי הגיע הזמן להפסקה?",
          duration: 8000,
        });
        
        // רטט קל להתראה
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
          if (navigator.vibrate) {
            navigator.vibrate([300, 200, 300]);
          }
        });
        
        longShiftNotified.current = true;
      }
    };

    const interval = setInterval(checkLongShift, 30 * 60 * 1000); // בדיקה כל 30 דקות
    return () => clearInterval(interval);
  }, [workDayStartTime, toast]);

  // איפוס התראות כשמתחילים יום עבודה חדש
  useEffect(() => {
    if (workDayStartTime) {
      longShiftNotified.current = false;
    }
  }, [workDayStartTime]);

  // בדיקת validation לנסיעה אחרונה
  useEffect(() => {
    if (!lastTrip || lastValidatedTripId.current === lastTrip.id) return;
    
    const validation = validateTrip(lastTrip);
    
    // הצגת אזהרות אם יש
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        toast({
          title: "⚠️ שים לב",
          description: warning,
          duration: 4000,
        });
      });
      
      // רטט קל
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      });
    }
    
    lastValidatedTripId.current = lastTrip.id;
  }, [lastTrip, toast]);
};
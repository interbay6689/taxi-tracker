import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";

export type AppMode = 'normal' | 'night' | 'driving';

export const useAppMode = () => {
  const [mode, setMode] = useState<AppMode>('normal');
  const [isAutoNightMode, setIsAutoNightMode] = useState(true);
  const { setTheme } = useTheme();

  const toggleNightMode = useCallback(() => {
    if (mode === 'night') {
      setMode('normal');
      setTheme('light');
    } else {
      setMode('night');
      setTheme('dark');
    }
    setIsAutoNightMode(false);
  }, [mode, setTheme]);

  useEffect(() => {
    if (isAutoNightMode) {
      const hour = new Date().getHours();
      if (hour >= 20 || hour <= 6) {
        setMode('night');
        setTheme('dark');
      } else {
        setMode('normal');
        setTheme('light');
      }
    }
  }, [isAutoNightMode, setTheme]);

  const toggleDrivingMode = () => {
    if (mode === 'driving') {
      setMode('normal');
    } else {
      setMode('driving');
    }
  };

  return {
    mode,
    setMode,
    toggleNightMode,
    toggleDrivingMode,
    isAutoNightMode,
    setIsAutoNightMode
  };
};
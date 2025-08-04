import { useState, useEffect } from "react";

export type AppMode = 'normal' | 'night' | 'driving';

export const useAppMode = () => {
  const [mode, setMode] = useState<AppMode>('normal');
  const [isAutoNightMode, setIsAutoNightMode] = useState(true);

  useEffect(() => {
    if (isAutoNightMode) {
      const hour = new Date().getHours();
      if (hour >= 20 || hour <= 6) {
        setMode('night');
      } else {
        setMode('normal');
      }
    }
  }, [isAutoNightMode]);

  const toggleNightMode = () => {
    if (mode === 'night') {
      setMode('normal');
    } else {
      setMode('night');
    }
    setIsAutoNightMode(false);
  };

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
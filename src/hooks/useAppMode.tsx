import { useState, useEffect, useCallback } from "react";

export type AppMode = 'normal' | 'night' | 'driving';

export const useAppMode = () => {
  const [mode, setMode] = useState<AppMode>('normal');
  const [isAutoNightMode, setIsAutoNightMode] = useState(true);

  // Apply theme to document
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const toggleNightMode = useCallback(() => {
    if (mode === 'night') {
      setMode('normal');
      applyTheme('light');
    } else {
      setMode('night');
      applyTheme('dark');
    }
    setIsAutoNightMode(false);
  }, [mode, applyTheme]);

  useEffect(() => {
    if (isAutoNightMode) {
      const hour = new Date().getHours();
      if (hour >= 20 || hour <= 6) {
        setMode('night');
        applyTheme('dark');
      } else {
        setMode('normal');
        applyTheme('light');
      }
    }
  }, [isAutoNightMode, applyTheme]);

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
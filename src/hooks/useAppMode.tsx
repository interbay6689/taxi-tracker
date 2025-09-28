import { useState, useEffect, useCallback } from "react";

export type AppMode = 'normal' | 'night' | 'driving';

export const useAppMode = () => {
  const [mode, setMode] = useState<AppMode>(() => {
    // Initialize from localStorage or check time
    const saved = localStorage.getItem('app-mode');
    if (saved && (saved === 'normal' || saved === 'night' || saved === 'driving')) {
      return saved as AppMode;
    }
    const hour = new Date().getHours();
    return (hour >= 20 || hour <= 6) ? 'night' : 'normal';
  });
  
  const [isAutoNightMode, setIsAutoNightMode] = useState(() => {
    const saved = localStorage.getItem('auto-night-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Apply theme to document immediately and reliably
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app-mode', theme === 'dark' ? 'night' : 'normal');
  }, []);

  const toggleNightMode = useCallback(() => {
    const newMode = mode === 'night' ? 'normal' : 'night';
    setMode(newMode);
    applyTheme(newMode === 'night' ? 'dark' : 'light');
    setIsAutoNightMode(false);
    localStorage.setItem('auto-night-mode', 'false');
  }, [mode, applyTheme]);

  // Apply theme on mount and when mode changes
  useEffect(() => {
    applyTheme(mode === 'night' ? 'dark' : 'light');
  }, [mode, applyTheme]);

  // Auto night mode logic
  useEffect(() => {
    if (isAutoNightMode) {
      const hour = new Date().getHours();
      const shouldBeNight = hour >= 20 || hour <= 6;
      const newMode = shouldBeNight ? 'night' : 'normal';
      if (newMode !== mode) {
        setMode(newMode);
      }
    }
  }, [isAutoNightMode, mode]);

  // Save auto night mode preference
  useEffect(() => {
    localStorage.setItem('auto-night-mode', JSON.stringify(isAutoNightMode));
  }, [isAutoNightMode]);

  const toggleDrivingMode = useCallback(() => {
    const newMode = mode === 'driving' ? 'normal' : 'driving';
    setMode(newMode);
    localStorage.setItem('app-mode', newMode);
  }, [mode]);

  return {
    mode,
    setMode,
    toggleNightMode,
    toggleDrivingMode,
    isAutoNightMode,
    setIsAutoNightMode
  };
};
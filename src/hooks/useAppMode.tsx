import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";

export type AppMode = 'normal' | 'night' | 'driving';

export const useAppMode = () => {
  const [mode, setMode] = useState<AppMode>('normal');
  const [isAutoNightMode, setIsAutoNightMode] = useState(true);
  const { setTheme } = useTheme();

  const toggleNightMode = useCallback(() => {
    console.log("🌙 toggleNightMode called, current mode:", mode);
    if (mode === 'night') {
      console.log("🌅 Switching to day mode");
      setMode('normal');
      setTheme('light');
    } else {
      console.log("🌙 Switching to night mode");
      setMode('night');
      setTheme('dark');
    }
    setIsAutoNightMode(false);
    console.log("✅ Theme toggle completed");
  }, [mode, setTheme]);

  useEffect(() => {
    console.log("🔄 useAppMode useEffect triggered, isAutoNightMode:", isAutoNightMode);
    if (isAutoNightMode) {
      const hour = new Date().getHours();
      console.log("⏰ Current hour:", hour);
      if (hour >= 20 || hour <= 6) {
        console.log("🌙 Auto switching to night mode");
        setMode('night');
        setTheme('dark');
      } else {
        console.log("🌅 Auto switching to day mode");
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
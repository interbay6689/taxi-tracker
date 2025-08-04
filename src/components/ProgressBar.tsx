import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar = ({ progress, className }: ProgressBarProps) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">
          {clampedProgress.toFixed(0)}%
        </span>
        {clampedProgress >= 100 && (
          <span className="text-sm text-success font-medium">
            🎯 יעד הושג!
          </span>
        )}
      </div>
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            clampedProgress >= 100 
              ? "bg-gradient-to-r from-success to-green-400" 
              : "bg-gradient-to-r from-primary to-blue-500"
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
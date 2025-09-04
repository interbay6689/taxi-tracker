
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type IconType = React.ComponentType<{ className?: string }>;

export interface TabItem {
  label: string;
  value: string;
  icon?: IconType;
}

interface ShadcnTabsProps<T extends string = string> {
  tabs: TabItem[];
  activeTab: T;
  setActiveTab: (value: T) => void;
}

export const ShadcnTabs = <T extends string = string>({ tabs, activeTab, setActiveTab }: ShadcnTabsProps<T>) => {
  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as T)} className="w-full">
      <TabsList className="w-full grid grid-cols-6 gap-1">
        {tabs.map(({ label, value, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="flex items-center gap-2 text-xs md:text-sm">
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

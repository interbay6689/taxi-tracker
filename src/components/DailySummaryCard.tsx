import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailySummaryCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: "income" | "profit" | "loss";
}

export const DailySummaryCard = ({ title, value, icon: Icon, variant }: DailySummaryCardProps) => {
  const formatValue = (val: number) => {
    return val >= 0 ? `₪${val.toLocaleString()}` : `-₪${Math.abs(val).toLocaleString()}`;
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "income":
        return "border-primary/20 bg-primary/5";
      case "profit":
        return "border-success/20 bg-success/5";
      case "loss":
        return "border-destructive/20 bg-destructive/5";
      default:
        return "";
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case "income":
        return "text-primary";
      case "profit":
        return "text-success";
      case "loss":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "income":
        return "text-primary";
      case "profit":
        return "text-success";
      case "loss":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("shadow-md", getVariantStyles())}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn("text-lg font-bold", getValueColor())}>
              {formatValue(value)}
            </p>
          </div>
          <Icon className={cn("h-6 w-6", getIconColor())} />
        </div>
      </CardContent>
    </Card>
  );
};
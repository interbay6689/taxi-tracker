
import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DateRangePickerProps {
  date?: DateRange;
  onDateChange: (range: DateRange | undefined) => void;
  placeholder?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ date, onDateChange, placeholder }) => {
  const label = React.useMemo(() => {
    if (date?.from && date?.to) {
      return `${format(date.from, "dd/MM/yy")} - ${format(date.to, "dd/MM/yy")}`;
    }
    if (date?.from) {
      return `${format(date.from, "dd/MM/yy")} - ...`;
    }
    return placeholder ?? "בחר טווח תאריכים";
  }, [date, placeholder]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          initialFocus
          mode="range"
          numberOfMonths={2}
          selected={date}
          onSelect={onDateChange}
        />
      </PopoverContent>
    </Popover>
  );
};

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCustomPaymentTypes } from "@/hooks/useCustomPaymentTypes";
import { Trip } from "@/hooks/useDatabase";

/**
 * A dialog for adding a new trip.  In addition to entering an
 * arbitrary amount, the user can pick a payment method from a
 * dropdown and optionally assign a tag to the trip.  The component
 * also surfaces a set of "quick amounts" based on the most recent
 * trip values entered today.  Selecting a quick amount will submit
 * the trip immediately using the currently selected payment method
 * and tag.  After submission the dialog resets its internal state
 * and closes.
 */
interface AddTripDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Called when the dialog should close */
  onClose: () => void;
  /**
   * Handler invoked when the user adds a new trip.  The tag
   * parameter is optional and will be undefined when the user
   * chooses not to specify a tag.
   */
  onAddTrip: (amount: number, paymentMethod: string, tag?: string) => void;
  /**
   * A list of today's trips.  Used to derive quick amount buttons
   * based on recently entered values.  Pass an empty array if
   * unavailable.
   */
  /**
   * A list of today's trips.  If omitted the component will assume an
   * empty array and display the default quick amounts.  Optional to
   * preserve backwards compatibility with call sites that have not
   * been updated to supply this prop.
   */
  tripsToday?: Trip[];
  /**
   * A list of tags the user can choose from.  If not provided a
   * sensible default is used.  Tags allow the user to categorise
   * trips by type (for example: "שדה", "תחנה", "הזמנה", "אחר").
   */
  tags?: string[];
}

export const AddTripDialog = ({
  isOpen,
  onClose,
  onAddTrip,
  tripsToday = [],
  tags = ["שדה", "תחנה", "הזמנה", "אחר"],
}: AddTripDialogProps) => {
  const { toast } = useToast();
  // Payment methods come from the custom payment types hook.  Each
  // option has a value used internally and a label shown to the user.
  const { allPaymentOptions } = useCustomPaymentTypes();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  // Selected tag value.  Use the special value "none" to denote no tag
  // instead of an empty string.  Radix UI's Select.Item does not
  // allow an empty string value, so we represent an unselected tag
  // with "none" internally.
  const [selectedTag, setSelectedTag] = useState<string>("none");
  // Normalize payment options to avoid calling .map on undefined
  const paymentOptions = Array.isArray(allPaymentOptions) ? allPaymentOptions : [];
  // Maintain a local copy of tags to allow the user to add new tags on the fly.
  const [localTags, setLocalTags] = useState<string[]>(Array.isArray(tags) ? tags : []);
  // When the parent-provided tags change, update the local list accordingly.
  useEffect(() => {
    setLocalTags(Array.isArray(tags) ? tags : []);
  }, [tags]);

  /**
   * Compute a list of quick amounts based on the unique values of
   * today's trips.  If the user hasn't recorded any trips yet the
   * component falls back to a predefined list of values.  Values
   * greater than zero are kept and sorted in descending order.
   */
  const quickAmounts = useMemo(() => {
    const source = Array.isArray(tripsToday) ? tripsToday : [];
    const uniqueAmounts = Array.from(new Set(source.map((trip) => trip.amount)))
      .filter((val) => val > 0)
      .sort((a, b) => b - a);
    const amounts = uniqueAmounts.slice(0, 6);
    const defaultAmounts = [20, 30, 40, 50, 60, 80];
    return amounts.length > 0 ? amounts : defaultAmounts;
  }, [tripsToday]);

  const resetState = () => {
    setAmount("");
    setPaymentMethod("cash");
    // Reset to "none" to represent no tag selected
    setSelectedTag("none");
  };


  /**
   * Validates the amount input and, if valid, invokes the `onAddTrip`
   * callback with the current state. Displays a toast message when
   * validation fails or when the trip is successfully added. After
   * submission, the component state is reset and the dialog is closed.
   */
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "שגיאה",
        description: "אנא הזן סכום תקין",
        variant: "destructive",
      });
      return;
    }
    // Interpret the special value "none" as an undefined tag
    onAddTrip(parsedAmount, paymentMethod, selectedTag === "none" ? undefined : selectedTag);
    resetState();
    onClose();
    toast({
      title: "נסיעה נוספה",
      description: `נוספה נסיעה בסכום ₪${parsedAmount} (${paymentMethod})`,
    });
  };

  /**
   * Handles clicks on a quick amount button. Immediately records a new
   * trip using the selected quick value, current payment method and
   * selected tag. After submission the dialog is closed and the
   * component resets its state.
   */
  const handleQuickClick = (value: number) => {
    onAddTrip(value, paymentMethod, selectedTag === "none" ? undefined : selectedTag);
    resetState();
    onClose();
    toast({
      title: "נסיעה נוספה",
      description: `נוספה נסיעה בסכום ₪${value} (${paymentMethod})`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-sm mx-auto rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">הוספת נסיעה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount input */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-base">
              סכום הנסיעה
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="הכנס סכום"
              className="text-xl text-center h-14"
              dir="ltr"
            />
          </div>
          {/* Payment method dropdown */}
          <div className="space-y-3">
            <Label className="text-base">אמצעי תשלום</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="בחר אמצעי תשלום" />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    {option.isCustom &&
                      "commissionRate" in option &&
                      typeof option.commissionRate === "number" &&
                      option.commissionRate !== 0 && (
                        <span className="ml-1 text-xs">
                          {option.commissionRate > 0
                            ? `(-${option.commissionRate * 100}%)`
                            : `(+${Math.abs(option.commissionRate) * 100}%)`}
                        </span>
                      )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Tag selection with ability to add new tags */}
          <div className="space-y-3">
            <Label className="text-base">תיוג נסיעה</Label>
            <div className="flex items-center gap-2">
              <Select
                value={selectedTag}
                onValueChange={(value) => setSelectedTag(value)}
              >
                <SelectTrigger className="h-10 min-w-[8rem]">
                  {/* Show a placeholder when no tag is selected */}
                  <SelectValue placeholder="ללא תיוג" />
                </SelectTrigger>
                <SelectContent>
                  {/* Use the special value "none" instead of an empty string */}
                  <SelectItem value="none">ללא תיוג</SelectItem>
                  {localTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => {
                  const newTag = prompt('הכנס שם תיוג חדש');
                  if (newTag && newTag.trim() !== '') {
                    // Avoid adding duplicate tags by checking the current list
                    const trimmed = newTag.trim();
                    if (!localTags.includes(trimmed)) {
                      setLocalTags([...localTags, trimmed]);
                    }
                    setSelectedTag(trimmed);
                  }
                }}
              >
                הוסף תיוג
              </Button>
            </div>
          </div>
          {/* Quick amount buttons */}
          <div className="space-y-3">
            <Label className="text-base">סכומים מהירים</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickClick(val)}
                  className="text-base h-12"
                >
                  ₪{val}
                </Button>
              ))}
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetState();
                onClose();
              }}
              className="flex-1 h-12 touch-manipulation"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 bg-gradient-to-r from-primary to-blue-500 touch-manipulation"
            >
              הוסף נסיעה
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
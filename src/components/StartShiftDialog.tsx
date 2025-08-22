
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface StartShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

export const StartShiftDialog = ({ isOpen, onClose, onSubmit }: StartShiftDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>התחלת משמרת</DialogTitle>
          <DialogDescription>האם להתחיל משמרת חדשה כעת?</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={onSubmit}>התחל משמרת</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

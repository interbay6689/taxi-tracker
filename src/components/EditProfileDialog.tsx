import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  displayName?: string;
  onProfileUpdated?: () => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  userEmail,
  displayName: initialDisplayName,
  onProfileUpdated,
}: EditProfileDialogProps) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(initialDisplayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם תצוגה',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('לא מחובר');

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'שם התצוגה עודכן בהצלחה',
      });
      
      onProfileUpdated?.();
    } catch (error: any) {
      console.error('Error updating display name:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בעדכון שם התצוגה',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את כל שדות הסיסמא',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'שגיאה',
        description: 'הסיסמא החדשה חייבת להכיל לפחות 6 תווים',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'שגיאה',
        description: 'הסיסמאות אינן תואמות',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'הסיסמא עודכנה בהצלחה',
      });

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בעדכון הסיסמא',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            עריכת פרופיל
          </DialogTitle>
          <DialogDescription>
            עדכן את פרטי הפרופיל והסיסמא שלך
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Display Name Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">פרטים אישיים</h4>
            
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                value={userEmail}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">שם תצוגה</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="הזן שם תצוגה"
              />
            </div>

            <Button 
              onClick={handleUpdateDisplayName} 
              disabled={isUpdatingProfile}
              className="w-full"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  מעדכן...
                </>
              ) : (
                'עדכן פרטים'
              )}
            </Button>
          </div>

          <Separator />

          {/* Password Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Lock className="h-4 w-4" />
              שינוי סיסמא
            </h4>

            <div className="space-y-2">
              <Label htmlFor="newPassword">סיסמא חדשה</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="הזן סיסמא חדשה"
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אימות סיסמא</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="הזן שוב את הסיסמא החדשה"
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              onClick={handleUpdatePassword} 
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              variant="outline"
              className="w-full"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  מעדכן...
                </>
              ) : (
                'עדכן סיסמא'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

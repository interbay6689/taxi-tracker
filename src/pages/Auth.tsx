import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Car, Shield, KeyRound, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Translate common Supabase errors to Hebrew
  const translateError = (errorMessage: string): string => {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'פרטי התחברות שגויים',
      'Email not confirmed': 'האימייל לא אומת',
      'User already registered': 'משתמש כבר קיים במערכת',
      'Password should be at least 6 characters': 'הסיסמה חייבת להכיל לפחות 6 תווים',
      'Invalid email': 'כתובת אימייל לא תקינה',
      'Signup requires a valid password': 'נדרשת סיסמה תקינה להרשמה',
      'Email address': 'כתובת האימייל',
      'is invalid': 'לא תקינה',
      'For security purposes, you can only request this once every 60 seconds': 'מסיבות אבטחה, ניתן לבקש איפוס סיסמה פעם ב-60 שניות',
      'Email rate limit exceeded': 'חרגת ממכסת האימיילים, נסה שוב מאוחר יותר',
    };
    
    let translated = errorMessage;
    Object.entries(errorMap).forEach(([key, value]) => {
      if (translated.includes(key)) {
        translated = translated.replace(key, value);
      }
    });
    return translated;
  };

  const cleanupAuthState = () => {
    // Clear all Supabase auth related items from localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear all Supabase auth related items from sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage || {});
    sessionStorageKeys.forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });

    // Also clear IndexedDB if exists (some Supabase versions use it)
    if (window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase('supabase-auth');
      } catch (e) {
        // Ignore if fails
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "ברוכים הבאים!",
          description: "התחברת בהצלחה למערכת",
        });
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      setError(translateError(error.message) || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "הרשמה הושלמה!",
          description: "נרשמת בהצלחה למערכת",
        });
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      setError(translateError(error.message) || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('אנא הזן כתובת אימייל');
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/auth`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setSuccessMessage('נשלח אימייל לאיפוס סיסמה. בדוק את תיבת הדואר שלך.');
      toast({
        title: "אימייל נשלח",
        description: "קישור לאיפוס סיסמה נשלח לאימייל שלך",
      });
    } catch (error: any) {
      setError(translateError(error.message) || 'שגיאה בשליחת אימייל לאיפוס סיסמה');
    } finally {
      setLoading(false);
    }
  };

  // Password Reset Form
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">איפוס סיסמה</CardTitle>
            <CardDescription>
              הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס סיסמה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">אימייל</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="הכנס את האימייל שלך"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowResetPassword(false);
                  setError('');
                  setSuccessMessage('');
                }}
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                חזרה להתחברות
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Car className="h-8 w-8 text-primary" />
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">מערכת מונית מאובטחת</CardTitle>
          <CardDescription>
            התחברות למערכת ניהול נסיעות מאובטחת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">התחברות</TabsTrigger>
              <TabsTrigger value="signup">הרשמה</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">אימייל</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="הכנס את האימייל שלך"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">סיסמה</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="הכנס את הסיסמה שלך"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'מתחבר...' : 'התחבר'}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => {
                    setShowResetPassword(true);
                    setError('');
                    setSuccessMessage('');
                  }}
                >
                  שכחת סיסמה?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">שם מלא</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="הכנס את השם שלך"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">אימייל</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="הכנס את האימייל שלך"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">סיסמה</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="בחר סיסמה חזקה"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    minLength={6}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'נרשם...' : 'הרשם'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            מערכת מאובטחת עם הצפנה מלאה של הנתונים
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, User, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <SettingsIcon className="h-6 w-6 text-primary" />
            הגדרות מערכת
          </CardTitle>
          <CardDescription>נהל את ההגדרות והפרטים האישיים שלך</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              פרופיל משתמש
            </h3>
            <div className="space-y-3 bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">אימייל:</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">מזהה:</span>
                <span className="text-sm text-muted-foreground font-mono text-xs">{user.id}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* System Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">מידע מערכת</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• כל ההגדרות נשמרות אוטומטית</p>
              <p>• ניתן לגשת להגדרות נוספות דרך תפריטי הניווט</p>
              <p>• לשאלות ותמיכה, צור קשר עם הצוות</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

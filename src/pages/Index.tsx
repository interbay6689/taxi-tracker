import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Car, LogIn } from 'lucide-react';
import { TaxiDashboard } from "@/components/SecureTaxiDashboard";

const Index = () => {
  const { user, loading } = useAuth();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center items-center gap-2 mb-4">
              <Car className="h-8 w-8 text-primary" />
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">מערכת מונית מאובטחת</CardTitle>
            <CardDescription>
              נדרשת התחברות למערכת לגישה לנתונים מאובטחים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              התחבר למערכת
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <TaxiDashboard />;
};

export default Index;

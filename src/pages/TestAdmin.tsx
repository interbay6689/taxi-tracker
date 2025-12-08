import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Database, Users, Car, Target, Wallet, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

const TestAdmin = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalWorkDays: 0,
    totalUsers: 0,
    totalExpenses: 0,
  });

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Database connection
    try {
      const { error } = await supabase.from('trips').select('count').limit(1);
      results.push({
        name: 'חיבור לבסיס הנתונים',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'החיבור תקין'
      });
    } catch (e) {
      results.push({
        name: 'חיבור לבסיס הנתונים',
        status: 'error',
        message: 'שגיאה בחיבור'
      });
    }

    // Test 2: Trips table
    try {
      const { data, error } = await supabase.from('trips').select('id').limit(5);
      results.push({
        name: 'טבלת נסיעות',
        status: error ? 'error' : 'success',
        message: error ? error.message : `נמצאו ${data?.length || 0} רשומות (מוגבל ל-5)`
      });
    } catch (e) {
      results.push({
        name: 'טבלת נסיעות',
        status: 'error',
        message: 'שגיאה בגישה לטבלה'
      });
    }

    // Test 3: Work days table
    try {
      const { data, error } = await supabase.from('work_days').select('id').limit(5);
      results.push({
        name: 'טבלת ימי עבודה',
        status: error ? 'error' : 'success',
        message: error ? error.message : `נמצאו ${data?.length || 0} רשומות (מוגבל ל-5)`
      });
    } catch (e) {
      results.push({
        name: 'טבלת ימי עבודה',
        status: 'error',
        message: 'שגיאה בגישה לטבלה'
      });
    }

    // Test 4: Daily goals table
    try {
      const { data, error } = await supabase.from('daily_goals').select('id').limit(5);
      results.push({
        name: 'טבלת יעדים',
        status: error ? 'error' : 'success',
        message: error ? error.message : `נמצאו ${data?.length || 0} רשומות (מוגבל ל-5)`
      });
    } catch (e) {
      results.push({
        name: 'טבלת יעדים',
        status: 'error',
        message: 'שגיאה בגישה לטבלה'
      });
    }

    // Test 5: Profiles table
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(5);
      results.push({
        name: 'טבלת פרופילים',
        status: error ? 'error' : 'success',
        message: error ? error.message : `נמצאו ${data?.length || 0} רשומות (מוגבל ל-5)`
      });
    } catch (e) {
      results.push({
        name: 'טבלת פרופילים',
        status: 'error',
        message: 'שגיאה בגישה לטבלה'
      });
    }

    // Test 6: Shift expenses table
    try {
      const { data, error } = await supabase.from('shift_expenses').select('id').limit(5);
      results.push({
        name: 'טבלת הוצאות משמרת',
        status: error ? 'error' : 'success',
        message: error ? error.message : `נמצאו ${data?.length || 0} רשומות (מוגבל ל-5)`
      });
    } catch (e) {
      results.push({
        name: 'טבלת הוצאות משמרת',
        status: 'error',
        message: 'שגיאה בגישה לטבלה'
      });
    }

    // Test 7: Custom order sources table
    try {
      const { data, error } = await supabase.from('custom_order_sources').select('id').limit(5);
      results.push({
        name: 'טבלת מקורות הזמנה',
        status: error ? 'error' : 'success',
        message: error ? error.message : `נמצאו ${data?.length || 0} רשומות (מוגבל ל-5)`
      });
    } catch (e) {
      results.push({
        name: 'טבלת מקורות הזמנה',
        status: 'error',
        message: 'שגיאה בגישה לטבלה'
      });
    }

    setTests(results);
    setIsRunning(false);

    const successCount = results.filter(t => t.status === 'success').length;
    toast({
      title: 'בדיקות הושלמו',
      description: `${successCount}/${results.length} בדיקות עברו בהצלחה`,
      variant: successCount === results.length ? 'default' : 'destructive'
    });
  };

  useEffect(() => {
    runTests();
  }, []);

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">🔧 דף בדיקות מערכת</h1>
          <p className="text-muted-foreground">בדיקת תקינות חיבורים וטבלאות בסיס הנתונים</p>
          <Badge variant="outline" className="mt-2">
            גרסת בדיקה - ללא צורך בהתחברות
          </Badge>
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              סיכום בדיקות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">{successCount} הצלחות</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="font-medium">{errorCount} שגיאות</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>תוצאות בדיקות</CardTitle>
            <CardDescription>בדיקת גישה לטבלאות בסיס הנתונים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tests.map((test, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {test.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : test.status === 'error' ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-muted-foreground/30 animate-pulse" />
                  )}
                  <span className="font-medium">{test.name}</span>
                </div>
                <Badge variant={test.status === 'success' ? 'default' : 'destructive'}>
                  {test.message}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button onClick={runTests} disabled={isRunning}>
            {isRunning ? 'מריץ בדיקות...' : 'הרץ בדיקות מחדש'}
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            חזרה לדף הבית
          </Button>
        </div>

        {/* Info */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              דף זה מיועד לבדיקות מערכת בלבד. הגישה לנתונים מוגבלת על ידי מדיניות RLS של Supabase.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAdmin;

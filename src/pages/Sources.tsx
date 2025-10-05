import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { useCustomOrderSources } from '@/hooks/useCustomOrderSources';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentTypesTab } from '@/components/settings/PaymentTypesTab';
import { Tag, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { TagsManagement } from '@/components/TagsManagement';

const Sources = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading } = useDatabase();
  const { allOrderSources, addCustomOrderSource, deleteCustomOrderSource } = useCustomOrderSources();
  
  const orderSourceNames = allOrderSources.map(source => source.value);
  const handleUpdateTags = async (tags: string[]) => {
    // This is a simplified implementation
    console.log('Order sources updated:', tags);
  };

  if (authLoading || loading) {
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
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">מקורות הזמנה ותשלום</h1>
      
      <Tabs defaultValue="order-sources" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="order-sources">מקורות הזמנה</TabsTrigger>
          <TabsTrigger value="payment-types">אמצעי תשלום</TabsTrigger>
        </TabsList>

        <TabsContent value="order-sources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                מקורות הזמנה
                <HelpTooltip content="נהל את מקורות ההזמנה השונים כמו גט, אפליקציות ומזדמן" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TagsManagement tags={orderSourceNames} onUpdateTags={handleUpdateTags} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-types" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                אמצעי תשלום
                <HelpTooltip content="נהל את אמצעי התשלום השונים והגדר ברירת מחדל לכל מקור הזמנה" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentTypesTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sources;

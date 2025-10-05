import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, TrendingUp, Fuel, AlertTriangle, BarChart3 } from "lucide-react";
import { Trip, ShiftExpense } from "@/hooks/useDatabase";
import { useCustomOrderSources } from '@/hooks/useCustomOrderSources';
import { DateRange } from "react-day-picker";
import { AnalyticsPeriodSelector, AnalyticsPeriod } from './AnalyticsPeriodSelector';
import { getDateRangeForPeriod, isDateInRange } from '@/utils/dateRangeUtils';
import { detectAnomalies } from '@/utils/dataValidation';
import { normalizePaymentMethod, groupTripsByPaymentMethod } from '@/utils/paymentMethodsHelper';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface AnalyticsTabProps {
  trips: Trip[];
  shiftExpenses?: ShiftExpense[];
  selectedPeriod?: AnalyticsPeriod;
  customDateRange?: DateRange | undefined;
  onPeriodChange?: (period: AnalyticsPeriod) => void;
  onCustomDateRangeChange?: (dateRange: DateRange | undefined) => void;
}

export const AnalyticsTab = ({ 
  trips, 
  shiftExpenses = [],
  selectedPeriod = 'today',
  customDateRange,
  onPeriodChange = () => {},
  onCustomDateRangeChange = () => {}
}: AnalyticsTabProps) => {
  const { allOrderSources } = useCustomOrderSources();
  
  
  const analytics = useMemo(() => {
    // חישוב טווח תאריכים מנורמל
    const dateRange = getDateRangeForPeriod(
      selectedPeriod, 
      customDateRange ? { from: customDateRange.from!, to: customDateRange.to! } : undefined
    );

    // סינון נסיעות והוצאות לפי טווח התאריכים
    const filteredTrips = trips.filter(trip => {
      try {
        return isDateInRange(trip.timestamp, dateRange);
      } catch (error) {
        console.error('Error filtering trip by date:', error, trip);
        return false;
      }
    });

    const filteredExpenses = shiftExpenses.filter(expense => {
      try {
        return isDateInRange(expense.created_at, dateRange);
      } catch (error) {
        console.error('Error filtering expense by date:', error, expense);
        return false;
      }
    });

    // זיהוי חריגות
    const anomalies = detectAnomalies(filteredTrips, filteredExpenses);

    // קיבוץ נסיעות לפי מקור הזמנה
    const tripsByOrderSource = new Map<string, Trip[]>();
    filteredTrips.forEach(trip => {
      const source = trip.order_source || 'מזדמן';
      if (!tripsByOrderSource.has(source)) {
        tripsByOrderSource.set(source, []);
      }
      tripsByOrderSource.get(source)!.push(trip);
    });

    // בניית סטטיסטיקות לפי מקור הזמנה
    const orderSourceStats = Array.from(tripsByOrderSource.entries()).map(([source, sourceTrips]) => {
      const income = sourceTrips.reduce((sum, trip) => sum + trip.amount, 0);
      
      // חישוב פילוח אמצעי תשלום בתוך כל מקור הזמנה
      const paymentMethodBreakdown = {
        'מזומן': sourceTrips.filter(t => t.payment_method === 'מזומן').reduce((sum, t) => sum + t.amount, 0),
        'אשראי': sourceTrips.filter(t => t.payment_method === 'אשראי').reduce((sum, t) => sum + t.amount, 0),
        'ביט': sourceTrips.filter(t => t.payment_method === 'ביט').reduce((sum, t) => sum + t.amount, 0),
      };
      
      return {
        method: source,
        income,
        count: sourceTrips.length,
        paymentMethodBreakdown
      };
    }).sort((a, b) => b.income - a.income);

    const paymentStats = orderSourceStats;

    const totalIncome = paymentStats.reduce((sum, stat) => sum + stat.income, 0);
    const totalFuelExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0);

    // נתונים לגרפים
    const pieChartData = paymentStats.map((stat, index) => ({
      name: stat.method,
      value: stat.income,
      count: stat.count,
      fill: `hsl(${(index * 360) / paymentStats.length}, 70%, 50%)`
    }));

    const barChartData = paymentStats.map(stat => ({
      name: stat.method,
      income: Math.round(stat.income),
      trips: stat.count
    }));

    return {
      totalIncome,
      totalFuelExpenses,
      paymentStats,
      totalTrips: filteredTrips.length,
      filteredTrips,
      filteredExpenses,
      dateRange,
      periodLabel: dateRange.label,
      anomalies,
      pieChartData,
      barChartData
    };
  }, [trips, shiftExpenses, selectedPeriod, customDateRange]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* בחירת תקופה */}
      <AnalyticsPeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={onPeriodChange}
        customDateRange={customDateRange}
        onCustomDateRangeChange={onCustomDateRangeChange}
      />

      {/* אזהרה אם טווח התאריכים לא תקין */}
      {!analytics.dateRange.isValid && (
        <Card className="border-orange-500 bg-orange-50 animate-scale-in">
          <CardContent className="p-4">
            <p className="text-sm text-orange-800">
              ⚠️ טווח התאריכים שנבחר לא תקין. מוצגים נתוני {analytics.periodLabel}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* אזהרות על חריגות */}
      {analytics.anomalies.length > 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20 animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              זוהו {analytics.anomalies.length} חריגות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.anomalies.slice(0, 3).map((anomaly, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded-lg text-sm ${
                    anomaly.severity === 'high' 
                      ? 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300' 
                      : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300'
                  }`}
                >
                  {anomaly.message}
                </div>
              ))}
              {analytics.anomalies.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  ועוד {analytics.anomalies.length - 3} חריגות נוספות
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* גרפים ויזואליים */}
      {analytics.paymentStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Pie Chart - התפלגות הכנסות */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                התפלגות הכנסות לפי מקור הזמנה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{payload[0].name}</p>
                            <p className="text-sm text-primary">₪{payload[0].value?.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{payload[0].payload.count} נסיעות</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - השוואת הכנסות */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                השוואת הכנסות ונסיעות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.barChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{payload[0].payload.name}</p>
                            <p className="text-sm text-primary">הכנסה: ₪{payload[0].value?.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">נסיעות: {payload[0].payload.trips}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ניתוח תיוגי תשלומים */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            התפלגות מקורות הזמנה - {analytics.periodLabel}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {analytics.dateRange.start.toLocaleDateString('he-IL')} - {analytics.dateRange.end.toLocaleDateString('he-IL')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.paymentStats.length === 0 && analytics.filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p className="text-lg font-medium">אין נסיעות או הוצאות</p>
                <p className="text-sm mt-1">{analytics.periodLabel}</p>
              </div>
            ) : (
              <>
                {/* מקורות הזמנה */}
                {analytics.paymentStats.map((stat, index) => (
                  <div 
                    key={index} 
                    className="p-3 rounded-lg border transition-all duration-200 hover:shadow-md bg-muted/30"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{stat.method}</span>
                        </div>
                        {stat.paymentMethodBreakdown && (
                          <div className="text-xs text-muted-foreground space-y-1 mt-2">
                            {stat.paymentMethodBreakdown['מזומן'] > 0 && (
                              <div className="flex justify-between">
                                <span>💵 מזומן</span>
                                <span>₪{stat.paymentMethodBreakdown['מזומן'].toLocaleString()}</span>
                              </div>
                            )}
                            {stat.paymentMethodBreakdown['אשראי'] > 0 && (
                              <div className="flex justify-between">
                                <span>💳 אשראי</span>
                                <span>₪{stat.paymentMethodBreakdown['אשראי'].toLocaleString()}</span>
                              </div>
                            )}
                            {stat.paymentMethodBreakdown['ביט'] > 0 && (
                              <div className="flex justify-between">
                                <span>📱 ביט</span>
                                <span>₪{stat.paymentMethodBreakdown['ביט'].toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₪{stat.income.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{stat.count} נסיעות</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* הוצאות דלק */}
                {analytics.filteredExpenses && analytics.filteredExpenses.length > 0 && (
                  <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 transition-all duration-200 hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-700 dark:text-red-400">הוצאות דלק</span>
                          <Fuel className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="text-xs mt-1 text-red-600 dark:text-red-400">
                          הוצאות תפעוליות
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600 dark:text-red-400">
                          -₪{analytics.filteredExpenses.reduce((sum, exp) => sum + (exp?.amount || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {analytics.filteredExpenses.length} תדלוקים
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* סיכום כללי */}
      <Card className="animate-fade-in hover-scale">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            סיכום - {analytics.periodLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 rounded-lg bg-primary/10 border border-primary/20 transition-all duration-300 hover:shadow-lg">
              <div className="text-lg font-bold mb-2">סה"כ הכנסות</div>
              <div className="text-3xl font-bold text-primary mb-2 transition-all duration-500">
                ₪{analytics.totalIncome.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">{analytics.totalTrips} נסיעות</div>
              {analytics.totalFuelExpenses > 0 && (
                <>
                  <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                    דלק: -₪{analytics.totalFuelExpenses.toLocaleString()}
                  </div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-400 mt-2 pt-2 border-t border-primary/20">
                    נטו: ₪{(analytics.totalIncome - analytics.totalFuelExpenses).toLocaleString()}
                  </div>
                </>
              )}
            </div>
            
            <div className="text-center p-6 rounded-lg bg-muted/50 border transition-all duration-300 hover:shadow-lg">
              <div className="text-lg font-bold mb-2">ממוצע לנסיעה</div>
              <div className="text-3xl font-bold text-secondary-foreground mb-2 transition-all duration-500">
                ₪{analytics.totalTrips > 0 ? Math.round(analytics.totalIncome / analytics.totalTrips) : 0}
              </div>
              <div className="text-sm text-muted-foreground">
                {analytics.dateRange.start.toLocaleDateString('he-IL')} - {analytics.dateRange.end.toLocaleDateString('he-IL')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
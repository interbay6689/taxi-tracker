import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  MessageCircle, 
  TrendingUp, 
  MapPin, 
  AlertCircle, 
  Crown,
  Target,
  Clock,
  DollarSign,
  Navigation,
  Fuel,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DriverTip {
  id: string;
  author: string;
  content: string;
  likes: number;
  timestamp: Date;
  category: 'routes' | 'earnings' | 'safety' | 'maintenance';
}

interface HotspotData {
  area: string;
  activity: 'high' | 'medium' | 'low';
  averageWait: number;
  earnings: number;
  timeOfDay: string;
}

interface LeaderboardEntry {
  rank: number;
  driver: string;
  score: number;
  badge: string;
  isCurrentUser?: boolean;
}

export const DriverCommunityHub = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('tips');
  const [newTip, setNewTip] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DriverTip['category']>('earnings');

  // Mock data - בפרויקט אמיתי יבוא מהשרת
  const [tips, setTips] = useState<DriverTip[]>([
    {
      id: '1',
      author: 'יוסי ר.',
      content: 'בשעות הערב כדאי להתרכז באזור דיזנגוף - הכי הרבה נסיעות ארוכות לנתב"ג',
      likes: 24,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      category: 'routes'
    },
    {
      id: '2', 
      author: 'משה כ.',
      content: 'טיפ חשוב: תמיד בדקו את הדלק לפני משמרת ערב. תחנות הדלק במרכז העיר עומסות בשעות הלילה',
      likes: 18,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      category: 'maintenance'
    },
    {
      id: '3',
      author: 'דני מ.',
      content: 'בימי גשם הביקוש עולה ב-40%. כדאי לעבוד יותר שעות ביום כזה',
      likes: 31,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      category: 'earnings'
    }
  ]);

  const hotspots: HotspotData[] = [
    { area: 'תחנה מרכזית', activity: 'high', averageWait: 8, earnings: 45, timeOfDay: '07:00-09:00' },
    { area: 'דיזנגוף סנטר', activity: 'medium', averageWait: 12, earnings: 38, timeOfDay: '14:00-16:00' },
    { area: 'נמל תעופה בן גוריון', activity: 'high', averageWait: 15, earnings: 85, timeOfDay: '20:00-23:00' },
    { area: 'אזור הבורסה', activity: 'medium', averageWait: 10, earnings: 42, timeOfDay: '08:00-18:00' },
  ];

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, driver: 'אברהם ל.', score: 2840, badge: 'מלך הכבישים' },
    { rank: 2, driver: 'יוסי ר.', score: 2720, badge: 'אמן הנסיעות' },
    { rank: 3, driver: 'משה כ.', score: 2650, badge: 'נהג מקצועי', isCurrentUser: true },
    { rank: 4, driver: 'דני מ.', score: 2580, badge: 'בטוח ומהיר' },
    { rank: 5, driver: 'רובי ש.', score: 2520, badge: 'שירות מעולה' },
  ];

  const handleSubmitTip = () => {
    if (!newTip.trim()) return;

    const tip: DriverTip = {
      id: Date.now().toString(),
      author: 'משה כ.', // שם המשתמש הנוכחי
      content: newTip,
      likes: 0,
      timestamp: new Date(),
      category: selectedCategory
    };

    setTips([tip, ...tips]);
    setNewTip('');
    toast({
      title: 'טיפ נוסף בהצלחה!',
      description: 'התטיפ שלך נוסף לקהילה ויעזור לנהגים אחרים',
    });
  };

  const handleLikeTip = (tipId: string) => {
    setTips(tips.map(tip => 
      tip.id === tipId ? { ...tip, likes: tip.likes + 1 } : tip
    ));
  };

  const getActivityColor = (activity: HotspotData['activity']) => {
    switch (activity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  const getActivityText = (activity: HotspotData['activity']) => {
    switch (activity) {
      case 'high': return 'פעילות גבוהה';
      case 'medium': return 'פעילות בינונית'; 
      case 'low': return 'פעילות נמוכה';
    }
  };

  const getCategoryIcon = (category: DriverTip['category']) => {
    switch (category) {
      case 'routes': return <Navigation className="w-4 h-4" />;
      case 'earnings': return <DollarSign className="w-4 h-4" />;
      case 'safety': return <AlertCircle className="w-4 h-4" />;
      case 'maintenance': return <Fuel className="w-4 h-4" />;
    }
  };

  const getCategoryName = (category: DriverTip['category']) => {
    switch (category) {
      case 'routes': return 'מסלולים';
      case 'earnings': return 'הכנסות';
      case 'safety': return 'בטיחות';
      case 'maintenance': return 'תחזוקה';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `לפני ${diffInMinutes} דקות`;
    } else if (diffInMinutes < 1440) {
      return `לפני ${Math.floor(diffInMinutes / 60)} שעות`;
    } else {
      return `לפני ${Math.floor(diffInMinutes / 1440)} ימים`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            קהילת הנהגים
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tips" className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            טיפים
          </TabsTrigger>
          <TabsTrigger value="hotspots" className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            נקודות חמות
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1">
            <Crown className="w-4 h-4" />
            לוח תוצאות
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            אתגרים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">שתף טיפ עם הקהילה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {(['routes', 'earnings', 'safety', 'maintenance'] as const).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="flex items-center gap-1"
                  >
                    {getCategoryIcon(category)}
                    {getCategoryName(category)}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="שתף טיפ מועיל עם נהגים אחרים..."
                value={newTip}
                onChange={(e) => setNewTip(e.target.value)}
                rows={3}
              />
              <Button onClick={handleSubmitTip} className="w-full">
                שתף טיפ
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {tips.map((tip) => (
              <Card key={tip.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getCategoryIcon(tip.category)}
                        {getCategoryName(tip.category)}
                      </Badge>
                      <span className="text-sm font-medium">{tip.author}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(tip.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm mb-3">{tip.content}</p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleLikeTip(tip.id)}
                      className="h-8 px-2"
                    >
                      👍 {tip.likes}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hotspots" className="space-y-4">
          <div className="grid gap-4">
            {hotspots.map((hotspot, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <h3 className="font-semibold">{hotspot.area}</h3>
                    </div>
                    <Badge className={`${getActivityColor(hotspot.activity)} text-white`}>
                      {getActivityText(hotspot.activity)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs text-muted-foreground">ממתין</span>
                      </div>
                      <div className="text-sm font-medium">{hotspot.averageWait} דק'</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs text-muted-foreground">ממוצע</span>
                      </div>
                      <div className="text-sm font-medium">₪{hotspot.earnings}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs text-muted-foreground">שעות שיא</span>
                      </div>
                      <div className="text-sm font-medium">{hotspot.timeOfDay}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div 
                    key={entry.rank}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      entry.isCurrentUser ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        entry.rank === 1 ? 'bg-yellow-500 text-white' :
                        entry.rank === 2 ? 'bg-gray-400 text-white' :
                        entry.rank === 3 ? 'bg-amber-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {entry.rank}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {entry.driver}
                          {entry.isCurrentUser && <Badge variant="secondary">אתה</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{entry.badge}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{entry.score.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">נקודות</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold">אתגר השבוע</h3>
                  </div>
                  <Badge variant="outline">5 ימים נותרו</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  השלם 50 נסיעות השבוע וזכה ב-100 נקודות בונוס
                </p>
                <div className="bg-muted rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
                <div className="text-xs text-muted-foreground">34/50 נסיעות (68%)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold">אתגר חודשי</h3>
                  </div>
                  <Badge variant="outline">15 ימים נותרו</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  הגע ל-1000₪ הכנסות השבוע וזכה ב-200 נקודות
                </p>
                <div className="bg-muted rounded-full h-2 mb-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="text-xs text-muted-foreground">450₪/1000₪ (45%)</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Target,
  Receipt,
  Tag,
  FileText,
  Clock,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';

const mainItems = [
  { title: 'דשבורד', url: '/dashboard', icon: LayoutDashboard },
  { title: 'אנליטיקה', url: '/analytics', icon: BarChart3 },
];

const managementItems = [
  { title: 'יעדים', url: '/goals', icon: Target },
  { title: 'הוצאות', url: '/expenses', icon: Receipt },
  { title: 'מקורות הזמנה', url: '/sources', icon: Tag },
];

const reportsItems = [
  { title: 'דוחות', url: '/reports', icon: FileText },
  { title: 'היסטוריה', url: '/history', icon: Clock },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderMenuItems = (items: typeof mainItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive(item.url)}>
            <NavLink to={item.url} className="flex items-center gap-3">
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
              {!collapsed && isActive(item.url) && (
                <ChevronRight className="h-4 w-4 mr-auto" />
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-l">
      <SidebarContent className="gap-0">
        {/* Header with toggle */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className={cn(
            "font-bold text-lg transition-opacity",
            collapsed ? "opacity-0 w-0" : "opacity-100"
          )}>
            ניהול מונית
          </h2>
          <SidebarTrigger className="mr-auto" />
        </div>

        {/* Main Section */}
        <SidebarGroup>
          <SidebarGroupLabel>ראשי</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(mainItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Management Section */}
        <SidebarGroup>
          <SidebarGroupLabel>ניהול</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(managementItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Reports Section */}
        <SidebarGroup>
          <SidebarGroupLabel>דוחות</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(reportsItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <Separator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/settings')}>
              <NavLink to="/settings" className="flex items-center gap-3">
                <Settings className="h-5 w-5 shrink-0" />
                {!collapsed && <span>הגדרות</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="flex items-center gap-3">
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>התנתק</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
